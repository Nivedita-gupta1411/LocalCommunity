const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, product, message } = req.body;
    
    // Prevent sending message to self
    if (receiver === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      product,
      message
    });

    // Notify receiver
    try {
      const Notification = require('../models/Notification');
      const Product = require('../models/Product');
      const prod = await Product.findById(product);
      await Notification.create({
        recipient: receiver,
        sender: req.user.id,
        type: 'new_message',
        title: 'New Message',
        message: `${req.user.name} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        relatedProduct: product
      });
    } catch (notifErr) {
      // Continue even if notification fails
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations (unique partners/products)
// @route   GET /api/messages
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).populate('sender receiver product', 'name profileImage title images').sort('-createdAt');

    // Grouping logic can be done on frontend or backend.
    // We'll return all and let frontend group by conversation.
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific conversation (by user & product)
// @route   GET /api/messages/:productId/:otherUserId
// @access  Private
exports.getConversation = async (req, res, next) => {
  try {
    const { productId, otherUserId } = req.params;

    const messages = await Message.find({
      product: productId,
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    }).sort('createdAt');

    // Mark messages as read
    await Message.updateMany(
      { product: productId, sender: otherUserId, receiver: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};
