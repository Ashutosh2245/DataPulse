const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const getEdaServiceUrl = () => {
  return process.env.PYTHON_EDA_URL || process.env.EDA_SERVICE_URL || 'http://localhost:5000';
};

/**
 * Invokes the Python EDA service to process a dataset file.
 * @param {string} filePath - Absolute path to local file
 * @param {string} filename - Original file name
 * @returns {Promise<Object>} Object containing summary and charts
 */
const processDataset = async (filePath, filename) => {
  const baseUrl = getEdaServiceUrl();
  const endpoint = `${baseUrl}/process`;

  // First attempt: pass file_path (if both services share a mounted volume / directory)
  try {
    const res = await axios.post(
      endpoint,
      { file_path: filePath },
      { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
  } catch (err) {
    console.warn(`Direct file_path invocation failed (${err.message}). Retrying with multipart upload.`);
    if (fs.existsSync(filePath)) {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), { filename: filename || 'dataset.csv' });
      const res = await axios.post(endpoint, form, {
        headers: form.getHeaders(),
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return res.data;
    }
    throw err;
  }
};

module.exports = {
  processDataset,
  getEdaServiceUrl,
};
