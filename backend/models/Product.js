const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Books',
      'Electronics',
      'Furniture',
      'Cycles',
      'Fashion',
      'Stationery',
      'Hostel Essentials',
      'Other'
    ]
  },
  listingType: {
    type: String,
    enum: ['Sell', 'Rent', 'Exchange', 'Donate'],
    default: 'Sell'
  },
  condition: {
    type: String,
    required: [true, 'Please select a condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Used']
  },
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, '{PATH} exceeds the limit of 5']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'deleted'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search capabilities
productSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });
productSchema.index({ listingType: 1, category: 1, status: 1 });

function arrayLimit(val) {
  return val.length > 0 && val.length <= 5;
}

module.exports = mongoose.model('Product', productSchema);
