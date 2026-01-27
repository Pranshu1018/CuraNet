import { realtimeDB } from '../src/lib/firebase-services.js';

// Sample resource decay data
const sampleResourceData = {
  "resource-001": {
    resource_name: "Paracetamol Tablets",
    category: "Medicine",
    hospital_id: "HOSP-001",
    total_units: 1000,
    used_units: 850,
    cost_per_unit: 2.5,
    expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  "resource-002": {
    resource_name: "Surgical Gloves",
    category: "Supplies", 
    hospital_id: "HOSP-001",
    total_units: 500,
    used_units: 400,
    cost_per_unit: 0.5,
    expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  },
  "resource-003": {
    resource_name: "Blood Bags - Type O+",
    category: "Blood",
    hospital_id: "HOSP-002", 
    total_units: 50,
    used_units: 45,
    cost_per_unit: 150,
    expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now (critical!)
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
  },
  "resource-004": {
    resource_name: "IV Drip Sets",
    category: "Equipment",
    hospital_id: "HOSP-002",
    total_units: 200,
    used_units: 180,
    cost_per_unit: 15,
    expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days from now
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  },
  "resource-005": {
    resource_name: "Insulin Vials",
    category: "Medicine",
    hospital_id: "HOSP-001",
    total_units: 100,
    used_units: 95,
    cost_per_unit: 25,
    expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now (high risk)
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  "resource-006": {
    resource_name: "Face Masks",
    category: "Supplies",
    hospital_id: "HOSP-003",
    total_units: 1000,
    used_units: 600,
    cost_per_unit: 0.2,
    expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
  },
  "resource-007": {
    resource_name: "Blood Bags - Type A+",
    category: "Blood",
    hospital_id: "HOSP-003",
    total_units: 30,
    used_units: 28,
    cost_per_unit: 150,
    expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now (critical!)
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  "resource-008": {
    resource_name: "Syringes 5ml",
    category: "Supplies",
    hospital_id: "HOSP-001",
    total_units: 800,
    used_units: 200,
    cost_per_unit: 0.3,
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days ago
  }
};

// Add sample resource data to Firebase
async function seedResourceData() {
  try {
    console.log('Adding sample resource decay data to Firebase...');
    await realtimeDB.writeData('resourceUsage', sampleResourceData);
    console.log('✅ Sample resource data added successfully!');
    
    // Verify the data was added
    const data = await realtimeDB.readData('resourceUsage');
    console.log('📊 Current resource data:', data);
  } catch (error) {
    console.error('❌ Error adding resource data:', error);
  }
}

seedResourceData();
