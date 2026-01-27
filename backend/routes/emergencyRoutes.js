const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const EmergencyAlert = require('../models/EmergencyAlert');
const { findNearestAmbulance, createLocationKey } = require('../utils/haversine');

// WebSocket io instance will be set by server
let ioInstance = null;

// Function to set IO instance
function setIO(io) {
  ioInstance = io;
}

/**
 * Generate unique alert ID
 */
function generateAlertId() {
  return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * POST /api/emergency
 * Creates a new emergency alert and assigns the nearest available ambulance
 * 
 * Request body:
 * {
 *   latitude: number,
 *   longitude: number
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        error: 'Invalid location data',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Check MongoDB connection status
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database connection unavailable',
        message: 'Unable to connect to database. Please ensure MongoDB is running and your IP is whitelisted in MongoDB Atlas.'
      });
    }

    // Find all available ambulances with timeout handling
    let availableAmbulances;
    try {
      availableAmbulances = await Ambulance.find({ status: 'AVAILABLE' }).maxTimeMS(5000);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(503).json({
        error: 'Database query failed',
        message: 'Unable to query ambulance data. Please check your MongoDB connection and IP whitelist settings.'
      });
    }

    // Find nearest ambulance using Haversine formula with consistent assignment
    const locationKey = createLocationKey(latitude, longitude);
    console.log(`📍 Location key: ${locationKey}`);
    
    const nearestAmbulance = findNearestAmbulance(
      availableAmbulances,
      latitude,
      longitude
    );

    if (!nearestAmbulance) {
      return res.status(503).json({
        error: 'No available ambulances',
        message: 'All ambulances are currently busy. Please try again later or call emergency services directly.'
      });
    }

    // Generate unique alert ID
    const alertId = generateAlertId();

    // Create emergency alert
    const emergencyAlert = new EmergencyAlert({
      alertId,
      victimLocation: {
        latitude,
        longitude
      },
      assignedAmbulanceId: nearestAmbulance.id,
      status: 'ASSIGNED',
      timestamp: new Date()
    });

    await emergencyAlert.save();

    // Update ambulance status to BUSY
    await Ambulance.findOneAndUpdate(
      { id: nearestAmbulance.id },
      {
        status: 'BUSY',
        assignedAlertId: alertId,
        lastUpdateTime: new Date()
      }
    );

    // Calculate estimated arrival time (assuming average speed of 60 km/h)
    const estimatedMinutes = Math.ceil((nearestAmbulance.distance / 60) * 60);
    const estimatedArrivalTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    await EmergencyAlert.findOneAndUpdate(
      { alertId },
      { estimatedArrivalTime }
    );

    // Emit WebSocket event for real-time updates
    if (ioInstance) {
      ioInstance.to(`emergency_${alertId}`).emit('emergency_alert_created', {
        alertId,
        victimLocation: { latitude, longitude },
        ambulance: {
          id: nearestAmbulance.id,
          unitNumber: nearestAmbulance.unitNumber,
          latitude: nearestAmbulance.latitude,
          longitude: nearestAmbulance.longitude,
          distance: Math.round(nearestAmbulance.distance * 10) / 10,
          estimatedArrivalMinutes: estimatedMinutes
        }
      });
    }

    // Return response with alert and ambulance details
    res.status(201).json({
      success: true,
      alert: {
        alertId,
        victimLocation: { latitude, longitude },
        assignedAmbulanceId: nearestAmbulance.id,
        timestamp: emergencyAlert.timestamp,
        estimatedArrivalTime
      },
      ambulance: {
        id: nearestAmbulance.id,
        unitNumber: nearestAmbulance.unitNumber,
        latitude: nearestAmbulance.latitude,
        longitude: nearestAmbulance.longitude,
        distance: Math.round(nearestAmbulance.distance * 10) / 10, // Round to 1 decimal
        estimatedArrivalMinutes: estimatedMinutes
      }
    });

  } catch (error) {
    console.error('Error creating emergency alert:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongooseError' || error.name === 'MongoServerError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({
        error: 'Database connection error',
        message: 'Unable to connect to database. Please check your MongoDB Atlas connection and ensure your IP address is whitelisted.'
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to process emergency request'
    });
  }
});

