const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for reporting'],
    enum: [
      'Spam',
      'Fake product',
      'Inappropriate content',
      'Wrong information',
      'Scam',
      'Other'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
