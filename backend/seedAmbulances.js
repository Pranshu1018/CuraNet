const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Mumbai center coordinates for realistic ambulance placement
const MUMBAI_CENTER = { lat: 19.0760, lng: 72.8777 };

/**
 * Generate random ambulance data in Mumbai area
 * Ambulances are scattered around Mumbai with most being AVAILABLE
 */
function generateAmbulances() {
  const ambulances = [];
  
  // Create 10 ambulances scattered around Mumbai
  for (let i = 1; i <= 10; i++) {
    // Spread ambulances in a ~20km radius around Mumbai center
    const angle = (i * 36) * (Math.PI / 180); // Distribute in a circle
    const radius = 0.05 + Math.random() * 0.15; // 0.05 to 0.2 degrees (~5-20km)
    
    const latitude = MUMBAI_CENTER.lat + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.05;
    const longitude = MUMBAI_CENTER.lng + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.05;
    
    // Most ambulances are available, but 1-2 might be busy
    const status = i <= 8 ? 'AVAILABLE' : 'BUSY';
    
    ambulances.push({
      id: `AMB-${String(i).padStart(3, '0')}`,
      unitNumber: `AMB-${String(i).padStart(3, '0')}`,
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      status: status,
      assignedAlertId: status === 'BUSY' ? `ALERT-${Date.now()}-${i}` : null,
      lastUpdateTime: new Date(Date.now() - Math.random() * 60 * 60 * 1000) // Random time in last hour
    });
  }
  
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
      console.log(`   ${amb.unitNumber}: ${amb.status}`);
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
