const mongoose = require('mongoose');

/**
 * Emergency Alert Model
 * Stores emergency alerts with victim location and assigned ambulance
 */
const emergencyAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  victimLocation: {
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
    }
  },
  assignedAmbulanceId: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED'],
    default: 'PENDING'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  estimatedArrivalTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
emergencyAlertSchema.index({ timestamp: -1 });
emergencyAlertSchema.index({ status: 1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
