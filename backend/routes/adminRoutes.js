const express = require('express');
const {
  getStats,
  getUsers,
  updateUserStatus,
  getAllProducts,
  adminDeleteProduct,
  getReports,
  updateReportStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

router.get('/products', getAllProducts);
router.delete('/products/:id', adminDeleteProduct);

router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

module.exports = router;
