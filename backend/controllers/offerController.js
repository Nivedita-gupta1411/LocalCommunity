const Offer = require('../models/Offer');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// @desc    Create an offer on a product
// @route   POST /api/offers
// @access  Private
exports.createOffer = async (req, res, next) => {
  try {
    const { productId, amount, message } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid offer amount greater than 0' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cannot make an offer on an inactive or sold product' });
    }

    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listing' });
    }

    const offer = await Offer.create({
      product: product._id,
      buyer: req.user.id,
      seller: product.seller,
      amount: Number(amount),
      message
    });

    // Notify seller
    await Notification.create({
      recipient: product.seller,
      sender: req.user.id,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${req.user.name} offered ₹${amount} for "${product.title}"`,
      relatedProduct: product._id,
      relatedOffer: offer._id
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's offers (sent or received)
// @route   GET /api/offers
// @access  Private
exports.getOffers = async (req, res, next) => {
  try {
    const { role } = req.query; // 'buyer' or 'seller'
    let query = {};

    if (role === 'buyer') {
      query.buyer = req.user.id;
    } else if (role === 'seller') {
      query.seller = req.user.id;
    } else {
      query = { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };
    }

    const offers = await Offer.find(query)
      .populate('product', 'title price images status')
      .populate('buyer', 'name profileImage college')
      .populate('seller', 'name profileImage college')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept an offer
// @route   PATCH /api/offers/:id/accept
// @access  Private
exports.acceptOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('product');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the seller can accept this offer' });
    }

    if (offer.status !== 'Pending' && offer.status !== 'Countered') {
      return res.status(400).json({ success: false, message: `Offer is already ${offer.status}` });
    }

    offer.status = 'Accepted';
    await offer.save();

    // Notify buyer
    await Notification.create({
      recipient: offer.buyer,
      sender: req.user.id,
      type: 'offer_accepted',
      title: 'Offer Accepted!',
      message: `${req.user.name} accepted your offer of ₹${offer.amount} for "${offer.product.title}"`,
      relatedProduct: offer.product._id,
      relatedOffer: offer._id
    });

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject an offer
// @route   PATCH /api/offers/:id/reject
// @access  Private
exports.rejectOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('product');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the seller can reject this offer' });
    }

    offer.status = 'Rejected';
    await offer.save();

    // Notify buyer
    await Notification.create({
      recipient: offer.buyer,
      sender: req.user.id,
      type: 'offer_rejected',
      title: 'Offer Declined',
      message: `${req.user.name} declined your offer for "${offer.product.title}"`,
      relatedProduct: offer.product._id,
      relatedOffer: offer._id
    });

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Counter an offer
// @route   PATCH /api/offers/:id/counter
// @access  Private
exports.counterOffer = async (req, res, next) => {
  try {
    const { counterAmount, counterMessage } = req.body;

    if (!counterAmount || Number(counterAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Counter amount must be greater than 0' });
    }

    const offer = await Offer.findById(req.params.id).populate('product');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the seller can counter this offer' });
    }

    offer.status = 'Countered';
    offer.counterAmount = Number(counterAmount);
    offer.counterMessage = counterMessage;
    await offer.save();

    // Notify buyer
    await Notification.create({
      recipient: offer.buyer,
      sender: req.user.id,
      type: 'offer_countered',
      title: 'Counter Offer Received',
      message: `${req.user.name} countered with ₹${counterAmount} for "${offer.product.title}"`,
      relatedProduct: offer.product._id,
      relatedOffer: offer._id
    });

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw an offer (buyer only)
// @route   PATCH /api/offers/:id/withdraw
// @access  Private
exports.withdrawOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.buyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the buyer can withdraw this offer' });
    }

    if (offer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Can only withdraw pending offers' });
    }

    offer.status = 'Withdrawn';
    await offer.save();

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};
