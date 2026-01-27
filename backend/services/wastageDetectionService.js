const mongoose = require('mongoose');
const InventoryUsage = require('../models/InventoryUsage');
const Hospital = require('../models/Hospital');

/**
 * Medical thresholds for different medicine categories
 * Based on typical consumption patterns and medical guidelines
 */
const MEDICAL_THRESHOLDS = {
  'Medicine': {
    // Percentage of initial stock that should be used before expiry
    // Higher values = more strict wastage detection
    'Paracetamol': 0.7,      // 70% should be used
    'Ibuprofen': 0.65,
    'Aspirin': 0.6,
    'Antibiotics': 0.8,       // Critical - high usage expected
    'Vaccines': 0.9,          // Very high usage expected
    'Insulin': 0.75,
    'default': 0.6            // Default threshold for other medicines
  },
  'Equipment': {
    'Oxygen Tanks': 0.8,      // High usage expected
    'Surgical Kits': 0.7,
    'Syringes': 0.85,
    'Gloves': 0.9,
    'Masks': 0.8,
    'default': 0.7
  },
  'Supplies': {
    'Bandages': 0.8,
    'Cotton': 0.7,
    'Alcohol Swabs': 0.75,
    'Gauze': 0.7,
    'default': 0.6
  }
};

/**
 * Get threshold for a specific medicine and category
 * @param {string} medicineName - Name of the medicine
 * @param {string} category - Category of the medicine
 * @returns {number} - Threshold value (0-1)
 */
function getMedicalThreshold(medicineName, category) {
  const categoryThresholds = MEDICAL_THRESHOLDS[category] || MEDICAL_THRESHOLDS['Medicine'];
  
  // Check for specific medicine threshold
  for (const [key, value] of Object.entries(categoryThresholds)) {
    if (key.toLowerCase() === medicineName.toLowerCase()) {
      return value;
    }
  }
  
  // Return default threshold for category
  return categoryThresholds.default || MEDICAL_THRESHOLDS.Medicine.default;
}

/**
 * Calculate days remaining to expiry
 * @param {Date} expiryDate - Expiry date of the medicine
 * @returns {number} - Days remaining (can be negative if expired)
 */
function calculateDaysToExpiry(expiryDate) {
  if (!expiryDate) return Infinity;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Analyze wastage risk for a single inventory item
 * @param {Object} hospital - Hospital document
 * @param {Object} inventoryItem - Inventory item from hospital
 * @param {number} totalUsage - Total usage from InventoryUsage
 * @returns {Object} - Wastage analysis result
 */
function analyzeWastageRisk(hospital, inventoryItem, totalUsage) {
  const daysToExpiry = calculateDaysToExpiry(inventoryItem.expiryDate);
  const threshold = getMedicalThreshold(inventoryItem.name, inventoryItem.category);
  const expectedUsage = inventoryItem.stock * threshold;
  const usageRate = inventoryItem.stock > 0 ? (totalUsage / inventoryItem.stock) : 0;
  
  let wastageStatus = 'NORMAL';
  let wastageScore = 0;
  
  // Check if item is expiring soon (within 30 days)
  const isExpiringSoon = daysToExpiry < 30;
  
  // Check if usage is below threshold
  const isLowUsage = usageRate < threshold;
  
  // Calculate wastage risk score (0-100)
  if (isExpiringSoon && isLowUsage) {
    wastageStatus = 'WASTE_RISK';
    wastageScore = Math.round((1 - usageRate) * 100);
  } else if (isExpiringSoon) {
    wastageStatus = 'EXPIRING_SOON';
    wastageScore = Math.round(Math.max(0, (30 - daysToExpiry) / 30 * 50));
  } else if (isLowUsage) {
    wastageStatus = 'LOW_USAGE';
    wastageScore = Math.round((threshold - usageRate) * 100);
  }
  
  // Calculate potential waste quantity
  const potentialWaste = Math.max(0, inventoryItem.stock - totalUsage);
  const wasteValue = potentialWaste > 0 ? Math.round((potentialWaste / inventoryItem.stock) * 100) : 0;
  
  return {
    hospitalId: hospital._id,
    hospitalName: hospital.name,
    medicineName: inventoryItem.name,
    category: inventoryItem.category,
    unit: inventoryItem.unit,
    initialStock: inventoryItem.stock,
    totalUsed: totalUsage,
    currentStock: Math.max(0, inventoryItem.stock - totalUsage),
    usageRate: Math.round(usageRate * 1000) / 10,
    expectedUsage: Math.round(expectedUsage * 10) / 10,
    threshold: Math.round(threshold * 100),
    expiryDate: inventoryItem.expiryDate,
    daysToExpiry: daysToExpiry,
    wastageStatus: wastageStatus,
    wastageScore: wastageScore,
    potentialWaste: potentialWaste,
    wastePercentage: wasteValue,
    isExpiringSoon: isExpiringSoon,
    isLowUsage: isLowUsage
  };
}

/**
 * Get wastage analysis for all items in a hospital
 * @param {string} hospitalId - Hospital ID
 * @returns {Promise<Array>} - Array of wastage analysis results
 */
async function getHospitalWastageAnalysis(hospitalId) {
  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Get all usage data for this hospital
    const usageData = await InventoryUsage.aggregate([
      {
        $match: {
          hospitalId: mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: '$medicineName',
          totalUsed: { $sum: '$quantityUsed' }
        }
      }
    ]);

    // Create usage lookup map
    const usageMap = {};
    usageData.forEach(item => {
      usageMap[item._id.toLowerCase()] = item.totalUsed;
    });

    // Analyze each inventory item
    const wastageAnalysis = [];
    for (const inventoryItem of hospital.inventory) {
      const medicineName = inventoryItem.name.toLowerCase();
      const totalUsage = usageMap[medicineName] || 0;
      
      const analysis = analyzeWastageRisk(hospital, inventoryItem, totalUsage);
      wastageAnalysis.push(analysis);
    }

    return wastageAnalysis;
  } catch (error) {
    console.error('Error analyzing hospital wastage:', error);
    throw error;
  }
}

