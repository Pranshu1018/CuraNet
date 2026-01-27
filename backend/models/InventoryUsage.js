const mongoose = require('mongoose');

const inventoryUsageSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  quantityUsed: {
    type: Number,
    required: true,
    min: 1
  },
  department: {
    type: String,
    required: true,
    enum: ['Emergency', 'OPD', 'IPD', 'ICU', 'Pharmacy', 'General', 'Pediatrics', 'Surgery', 'Maternity']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  purpose: {
    type: String,
    required: true,
    enum: ['Patient Treatment', 'Emergency Use', 'Surgery', 'Routine Care', 'Vaccination', 'Diagnostic']
  },
  patientId: {
    type: String,
    default: null
  },
  recordedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
inventoryUsageSchema.index({ hospitalId: 1, medicineName: 1, timestamp: -1 });
inventoryUsageSchema.index({ hospitalId: 1, timestamp: -1 });
inventoryUsageSchema.index({ medicineName: 1, timestamp: -1 });
inventoryUsageSchema.index({ department: 1, timestamp: -1 });

module.exports = mongoose.model('InventoryUsage', inventoryUsageSchema);
