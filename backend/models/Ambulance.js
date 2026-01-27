const mongoose = require('mongoose');

/**
 * Ambulance Model
 * Stores ambulance location, status, and tracking information
 */
const ambulanceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unitNumber: {
    type: String,
    required: true,
    unique: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY'],
    default: 'AVAILABLE'
  },
  assignedAlertId: {
    type: String,
    default: null
  },
  lastUpdateTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
ambulanceSchema.index({ latitude: 1, longitude: 1 });
ambulanceSchema.index({ status: 1 });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
