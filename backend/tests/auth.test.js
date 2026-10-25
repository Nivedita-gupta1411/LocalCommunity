const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');

// Required for tests that need JWT_SECRET
process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    college: 'Test College',
    location: 'Test Location'
  };

  describe('POST /api/auth/register', () => {
    it('1. should register user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.email).toEqual(validUser.email);
    });

    it('2. should reject registration with duplicate email', async () => {
      await User.create(validUser);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
    });

    it('3. should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'notanemail' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
    });

    it('4. should reject registration with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }); // missing name, password, college
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('5. should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body).toHaveProperty('token');
    });

    it('6. should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBeFalsy();
    });

    it('7. should reject login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password' });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBeFalsy();
    });
  });

  describe('Protected Routes', () => {
    let token;
    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      token = res.body.token;
    });

    it('8. should reject access without JWT', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBeFalsy();
    });

    it('9. should reject access with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(401);
    });

    it('10. should allow authenticated user to access /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.email).toEqual(validUser.email);
    });
  });
});
