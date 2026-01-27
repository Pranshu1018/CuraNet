import { realtimeDB } from '../src/lib/firebase-services.js';

// Sample ambulance data
const sampleAmbulanceData = {
  "ambulance-001": {
    ambulance_id: "AMB-001",
    status: "active",
    lat: 28.6139,
    lng: 77.2090,
    updated_at: new Date().toISOString()
  },
  "ambulance-002": {
    ambulance_id: "AMB-002", 
    status: "dispatched",
    lat: 28.6200,
    lng: 77.2150,
    updated_at: new Date(Date.now() - 15 * 60000).toISOString() // 15 mins ago
  },
  "ambulance-003": {
    ambulance_id: "AMB-003",
    status: "available",
    lat: 28.6100,
    lng: 77.2000,
    updated_at: new Date(Date.now() - 30 * 60000).toISOString() // 30 mins ago
  },
  "ambulance-004": {
    ambulance_id: "AMB-004",
    status: "maintenance",
    lat: 28.6300,
    lng: 77.2200,
    updated_at: new Date(Date.now() - 120 * 60000).toISOString() // 2 hours ago
  },
  "ambulance-005": {
    ambulance_id: "AMB-005",
    status: "active",
    lat: 28.6150,
    lng: 77.2050,
    updated_at: new Date(Date.now() - 5 * 60000).toISOString() // 5 mins ago
  }
};

// Add sample ambulance data to Firebase
async function seedAmbulanceData() {
  try {
    console.log('Adding sample ambulance data to Firebase...');
    await realtimeDB.writeData('ambulancePositions', sampleAmbulanceData);
    console.log('✅ Sample ambulance data added successfully!');
    
    // Verify the data was added
    const data = await realtimeDB.readData('ambulancePositions');
    console.log('📊 Current ambulance data:', data);
  } catch (error) {
    console.error('❌ Error adding ambulance data:', error);
  }
}

seedAmbulanceData();
