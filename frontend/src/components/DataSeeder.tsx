import React, { useEffect } from 'react';
import { realtimeDB } from '../lib/firebase-services';

const DataSeeder = () => {
  useEffect(() => {
    const seedData = async () => {
      try {
        // Sample ambulance data
        const ambulanceData = {
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
            updated_at: new Date(Date.now() - 15 * 60000).toISOString()
          },
          "ambulance-003": {
            ambulance_id: "AMB-003",
            status: "available",
            lat: 28.6100,
            lng: 77.2000,
            updated_at: new Date(Date.now() - 30 * 60000).toISOString()
          },
          "ambulance-004": {
            ambulance_id: "AMB-004",
            status: "maintenance",
            lat: 28.6300,
            lng: 77.2200,
            updated_at: new Date(Date.now() - 120 * 60000).toISOString()
          },
          "ambulance-005": {
            ambulance_id: "AMB-005",
            status: "active",
            lat: 28.6150,
            lng: 77.2050,
            updated_at: new Date(Date.now() - 5 * 60000).toISOString()
          }
        };

        // Sample resource decay data
        const resourceData = {
          "resource-001": {
            resource_name: "Paracetamol Tablets",
            category: "Medicine",
            hospital_id: "HOSP-001",
            total_units: 1000,
            used_units: 850,
            cost_per_unit: 2.5,
            expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          "resource-002": {
            resource_name: "Surgical Gloves",
            category: "Supplies", 
            hospital_id: "HOSP-001",
            total_units: 500,
            used_units: 400,
            cost_per_unit: 0.5,
            expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          "resource-003": {
            resource_name: "Blood Bags - Type O+",
            category: "Blood",
            hospital_id: "HOSP-002", 
            total_units: 50,
            used_units: 45,
            cost_per_unit: 150,
            expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          },
          "resource-004": {
            resource_name: "IV Drip Sets",
            category: "Equipment",
            hospital_id: "HOSP-002",
            total_units: 200,
            used_units: 180,
            cost_per_unit: 15,
            expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
          },
          "resource-005": {
            resource_name: "Insulin Vials",
            category: "Medicine",
            hospital_id: "HOSP-001",
            total_units: 100,
            used_units: 95,
            cost_per_unit: 25,
            expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

        console.log('Seeding ambulance data...');
        await realtimeDB.writeData('ambulancePositions', ambulanceData);
        console.log('✅ Ambulance data seeded successfully!');

        console.log('Seeding resource data...');
        await realtimeDB.writeData('resourceUsage', resourceData);
        console.log('✅ Resource data seeded successfully!');

        console.log('🎉 All sample data has been added to Firebase!');
        
      } catch (error) {
        console.error('❌ Error seeding data:', error);
      }
    };

    // Run seeding once
    seedData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Data Seeder</h2>
      <p className="text-gray-600">Check the console for seeding status...</p>
    </div>
  );
};

export default DataSeeder;
