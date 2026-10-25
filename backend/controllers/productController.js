const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const priceSuggestionService = require('../services/priceSuggestionService');

// @desc    Get all products (with pagination, search, filter)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'minPrice', 'maxPrice', 'seller', 'status', 'listingType', 'location'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse back to object
    query = JSON.parse(queryStr);

    // Add search functionality (flexible regex fallback if text search returns no results or general search)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { location: searchRegex }
      ];
    }

    // Add listing type filtering
    if (req.query.listingType) {
      query.listingType = req.query.listingType;
    }

    // Add location filtering
    if (req.query.location) {
      query.location = new RegExp(req.query.location.trim(), 'i');
    }

    // Add price filtering
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Add seller filtering (for My Listings page)
    if (req.query.seller) {
      query.seller = req.query.seller;
    }

    // Only active listings by default, unless seller is filtering own listings
    // or a specific status is requested
    if (req.query.status) {
      query.status = req.query.status;
    } else if (!req.query.seller) {
      query.status = 'active';
    }
    // When seller param is passed (MyListings), show all statuses (active + sold)

    let mongooseQuery = Product.find(query).populate('seller', 'name profileImage');

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      mongooseQuery = mongooseQuery.sort(sortBy);
    } else {
      mongooseQuery = mongooseQuery.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    mongooseQuery = mongooseQuery.skip(startIndex).limit(limit);

    // Execute query
    const products = await mongooseQuery;

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalProducts,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name profileImage location college');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save({ validateBeforeSave: false });

    // Track in recentlyViewed if user is authenticated via Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          const User = require('../models/User');
          const user = await User.findById(decoded.id);
          if (user) {
            // Remove if already present so it moves to front
            user.recentlyViewed = (user.recentlyViewed || []).filter(
              pId => pId.toString() !== product._id.toString()
            );
            user.recentlyViewed.unshift(product._id);
            // Limit to 10
            if (user.recentlyViewed.length > 10) {
              user.recentlyViewed = user.recentlyViewed.slice(0, 10);
            }
            await user.save({ validateBeforeSave: false });
          }
        }
      } catch (authErr) {
        // Silently continue if token is invalid or expired
      }
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res, next) => {
  try {
    // Add seller to req.body
    req.body.seller = req.user.id;

    // Handle images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image' });
    }

    req.body.images = req.files.map(file => `/uploads/${file.filename}`);

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      req.body.images = [...product.images, ...newImages];
      
      // Enforce max 5 images logic here if needed, or handle frontend validation strictly
      if (req.body.images.length > 5) {
         return res.status(400).json({ success: false, message: 'Maximum 5 images allowed' });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Optional: Delete images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        const filePath = path.join(__dirname, '..', img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark product as sold
// @route   PATCH /api/products/:id/sold
// @access  Private
exports.markAsSold = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    product.status = 'sold';
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart price suggestion based on historical comparable listings
// @route   GET /api/products/price-suggestion
// @access  Public
exports.getPriceSuggestion = async (req, res, next) => {
  try {
    const { category, condition, title, listingType, excludeId } = req.query;
    const suggestion = await priceSuggestionService.getSuggestedPrice({
      category,
      condition,
      title,
      listingType,
      excludeId
    });

    res.status(200).json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
};
