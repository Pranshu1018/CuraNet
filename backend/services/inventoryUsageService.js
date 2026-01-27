const mongoose = require('mongoose');
const InventoryUsage = require('../models/InventoryUsage');
const Hospital = require('../models/Hospital');

/**
 * Calculate current stock for a specific medicine in a hospital
 * @param {string} hospitalId - The hospital ID
 * @param {string} medicineName - The medicine name
 * @returns {Promise<number>} - Current stock quantity
 */
async function getCurrentStock(hospitalId, medicineName) {
  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Find the initial stock from hospital inventory
    const inventoryItem = hospital.inventory.find(item => 
      item.name.toLowerCase() === medicineName.toLowerCase()
    );
    
    if (!inventoryItem) {
      return 0; // Medicine not found in inventory
    }

    const initialStock = inventoryItem.stock;

    // Calculate total usage
    const usageResult = await InventoryUsage.aggregate([
      {
        $match: {
          hospitalId: mongoose.Types.ObjectId(hospitalId),
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

    const totalUsed = usageResult.length > 0 ? usageResult[0].totalUsed : 0;
    const currentStock = Math.max(0, initialStock - totalUsed);

    return currentStock;
  } catch (error) {
    console.error('Error calculating current stock:', error);
    throw error;
  }
}

/**
 * Calculate current stock for all medicines in a hospital
 * @param {string} hospitalId - The hospital ID
 * @returns {Promise<Array>} - Array of medicine stock information
 */
async function getAllMedicineStock(hospitalId) {
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

    // Calculate current stock for each medicine
    const stockData = hospital.inventory.map(item => {
      const medicineName = item.name.toLowerCase();
      const totalUsed = usageMap[medicineName] || 0;
      const currentStock = Math.max(0, item.stock - totalUsed);
      const usageRate = item.stock > 0 ? (totalUsed / item.stock) * 100 : 0;

      return {
        name: item.name,
        category: item.category,
        unit: item.unit,
        initialStock: item.stock,
        totalUsed: totalUsed,
        currentStock: currentStock,
        usageRate: Math.round(usageRate * 10) / 10,
        isLowStock: currentStock < 10,
        isExpiringSoon: item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expiryDate: item.expiryDate
      };
    });

    return stockData;
  } catch (error) {
    console.error('Error calculating all medicine stock:', error);
    throw error;
  }
}

/**
 * Record inventory usage
 * @param {string} hospitalId - The hospital ID
 * @param {string} medicineName - The medicine name
 * @param {number} quantityUsed - Quantity used
 * @param {string} department - Department using the medicine
 * @param {string} purpose - Purpose of usage
 * @param {string} recordedBy - Who recorded the usage
 * @param {string} patientId - Optional patient ID
 * @returns {Promise<Object>} - Created InventoryUsage document
 */
async function recordInventoryUsage(hospitalId, medicineName, quantityUsed, department, purpose, recordedBy, patientId = null) {
  try {
    // Check if medicine exists in hospital inventory
    const currentStock = await getCurrentStock(hospitalId, medicineName);
    
    if (currentStock < quantityUsed) {
      throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantityUsed}`);
    }

    const inventoryUsage = new InventoryUsage({
      hospitalId,
      medicineName,
      quantityUsed,
      department,
      purpose,
      recordedBy,
      patientId
    });

    return await inventoryUsage.save();
  } catch (error) {
    console.error('Error recording inventory usage:', error);
    throw error;
  }
}

/**
 * Get usage history for a specific medicine
 * @param {string} hospitalId - The hospital ID
 * @param {string} medicineName - The medicine name
 * @param {Date} startDate - Start date for history
 * @param {Date} endDate - End date for history
 * @returns {Promise<Array>} - Array of usage records
 */
async function getMedicineUsageHistory(hospitalId, medicineName, startDate = null, endDate = null) {
  try {
    const matchQuery = {
      hospitalId: mongoose.Types.ObjectId(hospitalId),
      medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') }
    };

    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = startDate;
      if (endDate) matchQuery.timestamp.$lte = endDate;
    }

    return await InventoryUsage.find(matchQuery)
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 records
  } catch (error) {
    console.error('Error getting medicine usage history:', error);
    throw error;
  }
}

/**
 * Get department-wise usage statistics
 * @param {string} hospitalId - The hospital ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Department usage statistics
 */
async function getDepartmentUsageStats(hospitalId, startDate = null, endDate = null) {
  try {
    const matchQuery = {
      hospitalId: mongoose.Types.ObjectId(hospitalId)
    };

    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = startDate;
      if (endDate) matchQuery.timestamp.$lte = endDate;
    }

    return await InventoryUsage.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: {
            department: '$department',
            medicineName: '$medicineName'
          },
          totalQuantity: { $sum: '$quantityUsed' },
          usageCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          medicines: {
            $push: {
              name: '$_id.medicineName',
              totalQuantity: '$totalQuantity',
              usageCount: '$usageCount'
            }
          },
          totalUsage: { $sum: '$totalQuantity' }
        }
      },
      {
        $sort: { totalUsage: -1 }
      }
    ]);
  } catch (error) {
    console.error('Error getting department usage stats:', error);
    throw error;
  }
}

module.exports = {
  getCurrentStock,
  getAllMedicineStock,
  recordInventoryUsage,
  getMedicineUsageHistory,
  getDepartmentUsageStats
};
