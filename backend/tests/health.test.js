const request = require('supertest');
const app = require('../src/app');

describe('Health API', () => {
  it('should return 200 OK for GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
    expect(res.body.service).toEqual('datapulse-backend');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 200 OK for GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.version).toEqual('1.0.0');
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown_endpoint');
    expect(res.statusCode).toEqual(404);
  });
});
