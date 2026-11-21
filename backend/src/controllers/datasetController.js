const path = require('path');
const datasetModel = require('../models/datasetModel');
const analysisModel = require('../models/analysisModel');
const pythonClient = require('../utils/pythonClient');
const { validateFileUpload } = require('../utils/validator');

const uploadDataset = async (req, res) => {
  try {
    const file = req.file;
    const fileError = validateFileUpload(file);
    if (fileError) {
      return res.status(400).json({ error: fileError });
    }

    const userId = req.user.id;
    const originalName = file.originalname;
    const filePath = path.resolve(file.path);

    // 1. Create dataset record with status 'pending'
    const dataset = await datasetModel.createDataset(userId, originalName, filePath, 'pending');

    // 2. Set status to 'processing'
    await datasetModel.updateDatasetStatus(dataset.id, 'processing');

    try {
      // 3. Call Python EDA Service
      const edaResult = await pythonClient.processDataset(filePath, originalName);

      // 4. Save analysis results to database
      const analysis = await analysisModel.createAnalysis(
        dataset.id,
        edaResult.summary,
        edaResult.charts
      );

      // 5. Update status to 'completed'
      const updatedDataset = await datasetModel.updateDatasetStatus(dataset.id, 'completed');

      return res.status(201).json({
        message: 'Dataset uploaded and processed successfully',
        dataset: updatedDataset,
        analysis: {
          id: analysis.id,
          analysis_time: analysis.analysis_time,
          summary: edaResult.summary,
          charts: edaResult.charts,
        },
      });
    } catch (procErr) {
      console.error(`EDA processing failed for dataset ${dataset.id}:`, procErr.message);
      await datasetModel.updateDatasetStatus(dataset.id, 'error');
      return res.status(502).json({
        error: 'Failed to process dataset via EDA service.',
        details: procErr.response?.data?.detail || procErr.message,
        dataset: { ...dataset, status: 'error' },
      });
    }
  } catch (err) {
    console.error('Upload dataset error:', err);
    return res.status(500).json({ error: 'Internal server error during dataset upload.' });
  }
};

const getDatasets = async (req, res) => {
  try {
    const userId = req.user.id;
    const datasets = await datasetModel.getDatasetsByUser(userId);
    return res.status(200).json({ datasets });
  } catch (err) {
    console.error('Get datasets error:', err);
    return res.status(500).json({ error: 'Failed to retrieve datasets.' });
  }
};

const getDatasetById = async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id, 10);
    if (isNaN(datasetId)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }

    const dataset = await datasetModel.getDatasetById(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    if (dataset.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this dataset.' });
    }

    return res.status(200).json({ dataset });
  } catch (err) {
    console.error('Get dataset by ID error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dataset details.' });
  }
};

const getDatasetResults = async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id, 10);
    if (isNaN(datasetId)) {
      return res.status(400).json({ error: 'Invalid dataset ID.' });
    }

    const dataset = await datasetModel.getDatasetById(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    if (dataset.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this dataset.' });
    }

    if (dataset.status !== 'completed') {
      return res.status(400).json({
        error: `Results not ready. Current status: ${dataset.status}`,
        status: dataset.status,
      });
    }

    const analysis = await analysisModel.getAnalysisByDatasetId(datasetId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis results not found.' });
    }

    return res.status(200).json({
      dataset_id: datasetId,
      filename: dataset.filename,
      status: dataset.status,
      analysis_time: analysis.analysis_time,
      summary: typeof analysis.summary_json === 'string'
        ? JSON.parse(analysis.summary_json)
        : analysis.summary_json,
      charts: typeof analysis.charts_json === 'string'
        ? JSON.parse(analysis.charts_json)
        : analysis.charts_json,
    });
  } catch (err) {
    console.error('Get dataset results error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analysis results.' });
  }
};


const askDataset = async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id, 10);
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question string is required.' });
    }

    const dataset = await datasetModel.getDatasetById(datasetId);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    if (dataset.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this dataset.' });
    }

    const axios = require('axios');
    const baseUrl = pythonClient.getEdaServiceUrl();
    const edaResponse = await axios.post(
      `${baseUrl}/ask`,
      {
        file_path: dataset.s3_key,
        question: question,
        dataset_name: dataset.filename,
      },
      { timeout: 30000 }
    );

    return res.status(200).json(edaResponse.data);
  } catch (err) {
    console.error('Ask dataset error:', err.message);
    return res.status(500).json({
      error: 'Failed to answer question on dataset.',
      details: err.response?.data?.detail || err.message,
    });
  }
};

module.exports = {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetResults,
  askDataset,
};

