const mongoose = require('mongoose');

const diseaseReportSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true
  },
  disease: {
    type: String,
    required: true,
    trim: true
  },
  cases: {
    type: Number,
    required: true,
    min: 0
  },
  reportingPeriod: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly']
  },
  periodStartDate: {
    type: Date,
    required: true
  },
  periodEndDate: {
    type: Date,
    required: true
  },
  reportingHospital: {
    type: String,
    required: true
  },
  reportedBy: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['mild', 'moderate', 'severe', 'critical']
  },
  ageGroup: {
    type: String,
    enum: ['0-5', '6-18', '19-40', '41-60', '60+'],
    required: false
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
diseaseReportSchema.index({ city: 1, disease: 1, periodStartDate: -1 });
diseaseReportSchema.index({ disease: 1, periodStartDate: -1 });
diseaseReportSchema.index({ city: 1, periodStartDate: -1 });
diseaseReportSchema.index({ reportingPeriod: 1, periodStartDate: -1 });

// Compound index for unique reporting periods
diseaseReportSchema.index(
  { city: 1, disease: 1, reportingPeriod: 1, periodStartDate: 1, periodEndDate: 1 },
  { unique: true }
);

module.exports = mongoose.model('DiseaseReport', diseaseReportSchema);