/**
 * GET /api/emergency/:alertId
 * Get details of a specific emergency alert
 */
router.get('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found',
        message: 'Emergency alert with the given ID does not exist'
      });
    }

    const ambulance = await Ambulance.findOne({ id: alert.assignedAmbulanceId });

    res.json({
      alert: {
        alertId: alert.alertId,
        victimLocation: alert.victimLocation,
        assignedAmbulanceId: alert.assignedAmbulanceId,
        status: alert.status,
        timestamp: alert.timestamp,
        estimatedArrivalTime: alert.estimatedArrivalTime
      },
      ambulance: ambulance ? {
        id: ambulance.id,
        unitNumber: ambulance.unitNumber,
        latitude: ambulance.latitude,
        longitude: ambulance.longitude,
        status: ambulance.status
      } : null
    });

  } catch (error) {
    console.error('Error fetching emergency alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch emergency alert'
    });
  }
});

/**
 * GET /api/ambulances
 * Get all ambulances (for admin/monitoring purposes)
 */
router.get('/ambulances', async (req, res) => {
  try {
    const ambulances = await Ambulance.find({});
    res.json({
      ambulances: ambulances.map(amb => ({
        id: amb.id,
        unitNumber: amb.unitNumber,
        latitude: amb.latitude,
        longitude: amb.longitude,
        status: amb.status,
        assignedAlertId: amb.assignedAlertId,
        lastUpdateTime: amb.lastUpdateTime
      }))
    });
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch ambulances'
    });
  }
});

/**
 * POST /api/ambulances/:ambulanceId/location
 * Update ambulance location (called by ambulance tracking device)
 */
router.post('/ambulances/:ambulanceId/location', async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        error: 'Invalid location data',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    const ambulance = await Ambulance.findOneAndUpdate(
      { id: ambulanceId },
      {
        latitude,
        longitude,
        lastUpdateTime: new Date()
      },
      { new: true }
    );

    if (!ambulance) {
      return res.status(404).json({
        error: 'Ambulance not found',
        message: 'Ambulance with the given ID does not exist'
      });
    }

    // Emit WebSocket event for real-time location updates
    if (ioInstance && ambulance.assignedAlertId) {
      ioInstance.to(`emergency_${ambulance.assignedAlertId}`).emit('ambulance_location_update', {
        alertId: ambulance.assignedAlertId,
        ambulance: {
          id: ambulance.id,
          unitNumber: ambulance.unitNumber,
          latitude: ambulance.latitude,
          longitude: ambulance.longitude,
          status: ambulance.status
        }
      });
    }

    res.json({
      success: true,
      ambulance: {
        id: ambulance.id,
        unitNumber: ambulance.unitNumber,
        latitude: ambulance.latitude,
        longitude: ambulance.longitude,
        status: ambulance.status,
        lastUpdateTime: ambulance.lastUpdateTime
      }
    });

  } catch (error) {
    console.error('Error updating ambulance location:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update ambulance location'
    });
  }
});

/**
 * POST /api/ambulances/:ambulanceId/status
 * Update ambulance status (e.g., mark as AVAILABLE after completing emergency)
 */
router.post('/ambulances/:ambulanceId/status', async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'BUSY'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be either AVAILABLE or BUSY'
      });
    }

    const updateData = {
      status,
      lastUpdateTime: new Date()
    };

    if (status === 'AVAILABLE') {
      updateData.assignedAlertId = null;
    }

    const ambulance = await Ambulance.findOneAndUpdate(
      { id: ambulanceId },
      updateData,
      { new: true }
    );

    if (!ambulance) {
      return res.status(404).json({
        error: 'Ambulance not found',
        message: 'Ambulance with the given ID does not exist'
      });
    }

    res.json({
      success: true,
      ambulance: {
        id: ambulance.id,
        unitNumber: ambulance.unitNumber,
        status: ambulance.status,
        assignedAlertId: ambulance.assignedAlertId
      }
    });

  } catch (error) {
    console.error('Error updating ambulance status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update ambulance status'
    });
  }
});

// Export router and setIO function
module.exports = router;
module.exports.setIO = setIO;
  
