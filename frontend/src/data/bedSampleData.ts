// Sample bed availability data for demonstration
export const sampleBedData = [
  {
    id: "bed-1",
    hospitalName: "City General Hospital",
    department: "General",
    totalBeds: 120,
    availableBeds: 45,
    occupiedBeds: 65,
    reservedBeds: 8,
    maintenanceBeds: 2,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456789",
      email: "admissions@citygeneral.com",
      emergencyContact: "+91-11-23456790"
    },
    averageWaitTime: 25,
    occupancyRate: 54.2
  },
  {
    id: "bed-2",
    hospitalName: "City General Hospital",
    department: "ICU",
    totalBeds: 24,
    availableBeds: 3,
    occupiedBeds: 18,
    reservedBeds: 2,
    maintenanceBeds: 1,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456789",
      email: "icu@citygeneral.com",
      emergencyContact: "+91-11-23456790"
    },
    averageWaitTime: 45,
    occupancyRate: 75.0
  },
  {
    id: "bed-3",
    hospitalName: "City General Hospital",
    department: "Emergency",
    totalBeds: 18,
    availableBeds: 2,
    occupiedBeds: 14,
    reservedBeds: 1,
    maintenanceBeds: 1,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456789",
      email: "emergency@citygeneral.com",
      emergencyContact: "+91-11-23456790"
    },
    averageWaitTime: 15,
    occupancyRate: 77.8
  },
  {
    id: "bed-4",
    hospitalName: "City General Hospital",
    department: "Ventilator",
    totalBeds: 12,
    availableBeds: 1,
    occupiedBeds: 9,
    reservedBeds: 1,
    maintenanceBeds: 1,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456789",
      email: "icu@citygeneral.com",
      emergencyContact: "+91-11-23456790"
    },
    averageWaitTime: 60,
    occupancyRate: 75.0
  },
  {
    id: "bed-5",
    hospitalName: "MediCare Center",
    department: "General",
    totalBeds: 80,
    availableBeds: 32,
    occupiedBeds: 40,
    reservedBeds: 5,
    maintenanceBeds: 3,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456788",
      email: "admissions@medicare.com",
      emergencyContact: "+91-11-23456788"
    },
    averageWaitTime: 30,
    occupancyRate: 50.0
  },
  {
    id: "bed-6",
    hospitalName: "MediCare Center",
    department: "ICU",
    totalBeds: 16,
    availableBeds: 0,
    occupiedBeds: 14,
    reservedBeds: 2,
    maintenanceBeds: 0,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456788",
      email: "icu@medicare.com",
      emergencyContact: "+91-11-23456788"
    },
    averageWaitTime: 120,
    occupancyRate: 87.5
  },
  {
    id: "bed-7",
    hospitalName: "Emergency Medical Center",
    department: "Emergency",
    totalBeds: 12,
    availableBeds: 8,
    occupiedBeds: 3,
    reservedBeds: 1,
    maintenanceBeds: 0,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456799",
      email: "emergency@emc.com",
      emergencyContact: "+91-11-23456799"
    },
    averageWaitTime: 10,
    occupancyRate: 25.0
  },
  {
    id: "bed-8",
    hospitalName: "Emergency Medical Center",
    department: "Ventilator",
    totalBeds: 8,
    availableBeds: 4,
    occupiedBeds: 2,
    reservedBeds: 1,
    maintenanceBeds: 1,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: 28.6139, lng: 77.2090 },
    contactInfo: {
      phone: "+91-11-23456799",
      email: "icu@emc.com",
      emergencyContact: "+91-11-23456799"
    },
    averageWaitTime: 45,
    occupancyRate: 37.5
  }
];

// Function to initialize sample data in Firebase
export const initializeSampleBedData = async () => {
  try {
    const { mediSyncServices } = await import('@/lib/firebase-services');
    
    // Check if data already exists
    const existingData = await mediSyncServices.beds.getAllBeds();
    
    if (!existingData || Object.keys(existingData).length === 0) {
      // Initialize with sample data
      for (const bed of sampleBedData) {
        await mediSyncServices.beds.updateStatus(bed.id, 'initialized');
      }
      console.log('Sample bed data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing sample bed data:', error);
  }
};
