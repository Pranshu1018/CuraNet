const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  totalBeds: {
    type: Number,
    required: true,
    min: 0
  },
  inventory: [{
    name: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    category: {
      type: String,
      required: true,
      enum: ['Medicine', 'Equipment', 'Supplies']
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
