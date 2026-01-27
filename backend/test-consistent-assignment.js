const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');
const { findNearestAmbulance, createLocationKey } = require('./utils/haversine');

const MONGODB_URI = 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Test same location multiple times
const testLocation = { lat: 19.0760, lng: 72.8777 }; // Mumbai center

async function testConsistentAssignment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const ambulances = await Ambulance.find({ status: 'AVAILABLE' });
    console.log(`\n🚑 Found ${ambulances.length} available ambulances\n`);
    
    // Test same location 5 times
    for (let i = 1; i <= 5; i++) {
      console.log(`\n--- Test ${i}: Same Location ---`);
      
      const locationKey = createLocationKey(testLocation.lat, testLocation.lng);
      const nearestAmbulance = findNearestAmbulance(ambulances, testLocation.lat, testLocation.lng);
      
      console.log(`Location Key: ${locationKey}`);
      console.log(`Selected Ambulance: ${nearestAmbulance.id}`);
      console.log(`Distance: ${nearestAmbulance.distance?.toFixed(3)} km`);
      
      // Simulate ambulance becoming busy after first assignment
      if (i === 1) {
        // Mark first assigned ambulance as busy for subsequent tests
        await Ambulance.findOneAndUpdate(
          { id: nearestAmbulance.id },
          { status: 'BUSY', assignedAlertId: `TEST-${Date.now()}` }
        );
        console.log(`🔒 Marked ${nearestAmbulance.id} as BUSY for subsequent tests`);
      }
    }
    
    // Cleanup test data
    await Ambulance.updateMany(
      { status: 'BUSY' },
      { status: 'AVAILABLE', assignedAlertId: null }
    );
    console.log('\n🧹 Cleaned up test data - reset all ambulances to AVAILABLE');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run test if executed directly
if (require.main === module) {
  testConsistentAssignment();
}

module.exports = { testConsistentAssignment };
