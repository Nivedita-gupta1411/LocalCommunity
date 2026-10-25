const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Search & Filter API', () => {
  let userId;
  
  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'User 1', email: 'user1@example.com', password: 'password', college: 'Col'
    });
    userId = res.body.data._id;

    // Seed products with explicit sequential timestamps to guarantee sort ordering
    const now = Date.now();
    await Product.insertMany([
      { title: 'Engineering Math', description: 'Advanced calculus', price: 50, category: 'Books', condition: 'Used', location: 'Hostel A', images: ['/1.jpg'], seller: userId, status: 'active', createdAt: new Date(now - 4000) },
      { title: 'Gaming Laptop', description: 'Powerful laptop', price: 1000, category: 'Electronics', condition: 'Like New', location: 'Hostel B', images: ['/2.jpg'], seller: userId, status: 'active', createdAt: new Date(now - 3000) },
      { title: 'Study Chair', description: 'Comfortable', price: 200, category: 'Furniture', condition: 'New', location: 'Hostel A', images: ['/3.jpg'], seller: userId, status: 'active', createdAt: new Date(now - 2000) },
      { title: 'Physics Book', description: 'Basic physics', price: 40, category: 'Books', condition: 'Used', location: 'Hostel C', images: ['/4.jpg'], seller: userId, status: 'active', createdAt: new Date(now - 1000) },
      { title: 'Sold Item', description: 'Should not appear', price: 10, category: 'Other', condition: 'Used', location: 'None', images: ['/5.jpg'], seller: userId, status: 'sold', createdAt: new Date(now) }
    ]);

    // Ensure text indexes are built
    await Product.ensureIndexes();
  });

  it('1. should search by product title or description using text search', async () => {
    const res = await request(app).get('/api/products?search=Math');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toEqual('Engineering Math');
  });

  it('3. should filter by category', async () => {
    const res = await request(app).get('/api/products?category=Books');
    expect(res.body.data.length).toBe(2);
  });

  it('4. should filter by condition', async () => {
    const res = await request(app).get('/api/products?condition=New');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toEqual('Study Chair');
  });

  it('5. should filter by minimum price', async () => {
    const res = await request(app).get('/api/products?minPrice=200');
    expect(res.body.data.length).toBe(2); // Chair, Laptop
  });

  it('6. should filter by maximum price', async () => {
    const res = await request(app).get('/api/products?maxPrice=100');
    expect(res.body.data.length).toBe(2); // Both books
  });

  it('7. should sort by newest (default)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.body.data[0].title).toEqual('Physics Book'); // Inserted last
  });

  it('8. should sort by price ascending', async () => {
    const res = await request(app).get('/api/products?sort=price');
    expect(res.body.data[0].title).toEqual('Physics Book'); // 40
    expect(res.body.data[1].title).toEqual('Engineering Math'); // 50
  });

  it('9. should sort by price descending', async () => {
    const res = await request(app).get('/api/products?sort=-price');
    expect(res.body.data[0].title).toEqual('Gaming Laptop'); // 1000
  });

  it('10. should handle pagination', async () => {
    const res = await request(app).get('/api/products?page=1&limit=2');
    expect(res.body.data.length).toBe(2);
    expect(res.body.totalPages).toBe(2); // 4 active items total / 2 limit
    expect(res.body.totalProducts).toBe(4);
    
    const res2 = await request(app).get('/api/products?page=2&limit=2');
    expect(res2.body.data.length).toBe(2);
  });
});
