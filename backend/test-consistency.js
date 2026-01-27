const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');
const { findNearestAmbulance, createLocationHash } = require('./utils/haversine');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Test locations around Mumbai
const testLocations = [
  { lat: 19.0760, lng: 72.8777, name: "Mumbai Center" },
  { lat: 19.0800, lng: 72.8800, name: "Slightly North" },
  { lat: 19.0720, lng: 72.8750, name: "Slightly South" },
  { lat: 19.0760, lng: 72.8777, name: "Same as Center" }, // Exact same as first
  { lat: 19.0760, lng: 72.8777, name: "Same as Center Again" } // Exact same as first
];

async function testConsistency() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get all available ambulances
    const ambulances = await Ambulance.find({ status: 'AVAILABLE' });
    console.log(`\n🚑 Found ${ambulances.length} available ambulances\n`);
    
    // Test each location
    const results = [];
    
    for (const location of testLocations) {
      const locationHash = createLocationHash(location.lat, location.lng);
      const nearestAmbulance = findNearestAmbulance(ambulances, location.lat, location.lng);
      
      const result = {
        location: location.name,
        hash: locationHash,
        coordinates: `(${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})`,
        ambulance: nearestAmbulance ? nearestAmbulance.id : 'None',
        distance: nearestAmbulance ? nearestAmbulance.distance.toFixed(3) + ' km' : 'N/A'
      };
      
      results.push(result);
      console.log(`📍 ${result.location}:`);
      console.log(`   Hash: ${result.hash}`);
      console.log(`   Coordinates: ${result.coordinates}`);
      console.log(`   Ambulance: ${result.ambulance}`);
      console.log(`   Distance: ${result.distance}\n`);
    }
    
    // Check consistency
    console.log('🔍 CONSISTENCY CHECK:');
    const centerLocation1 = results[0]; // Mumbai Center
    const centerLocation2 = results[3]; // Same as Center
    const centerLocation3 = results[4]; // Same as Center Again
    
    if (centerLocation1.ambulance === centerLocation2.ambulance && 
        centerLocation2.ambulance === centerLocation3.ambulance) {
      console.log('✅ CONSISTENT: Same location selects same ambulance');
    } else {
      console.log('❌ INCONSISTENT: Same location selects different ambulances');
      console.log(`   First: ${centerLocation1.ambulance}`);
      console.log(`   Second: ${centerLocation2.ambulance}`);
      console.log(`   Third: ${centerLocation3.ambulance}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing consistency:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if executed directly
if (require.main === module) {
  testConsistency();
}

module.exports = { testConsistency };
