const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Authorization API', () => {
  let userToken, adminToken;
  
  beforeEach(async () => {
    // Normal User
    const resUser = await request(app).post('/api/auth/register').send({
      name: 'Normal User', email: 'user@example.com', password: 'password', college: 'Col'
    });
    userToken = resUser.body.token;

    // Admin User
    const admin = await User.create({
      name: 'Admin User', email: 'admin@example.com', password: 'password', college: 'Col', role: 'admin'
    });
    
    const resAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com', password: 'password'
    });
    adminToken = resAdmin.body.token;
  });

  it('1. should prevent normal user from accessing admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toEqual(403);
  });

  it('2. should allow admin to access admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });
});
