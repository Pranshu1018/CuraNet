import { diseaseOutbreakServices, outbreakReportServices } from './disease-outbreak-services';
import { Timestamp } from 'firebase/firestore';

// Sample disease outbreak data for Mumbai
const sampleOutbreaks = [
  {
    zone: "Dadar",
    lat: 19.0198,
    lng: 72.8425,
    disease: "Dengue",
    severity: "critical" as const,
    active_cases: 145
  },
  {
    zone: "Andheri East",
    lat: 19.1156,
    lng: 72.8646,
    disease: "COVID-19",
    severity: "high" as const,
    active_cases: 89
  },
  {
    zone: "Bandra West",
    lat: 19.0596,
    lng: 72.8295,
    disease: "Malaria",
    severity: "medium" as const,
    active_cases: 34
  },
  {
    zone: "Kurla",
    lat: 19.0675,
    lng: 72.8846,
    disease: "Dengue",
    severity: "high" as const,
    active_cases: 67
  },
  {
    zone: "Ghatkopar",
    lat: 19.0833,
    lng: 72.9086,
    disease: "COVID-19",
    severity: "low" as const,
    active_cases: 12
  },
  {
    zone: "Chembur",
    lat: 19.0414,
    lng: 72.8989,
    disease: "Malaria",
    severity: "medium" as const,
    active_cases: 28
  },
  {
    zone: "Worli",
    lat: 19.0177,
    lng: 72.8186,
    disease: "Dengue",
    severity: "critical" as const,
    active_cases: 178
  },
  {
    zone: "Powai",
    lat: 19.1198,
    lng: 72.9052,
    disease: "COVID-19",
    severity: "medium" as const,
    active_cases: 45
  },
  {
    zone: "Sion",
    lat: 19.0458,
    lng: 72.8704,
    disease: "Malaria",
    severity: "low" as const,
    active_cases: 8
  },
  {
    zone: "Matunga",
    lat: 19.0244,
    lng: 72.8445,
    disease: "Dengue",
    severity: "medium" as const,
    active_cases: 56
  }
];

// Sample outbreak reports
const sampleReports = [
  {
    zone: "Dadar",
    disease: "Dengue",
    cases: 145,
    reported_by: "KEM Hospital"
  },
  {
    zone: "Andheri East",
    disease: "COVID-19",
    cases: 89,
    reported_by: "Cooper Hospital"
  },
  {
    zone: "Bandra West",
    disease: "Malaria",
    cases: 34,
    reported_by: "Bandra Worli Medical Center"
  },
  {
    zone: "Worli",
    disease: "Dengue",
    cases: 178,
    reported_by: "Worli Hospital"
  },
  {
    zone: "Kurla",
    disease: "Dengue",
    cases: 67,
    reported_by: "Lifeline Hospital"
  }
];

// Function to seed sample data
export const seedDiseaseOutbreakData = async () => {
  try {
    console.log('Starting to seed disease outbreak data...');
    
    // Clear existing data (optional - uncomment if you want to start fresh)
    // Note: This would require implementing a delete all function
    
    // Add sample outbreaks
    for (const outbreak of sampleOutbreaks) {
      try {
        const id = await diseaseOutbreakServices.createOutbreak(outbreak);
        console.log(`Created outbreak: ${outbreak.disease} in ${outbreak.zone} with ID: ${id}`);
      } catch (error) {
        console.error(`Error creating outbreak for ${outbreak.zone}:`, error);
      }
    }
    
    // Add sample reports
    for (const report of sampleReports) {
      try {
        const id = await outbreakReportServices.createReport(report);
        console.log(`Created report: ${report.disease} in ${report.zone} with ID: ${id}`);
      } catch (error) {
        console.error(`Error creating report for ${report.zone}:`, error);
      }
    }
    
    console.log('Successfully seeded disease outbreak data!');
    return true;
  } catch (error) {
    console.error('Error seeding disease outbreak data:', error);
    return false;
  }
};

// Function to clear all data (use with caution)
export const clearDiseaseOutbreakData = async () => {
  try {
    console.log('Clearing all disease outbreak data...');
    
    // Get all outbreaks
    const outbreaks = await diseaseOutbreakServices.getAllOutbreaks();
    
    // Delete each outbreak
    for (const outbreak of outbreaks) {
      if (outbreak.id) {
        await diseaseOutbreakServices.updateOutbreak(outbreak.id, { active_cases: 0, severity: 'low' });
      }
    }
    
    console.log('Successfully cleared disease outbreak data!');
    return true;
  } catch (error) {
    console.error('Error clearing disease outbreak data:', error);
    return false;
  }
};

// Auto-seed function that can be called from the browser console
export const autoSeed = async () => {
  const success = await seedDiseaseOutbreakData();
  if (success) {
    alert('Sample disease outbreak data has been added successfully!');
  } else {
    alert('Failed to add sample data. Check console for details.');
  }
};

// Make the function available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).seedDiseaseData = seedDiseaseOutbreakData;
  (window as any).clearDiseaseData = clearDiseaseOutbreakData;
  (window as any).autoSeedDiseaseData = autoSeed;
}
