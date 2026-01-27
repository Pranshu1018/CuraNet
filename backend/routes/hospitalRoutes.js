const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { getCurrentOccupiedBeds, getMultipleOccupiedBeds, createBedEvent } = require('../services/bedEventService');

// POST /add - Create a new hospital
router.post('/add', async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /heatmap-data - Return hospital data from MongoDB with calculated occupancy
router.get('/heatmap-data', async (req, res) => {
  console.log('Hit: Heatmap Data Endpoint');
  
  try {
    const hospitals = await Hospital.find({});
    
    // Filter out hospitals with missing location data
    const validHospitals = hospitals.filter(hospital => 
      hospital.location && 
      typeof hospital.location.lat === 'number' && 
      typeof hospital.location.lng === 'number' &&
      hospital.totalBeds > 0
    );
    
    if (validHospitals.length === 0) {
      return res.json([]);
    }
    
    const hospitalIds = validHospitals.map(h => h._id);
    
    // Get occupied beds for all hospitals
    const occupancyData = await getMultipleOccupiedBeds(hospitalIds);
    
    // Create a lookup map for occupied beds
    const occupancyMap = {};
    occupancyData.forEach(item => {
      occupancyMap[item.hospitalId.toString()] = item.occupiedBeds;
    });
    
    const heatmapData = validHospitals.map(hospital => {
      const hospitalId = hospital._id.toString();
      const occupiedBeds = occupancyMap[hospitalId] || 0;
      const intensity = hospital.totalBeds > 0 ? occupiedBeds / hospital.totalBeds : 0;
      const normalizedIntensity = Math.min(1, Math.max(0, intensity));
      
      // Map severity based on intensity
      let severity;
      if (normalizedIntensity < 0.6) {
        severity = 'LOW';
      } else if (normalizedIntensity <= 0.75) {
        severity = 'MEDIUM';
      } else if (normalizedIntensity <= 0.85) {
        severity = 'HIGH';
      } else {
        severity = 'CRITICAL';
      }
      
      return {
        lat: hospital.location.lat,
        lng: hospital.location.lng,
        intensity: normalizedIntensity,
        severity: severity
      };
    });
    
    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// POST /admission - Record patient admission
router.post('/admission', async (req, res) => {
  try {
    const { hospitalId, count = 1 } = req.body;
    
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }
    
    // Verify hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Create admission event
    const bedEvent = await createBedEvent(hospitalId, 'ADMISSION', count);
    
    // Get updated occupancy
    const occupiedBeds = await getCurrentOccupiedBeds(hospitalId);
    
    res.status(201).json({
      message: 'Admission recorded successfully',
      event: bedEvent,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds)
    });
  } catch (error) {
    console.error('Error recording admission:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /discharge - Record patient discharge
router.post('/discharge', async (req, res) => {
  try {
    const { hospitalId, count = 1 } = req.body;
    
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }
    
    // Verify hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Create discharge event
    const bedEvent = await createBedEvent(hospitalId, 'DISCHARGE', count);
    
    // Get updated occupancy
    const occupiedBeds = await getCurrentOccupiedBeds(hospitalId);
    
    res.status(201).json({
      message: 'Discharge recorded successfully',
      event: bedEvent,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds)
    });
  } catch (error) {
    console.error('Error recording discharge:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /:id/occupancy - Get current occupancy for a specific hospital
router.get('/:id/occupancy', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    const occupiedBeds = await getCurrentOccupiedBeds(req.params.id);
    
    res.json({
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      totalBeds: hospital.totalBeds,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
      occupancyRate: hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) * 100 : 0
    });
  } catch (error) {
    console.error('Error fetching occupancy:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy data' });
  }
});

module.exports = router;
