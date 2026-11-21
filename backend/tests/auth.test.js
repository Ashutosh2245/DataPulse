const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const userModel = require('../src/models/userModel');

jest.mock('../src/models/userModel');

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      userModel.findUserByEmail.mockResolvedValue(null);
      userModel.createUser.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'securePassword123',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject registration if email is already registered', async () => {
      userModel.findUserByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const res = await request(app)
        .post('/api/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'securePassword123',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error', 'Email already registered.');
    });

    it('should validate invalid email and short password', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          name: 'T',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/login', () => {
    it('should log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('validPassword', 10);
      userModel.findUserByEmail.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: hashedPassword,
      });

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'validPassword',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      userModel.findUserByEmail.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password_hash: hashedPassword,
      });

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password.');
    });

    it('should reject login if user not found', async () => {
      userModel.findUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/me', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const secret = process.env.JWT_SECRET || 'datapulse_default_jwt_secret_phase1';
      const token = jwt.sign({ id: 1, email: 'test@example.com' }, secret);

      userModel.findUserById.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });
  });
});
