const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an offer amount'],
    min: [1, 'Offer amount must be greater than 0']
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Countered', 'Withdrawn'],
    default: 'Pending'
  },
  counterAmount: {
    type: Number,
    min: [1, 'Counter offer amount must be greater than 0']
  },
  counterMessage: {
    type: String,
    maxlength: [500, 'Counter message cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

offerSchema.index({ product: 1, buyer: 1 });
offerSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Offer', offerSchema);
