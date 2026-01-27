const BedEvent = require('../models/BedEvent');
const InventoryUsage = require('../models/InventoryUsage');
const DiseaseReport = require('../models/DiseaseReport');
const Hospital = require('../models/Hospital');
const { getCurrentOccupiedBeds } = require('./bedEventService');
const { calculateCitySummary, classifyHospital } = require('../routes/cityRoutes');
const { getHospitalWastageAnalysis, getCityWastageSummary } = require('./wastageDetectionService');
const { calculateBaseline, detectPandemicAlerts, getAllOutbreakAnalysis } = require('./outbreakDetectionService');

/**
 * Setup MongoDB Change Streams for real-time bed event monitoring
 * @param {Object} io - Socket.io instance
 * @param {Object} mongoose - Mongoose instance
 */
async function setupChangeStreams(io, mongoose) {
  try {
    console.log('🔄 Setting up MongoDB Change Streams for BedEvent...');
    
    // Wait for MongoDB connection to be ready
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection to be ready...');
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    }
    
    // Get the BedEvent collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const bedEventCollection = db.collection('bedevents');
    
    // Open change stream for BedEvent
    const bedEventChangeStream = bedEventCollection.watch([
      { $match: { operationType: 'insert' } }
    ], {
      fullDocument: 'updateLookup'
    });
    
    bedEventChangeStream.on('change', async (change) => {
      try {
        console.log('📊 BedEvent change detected:', change.fullDocument);
        
        const bedEvent = change.fullDocument;
        const hospitalId = bedEvent.hospitalId;
        
        // Recalculate affected hospital occupancy
        const occupiedBeds = await getCurrentOccupiedBeds(hospitalId);
        const hospital = await Hospital.findById(hospitalId);
        
        if (!hospital) {
          console.error('Hospital not found for bed event:', hospitalId);
          return;
        }
        
        const occupancyRate = hospital.totalBeds > 0 ? (occupiedBeds / hospital.totalBeds) * 100 : 0;
        const status = classifyHospital(occupancyRate);
        
        // Prepare hospital update data
        const hospitalUpdate = {
          hospitalId: hospital._id,
          name: hospital.name,
          location: hospital.location,
          totalBeds: hospital.totalBeds,
          occupiedBeds: occupiedBeds,
          availableBeds: Math.max(0, hospital.totalBeds - occupiedBeds),
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          status: status,
          event: {
            type: bedEvent.type,
            count: bedEvent.count,
            timestamp: bedEvent.timestamp
          },
          timestamp: new Date()
        };
        
        // Recalculate city summary
        const allHospitals = await Hospital.find({});
        const allHospitalIds = allHospitals.map(h => h._id);
        const { getMultipleOccupiedBeds } = require('./bedEventService');
        const allOccupancyData = await getMultipleOccupiedBeds(allHospitalIds);
        const citySummary = calculateCitySummary(allHospitals, allOccupancyData);
        
        // Emit real-time updates
        console.log(`📡 Emitting real-time updates for ${hospital.name}`);
        console.log(`   - Hospital Status: ${status} (${occupancyRate.toFixed(1)}% occupancy)`);
        console.log(`   - City Overall: ${citySummary.summary.status} (${citySummary.summary.overallOccupancyRate}% occupancy)`);
        
        // Emit to specific hospital room
        io.to(`hospital-${hospitalId}`).emit('hospital_update', hospitalUpdate);
        
        // Emit to city-wide room
        io.to('city-capacity').emit('city_update', citySummary);
        
        // Emit to admin room for critical alerts
        if (status === 'Critical') {
          io.to('admin-alerts').emit('critical_alert', {
            type: 'hospital_critical',
            hospital: hospitalUpdate,
            citySummary: citySummary.summary,
            timestamp: new Date()
          });
        }
        
        // Emit city-wide critical alert if overall status is critical
        if (citySummary.summary.status === 'Critical') {
          io.to('admin-alerts').emit('critical_alert', {
            type: 'city_critical',
            citySummary: citySummary.summary,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error processing BedEvent change stream event:', error);
      }
    });
    
    bedEventChangeStream.on('error', (error) => {
      console.error('BedEvent Change Stream Error:', error);
      // Attempt to restart change stream after delay
      setTimeout(() => {
        console.log('🔄 Attempting to restart BedEvent change stream...');
        setupChangeStreams(io, mongoose);
      }, 5000);
    });
    
    console.log('✅ BedEvent Change Streams activated successfully');
    
    // Setup InventoryUsage Change Streams
    console.log('🔄 Setting up MongoDB Change Streams for InventoryUsage...');
    
    const inventoryUsageCollection = db.collection('inventoryusages');
    
    // Open change stream for InventoryUsage
    const inventoryUsageChangeStream = inventoryUsageCollection.watch([
      { $match: { operationType: 'insert' } }
    ], {
      fullDocument: 'updateLookup'
    });
    
    inventoryUsageChangeStream.on('change', async (change) => {
      try {
        console.log('💊 InventoryUsage change detected:', change.fullDocument);
        
        const usageEvent = change.fullDocument;
        const hospitalId = usageEvent.hospitalId;
        
        // Get hospital details
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
          console.error('Hospital not found for inventory usage:', hospitalId);
          return;
        }
        
        // Recalculate wastage analysis for affected hospital
        const wastageAnalysis = await getHospitalWastageAnalysis(hospitalId);
        
        // Find items that are now at WASTE_RISK
        const wasteRiskItems = wastageAnalysis.filter(item => item.wastageStatus === 'WASTE_RISK');
        
        // Check if this specific usage event created or worsened wastage risk
        const affectedMedicine = wastageAnalysis.find(item => 
          item.medicineName.toLowerCase() === usageEvent.medicineName.toLowerCase()
        );
        
        if (affectedMedicine && affectedMedicine.wastageStatus === 'WASTE_RISK') {
          console.log(`⚠️ WASTE_RISK detected for ${affectedMedicine.medicineName} at ${hospital.name}`);
          
          // Emit wastage risk alert
          io.to('admin-alerts').emit('wastage_alert', {
            type: 'medicine_waste_risk',
            hospital: {
              hospitalId: hospital._id,
              hospitalName: hospital.name
            },
            medicine: affectedMedicine,
            usageEvent: usageEvent,
            timestamp: new Date()
          });
          
          // Emit to hospital-specific room
          io.to(`hospital-${hospitalId}`).emit('hospital_wastage_update', {
            hospitalId: hospital._id,
            hospitalName: hospital.name,
            wastageAnalysis: wastageAnalysis,
            highRiskItems: wasteRiskItems,
            timestamp: new Date()
          });
        }
        
        // Recalculate city-wide wastage summary
        const cityWastageSummary = await getCityWastageSummary();
        
        // Emit city-wide wastage update
        io.to('city-wastage').emit('city_wastage_update', cityWastageSummary);
        
        // Emit city-wide wastage alert if significant waste detected
        if (cityWastageSummary.summary.wasteRiskItems > 0) {
          io.to('admin-alerts').emit('city_wastage_alert', {
            type: 'city_waste_risk',
            citySummary: cityWastageSummary,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error processing InventoryUsage change stream event:', error);
      }
    });
    
    inventoryUsageChangeStream.on('error', (error) => {
      console.error('InventoryUsage Change Stream Error:', error);
      // Attempt to restart change stream after delay
      setTimeout(() => {
        console.log('🔄 Attempting to restart InventoryUsage change stream...');
        setupInventoryUsageChangeStream(io, mongoose);
      }, 5000);
    });
    
    console.log('✅ InventoryUsage Change Streams activated successfully');
    
    // Setup DiseaseReport Change Streams
    console.log('🔄 Setting up MongoDB Change Streams for DiseaseReport...');
    
    const diseaseReportCollection = db.collection('diseasereports');
    
    // Open change stream for DiseaseReport
    const diseaseReportChangeStream = diseaseReportCollection.watch([
      { $match: { operationType: 'insert' } }
    ], {
      fullDocument: 'updateLookup'
    });
    
    diseaseReportChangeStream.on('change', async (change) => {
      try {
        console.log('🦠 DiseaseReport change detected:', change.fullDocument);
        
        const diseaseReport = change.fullDocument;
        
        // Recalculate outbreak analysis for affected city and disease
        const outbreakAnalysis = await calculateBaseline(
          diseaseReport.city,
          diseaseReport.disease,
          diseaseReport.reportingPeriod
        );
        
        if (outbreakAnalysis.hasEnoughData && outbreakAnalysis.current.isOutbreak) {
          console.log(`🚨 OUTBREAK detected: ${diseaseReport.disease} in ${diseaseReport.city}`);
          
          // Emit outbreak alert
          io.to('admin-alerts').emit('outbreak_alert', {
            type: 'disease_outbreak',
            city: diseaseReport.city,
            disease: diseaseReport.disease,
            analysis: outbreakAnalysis,
            report: diseaseReport,
            timestamp: new Date()
          });
          
          // Emit to city-specific room
          io.to(`city-${diseaseReport.city}`).emit('city_outbreak_update', {
            city: diseaseReport.city,
            outbreakAnalysis: outbreakAnalysis,
            timestamp: new Date()
          });
        }
        
        // Check for pandemic-level alerts
        const allOutbreakAnalyses = await getAllOutbreakAnalysis(diseaseReport.reportingPeriod);
        const pandemicDetection = await detectPandemicAlerts(allOutbreakAnalyses);
        
        // Emit pandemic alerts if detected
        if (pandemicDetection.pandemicAlerts.length > 0) {
          console.log(`🌍 PANDEMIC ALERT: ${pandemicDetection.pandemicAlerts.length} diseases detected`);
          
          pandemicDetection.pandemicAlerts.forEach(pandemicAlert => {
            io.to('admin-alerts').emit('pandemic_alert', {
              type: 'pandemic_detected',
              pandemic: pandemicAlert,
              timestamp: new Date()
            });
          });
          
          // Emit city-wide pandemic update
          io.to('pandemic-monitoring').emit('pandemic_update', pandemicDetection);
        }
        
        // Emit general outbreak update
        io.to('outbreak-monitoring').emit('outbreak_update', {
          newReport: diseaseReport,
          affectedAnalysis: outbreakAnalysis,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error processing DiseaseReport change stream event:', error);
      }
    });
    
    diseaseReportChangeStream.on('error', (error) => {
      console.error('DiseaseReport Change Stream Error:', error);
      // Attempt to restart change stream after delay
      setTimeout(() => {
        console.log('🔄 Attempting to restart DiseaseReport change stream...');
        setupChangeStreams(io, mongoose);
      }, 5000);
    });
    
    console.log('✅ DiseaseReport Change Streams activated successfully');
    
    return { bedEventChangeStream, inventoryUsageChangeStream, diseaseReportChangeStream };
    
  } catch (error) {
    console.error('Error setting up change streams:', error);
    throw error;
  }
}

/**
 * Initialize Socket.io rooms for real-time updates
 * @param {Object} socket - Socket.io socket instance
 */
function initializeSocketRooms(socket) {
  console.log(`🔌 Socket connected: ${socket.id}`);
  
  // Join default rooms
  socket.join('city-capacity');
  socket.join('city-wastage');
  socket.join('outbreak-monitoring');
  socket.join('pandemic-monitoring');
  socket.join('admin-alerts');
  
  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital-${hospitalId}`);
    console.log(`🏥 Socket ${socket.id} joined hospital room: ${hospitalId}`);
  });
  
  socket.on('join_city', (cityName) => {
    socket.join(`city-${cityName}`);
    console.log(`🏙️ Socket ${socket.id} joined city room: ${cityName}`);
  });
  
  socket.on('leave_hospital', (hospitalId) => {
    socket.leave(`hospital-${hospitalId}`);
    console.log(`🚪 Socket ${socket.id} left hospital room: ${hospitalId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
}

/**
 * Get initial city summary for new connections
 * @returns {Promise<Object>} - Current city capacity summary
 */
async function getInitialCitySummary() {
  try {
    const allHospitals = await Hospital.find({});
    const allHospitalIds = allHospitals.map(h => h._id);
    const { getMultipleOccupiedBeds } = require('./bedEventService');
    const allOccupancyData = await getMultipleOccupiedBeds(allHospitalIds);
    const citySummary = calculateCitySummary(allHospitals, allOccupancyData);
    return citySummary;
  } catch (error) {
    console.error('Error getting initial city summary:', error);
    throw error;
  }
}

module.exports = {
  setupChangeStreams,
  initializeSocketRooms,
  getInitialCitySummary
};
