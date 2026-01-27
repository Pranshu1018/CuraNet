const mongoose = require('mongoose');

const bedEventSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ADMISSION', 'DISCHARGE']
  },
  count: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
bedEventSchema.index({ hospitalId: 1, timestamp: 1 });
bedEventSchema.index({ type: 1, timestamp: 1 });

module.exports = mongoose.model('BedEvent', bedEventSchema);
