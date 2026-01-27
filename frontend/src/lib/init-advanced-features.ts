import { mediSyncServices } from './firebase-services';

// Initialize advanced features data in Firebase
export const initializeAdvancedFeatures = async () => {
  try {
    console.log('🚀 Initializing advanced features data...');

    // Initialize Ambulance Events
    const ambulanceEvents = [
      {
        ambulance_id: 'AMB-001',
        lat: 19.0760,
        lng: 72.8777,
        status: 'active',
        updated_at: new Date().toISOString(),
        crew: {
          driver: 'John Smith',
          paramedic: 'Sarah Johnson',
          emt: 'Mike Wilson'
        },
        patient: {
          name: 'Patient 1',
          condition: 'stable',
          destination: 'City General Hospital'
        }
      },
      {
        ambulance_id: 'AMB-002',
        lat: 19.0870,
        lng: 72.8887,
        status: 'dispatched',
        updated_at: new Date().toISOString(),
        crew: {
          driver: 'Robert Brown',
          paramedic: 'Emily Davis',
          emt: 'Chris Taylor'
        }
      },
      {
        ambulance_id: 'AMB-003',
        lat: 19.0660,
        lng: 72.8667,
        status: 'available',
        updated_at: new Date().toISOString(),
        crew: {
          driver: 'David Lee',
          paramedic: 'Lisa Anderson',
          emt: 'James Martin'
        }
      },
      {
        ambulance_id: 'AMB-004',
        lat: 19.0970,
        lng: 72.8997,
        status: 'maintenance',
        updated_at: new Date().toISOString(),
        crew: {
          driver: 'Michael White',
          paramedic: 'Jennifer Garcia',
          emt: 'William Rodriguez'
        }
      }
    ];

    await mediSyncServices.dashboard.updateStats({ ambulanceEvents });
    console.log('✅ Ambulance events initialized');

    // Initialize Disease Outbreaks
    const diseaseOutbreaks = [
      {
        disease: 'Influenza',
        area: 'Downtown',
        severity: 'medium',
        total_cases: 45,
        reports: 12,
        first_detection: '2024-01-15',
        latest_detection: '2024-01-20',
        calculated_severity: 'medium',
        trend: 'increasing'
      },
      {
        disease: 'Dengue',
        area: 'Riverside',
        severity: 'high',
        total_cases: 78,
        reports: 23,
        first_detection: '2024-01-10',
        latest_detection: '2024-01-19',
        calculated_severity: 'high',
        trend: 'stable'
      },
      {
        disease: 'COVID-19',
        area: 'Uptown',
        severity: 'low',
        total_cases: 12,
        reports: 5,
        first_detection: '2024-01-18',
        latest_detection: '2024-01-20',
        calculated_severity: 'low',
        trend: 'decreasing'
      }
    ];

    await mediSyncServices.dashboard.updateStats({ diseaseOutbreaks });
    console.log('✅ Disease outbreaks initialized');

    // Initialize Resource Usage
    const resourceUsage = [
      {
        name: 'Ventilators',
        category: 'Equipment',
        current_stock: 25,
        usage_velocity: 3.2,
        expiry_date: '2025-12-31',
        waste_risk: 'medium',
        last_updated: new Date().toISOString(),
        location: 'ICU Ward A'
      },
      {
        name: 'Surgical Masks',
        category: 'Supplies',
        current_stock: 5000,
        usage_velocity: 150,
        expiry_date: '2024-06-30',
        waste_risk: 'high',
        last_updated: new Date().toISOString(),
        location: 'Main Storage'
      },
      {
        name: 'Insulin',
        category: 'Medicine',
        current_stock: 120,
        usage_velocity: 8,
        expiry_date: '2024-08-15',
        waste_risk: 'critical',
        last_updated: new Date().toISOString(),
        location: 'Pharmacy'
      },
      {
        name: 'Blood Type O+',
        category: 'Blood',
        current_stock: 45,
        usage_velocity: 12,
        expiry_date: '2024-02-28',
        waste_risk: 'high',
        last_updated: new Date().toISOString(),
        location: 'Blood Bank'
      },
      {
        name: 'MRI Contrast',
        category: 'Medicine',
        current_stock: 30,
        usage_velocity: 2,
        expiry_date: '2024-09-30',
        waste_risk: 'low',
        last_updated: new Date().toISOString(),
        location: 'Radiology'
      }
    ];

    await mediSyncServices.dashboard.updateStats({ resourceUsage });
    console.log('✅ Resource usage data initialized');

    console.log('🎉 All advanced features initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing advanced features:', error);
    return false;
  }
};
