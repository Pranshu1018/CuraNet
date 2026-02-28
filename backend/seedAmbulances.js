const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Multiple city centers for better coverage
const CITY_CENTERS = [
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
  { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  { lat: 13.0827, lng: 80.2707, name: 'Chennai' }
];

/**
 * Generate random ambulance data across major Indian cities
 * Ambulances are scattered around multiple cities for better coverage
 */
function generateAmbulances() {
  const ambulances = [];
  let ambulanceId = 1;
  
  // Create 2 ambulances per city (10 total)
  CITY_CENTERS.forEach(city => {
    for (let i = 0; i < 2; i++) {
      // Spread ambulances in a ~15km radius around city center
      const angle = (i * 180) * (Math.PI / 180); // Distribute in a circle
      const radius = 0.05 + Math.random() * 0.1; // 0.05 to 0.15 degrees (~5-15km)
      
      const latitude = city.lat + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.03;
      const longitude = city.lng + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.03;
      
      // Most ambulances are available, but some might be busy
      const status = ambulanceId <= 8 ? 'AVAILABLE' : 'BUSY';
      
      ambulances.push({
        id: `AMB-${String(ambulanceId).padStart(3, '0')}`,
        unitNumber: `AMB-${String(ambulanceId).padStart(3, '0')}`,
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        status: status,
        assignedAlertId: status === 'BUSY' ? `ALERT-${Date.now()}-${ambulanceId}` : null,
        lastUpdateTime: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Random time in last hour
        city: city.name
      });
      
      ambulanceId++;
    }
  });
  
  return ambulances;
}

async function seedAmbulances() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Clear existing ambulance data
    await Ambulance.deleteMany({});
    console.log('🗑️  Cleared existing ambulance data');
    
    // Generate and insert ambulances
    const ambulances = generateAmbulances();
    const savedAmbulances = await Ambulance.insertMany(ambulances);
    
    console.log(`\n🚑 Successfully seeded ${savedAmbulances.length} ambulances!`);
    console.log('─────────────────────────────────────────────');
    
    // Display summary
    const available = savedAmbulances.filter(a => a.status === 'AVAILABLE').length;
    const busy = savedAmbulances.filter(a => a.status === 'BUSY').length;
    
    console.log(`   Available: ${available}`);
    console.log(`   Busy: ${busy}`);
    console.log('─────────────────────────────────────────────\n');
    
    // Display each ambulance
    savedAmbulances.forEach(amb => {
      console.log(`   ${amb.unitNumber}: ${amb.status} (${amb.city || 'Unknown'})`);
      console.log(`      Location: (${amb.latitude.toFixed(6)}, ${amb.longitude.toFixed(6)})`);
    });
    
    console.log('\n✅ Ambulance seeding completed!\n');
    
  } catch (error) {
    console.error('❌ Error seeding ambulances:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedAmbulances();
}

module.exports = { seedAmbulances };
