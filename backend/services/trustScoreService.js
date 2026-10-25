const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Report = require('../models/Report');

/**
 * Seller Trust Score Service
 * Transparent, deterministic 0–100 score computed from real on-platform activity.
 * 
 * Formula (0 - 100):
 * - Base Baseline: 70
 * - Completed Sales: +3 per sold listing (max +15)
 * - Offer Reliability: (offersResponded / offersReceived) * 10 (or +5 neutral if 0 offers received) (max +10)
 * - Account Maturity: +1 per 30 days on campus (max +5)
 * - Verified Violations: -20 per resolved report against seller's listings (max -40 penalty)
 * - Suspended Account: forces score to 0
 */
exports.calculateTrustScore = async (userId) => {
  const user = await User.findById(userId).select('name college status createdAt role');
  if (!user) {
    return null;
  }

  // 1. If user is suspended, trust score is immediately 0
  if (user.status === 'suspended') {
    return {
      userId: user._id,
      userName: user.name,
      score: 0,
      tier: 'Suspended',
      color: 'red',
      isSuspended: true,
      summary: 'Account suspended for policy violations.',
      breakdown: {
        base: 0,
        salesBonus: 0,
        reliabilityBonus: 0,
        accountMaturityBonus: 0,
        violationPenalty: 0
      },
      stats: {
        totalListings: 0,
        completedSales: 0,
        activeListings: 0,
        offersReceived: 0,
        offersResponded: 0,
        responseRatePercent: 0,
        resolvedReports: 0,
        memberDays: 0
      },
      badges: []
    };
  }

  // 2. Product Stats
  const sellerProducts = await Product.find({ seller: userId }).select('_id status');
  const totalListings = sellerProducts.length;
  const completedSales = sellerProducts.filter(p => p.status === 'sold').length;
  const activeListings = sellerProducts.filter(p => p.status === 'active').length;

  // 3. Offer Responsiveness
  const receivedOffers = await Offer.find({ seller: userId }).select('status');
  const offersReceived = receivedOffers.length;
  const offersResponded = receivedOffers.filter(o => ['Accepted', 'Rejected', 'Countered'].includes(o.status)).length;

  let responseRatePercent = 0;
  let reliabilityBonus = 5; // Neutral baseline for sellers who haven't received offers yet
  if (offersReceived > 0) {
    responseRatePercent = Math.round((offersResponded / offersReceived) * 100);
    reliabilityBonus = Math.min(10, Math.round((offersResponded / offersReceived) * 10));
  }

  // 4. Account Age (Maturity)
  const now = new Date();
  const createdDate = new Date(user.createdAt || now);
  const diffTime = Math.max(0, now - createdDate);
  const memberDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const accountMaturityBonus = Math.min(5, Math.floor(memberDays / 30));

  // 5. Verified Violations (Resolved reports on user's products)
  const productIds = sellerProducts.map(p => p._id);
  let resolvedReports = 0;
  if (productIds.length > 0) {
    resolvedReports = await Report.countDocuments({
      product: { $in: productIds },
      status: 'resolved'
    });
  }
  const violationPenalty = Math.min(40, resolvedReports * 20);

  // 6. Calculate Sales Bonus (+3 per sale, max 15)
  const salesBonus = Math.min(15, completedSales * 3);

  // 7. Base score
  const base = 70;

  // 8. Total Raw Score
  let score = base + salesBonus + reliabilityBonus + accountMaturityBonus - violationPenalty;
  score = Math.max(0, Math.min(100, score));

  // 9. Assign Tier & Color
  let tier = 'Fair';
  let color = 'amber';
  if (score >= 90) {
    tier = 'Excellent';
    color = 'emerald';
  } else if (score >= 75) {
    tier = 'Good';
    color = 'blue';
  } else if (score < 50) {
    tier = 'Caution';
    color = 'rose';
  }

  // 10. Badges
  const badges = [];
  if (user.college) {
    badges.push('Campus Verified');
  }
  if (completedSales >= 5) {
    badges.push('Top Seller');
  } else if (completedSales >= 1) {
    badges.push('Active Seller');
  }
  if (offersReceived >= 3 && responseRatePercent >= 80) {
    badges.push('Quick Responder');
  }
  if (memberDays >= 60) {
    badges.push('Community Veteran');
  }

  return {
    userId: user._id,
    userName: user.name,
    score,
    tier,
    color,
    isSuspended: false,
    summary: `${tier} Community Standing (${score}/100)`,
    breakdown: {
      base,
      salesBonus,
      reliabilityBonus,
      accountMaturityBonus,
      violationPenalty
    },
    stats: {
      totalListings,
      completedSales,
      activeListings,
      offersReceived,
      offersResponded,
      responseRatePercent,
      resolvedReports,
      memberDays
    },
    badges
  };
};
