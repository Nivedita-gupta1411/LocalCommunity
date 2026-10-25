const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => {
  await db.connect();
  // Ensure uploads directory and dummy test image exist
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const dummyPath = path.join(uploadDir, 'test-image.jpg');
  if (!fs.existsSync(dummyPath)) {
    // Create a minimal valid JPEG (JFIF header)
    const buf = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(dummyPath, buf);
  }
});

afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// Helper: register a user and return { token, userId }
async function createUser(overrides = {}) {
  const data = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    college: 'Test College',
    ...overrides
  };
  const res = await request(app).post('/api/auth/register').send(data);
  return { token: res.body.token, userId: res.body.data._id, email: data.email };
}

// Helper: create a product directly in DB
async function createProductInDB(sellerId, overrides = {}) {
  return Product.create({
    title: 'Test Product',
    description: 'Test product description',
    price: 100,
    category: 'Books',
    condition: 'Used',
    location: 'Test Location',
    images: ['/uploads/test.jpg'],
    seller: sellerId,
    ...overrides
  });
}

describe('Product API', () => {
  let user1, user2;

  beforeEach(async () => {
    user1 = await createUser({ email: 'user1@test.com' });
    user2 = await createUser({ email: 'user2@test.com' });
  });

  // === CRUD ===

  it('1. should create product as authenticated user (with image upload)', async () => {
    const imgPath = path.join(__dirname, '../uploads/test-image.jpg');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${user1.token}`)
      .field('title', 'My New Book')
      .field('description', 'A nice book')
      .field('price', '250')
      .field('category', 'Books')
      .field('condition', 'New')
      .field('location', 'Hostel A')
      .attach('images', imgPath);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My New Book');
    expect(res.body.data.seller).toBe(user1.userId);
  });

  it('2. should reject create product without authentication', async () => {
    const res = await request(app).post('/api/products').send({ title: 'x' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. should get products', async () => {
    await createProductInDB(user1.userId);
    await createProductInDB(user1.userId, { title: 'Another' });

    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body).toHaveProperty('totalProducts');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
  });

  it('4. should get product by ID', async () => {
    const product = await createProductInDB(user1.userId, { title: 'Specific Product' });
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Specific Product');
  });

  it('5. should return 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/60d21b4667d0d8992e610c85');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('6. should update own product', async () => {
    const product = await createProductInDB(user1.userId);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ price: 999 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(999);
  });

  it('7. should prevent user from updating another user\'s product', async () => {
    const product = await createProductInDB(user1.userId);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${user2.token}`)
      .send({ price: 1 });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('8. should delete own product', async () => {
    const product = await createProductInDB(user1.userId);
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${user1.token}`);

    expect(res.statusCode).toBe(200);
    const check = await Product.findById(product._id);
    expect(check).toBeNull();
  });

  it('9. should prevent user from deleting another user\'s product', async () => {
    const product = await createProductInDB(user1.userId);
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${user2.token}`);

    expect(res.statusCode).toBe(403);
    // Product should still exist
    const check = await Product.findById(product._id);
    expect(check).not.toBeNull();
  });

  it('10. should mark product as sold (owner only)', async () => {
    const product = await createProductInDB(user1.userId);
    const res = await request(app)
      .patch(`/api/products/${product._id}/sold`)
      .set('Authorization', `Bearer ${user1.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('sold');
  });
});
