const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const datasetModel = require('../src/models/datasetModel');
const analysisModel = require('../src/models/analysisModel');
const pythonClient = require('../utils/pythonClient');

jest.mock('../src/models/datasetModel');
jest.mock('../src/models/analysisModel');
jest.mock('../src/utils/pythonClient');

describe('Datasets API Endpoints', () => {
  const secret = process.env.JWT_SECRET || 'datapulse_default_jwt_secret_phase1';
  const token = jwt.sign({ id: 1, email: 'test@example.com' }, secret);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/datasets', () => {
    it('should list datasets for logged-in user', async () => {
      datasetModel.getDatasetsByUser.mockResolvedValue([
        { id: 10, filename: 'data.csv', status: 'completed', uploaded_at: new Date().toISOString() },
      ]);

      const res = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.datasets)).toBe(true);
      expect(res.body.datasets.length).toBe(1);
    });
  });

  describe('POST /api/datasets (Upload)', () => {
    it('should upload and process a valid CSV file', async () => {
      datasetModel.createDataset.mockResolvedValue({
        id: 10,
        user_id: 1,
        filename: 'test.csv',
        status: 'pending',
      });
      datasetModel.updateDatasetStatus.mockResolvedValue({
        id: 10,
        user_id: 1,
        filename: 'test.csv',
        status: 'completed',
      });
      pythonClient.processDataset.mockResolvedValue({
        summary: { columns: ['age', 'salary'], stats: {} },
        charts: { histogram: {} },
      });
      analysisModel.createAnalysis.mockResolvedValue({
        id: 5,
        dataset_id: 10,
        analysis_time: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('age,salary\n25,50000\n30,60000\n'), 'test.csv');

      expect(res.statusCode).toBe(201);
      expect(res.body.dataset.status).toBe('completed');
      expect(res.body).toHaveProperty('analysis');
    });

    it('should reject invalid file types', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('invalid file text'), 'unsupported.txt');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid file type');
    });
  });

  describe('GET /api/datasets/:id/results', () => {
    it('should return analysis results for completed dataset', async () => {
      datasetModel.getDatasetById.mockResolvedValue({
        id: 10,
        user_id: 1,
        filename: 'test.csv',
        status: 'completed',
      });
      analysisModel.getAnalysisByDatasetId.mockResolvedValue({
        id: 5,
        dataset_id: 10,
        analysis_time: new Date().toISOString(),
        summary_json: { columns: ['age'], stats: {} },
        charts_json: { histogram: {} },
      });

      const res = await request(app)
        .get('/api/datasets/10/results')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('charts');
      expect(res.body.dataset_id).toBe(10);
    });

    it('should forbid access if dataset belongs to another user', async () => {
      datasetModel.getDatasetById.mockResolvedValue({
        id: 20,
        user_id: 999, // Different user
        filename: 'secret.csv',
        status: 'completed',
      });

      const res = await request(app)
        .get('/api/datasets/20/results')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