/**
 * Get city-wide wastage summary
 * @returns {Promise<Object>} - City wastage summary
 */
async function getCityWastageSummary() {
  try {
    const hospitals = await Hospital.find({});
    const allWastageAnalysis = [];
    
    // Get wastage analysis for all hospitals
    for (const hospital of hospitals) {
      const hospitalAnalysis = await getHospitalWastageAnalysis(hospital._id);
      allWastageAnalysis.push(...hospitalAnalysis);
    }

    // Categorize by wastage status
    const wasteRiskItems = allWastageAnalysis.filter(item => item.wastageStatus === 'WASTE_RISK');
    const expiringSoonItems = allWastageAnalysis.filter(item => item.wastageStatus === 'EXPIRING_SOON');
    const lowUsageItems = allWastageAnalysis.filter(item => item.wastageStatus === 'LOW_USAGE');
    const normalItems = allWastageAnalysis.filter(item => item.wastageStatus === 'NORMAL');

    // Calculate totals
    const totalPotentialWaste = allWastageAnalysis.reduce((sum, item) => sum + item.potentialWaste, 0);
    const totalInitialValue = allWastageAnalysis.reduce((sum, item) => sum + item.initialStock, 0);
    const totalWastePercentage = totalInitialValue > 0 ? Math.round((totalPotentialWaste / totalInitialValue) * 100) : 0;

    // Group by category
    const categoryBreakdown = {};
    allWastageAnalysis.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = {
          totalItems: 0,
          wasteRiskItems: 0,
          totalWaste: 0,
          totalValue: 0
        };
      }
      
      categoryBreakdown[item.category].totalItems++;
      categoryBreakdown[item.category].totalValue += item.initialStock;
      categoryBreakdown[item.category].totalWaste += item.potentialWaste;
      
      if (item.wastageStatus === 'WASTE_RISK') {
        categoryBreakdown[item.category].wasteRiskItems++;
      }
    });

    // Calculate waste percentages by category
    Object.keys(categoryBreakdown).forEach(category => {
      const cat = categoryBreakdown[category];
      cat.wastePercentage = cat.totalValue > 0 ? Math.round((cat.totalWaste / cat.totalValue) * 100) : 0;
    });

    return {
      city: 'Mumbai',
      timestamp: new Date(),
      summary: {
        totalItems: allWastageAnalysis.length,
        wasteRiskItems: wasteRiskItems.length,
        expiringSoonItems: expiringSoonItems.length,
        lowUsageItems: lowUsageItems.length,
        normalItems: normalItems.length,
        totalPotentialWaste: totalPotentialWaste,
        totalInitialValue: totalInitialValue,
        overallWastePercentage: totalWastePercentage
      },
      categoryBreakdown: categoryBreakdown,
      highRiskItems: wasteRiskItems.sort((a, b) => b.wastageScore - a.wastageScore).slice(0, 10), // Top 10 high-risk items
      allItems: allWastageAnalysis
    };
  } catch (error) {
    console.error('Error getting city wastage summary:', error);
    throw error;
  }
}

/**
 * Get wastage analysis for specific medicine across all hospitals
 * @param {string} medicineName - Medicine name to analyze
 * @returns {Promise<Array>} - Array of wastage analysis by hospital
 */
async function getMedicineWastageByHospital(medicineName) {
  try {
    const hospitals = await Hospital.find({});
    const medicineAnalysis = [];
    
    for (const hospital of hospitals) {
      const inventoryItem = hospital.inventory.find(item => 
        item.name.toLowerCase() === medicineName.toLowerCase()
      );
      
      if (inventoryItem) {
        // Get usage for this specific medicine
        const usageData = await InventoryUsage.aggregate([
          {
            $match: {
              hospitalId: mongoose.Types.ObjectId(hospital._id),
              medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') }
            }
          },
          {
            $group: {
              _id: null,
              totalUsed: { $sum: '$quantityUsed' }
            }
          }
        ]);
        
        const totalUsage = usageData.length > 0 ? usageData[0].totalUsed : 0;
        const analysis = analyzeWastageRisk(hospital, inventoryItem, totalUsage);
        medicineAnalysis.push(analysis);
      }
    }
    
    return medicineAnalysis;
  } catch (error) {
    console.error('Error getting medicine wastage by hospital:', error);
    throw error;
  }
}

module.exports = {
  getHospitalWastageAnalysis,
  getCityWastageSummary,
  getMedicineWastageByHospital,
  getMedicalThreshold,
  calculateDaysToExpiry,
  analyzeWastageRisk
};
