const express = require('express');
const {
  getFavorites,
  getUserProfile,
  updateProfile,
  getRecentlyViewed,
  getRecommendations,
  getSellerTrustScore
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/me/favorites', protect, getFavorites);
router.get('/me/recently-viewed', protect, getRecentlyViewed);
router.get('/me/recommendations', protect, getRecommendations);
router.get('/profile/:id', getUserProfile);
router.get('/profile/:id/trust-score', getSellerTrustScore);
router.get('/:id/trust-score', getSellerTrustScore);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

module.exports = router;
