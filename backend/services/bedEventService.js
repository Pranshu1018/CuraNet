const mongoose = require('mongoose');
const BedEvent = require('../models/BedEvent');

/**
 * Calculate current occupied beds for a hospital based on BedEvent records
 * @param {string} hospitalId - The hospital ID
 * @returns {Promise<number>} - Current occupied beds count
 */
async function getCurrentOccupiedBeds(hospitalId) {
  try {
    const result = await BedEvent.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: '$type',
          totalCount: { $sum: '$count' }
        }
      }
    ]);

    let admissions = 0;
    let discharges = 0;

    result.forEach(item => {
      if (item._id === 'ADMISSION') {
        admissions = item.totalCount;
      } else if (item._id === 'DISCHARGE') {
        discharges = item.totalCount;
      }
    });

    return Math.max(0, admissions - discharges);
  } catch (error) {
    console.error('Error calculating occupied beds:', error);
    throw error;
  }
}

/**
 * Calculate current occupied beds for multiple hospitals
 * @param {Array} hospitalIds - Array of hospital IDs
 * @returns {Promise<Array>} - Array of {hospitalId, occupiedBeds} objects
 */
async function getMultipleOccupiedBeds(hospitalIds) {
  try {
    const objectIds = hospitalIds.map(id => new mongoose.Types.ObjectId(id));
    
    const result = await BedEvent.aggregate([
      {
        $match: {
          hospitalId: { $in: objectIds }
        }
      },
      {
        $group: {
          _id: {
            hospitalId: '$hospitalId',
            type: '$type'
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $group: {
          _id: '$_id.hospitalId',
          admissions: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'ADMISSION'] },
                '$totalCount',
                0
              ]
            }
          },
          discharges: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'DISCHARGE'] },
                '$totalCount',
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          hospitalId: '$_id',
          occupiedBeds: { $subtract: ['$admissions', '$discharges'] }
        }
      }
    ]);

    // Ensure non-negative values
    return result.map(item => ({
      hospitalId: item.hospitalId,
      occupiedBeds: Math.max(0, item.occupiedBeds)
    }));
  } catch (error) {
    console.error('Error calculating multiple occupied beds:', error);
    throw error;
  }
}

/**
 * Create a bed event (admission or discharge)
 * @param {string} hospitalId - The hospital ID
 * @param {string} type - 'ADMISSION' or 'DISCHARGE'
 * @param {number} count - Number of beds (default 1)
 * @returns {Promise<Object>} - Created BedEvent
 */
async function createBedEvent(hospitalId, type, count = 1) {
  try {
    const bedEvent = new BedEvent({
      hospitalId,
      type,
      count
    });
    
    return await bedEvent.save();
  } catch (error) {
    console.error('Error creating bed event:', error);
    throw error;
  }
}

/**
 * Get bed events for a hospital within a date range
 * @param {string} hospitalId - The hospital ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of BedEvent documents
 */
async function getBedEventsByDateRange(hospitalId, startDate, endDate) {
  try {
    return await BedEvent.find({
      hospitalId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: -1 });
  } catch (error) {
    console.error('Error fetching bed events by date range:', error);
    throw error;
  }
}

module.exports = {
  getCurrentOccupiedBeds,
  getMultipleOccupiedBeds,
  createBedEvent,
  getBedEventsByDateRange
};
