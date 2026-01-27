const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');

const MONGODB_URI = 'mongodb+srv://hospital_user:Zd35eWE4go0KiEAZ@cluster0.ezc39kq.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

async function checkAmbulances() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const ambulances = await Ambulance.find({});
    console.log(`\n📊 Total ambulances in database: ${ambulances.length}`);
    
    const available = ambulances.filter(a => a.status === 'AVAILABLE');
    const busy = ambulances.filter(a => a.status === 'BUSY');
    
    console.log(`🟢 Available ambulances: ${available.length}`);
    available.forEach(a => {
      console.log(`   ${a.id} (${a.unitNumber}) - Status: ${a.status}`);
      console.log(`   Location: (${a.latitude}, ${a.longitude})`);
    });
    
    console.log(`🟡 Busy ambulances: ${busy.length}`);
    busy.forEach(a => {
      console.log(`   ${a.id} (${a.unitNumber}) - Status: ${a.status}`);
      console.log(`   Assigned Alert: ${a.assignedAlertId || 'None'}`);
    });
    
    if (available.length === 0) {
      console.log('\n❌ PROBLEM: No available ambulances found!');
      console.log('🔧 SOLUTION: Run seedAmbulances.js to populate database');
    } else {
      console.log('\n✅ Available ambulances found - SOS should work!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAmbulances();
