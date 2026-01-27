import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';

// Types for Disease Outbreak
export interface DiseaseOutbreak {
  id?: string;
  zone: string;
  lat: number;
  lng: number;
  disease: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active_cases: number;
  reported_at: Timestamp;
  last_updated: Timestamp;
}

export interface OutbreakReport {
  id?: string;
  zone: string;
  disease: string;
  cases: number;
  reported_by: string;
  created_at: Timestamp;
}

// Disease Outbreak Services
export const diseaseOutbreakServices = {
  // Create a new outbreak
  createOutbreak: async (outbreakData: Omit<DiseaseOutbreak, 'id' | 'reported_at' | 'last_updated'>) => {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(firestore, 'disease_outbreaks'), {
      ...outbreakData,
      reported_at: now,
      last_updated: now
    });
    return docRef.id;
  },

  // Update an outbreak
  updateOutbreak: async (id: string, data: Partial<DiseaseOutbreak>) => {
    const outbreakRef = doc(firestore, 'disease_outbreaks', id);
    await updateDoc(outbreakRef, {
      ...data,
      last_updated: Timestamp.now()
    });
  },

  // Mark outbreak as resolved
  markResolved: async (id: string) => {
    const outbreakRef = doc(firestore, 'disease_outbreaks', id);
    await updateDoc(outbreakRef, {
      severity: 'low',
      active_cases: 0,
      last_updated: Timestamp.now()
    });
  },

  // Get single outbreak
  getOutbreak: async (id: string) => {
    const outbreakRef = doc(firestore, 'disease_outbreaks', id);
    const outbreakSnap = await getDoc(outbreakRef);
    return outbreakSnap.exists() ? { id: outbreakSnap.id, ...outbreakSnap.data() } as DiseaseOutbreak : null;
  },

  // Get all outbreaks
  getAllOutbreaks: async () => {
    const q = query(
      collection(firestore, 'disease_outbreaks'),
      orderBy('severity', 'desc'),
      orderBy('last_updated', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiseaseOutbreak));
  },

  // Get outbreaks by disease
  getOutbreaksByDisease: async (disease: string) => {
    const q = query(
      collection(firestore, 'disease_outbreaks'),
      where('disease', '==', disease),
      orderBy('severity', 'desc'),
      orderBy('last_updated', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiseaseOutbreak));
  },

  // Get critical outbreaks only
  getCriticalOutbreaks: async () => {
    const q = query(
      collection(firestore, 'disease_outbreaks'),
      where('severity', '==', 'critical'),
      orderBy('last_updated', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiseaseOutbreak));
  },

  // Search outbreaks by zone or disease
  searchOutbreaks: async (searchTerm: string) => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get all outbreaks and filter client-side (Firestore doesn't support OR queries)
    const allOutbreaks = await diseaseOutbreakServices.getAllOutbreaks();
    return allOutbreaks.filter(outbreak => 
      outbreak.zone.toLowerCase().includes(searchTermLower) ||
      outbreak.disease.toLowerCase().includes(searchTermLower)
    );
  },

  // Real-time listener for all outbreaks
  listenToOutbreaks: (callback: (outbreaks: DiseaseOutbreak[]) => void) => {
    const q = query(
      collection(firestore, 'disease_outbreaks'),
      orderBy('severity', 'desc'),
      orderBy('last_updated', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const outbreaks = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as DiseaseOutbreak));
      callback(outbreaks);
    });
  },

  // Real-time listener for filtered outbreaks
  listenToFilteredOutbreaks: (
    filters: { disease?: string; severity?: string; searchTerm?: string },
    callback: (outbreaks: DiseaseOutbreak[]) => void
  ) => {
    let q = query(collection(firestore, 'disease_outbreaks'));
    
    // Apply filters
    if (filters.disease && filters.disease !== 'all') {
      q = query(q, where('disease', '==', filters.disease));
    }
    
    if (filters.severity && filters.severity !== 'all') {
      q = query(q, where('severity', '==', filters.severity));
    }
    
    q = query(q, orderBy('severity', 'desc'), orderBy('last_updated', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      let outbreaks = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as DiseaseOutbreak));
      
      // Apply search filter if needed
      if (filters.searchTerm) {
        const searchTermLower = filters.searchTerm.toLowerCase();
        outbreaks = outbreaks.filter(outbreak => 
          outbreak.zone.toLowerCase().includes(searchTermLower) ||
          outbreak.disease.toLowerCase().includes(searchTermLower)
        );
      }
      
      callback(outbreaks);
    });
  }
};

// Outbreak Reports Services
export const outbreakReportServices = {
  // Create a new report
  createReport: async (reportData: Omit<OutbreakReport, 'id' | 'created_at'>) => {
    const docRef = await addDoc(collection(firestore, 'outbreak_reports'), {
      ...reportData,
      created_at: Timestamp.now()
    });
    return docRef.id;
  },

  // Get all reports
  getAllReports: async () => {
    const q = query(
      collection(firestore, 'outbreak_reports'),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutbreakReport));
  },

  // Get reports by zone
  getReportsByZone: async (zone: string) => {
    const q = query(
      collection(firestore, 'outbreak_reports'),
      where('zone', '==', zone),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutbreakReport));
  }
};

// Utility functions
export const outbreakUtils = {
  // Get severity color for UI
  getSeverityColor: (severity: string) => {
    switch (severity) {
      case 'low': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' };
      case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' };
      case 'high': return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' };
      case 'critical': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-500' };
    }
  },

  // Format timestamp (handles both string and Timestamp inputs)
  formatTimestamp: (timestamp: Timestamp | string) => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    return timestamp.toDate().toLocaleDateString();
  },

  // Get relative time (handles both string and Timestamp inputs)
  getRelativeTime: (timestamp: Timestamp | string) => {
    const now = new Date();
    const time = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
};
