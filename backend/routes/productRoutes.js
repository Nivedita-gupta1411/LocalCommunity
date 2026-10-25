const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  markAsSold,
  getPriceSuggestion
} = require('../controllers/productController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { addFavorite, removeFavorite } = require('../controllers/userController');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, upload.array('images', 5), createProduct);

router.get('/price-suggestion', getPriceSuggestion);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, upload.array('images', 5), updateProduct)
  .delete(protect, deleteProduct);

router.patch('/:id/sold', protect, markAsSold);

router.post('/:id/favorite', protect, addFavorite);
router.delete('/:id/favorite', protect, removeFavorite);

module.exports = router;
