const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { getMultipleOccupiedBeds } = require('../services/bedEventService');

/**
 * Classify hospital based on occupancy rate
 * @param {number} occupancyRate - Occupancy percentage (0-100)
 * @returns {string} - 'Available', 'Warning', or 'Critical'
 */
function classifyHospital(occupancyRate) {
  if (occupancyRate < 70) return 'Available';
  if (occupancyRate <= 85) return 'Warning';
  return 'Critical';
}

/**
 * Calculate city-level capacity summary
 * @param {Array} hospitals - Array of hospital objects
 * @param {Array} occupancyData - Array of occupied beds data
 * @returns {Object} - City capacity summary
 */
function calculateCitySummary(hospitals, occupancyData) {
  // Create lookup map for occupied beds
  const occupancyMap = {};
  occupancyData.forEach(item => {
    occupancyMap[item.hospitalId.toString()] = item.occupiedBeds;
  });

  let totalBeds = 0;
  let totalOccupiedBeds = 0;
  const hospitalStatuses = {
    Available: { count: 0, beds: 0, occupiedBeds: 0 },
    Warning: { count: 0, beds: 0, occupiedBeds: 0 },
    Critical: { count: 0, beds: 0, occupiedBeds: 0 }
  };

  const hospitalDetails = hospitals.map(hospital => {
    const hospitalId = hospital._id.toString();
    const occupiedBeds = occupancyMap[hospitalId] || 0;
    const occupancyRate = hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) * 100 : 0;
    const status = classifyHospital(occupancyRate);

    // Update totals
    totalBeds += hospital.totalBeds;
    totalOccupiedBeds += occupiedBeds;

    // Update status counts
    hospitalStatuses[status].count++;
    hospitalStatuses[status].beds += hospital.totalBeds;
    hospitalStatuses[status].occupiedBeds += occupiedBeds;

    return {
      hospitalId: hospital._id,
      name: hospital.name,
      location: hospital.location,
      totalBeds: hospital.totalBeds,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
      status: status
    };
  });

  const overallOccupancyRate = totalBeds > 0 ? (totalOccupiedBeds / totalBeds) * 100 : 0;

  return {
    city: 'Mumbai',
    timestamp: new Date(),
    summary: {
      totalHospitals: hospitals.length,
      totalBeds: totalBeds,
      totalOccupiedBeds: totalOccupiedBeds,
      totalAvailableBeds: Math.max(0, totalBeds - totalOccupiedBeds),
      overallOccupancyRate: Math.round(overallOccupancyRate * 10) / 10,
      status: classifyHospital(overallOccupancyRate)
    },
    breakdown: {
      Available: {
        count: hospitalStatuses.Available.count,
        beds: hospitalStatuses.Available.beds,
        occupiedBeds: hospitalStatuses.Available.occupiedBeds,
        occupancyRate: hospitalStatuses.Available.beds > 0 ? 
          Math.round((hospitalStatuses.Available.occupiedBeds / hospitalStatuses.Available.beds) * 1000) / 10 : 0
      },
      Warning: {
        count: hospitalStatuses.Warning.count,
        beds: hospitalStatuses.Warning.beds,
        occupiedBeds: hospitalStatuses.Warning.occupiedBeds,
        occupancyRate: hospitalStatuses.Warning.beds > 0 ? 
          Math.round((hospitalStatuses.Warning.occupiedBeds / hospitalStatuses.Warning.beds) * 1000) / 10 : 0
      },
      Critical: {
        count: hospitalStatuses.Critical.count,
        beds: hospitalStatuses.Critical.beds,
        occupiedBeds: hospitalStatuses.Critical.occupiedBeds,
        occupancyRate: hospitalStatuses.Critical.beds > 0 ? 
          Math.round((hospitalStatuses.Critical.occupiedBeds / hospitalStatuses.Critical.beds) * 1000) / 10 : 0
      }
    },
    hospitals: hospitalDetails
  };
}

// GET /api/city/capacity-summary - Get real-time city capacity summary
router.get('/capacity-summary', async (req, res) => {
  try {
    console.log('Hit: City Capacity Summary Endpoint');
    
    // Get all hospitals
    const hospitals = await Hospital.find({});
    const hospitalIds = hospitals.map(h => h._id);
    
    // Get occupied beds for all hospitals
    const occupancyData = await getMultipleOccupiedBeds(hospitalIds);
    
    // Calculate city summary
    const citySummary = calculateCitySummary(hospitals, occupancyData);
    
    res.json(citySummary);
  } catch (error) {
    console.error('Error fetching city capacity summary:', error);
    res.status(500).json({ error: 'Failed to fetch city capacity summary' });
  }
});

// GET /api/city/hospital-status/:hospitalId - Get real-time status for specific hospital
router.get('/hospital-status/:hospitalId', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Get current occupancy
    const occupancyData = await getMultipleOccupiedBeds([req.params.hospitalId]);
    const occupiedBeds = occupancyData.length > 0 ? occupancyData[0].occupiedBeds : 0;
    const occupancyRate = hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) * 100 : 0;
    const status = classifyHospital(occupancyRate);
    
    res.json({
      hospitalId: hospital._id,
      name: hospital.name,
      location: hospital.location,
      totalBeds: hospital.totalBeds,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      status: status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching hospital status:', error);
    res.status(500).json({ error: 'Failed to fetch hospital status' });
  }
});

// GET /api/city/heatmap-data - Return hospital data with occupancy for map display
router.get('/heatmap-data', async (req, res) => {
  try {
    console.log('Hit: City Heatmap Data Endpoint');
    
    const hospitals = await Hospital.find({});
    const hospitalIds = hospitals.map(h => h._id);
    
    // Get occupied beds for all hospitals
    const occupancyData = await getMultipleOccupiedBeds(hospitalIds);
    
    // Create lookup map
    const occupancyMap = {};
    occupancyData.forEach(item => {
      occupancyMap[item.hospitalId.toString()] = item.occupiedBeds;
    });
    
    const hospitalsWithOccupancy = hospitals.map(hospital => {
      const hospitalId = hospital._id.toString();
      const occupiedBeds = occupancyMap[hospitalId] || 0;
      const occupancyRate = hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) : 0;
      
      return {
        _id: hospital._id,
        name: hospital.name,
        location: hospital.location,
        totalBeds: hospital.totalBeds,
        occupiedBeds: occupiedBeds,
        availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        status: classifyHospital(occupancyRate * 100)
      };
    });
    
    res.json({ hospitals: hospitalsWithOccupancy });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

module.exports = { 
  router, 
  calculateCitySummary, 
  classifyHospital 
};
