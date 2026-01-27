const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { 
  getAllMedicineStock, 
  recordInventoryUsage, 
  getMedicineUsageHistory,
  getDepartmentUsageStats,
  getCurrentStock
} = require('../services/inventoryUsageService');
const { 
  getHospitalWastageAnalysis, 
  getCityWastageSummary,
  getMedicineWastageByHospital
} = require('../services/wastageDetectionService');

// GET /inventory/:id - Fetch hospital's inventory with real-time stock calculation
router.get('/inventory/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Get real-time stock data from usage logs
    const inventoryData = await getAllMedicineStock(req.params.id);
    
    // Calculate current occupied beds
    const { getCurrentOccupiedBeds } = require('../services/bedEventService');
    const occupiedBeds = await getCurrentOccupiedBeds(req.params.id);
    
    res.json({
      hospitalName: hospital.name,
      totalBeds: hospital.totalBeds,
      occupiedBeds: occupiedBeds,
      availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
      occupancyRate: hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) * 100 : 0,
      inventory: inventoryData,
      summary: {
        totalItems: inventoryData.length,
        lowStockItems: inventoryData.filter(item => item.isLowStock).length,
        expiringItems: inventoryData.filter(item => item.isExpiringSoon).length,
        totalUsage: inventoryData.reduce((sum, item) => sum + item.totalUsed, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /inventory/usage - Record inventory usage
router.post('/usage', async (req, res) => {
  try {
    const {
      hospitalId,
      medicineName,
      quantityUsed,
      department,
      purpose,
      recordedBy,
      patientId
    } = req.body;

    // Validate required fields
    if (!hospitalId || !medicineName || !quantityUsed || !department || !purpose || !recordedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: hospitalId, medicineName, quantityUsed, department, purpose, recordedBy' 
      });
    }

    // Verify hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Record usage
    const usageRecord = await recordInventoryUsage(
      hospitalId,
      medicineName,
      quantityUsed,
      department,
      purpose,
      recordedBy,
      patientId
    );

    // Get updated stock
    const currentStock = await getCurrentStock(hospitalId, medicineName);

    res.status(201).json({
      message: 'Inventory usage recorded successfully',
      usage: usageRecord,
      currentStock: currentStock,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error recording inventory usage:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /inventory/:hospitalId/medicine/:medicineName/stock - Get current stock for specific medicine
router.get('/:hospitalId/medicine/:medicineName/stock', async (req, res) => {
  try {
    const { hospitalId, medicineName } = req.params;
    
    const currentStock = await getCurrentStock(hospitalId, medicineName);
    
    res.json({
      hospitalId,
      medicineName,
      currentStock: currentStock,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting medicine stock:', error);
    res.status(500).json({ error: 'Failed to get medicine stock' });
  }
});

// GET /inventory/:hospitalId/medicine/:medicineName/history - Get usage history for specific medicine
router.get('/:hospitalId/medicine/:medicineName/history', async (req, res) => {
  try {
    const { hospitalId, medicineName } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const history = await getMedicineUsageHistory(hospitalId, medicineName, start, end);
    
    res.json({
      hospitalId,
      medicineName,
      history: history,
      totalCount: history.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting medicine history:', error);
    res.status(500).json({ error: 'Failed to get medicine history' });
  }
});

// GET /inventory/:hospitalId/department-stats - Get department-wise usage statistics
router.get('/:hospitalId/department-stats', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const stats = await getDepartmentUsageStats(hospitalId, start, end);
    
    res.json({
      hospitalId,
      departmentStats: stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting department stats:', error);
    res.status(500).json({ error: 'Failed to get department statistics' });
  }
});

// GET /inventory/:hospitalId/low-stock - Get low stock items
router.get('/:hospitalId/low-stock', async (req, res) => {
  try {
    const inventoryData = await getAllMedicineStock(req.params.id);
    const lowStockItems = inventoryData.filter(item => item.isLowStock);
    
    res.json({
      hospitalId: req.params.id,
      lowStockItems: lowStockItems,
      count: lowStockItems.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting low stock items:', error);
    res.status(500).json({ error: 'Failed to get low stock items' });
  }
});

// GET /inventory/:hospitalId/expiring - Get items expiring soon
router.get('/:hospitalId/expiring', async (req, res) => {
  try {
    const inventoryData = await getAllMedicineStock(req.params.id);
    const expiringItems = inventoryData.filter(item => item.isExpiringSoon);
    
    res.json({
      hospitalId: req.params.id,
      expiringItems: expiringItems,
      count: expiringItems.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting expiring items:', error);
    res.status(500).json({ error: 'Failed to get expiring items' });
  }
});

// GET /inventory/wastage-summary - Get city-wide wastage summary
router.get('/wastage-summary', async (req, res) => {
  try {
    console.log('Hit: Wastage Summary Endpoint');
    
    const wastageSummary = await getCityWastageSummary();
    
    res.json(wastageSummary);
  } catch (error) {
    console.error('Error fetching wastage summary:', error);
    res.status(500).json({ error: 'Failed to fetch wastage summary' });
  }
});

// GET /inventory/:hospitalId/wastage - Get hospital-specific wastage analysis
router.get('/:hospitalId/wastage', async (req, res) => {
  try {
    const wastageAnalysis = await getHospitalWastageAnalysis(req.params.id);
    
    // Categorize items by wastage status
    const wasteRiskItems = wastageAnalysis.filter(item => item.wastageStatus === 'WASTE_RISK');
    const expiringSoonItems = wastageAnalysis.filter(item => item.wastageStatus === 'EXPIRING_SOON');
    const lowUsageItems = wastageAnalysis.filter(item => item.wastageStatus === 'LOW_USAGE');
    const normalItems = wastageAnalysis.filter(item => item.wastageStatus === 'NORMAL');
    
    res.json({
      hospitalId: req.params.id,
      summary: {
        totalItems: wastageAnalysis.length,
        wasteRiskItems: wasteRiskItems.length,
        expiringSoonItems: expiringSoonItems.length,
        lowUsageItems: lowUsageItems.length,
        normalItems: normalItems.length,
        totalPotentialWaste: wastageAnalysis.reduce((sum, item) => sum + item.potentialWaste, 0)
      },
      highRiskItems: wasteRiskItems.sort((a, b) => b.wastageScore - a.wastageScore),
      allItems: wastageAnalysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting hospital wastage analysis:', error);
    res.status(500).json({ error: 'Failed to get wastage analysis' });
  }
});

// GET /inventory/medicine/:medicineName/wastage - Get wastage analysis for specific medicine across all hospitals
router.get('/medicine/:medicineName/wastage', async (req, res) => {
  try {
    const { medicineName } = req.params;
    const wastageAnalysis = await getMedicineWastageByHospital(medicineName);
    
    res.json({
      medicineName: medicineName,
      hospitalAnalysis: wastageAnalysis,
      summary: {
        totalHospitals: wastageAnalysis.length,
        wasteRiskHospitals: wastageAnalysis.filter(item => item.wastageStatus === 'WASTE_RISK').length,
        totalPotentialWaste: wastageAnalysis.reduce((sum, item) => sum + item.potentialWaste, 0)
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting medicine wastage analysis:', error);
    res.status(500).json({ error: 'Failed to get medicine wastage analysis' });
  }
});

module.exports = router;
