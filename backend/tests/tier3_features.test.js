const request = require('supertest');
const app = require('../app');
const db = require('./setup');
const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Report = require('../models/Report');

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

async function createProductDirect(sellerId, data = {}) {
  return await Product.create({
    title: data.title || 'Engineering Mechanics',
    description: data.description || 'Statics and Dynamics textbook in good shape',
    price: data.price !== undefined ? data.price : 500,
    category: data.category || 'Books',
    condition: data.condition || 'Good',
    location: data.location || 'Hostel 3',
    listingType: data.listingType || 'Sell',
    status: data.status || 'active',
    seller: sellerId,
    images: ['uploads/test.jpg']
  });
}

describe('Smart Price Suggestion & Seller Trust Score Features', () => {
  let seller, buyer;

  beforeEach(async () => {
    seller = await createUser({ name: 'Active Seller', college: 'IIT Bombay' });
    buyer = await createUser({ name: 'Active Buyer', college: 'IIT Bombay' });
  });

  describe('Feature 1: Smart Price Suggestion API', () => {
    it('should return hasSuggestion: false when fewer than 3 listings exist in category', async () => {
      // Seed only 2 products
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 1200 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 1400 });

      const res = await request(app)
        .get('/api/products/price-suggestion?category=Electronics&listingType=Sell');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasSuggestion).toBe(false);
      expect(res.body.data.sampleSize).toBe(2);
      expect(res.body.data.message).toMatch(/not enough/i);
    });

    it('should return suggested price range when 3 or more listings exist', async () => {
      // Seed 4 products in Books category with prices: 300, 400, 500, 600
      await createProductDirect(seller.user._id, { category: 'Books', condition: 'Good', price: 300 });
      await createProductDirect(seller.user._id, { category: 'Books', condition: 'Good', price: 400 });
      await createProductDirect(seller.user._id, { category: 'Books', condition: 'Good', price: 500 });
      await createProductDirect(seller.user._id, { category: 'Books', condition: 'Good', price: 600 });

      const res = await request(app)
        .get('/api/products/price-suggestion?category=Books&condition=Good&listingType=Sell');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasSuggestion).toBe(true);
      expect(res.body.data.suggestedPrice).toBeGreaterThan(0);
      expect(res.body.data.minPrice).toBeLessThanOrEqual(res.body.data.suggestedPrice);
      expect(res.body.data.maxPrice).toBeGreaterThanOrEqual(res.body.data.suggestedPrice);
      expect(res.body.data.sampleSize).toBe(4);
    });

    it('should exclude current listing in edit mode when excludeId is provided', async () => {
      const p1 = await createProductDirect(seller.user._id, { category: 'Stationery', price: 100 });
      const p2 = await createProductDirect(seller.user._id, { category: 'Stationery', price: 120 });
      const p3 = await createProductDirect(seller.user._id, { category: 'Stationery', price: 150 });

      // With excludeId of p1, only 2 remain -> insufficient data
      const res = await request(app)
        .get(`/api/products/price-suggestion?category=Stationery&excludeId=${p1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasSuggestion).toBe(false);
      expect(res.body.data.sampleSize).toBe(2);
    });

    it('should trim extreme outliers when sample size is 5 or more', async () => {
      // Prices: 100, 500, 520, 540, 550, 10000 (extreme outlier)
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 100 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 500 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 520 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 540 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 550 });
      await createProductDirect(seller.user._id, { category: 'Electronics', price: 10000 });

      const res = await request(app)
        .get('/api/products/price-suggestion?category=Electronics');

      expect(res.status).toBe(200);
      expect(res.body.data.hasSuggestion).toBe(true);
      // Median should not be skewed towards 10000
      expect(res.body.data.suggestedPrice).toBeLessThan(1000);
      expect(res.body.data.maxPrice).toBeLessThan(2000);
    });
  });

  describe('Feature 2: Seller Trust Score API', () => {
    it('should compute baseline trust score for a new active seller', async () => {
      const res = await request(app).get(`/api/users/${seller.user._id}/trust-score`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(75); // 70 base + 5 neutral offer reliability
      expect(res.body.data.tier).toBe('Good');
      expect(res.body.data.isSuspended).toBe(false);
      expect(res.body.data.badges).toContain('Campus Verified');
      expect(res.body.data.stats.completedSales).toBe(0);
    });

    it('should increase score when seller completes sales', async () => {
      // Create 3 sold products (+9 bonus)
      await createProductDirect(seller.user._id, { status: 'sold' });
      await createProductDirect(seller.user._id, { status: 'sold' });
      await createProductDirect(seller.user._id, { status: 'sold' });

      const res = await request(app).get(`/api/users/${seller.user._id}/trust-score`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.completedSales).toBe(3);
      expect(res.body.data.breakdown.salesBonus).toBe(9);
      expect(res.body.data.score).toBe(84); // 70 + 9 + 5 = 84
      expect(res.body.data.badges).toContain('Active Seller');
    });

    it('should award reliability bonus for responding to offers', async () => {
      const prod = await createProductDirect(seller.user._id, { status: 'active' });

      // Create 3 offers: 2 accepted, 1 rejected -> 100% response rate
      await Offer.create({ product: prod._id, buyer: buyer.user._id, seller: seller.user._id, amount: 400, status: 'Accepted' });
      await Offer.create({ product: prod._id, buyer: buyer.user._id, seller: seller.user._id, amount: 350, status: 'Rejected' });
      await Offer.create({ product: prod._id, buyer: buyer.user._id, seller: seller.user._id, amount: 300, status: 'Countered', counterAmount: 380 });

      const res = await request(app).get(`/api/users/${seller.user._id}/trust-score`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.offersReceived).toBe(3);
      expect(res.body.data.stats.offersResponded).toBe(3);
      expect(res.body.data.stats.responseRatePercent).toBe(100);
      expect(res.body.data.breakdown.reliabilityBonus).toBe(10);
      expect(res.body.data.badges).toContain('Quick Responder');
    });

    it('should penalize trust score for verified resolved reports', async () => {
      const prod = await createProductDirect(seller.user._id, { status: 'active' });

      // Create a resolved report against seller's product
      await Report.create({
        reporter: buyer.user._id,
        product: prod._id,
        reason: 'Fake product',
        description: 'Listing is misleading',
        status: 'resolved'
      });

      const res = await request(app).get(`/api/users/${seller.user._id}/trust-score`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.resolvedReports).toBe(1);
      expect(res.body.data.breakdown.violationPenalty).toBe(20);
      // 70 base + 5 neutral - 20 penalty = 55 (Fair)
      expect(res.body.data.score).toBe(55);
      expect(res.body.data.tier).toBe('Fair');
    });

    it('should return score 0 and suspended status if seller is suspended', async () => {
      await User.findByIdAndUpdate(seller.user._id, { status: 'suspended' });

      const res = await request(app).get(`/api/users/${seller.user._id}/trust-score`);

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.isSuspended).toBe(true);
      expect(res.body.data.tier).toBe('Suspended');
    });

    it('should support alternative route /api/users/profile/:id/trust-score', async () => {
      const res = await request(app).get(`/api/users/profile/${seller.user._id}/trust-score`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId.toString()).toBe(seller.user._id.toString());
    });
  });
});
