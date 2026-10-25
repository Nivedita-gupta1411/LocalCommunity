const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Message = require('../models/Message');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, activeProducts, soldProducts, totalReports, pendingReports, totalMessages] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'sold' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Message.countDocuments()
    ]);

    // Category breakdown
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent users (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    const newListingsThisWeek = await Product.countDocuments({ createdAt: { $gte: weekAgo } });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        activeProducts,
        soldProducts,
        totalReports,
        pendingReports,
        totalMessages,
        newUsersThisWeek,
        newListingsThisWeek,
        categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (suspend/active)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.status = req.body.status || user.status;
    await user.save();
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products (including deleted/sold)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('seller', 'name email');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (admin force delete)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.adminDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('product', 'title status seller');
      
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PATCH /api/admin/reports/:id
// @access  Private/Admin
exports.updateReportStatus = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
