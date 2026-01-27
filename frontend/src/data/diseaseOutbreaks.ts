// TODO: Replace local data source with Firebase Firestore collection 'disease_outbreaks'

export interface DiseaseOutbreak {
  id: string;
  zone: string;
  lat: number;
  lng: number;
  disease: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active_cases: number;
  reported_at: string;
  last_updated: string;
}

// Realistic Mumbai disease outbreak data with accurate coordinates
export const diseaseOutbreaks: DiseaseOutbreak[] = [
  {
    id: 'outbreak-1',
    zone: 'Andheri East',
    lat: 19.1196,
    lng: 72.8465,
    disease: 'Dengue',
    severity: 'high',
    active_cases: 47,
    reported_at: '2024-01-15T08:30:00Z',
    last_updated: '2024-01-19T14:20:00Z'
  },
  {
    id: 'outbreak-2',
    zone: 'Dadar',
    lat: 19.0178,
    lng: 72.8429,
    disease: 'COVID-19',
    severity: 'medium',
    active_cases: 23,
    reported_at: '2024-01-12T11:15:00Z',
    last_updated: '2024-01-18T09:45:00Z'
  },
  {
    id: 'outbreak-3',
    zone: 'Borivali',
    lat: 19.2313,
    lng: 72.8574,
    disease: 'Malaria',
    severity: 'low',
    active_cases: 12,
    reported_at: '2024-01-14T16:20:00Z',
    last_updated: '2024-01-17T13:10:00Z'
  },
  {
    id: 'outbreak-4',
    zone: 'Kurla',
    lat: 19.0675,
    lng: 72.8782,
    disease: 'Dengue',
    severity: 'critical',
    active_cases: 89,
    reported_at: '2024-01-10T07:45:00Z',
    last_updated: '2024-01-19T18:30:00Z'
  },
  {
    id: 'outbreak-5',
    zone: 'Bandra',
    lat: 19.0596,
    lng: 72.8295,
    disease: 'COVID-19',
    severity: 'medium',
    active_cases: 31,
    reported_at: '2024-01-13T14:30:00Z',
    last_updated: '2024-01-18T16:15:00Z'
  },
  {
    id: 'outbreak-6',
    zone: 'Navi Mumbai',
    lat: 19.0330,
    lng: 73.0297,
    disease: 'Malaria',
    severity: 'high',
    active_cases: 56,
    reported_at: '2024-01-11T10:20:00Z',
    last_updated: '2024-01-19T12:40:00Z'
  },
  {
    id: 'outbreak-7',
    zone: 'Worli',
    lat: 19.0170,
    lng: 72.8156,
    disease: 'Dengue',
    severity: 'medium',
    active_cases: 28,
    reported_at: '2024-01-16T09:10:00Z',
    last_updated: '2024-01-18T11:25:00Z'
  },
  {
    id: 'outbreak-8',
    zone: 'Ghatkopar',
    lat: 19.0833,
    lng: 72.9086,
    disease: 'COVID-19',
    severity: 'low',
    active_cases: 15,
    reported_at: '2024-01-17T15:45:00Z',
    last_updated: '2024-01-19T08:55:00Z'
  }
];

// Helper function to get outbreaks by disease type
export const getOutbreaksByDisease = (disease: string): DiseaseOutbreak[] => {
  return diseaseOutbreaks.filter(outbreak => 
    outbreak.disease.toLowerCase() === disease.toLowerCase()
  );
};

// Helper function to get outbreaks by severity
export const getOutbreaksBySeverity = (severity: string): DiseaseOutbreak[] => {
  return diseaseOutbreaks.filter(outbreak => outbreak.severity === severity);
};

// Helper function to search outbreaks
export const searchOutbreaks = (searchTerm: string): DiseaseOutbreak[] => {
  const term = searchTerm.toLowerCase();
  return diseaseOutbreaks.filter(outbreak => 
    outbreak.disease.toLowerCase().includes(term) ||
    outbreak.zone.toLowerCase().includes(term)
  );
};

// Helper function to get critical outbreaks
export const getCriticalOutbreaks = (): DiseaseOutbreak[] => {
  return diseaseOutbreaks.filter(outbreak => outbreak.severity === 'critical');
};

// Helper function to get severity counts
export const getSeverityCounts = () => {
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  diseaseOutbreaks.forEach(outbreak => {
    counts[outbreak.severity]++;
  });
  
  return counts;
};
