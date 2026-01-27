const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// WebSocket io instance will be set by server
let ioInstance = null;

// Function to set IO instance
function setIO(io) {
  ioInstance = io;
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

/**
 * @route   POST /api/patients/register
 * @desc    Register a new patient and generate token
 * @access   Public
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').trim().notEmpty().withMessage('Phone number required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
  body('department').isIn(['Cardiology', 'General Medicine', 'Pediatrics', 'Neurology', 'Orthopedics', 'Emergency']).withMessage('Valid department required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, email, phone, age, gender, department, priority, password } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ 
        error: 'Patient already registered',
        message: 'Please login with your existing account'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new patient
    const patient = new Patient({
      name,
      email,
      phone,
      age,
      gender,
      department,
      priority: priority || 'medium',
      password: hashedPassword,
      status: 'registered'
    });

    await patient.save();

    // Get queue position
    const position = await Patient.getQueuePosition(department, patient._id);
    patient.positionInQueue = position;

    // Emit real-time update
    if (ioInstance) {
      ioInstance.emit('patient_registered', {
        department,
        patient: {
          tokenNumber: patient.tokenNumber,
          name: patient.name,
          positionInQueue: position,
          estimatedWaitTime: position * 15
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        tokenNumber: patient.tokenNumber,
        positionInQueue: position,
        estimatedWaitTime: position * 15,
        department: patient.department
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/patients/login
 * @desc    Login patient and return token
 * @access   Public
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find patient
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email not found'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }

    // Update last login
    patient.lastLogin = new Date();
    await patient.save();

    // Get current queue position
    const position = await Patient.getQueuePosition(patient.department, patient._id);

    // Create JWT token
    const token = jwt.sign(
      { 
        id: patient._id, 
        email: patient.email,
        tokenNumber: patient.tokenNumber 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          tokenNumber: patient.tokenNumber,
          department: patient.department,
          positionInQueue: position,
          estimatedWaitTime: position * 15,
          status: patient.status
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/patients/queue/:department
 * @desc    Get queue for a department
 * @access   Public
 */
router.get('/queue/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const patients = await Patient.find({
      department,
      status: { $in: ['registered', 'waiting'] }
    }).sort({ checkInTime: 1 });

    const queueData = patients.map((patient, index) => ({
      tokenNumber: patient.tokenNumber,
      name: patient.name,
      positionInQueue: index + 1,
      estimatedWaitTime: index * 15,
      department: patient.department,
      priority: patient.priority,
      status: patient.status,
      checkInTime: patient.checkInTime
    }));

    res.json({
      success: true,
      data: {
        department,
        totalPatients: queueData.length,
        queue: queueData
      }
    });

  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch queue', 
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/patients/my-status
 * @desc    Get current patient status and position
 * @access   Private
 */
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient not found' 
      });
    }

    // Get current queue position
    const position = await Patient.getQueuePosition(patient.department, patient._id);

    res.json({
      success: true,
      data: {
        tokenNumber: patient.tokenNumber,
        name: patient.name,
        department: patient.department,
        positionInQueue: position,
        estimatedWaitTime: position * 15,
        status: patient.status,
        checkInTime: patient.checkInTime
      }
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch status', 
      message: error.message 
    });
  }
});

/**
 * @route   PUT /api/patients/update-status
 * @desc    Update patient status (for doctors/staff)
 * @access   Private
 */
router.put('/update-status', authenticateToken, [
  body('status').isIn(['waiting', 'in-consultation', 'completed', 'cancelled']).withMessage('Valid status required'),
  body('patientId').notEmpty().withMessage('Patient ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { status, patientId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient not found' 
      });
    }

    // Update status and timestamps
    patient.status = status;
    if (status === 'in-consultation') {
      patient.consultationStartTime = new Date();
    } else if (status === 'completed') {
      patient.consultationEndTime = new Date();
    }

    await patient.save();

    // Update queue positions for this department
    await Patient.getQueuePosition(patient.department, patientId);

    // Emit real-time update
    if (ioInstance) {
      ioInstance.emit('status_updated', {
        department: patient.department,
        patientId: patientId,
        tokenNumber: patient.tokenNumber,
        status: status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        tokenNumber: patient.tokenNumber,
        status: status
      }
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      error: 'Failed to update status', 
      message: error.message 
    });
  }
});

/**
 * @route   DELETE /api/patients/clear-all
 * @desc    Delete all patients from queue
 * @access   Public (for demo purposes)
 */
router.delete('/clear-all', async (req, res) => {
  try {
    // Delete all patients
    const result = await Patient.deleteMany({});
    
    // Emit real-time update
    if (ioInstance) {
      ioInstance.emit('queue_cleared', {
        message: 'All patients cleared from queue',
        timestamp: new Date(),
        deletedCount: result.deletedCount
      });
    }

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} patients from queue`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({ 
      error: 'Failed to clear queue', 
      message: error.message 
    });
  }
});

module.exports = { router, setIO };
