const User = require('../models/User');

// @desc    Add product to favorites
// @route   POST /api/products/:id/favorite
// @access  Private
exports.addFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if already in favorites
    if (user.favorites.includes(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Product already in favorites' });
    }

    user.favorites.push(req.params.id);
    await user.save();

    res.status(200).json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/products/:id/favorite
// @access  Private
exports.removeFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== req.params.id
    );
    
    await user.save();

    res.status(200).json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.status(200).json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public user profile
// @route   GET /api/users/profile/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -favorites');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'college', 'location'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle profile image upload
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recently viewed products
// @route   GET /api/users/me/recently-viewed
// @access  Private
exports.getRecentlyViewed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'recentlyViewed',
      populate: { path: 'seller', select: 'name profileImage' }
    });

    const activeRecent = (user.recentlyViewed || []).filter(p => p && p.status === 'active');
    res.status(200).json({ success: true, count: activeRecent.length, data: activeRecent });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rule-based product recommendations
// @route   GET /api/users/me/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const user = await User.findById(req.user.id).populate('recentlyViewed').populate('favorites');

    // Collect preferred categories from recent views and favorites
    const categoryCounts = {};
    (user.recentlyViewed || []).forEach(p => {
      if (p && p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 2;
    });
    (user.favorites || []).forEach(p => {
      if (p && p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 3;
    });

    const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

    let recommendedProducts = [];
    const excludedIds = [
      ...((user.recentlyViewed || []).map(p => p._id)),
      ...((user.favorites || []).map(p => p._id))
    ];

    if (topCategories.length > 0) {
      recommendedProducts = await Product.find({
        category: { $in: topCategories },
        status: 'active',
        seller: { $ne: user._id },
        _id: { $nin: excludedIds }
      })
      .populate('seller', 'name profileImage')
      .sort('-views -createdAt')
      .limit(8);
    }

    // Fallback: If not enough recommendations, backfill with most viewed active listings
    if (recommendedProducts.length < 4) {
      const remainingLimit = 8 - recommendedProducts.length;
      const alreadyRecommended = recommendedProducts.map(p => p._id);
      const fallbackProducts = await Product.find({
        status: 'active',
        seller: { $ne: user._id },
        _id: { $nin: [...excludedIds, ...alreadyRecommended] }
      })
      .populate('seller', 'name profileImage')
      .sort('-views -createdAt')
      .limit(remainingLimit);

      recommendedProducts = [...recommendedProducts, ...fallbackProducts];
    }

    res.status(200).json({
      success: true,
      topCategories,
      data: recommendedProducts
    });
  } catch (error) {
    next(error);
  }
};
