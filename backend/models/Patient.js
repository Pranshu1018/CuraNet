const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Queue Information
  department: {
    type: String,
    required: true,
    enum: ['Cardiology', 'General Medicine', 'Pediatrics', 'Neurology', 'Orthopedics', 'Emergency']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
    default: 'medium'
  },
  
  // Token Information
  tokenNumber: {
    type: String,
    unique: true
  },
  positionInQueue: {
    type: Number,
    default: 0
  },
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  
  // Status & Timestamps
  status: {
    type: String,
    enum: ['registered', 'waiting', 'in-consultation', 'completed', 'cancelled'],
    default: 'registered'
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  consultationStartTime: Date,
  consultationEndTime: Date,
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
patientSchema.index({ email: 1 });
patientSchema.index({ tokenNumber: 1 });
patientSchema.index({ department: 1, status: 1 });
patientSchema.index({ department: 1, positionInQueue: 1 });

// Pre-save middleware to generate token number
patientSchema.pre('save', async function(next) {
  if (this.isNew && !this.tokenNumber) {
    // Generate department-specific token
    const deptCode = {
      'Cardiology': 'A',
      'General Medicine': 'B', 
      'Pediatrics': 'C',
      'Neurology': 'D',
      'Orthopedics': 'E',
      'Emergency': 'F'
    };
    
    const code = deptCode[this.department] || 'X';
    
    // Get next serial number for this department
    const lastPatient = await this.constructor
      .findOne({ 
        tokenNumber: { $regex: `^OPD-${code}-` },
        department: this.department 
      })
      .sort({ tokenNumber: -1 });
    
    let nextNumber = 1;
    if (lastPatient && lastPatient.tokenNumber) {
      const lastNum = parseInt(lastPatient.tokenNumber.split('-')[2]);
      nextNumber = lastNum + 1;
    }
    
    this.tokenNumber = `OPD-${code}-${String(nextNumber).padStart(3, '0')}`;
  }
  next();
});

// Static method to get queue position
patientSchema.statics.getQueuePosition = async function(department, patientId) {
  const patients = await this.find({
    department,
    status: { $in: ['registered', 'waiting'] }
  }).sort({ checkInTime: 1 });
  
  const position = patients.findIndex(p => p._id.toString() === patientId.toString()) + 1;
  
  // Update all positions
  for (let i = 0; i < patients.length; i++) {
    await this.findByIdAndUpdate(patients[i]._id, {
      positionInQueue: i + 1,
      estimatedWaitTime: i * 15 // 15 minutes per patient
    });
  }
  
  return position;
};

module.exports = mongoose.model('Patient', patientSchema);
