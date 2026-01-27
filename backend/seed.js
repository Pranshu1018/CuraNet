const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const { createBedEvent } = require('./services/bedEventService');
const { recordInventoryUsage } = require('./services/inventoryUsageService');

const MONGODB_URI = 'mongodb+srv://nishipvt23_db_user:ZTuw5z0bXm183nJq@cluster0.3xogzvi.mongodb.net/hospital-sync?retryWrites=true&w=majority&appName=Cluster0';

// Generate realistic inventory for each hospital
function generateInventory() {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 5); // 5 days from now
  
  return [
    {
      name: 'Paracetamol',
      stock: 500,
      unit: 'tablets',
      expiryDate: expiryDate,
      category: 'Medicine'
    },
    {
      name: 'Oxygen Tanks',
      stock: 20,
      unit: 'cylinders',
      expiryDate: null,
      category: 'Equipment'
    },
    {
      name: 'Vaccines',
      stock: 100,
      unit: 'doses',
      expiryDate: expiryDate,
      category: 'Medicine'
    }
  ];
}

// Tier 1 - Real Mumbai Hospitals (Big 6)
const tier1Hospitals = [
  {
    name: 'KEM Hospital',
    location: { lat: 19.002, lng: 72.842 },
    totalBeds: 1800,
    inventory: generateInventory()
  },
  {
    name: 'Lilavati Hospital',
    location: { lat: 19.051, lng: 72.829 },
    totalBeds: 300,
    inventory: generateInventory()
  },
  {
    name: 'Tata Memorial',
    location: { lat: 19.006, lng: 72.841 },
    totalBeds: 600,
    inventory: generateInventory()
  },
  {
    name: 'Kokilaben Ambani',
    location: { lat: 19.131, lng: 72.823 },
    totalBeds: 750,
    inventory: generateInventory()
  },
  {
    name: 'Hiranandani Hospital',
    location: { lat: 19.118, lng: 72.911 },
    totalBeds: 240,
    inventory: generateInventory()
  },
  {
    name: 'Sion Hospital',
    location: { lat: 19.040, lng: 72.860 },
    totalBeds: 1400,
    inventory: generateInventory()
  }
];

// Generate Tier 2 - City Health Centers (44 clinics)
function generateTier2Hospitals() {
  const tier2Hospitals = [];
  const mumbaiCenter = { lat: 19.0760, lng: 72.8777 };
  
  for (let i = 1; i <= 44; i++) {
    const totalBeds = Math.floor(Math.random() * 31) + 20; // 20-50 beds
    
    tier2Hospitals.push({
      name: `City Health Center #${i}`,
      location: {
        lat: mumbaiCenter.lat + (Math.random() - 0.5) * 0.2, // ±0.1 degrees
        lng: mumbaiCenter.lng + (Math.random() - 0.5) * 0.2  // ±0.1 degrees
      },
      totalBeds: totalBeds,
      inventory: generateInventory()
    });
  }
  
  return tier2Hospitals;
}

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing data
    await Hospital.deleteMany({});
    const BedEvent = require('./models/BedEvent');
    await BedEvent.deleteMany({});
    const InventoryUsage = require('./models/InventoryUsage');
    await InventoryUsage.deleteMany({});
    console.log('Cleared existing hospital, bed event, and inventory usage data');
    
    // Combine Tier 1 and Tier 2 hospitals
    const allHospitals = [...tier1Hospitals, ...generateTier2Hospitals()];
    
    // Insert all hospitals
    const savedHospitals = await Hospital.insertMany(allHospitals);
    console.log(`Database Seeded with ${allHospitals.length} hospitals!`);
    console.log(`- 6 Tier 1 (Real Hospitals)`);
    console.log(`- 44 Tier 2 (City Health Centers)`);
    
    // Generate initial bed events for realistic occupancy
    console.log('Generating initial bed events...');
    for (const hospital of savedHospitals) {
      // Generate realistic initial occupancy (60-95% for Tier 1, 30-70% for Tier 2)
      const targetOccupancyRate = hospital.name.includes('City Health Center') 
        ? 0.3 + Math.random() * 0.4  // 30-70%
        : 0.6 + Math.random() * 0.35; // 60-95%
      
      const targetOccupiedBeds = Math.floor(hospital.totalBeds * targetOccupancyRate);
      
      // Create admission events to reach target occupancy
      if (targetOccupiedBeds > 0) {
        await createBedEvent(hospital._id, 'ADMISSION', targetOccupiedBeds);
      }
      
      console.log(`${hospital.name}: ${targetOccupiedBeds}/${hospital.totalBeds} beds occupied (${(targetOccupancyRate * 100).toFixed(1)}%)`);
    }
    
    console.log('Initial bed events created successfully!');
    
    // Generate initial inventory usage logs for realistic consumption
    console.log('Generating initial inventory usage logs...');
    const departments = ['Emergency', 'OPD', 'IPD', 'ICU', 'Pharmacy', 'General', 'Pediatrics', 'Surgery', 'Maternity'];
    const purposes = ['Patient Treatment', 'Emergency Use', 'Surgery', 'Routine Care', 'Vaccination', 'Diagnostic'];
    
    for (const hospital of savedHospitals) {
      // Generate realistic usage for each medicine in inventory
      for (const inventoryItem of hospital.inventory) {
        // Calculate realistic usage based on hospital size and medicine type
        let baseUsage;
        if (inventoryItem.name === 'Paracetamol') {
          baseUsage = Math.floor(hospital.totalBeds * 0.8); // High usage for common medicine
        } else if (inventoryItem.name === 'Oxygen Tanks') {
          baseUsage = Math.floor(hospital.totalBeds * 0.15); // Lower usage for equipment
        } else if (inventoryItem.name === 'Vaccines') {
          baseUsage = Math.floor(hospital.totalBeds * 0.3); // Medium usage for vaccines
        }
        
        // Add some randomness
        const totalUsage = Math.max(0, baseUsage + Math.floor((Math.random() - 0.5) * baseUsage * 0.3));
        
        if (totalUsage > 0 && totalUsage < inventoryItem.stock) {
          // Generate multiple usage events over the past 30 days
          const eventsCount = Math.min(10, Math.ceil(totalUsage / 20)); // Max 10 events
          const usagePerEvent = Math.ceil(totalUsage / eventsCount);
          
          for (let i = 0; i < eventsCount; i++) {
            const daysAgo = Math.floor(Math.random() * 30); // Random day in last 30 days
            const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            const department = departments[Math.floor(Math.random() * departments.length)];
            const purpose = purposes[Math.floor(Math.random() * purposes.length)];
            
            try {
              await recordInventoryUsage(
                hospital._id,
                inventoryItem.name,
                usagePerEvent,
                department,
                purpose,
                'System Seed',
                null
              );
            } catch (error) {
              // Skip if usage exceeds available stock
              console.log(`Skipped usage for ${inventoryItem.name} at ${hospital.name}: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log('Initial inventory usage logs created successfully!');
    console.log('All hospitals have inventory: Paracetamol (500), Oxygen Tanks (20), Vaccines (100)');
    console.log('Usage logs generated for realistic consumption patterns over past 30 days');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();
