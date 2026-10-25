const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Notification = require('../models/Notification');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

async function createUser(data = {}) {
  const email = data.email || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@college.edu`;
  const res = await request(app).post('/api/auth/register').send({
    name: data.name || 'Test User',
    email,
    password: 'password123',
    college: 'IIT Delhi',
    ...data
  });
  return { token: res.body.token, user: res.body.data };
}

async function createProduct(token, data = {}) {
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .field('title', data.title || 'Engineering Mechanics')
    .field('description', data.description || 'Statics and Dynamics textbook in good shape')
    .field('price', data.price || 400)
    .field('category', data.category || 'Books')
    .field('condition', data.condition || 'Good')
    .field('location', data.location || 'Hostel 3')
    .field('listingType', data.listingType || 'Sell')
    .attach('images', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9]), 'test.jpg');
  return res.body.data;
}

describe('Tier 2 Features Test Suite', () => {
  let seller, buyer, product;

  beforeEach(async () => {
    seller = await createUser({ name: 'Seller User' });
    buyer = await createUser({ name: 'Buyer User' });
    product = await createProduct(seller.token, { title: 'Bicycle Gear 6', listingType: 'Rent', price: 1500 });
  });

  describe('1. Listing Types', () => {
    it('should create listing with valid listingType', async () => {
      const p = await createProduct(seller.token, { title: 'Free Mattress', listingType: 'Donate', price: 0 });
      expect(p.listingType).toBe('Donate');
    });

    it('should reject invalid listingType with validation error', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${seller.token}`)
        .field('title', 'Invalid Item')
        .field('description', 'Test item description')
        .field('price', 100)
        .field('category', 'Other')
        .field('condition', 'Good')
        .field('location', 'Campus')
        .field('listingType', 'InvalidType')
        .attach('images', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9]), 'test.jpg');

      expect(res.statusCode).toBe(400);
    });

    it('should filter products by listingType', async () => {
      await createProduct(seller.token, { title: 'Sell Laptop', listingType: 'Sell' });
      await createProduct(seller.token, { title: 'Donate Clothes', listingType: 'Donate' });

      const resRent = await request(app).get('/api/products?listingType=Rent');
      expect(resRent.statusCode).toBe(200);
      expect(resRent.body.data.every(p => p.listingType === 'Rent')).toBe(true);

      const resDonate = await request(app).get('/api/products?listingType=Donate');
      expect(resDonate.statusCode).toBe(200);
      expect(resDonate.body.data.every(p => p.listingType === 'Donate')).toBe(true);
    });
  });

  describe('2. Offers & Negotiation System', () => {
    it('should create valid offer and notify seller', async () => {
      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1200, message: 'Can you do 1200?' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.amount).toBe(1200);
      expect(res.body.data.status).toBe('Pending');

      // Verify notification created for seller
      const notifs = await Notification.find({ recipient: seller.user._id, type: 'offer_received' });
      expect(notifs.length).toBe(1);
    });

    it('should reject unauthenticated offer', async () => {
      const res = await request(app)
        .post('/api/offers')
        .send({ productId: product._id, amount: 1200 });

      expect(res.statusCode).toBe(401);
    });

    it('should reject offer on own listing', async () => {
      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${seller.token}`)
        .send({ productId: product._id, amount: 1000 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('own listing');
    });

    it('should reject non-positive offer amount', async () => {
      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 0 });

      expect(res.statusCode).toBe(400);
    });

    it('seller can accept offer and buyer receives notification', async () => {
      const offerRes = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1300 });

      const offerId = offerRes.body.data._id;

      const acceptRes = await request(app)
        .patch(`/api/offers/${offerId}/accept`)
        .set('Authorization', `Bearer ${seller.token}`);

      expect(acceptRes.statusCode).toBe(200);
      expect(acceptRes.body.data.status).toBe('Accepted');

      const notifs = await Notification.find({ recipient: buyer.user._id, type: 'offer_accepted' });
      expect(notifs.length).toBe(1);
    });

    it('seller can reject offer', async () => {
      const offerRes = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 900 });

      const offerId = offerRes.body.data._id;

      const rejectRes = await request(app)
        .patch(`/api/offers/${offerId}/reject`)
        .set('Authorization', `Bearer ${seller.token}`);

      expect(rejectRes.statusCode).toBe(200);
      expect(rejectRes.body.data.status).toBe('Rejected');
    });

    it('seller can counter offer with valid amount', async () => {
      const offerRes = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1000 });

      const offerId = offerRes.body.data._id;

      const counterRes = await request(app)
        .patch(`/api/offers/${offerId}/counter`)
        .set('Authorization', `Bearer ${seller.token}`)
        .send({ counterAmount: 1350, counterMessage: 'Lowest I can do is 1350' });

      expect(counterRes.statusCode).toBe(200);
      expect(counterRes.body.data.status).toBe('Countered');
      expect(counterRes.body.data.counterAmount).toBe(1350);
    });

    it('unauthorized user cannot accept another seller offer', async () => {
      const thirdUser = await createUser();
      const offerRes = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1100 });

      const offerId = offerRes.body.data._id;

      const res = await request(app)
        .patch(`/api/offers/${offerId}/accept`)
        .set('Authorization', `Bearer ${thirdUser.token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('3. Notifications', () => {
    it('retrieves user notifications and marks as read', async () => {
      // Trigger notification
      await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1200 });

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${seller.token}`);

      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.unreadCount).toBeGreaterThanOrEqual(1);

      const notifId = listRes.body.data[0]._id;

      // Mark single read
      const markRes = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${seller.token}`);

      expect(markRes.statusCode).toBe(200);
      expect(markRes.body.data.read).toBe(true);

      // Mark all read
      const markAllRes = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${seller.token}`);

      expect(markAllRes.statusCode).toBe(200);
    });

    it('prevents user from modifying another user notification', async () => {
      await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ productId: product._id, amount: 1200 });

      const sellerNotif = await Notification.findOne({ recipient: seller.user._id });

      const res = await request(app)
        .patch(`/api/notifications/${sellerNotif._id}/read`)
        .set('Authorization', `Bearer ${buyer.token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('4. Recently Viewed Products', () => {
    it('tracks viewed product for authenticated user without duplicate ids', async () => {
      // Open product with auth token
      await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${buyer.token}`);

      // Open again to test duplicate prevention
      await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${buyer.token}`);

      const recentRes = await request(app)
        .get('/api/users/me/recently-viewed')
        .set('Authorization', `Bearer ${buyer.token}`);

      expect(recentRes.statusCode).toBe(200);
      expect(recentRes.body.data.length).toBe(1);
      expect(recentRes.body.data[0]._id.toString()).toBe(product._id.toString());
    });
  });

  describe('5. Rule-Based Recommendations', () => {
    it('recommends active products based on user activity', async () => {
      // Create some active products in other categories
      await createProduct(seller.token, { title: 'Desk Lamp', category: 'Hostel Essentials' });
      await createProduct(seller.token, { title: 'Office Chair', category: 'Furniture' });

      const recRes = await request(app)
        .get('/api/users/me/recommendations')
        .set('Authorization', `Bearer ${buyer.token}`);

      expect(recRes.statusCode).toBe(200);
      expect(Array.isArray(recRes.body.data)).toBe(true);
      expect(recRes.body.data.every(p => p.status === 'active')).toBe(true);
    });
  });
});
