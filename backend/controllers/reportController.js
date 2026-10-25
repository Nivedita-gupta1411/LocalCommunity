const Report = require('../models/Report');

// @desc    Report a product
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    const { product, reason, description } = req.body;
    
    // Check if user already reported this product
    const existingReport = await Report.findOne({ reporter: req.user.id, product });
    
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this product' });
    }

    const report = await Report.create({
      reporter: req.user.id,
      product,
      reason,
      description
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
