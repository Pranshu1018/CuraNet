import { database } from './firebase';
import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  limitToLast,
  equalTo
} from 'firebase/database';

// Fallback data for development when Firebase is not accessible
const fallbackData = {
  hospitals: [
    { id: '1', name: 'City General Hospital', lat: 19.0760, lng: 72.8777, intensity: 0.3 },
    { id: '2', name: 'St. Mary Medical Center', lat: 19.0870, lng: 72.8887, intensity: 0.7 },
    { id: '3', name: 'Memorial Regional Hospital', lat: 19.0660, lng: 72.8667, intensity: 0.9 },
    { id: '4', name: 'Riverside Medical Center', lat: 19.0970, lng: 72.8997, intensity: 0.4 },
    { id: '5', name: 'Emergency Care Hospital', lat: 19.0560, lng: 72.8557, intensity: 0.6 },
    { id: '6', name: 'Community Health Center', lat: 19.1170, lng: 72.9107, intensity: 0.2 }
  ],
  beds: {
    "bed-001": { id: "bed-001", hospitalId: "HOSP-001", type: "ICU", status: "available", patientId: null },
    "bed-002": { id: "bed-002", hospitalId: "HOSP-001", type: "General", status: "occupied", patientId: "PAT-001" },
    "bed-003": { id: "bed-003", hospitalId: "HOSP-002", type: "ICU", status: "occupied", patientId: "PAT-002" },
    "bed-004": { id: "bed-004", hospitalId: "HOSP-002", type: "General", status: "available", patientId: null },
    "bed-005": { id: "bed-005", hospitalId: "HOSP-003", type: "Ventilator", status: "occupied", patientId: "PAT-003" }
  },
  bloodBank: {
    "A+": { units: 45, lastUpdated: Date.now() },
    "A-": { units: 23, lastUpdated: Date.now() },
    "B+": { units: 38, lastUpdated: Date.now() },
    "B-": { units: 19, lastUpdated: Date.now() },
    "O+": { units: 67, lastUpdated: Date.now() },
    "O-": { units: 31, lastUpdated: Date.now() },
    "AB+": { units: 12, lastUpdated: Date.now() },
    "AB-": { units: 8, lastUpdated: Date.now() }
  },
  inventory: [
    { id: "inv-001", name: "Paracetamol", category: "Medicine", quantity: 850, unit: "tablets" },
    { id: "inv-002", name: "Surgical Gloves", category: "Supplies", quantity: 400, unit: "pairs" },
    { id: "inv-003", name: "IV Drip Sets", category: "Equipment", quantity: 180, unit: "sets" },
    { id: "inv-004", name: "Blood Bags O+", category: "Blood", quantity: 45, unit: "bags" },
    { id: "inv-005", name: "Insulin Vials", category: "Medicine", quantity: 95, unit: "vials" }
  ]
};

// Helper function to check if error is permission denied
const isPermissionDenied = (error: any) => {
  return error?.code === 'PERMISSION_DENIED' || 
         error?.message?.includes('Permission denied') ||
         error?.message?.includes('PERMISSION_DENIED');
};

// Realtime Database helpers with fallback support
export const realtimeDB = {
  // Write data with fallback
  writeData: async (path: string, data: any) => {
    try {
      const dbRef = ref(database, path);
      return await set(dbRef, data);
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase write permission denied for ${path}. Using localStorage fallback.`);
        localStorage.setItem(`curanet_${path.replace(/\//g, '_')}`, JSON.stringify(data));
        return Promise.resolve(data);
      }
      throw error;
    }
  },

  // Push data (generates unique key) with fallback
  pushData: async (path: string, data: any) => {
    try {
      const dbRef = ref(database, path);
      return await push(dbRef, data);
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase push permission denied for ${path}. Using localStorage fallback.`);
        const existingData = JSON.parse(localStorage.getItem(`curanet_${path.replace(/\//g, '_')}`) || '{}');
        const newId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        existingData[newId] = data;
        localStorage.setItem(`curanet_${path.replace(/\//g, '_')}`, JSON.stringify(existingData));
        return Promise.resolve({ key: newId });
      }
      throw error;
    }
  },

  // Read data once with fallback
  readData: async (path: string) => {
    try {
      const dbRef = ref(database, path);
      const snapshot = await get(dbRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase read permission denied for ${path}. Using localStorage fallback.`);
        const fallbackPath = path.replace(/\//g, '_');
        
        // Check for specific fallback data
        if (path.includes('hospitals') && fallbackData.hospitals) {
          return fallbackData.hospitals;
        }
        if (path.includes('beds') && fallbackData.beds) {
          return fallbackData.beds;
        }
        if (path.includes('bloodBank') && fallbackData.bloodBank) {
          return fallbackData.bloodBank;
        }
        if (path.includes('inventory') && fallbackData.inventory) {
          return fallbackData.inventory;
        }
        
        // Check localStorage
        const storedData = localStorage.getItem(`curanet_${fallbackPath}`);
        return storedData ? JSON.parse(storedData) : null;
      }
      throw error;
    }
  },

  // Update data with fallback
  updateData: async (path: string, data: any) => {
    try {
      const dbRef = ref(database, path);
      return await update(dbRef, data);
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase update permission denied for ${path}. Using localStorage fallback.`);
        const existingData = JSON.parse(localStorage.getItem(`curanet_${path.replace(/\//g, '_')}`) || '{}');
        const updatedData = { ...existingData, ...data };
        localStorage.setItem(`curanet_${path.replace(/\//g, '_')}`, JSON.stringify(updatedData));
        return Promise.resolve(updatedData);
      }
      throw error;
    }
  },

  // Delete data with fallback
  deleteData: async (path: string) => {
    try {
      const dbRef = ref(database, path);
      return await remove(dbRef);
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase delete permission denied for ${path}. Using localStorage fallback.`);
        localStorage.removeItem(`curanet_${path.replace(/\//g, '_')}`);
        return Promise.resolve();
      }
      throw error;
    }
  },

  // Listen for real-time updates with fallback
  listenToData: (path: string, callback: (data: any) => void) => {
    try {
      const dbRef = ref(database, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
      });
      return unsubscribe;
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase listen permission denied for ${path}. Using localStorage fallback.`);
        
        // Initial data from localStorage or fallback
        const fallbackPath = path.replace(/\//g, '_');
        let data = localStorage.getItem(`curanet_${fallbackPath}`);
        
        if (!data) {
          // Use predefined fallback data
          if (path.includes('hospitals') && fallbackData.hospitals) {
            data = JSON.stringify(fallbackData.hospitals);
          } else if (path.includes('beds') && fallbackData.beds) {
            data = JSON.stringify(fallbackData.beds);
          } else if (path.includes('bloodBank') && fallbackData.bloodBank) {
            data = JSON.stringify(fallbackData.bloodBank);
          } else if (path.includes('inventory') && fallbackData.inventory) {
            data = JSON.stringify(fallbackData.inventory);
          }
        }
        
        callback(data ? JSON.parse(data) : null);
        
        // Return a mock unsubscribe function
        return () => {};
      }
      throw error;
    }
  },

  // Query helpers with fallback
  queryData: (path: string, constraints: any[]) => {
    try {
      let q = query(ref(database, path));
      constraints.forEach(constraint => {
        q = query(q, constraint);
      });
      return q;
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.warn(`Firebase query permission denied for ${path}. Using localStorage fallback.`);
        return null;
      }
      throw error;
    }
  }
};

// Specific service functions for MediSync
export const mediSyncServices = {
  // Patients
  patients: {
    create: (patientData: any) => realtimeDB.pushData('patients', patientData),
    update: (patientId: string, data: any) => realtimeDB.updateData(`patients/${patientId}`, data),
    get: (patientId: string) => realtimeDB.readData(`patients/${patientId}`),
    getAll: () => realtimeDB.readData('patients'),
    listen: (callback: (patients: any) => void) => realtimeDB.listenToData('patients', callback)
  },

  // OPD Queue
  opdQueue: {
    addToQueue: (patientData: any) => realtimeDB.pushData('opdQueue', { ...patientData, status: 'waiting', timestamp: Date.now() }),
    updateStatus: (queueId: string, status: string) => realtimeDB.updateData(`opdQueue/${queueId}`, { status }),
    getQueue: () => realtimeDB.readData('opdQueue'),
    listenToQueue: (callback: (queue: any) => void) => realtimeDB.listenToData('opdQueue', callback)
  },

  // Beds
  beds: {
    updateStatus: (bedId: string, status: string, patientId?: string) => {
      const updateData: any = { status, lastUpdated: Date.now() };
      if (patientId !== undefined && patientId !== null) {
        updateData.patientId = patientId;
      }
      return realtimeDB.updateData(`beds/${bedId}`, updateData);
    },
    getAll: async (hospitalId?: string) => {
      const beds = await realtimeDB.readData('beds');
      if (!hospitalId || !beds) return beds;
      
      const bedsObj = typeof beds === 'object' && !Array.isArray(beds) ? beds : {};
      const filtered: any = {};
      
      Object.entries(bedsObj).forEach(([id, bed]: [string, any]) => {
        if (bed.hospitalId === hospitalId || !bed.hospitalId) {
          filtered[id] = bed;
        }
      });
      
      return filtered;
    },
    getAllBeds: async (hospitalId?: string) => {
      const beds = await realtimeDB.readData('beds');
      if (!hospitalId || !beds) return beds;
      
      const bedsObj = typeof beds === 'object' && !Array.isArray(beds) ? beds : {};
      const filtered: any = {};
      
      Object.entries(bedsObj).forEach(([id, bed]: [string, any]) => {
        if (bed.hospitalId === hospitalId || !bed.hospitalId) {
          filtered[id] = bed;
        }
      });
      
      return filtered;
    },
    listen: (callback: (beds: any) => void, hospitalId?: string) => {
      return realtimeDB.listenToData('beds', (beds) => {
        if (!hospitalId || !beds) {
          callback(beds);
          return;
        }
        
        const bedsObj = typeof beds === 'object' && !Array.isArray(beds) ? beds : {};
        const filtered: any = {};
        
        Object.entries(bedsObj).forEach(([id, bed]: [string, any]) => {
          if (bed.hospitalId === hospitalId || !bed.hospitalId) {
            filtered[id] = bed;
          }
        });
        
        callback(filtered);
      });
    },
    listenToBedUpdates: (callback: (beds: any) => void, hospitalId?: string) => {
      return realtimeDB.listenToData('beds', (beds) => {
        if (!hospitalId || !beds) {
          callback(beds);
          return;
        }
        
        const bedsObj = typeof beds === 'object' && !Array.isArray(beds) ? beds : {};
        const filtered: any = {};
        
        Object.entries(bedsObj).forEach(([id, bed]: [string, any]) => {
          if (bed.hospitalId === hospitalId || !bed.hospitalId) {
            filtered[id] = bed;
          }
        });
        
        callback(filtered);
      });
    }
  },

  // Blood Bank
  bloodBank: {
    addDonation: (donationData: any) => realtimeDB.pushData('bloodBank/donations', donationData),
    updateInventory: (bloodType: string, units: number) => 
      realtimeDB.updateData(`bloodBank/inventory/${bloodType}`, { units, lastUpdated: Date.now() }),
    getInventory: () => realtimeDB.readData('bloodBank/inventory'),
    getDonations: () => realtimeDB.readData('bloodBank/donations'),
    listenToInventory: (callback: (inventory: any) => void) => 
      realtimeDB.listenToData('bloodBank/inventory', callback)
  },

  // Admissions
  admissions: {
    create: (admissionData: any) => realtimeDB.pushData('admissions', admissionData),
    update: (admissionId: string, data: any) => realtimeDB.updateData(`admissions/${admissionId}`, data),
    getAll: async (hospitalId?: string) => {
      const admissions = await realtimeDB.readData('admissions');
      if (!hospitalId || !admissions) return admissions;
      
      const admObj = typeof admissions === 'object' && !Array.isArray(admissions) ? admissions : {};
      const filtered: any = {};
      
      Object.entries(admObj).forEach(([id, adm]: [string, any]) => {
        if (adm.hospitalId === hospitalId || !adm.hospitalId) {
          filtered[id] = adm;
        }
      });
      
      return filtered;
    },
    listen: (callback: (admissions: any) => void, hospitalId?: string) => {
      return realtimeDB.listenToData('admissions', (admissions) => {
        if (!hospitalId || !admissions) {
          callback(admissions);
          return;
        }
        
        const admObj = typeof admissions === 'object' && !Array.isArray(admissions) ? admissions : {};
        const filtered: any = {};
        
        Object.entries(admObj).forEach(([id, adm]: [string, any]) => {
          if (adm.hospitalId === hospitalId || !adm.hospitalId) {
            filtered[id] = adm;
          }
        });
        
        callback(filtered);
      });
    }
  },
  
  // Hospital Registration
  hospitals: {
    createRegistration: (registrationData: any) => realtimeDB.pushData('hospitalRegistrations', {
      ...registrationData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }),
    getRegistrations: () => realtimeDB.readData('hospitalRegistrations'),
    updateRegistration: (id: string, data: any) => realtimeDB.updateData(`hospitalRegistrations/${id}`, data),
    listenToRegistrations: (callback: (registrations: any) => void) => 
      realtimeDB.listenToData('hospitalRegistrations', callback)
  },

  // Inventory
  inventory: {
    addItem: (itemData: any) => realtimeDB.pushData('inventory/items', itemData),
    updateStock: (itemId: string, quantity: number) => 
      realtimeDB.updateData(`inventory/items/${itemId}`, { quantity, lastUpdated: Date.now() }),
    getAll: () => realtimeDB.readData('inventory/items'),
    listen: (callback: (items: any) => void) => realtimeDB.listenToData('inventory/items', callback)
  },

  // Dashboard Stats
  dashboard: {
    getStats: () => realtimeDB.readData('dashboard/stats'),
    updateStats: (stats: any) => realtimeDB.updateData('dashboard/stats', { ...stats, lastUpdated: Date.now() }),
    listenToStats: (callback: (stats: any) => void) => realtimeDB.listenToData('dashboard/stats', callback),
    
    // Ambulance Tracking
    getAmbulanceEvents: () => realtimeDB.readData('dashboard/ambulanceEvents'),
    listenToAmbulanceEvents: (callback: (events: any) => void) => realtimeDB.listenToData('dashboard/ambulanceEvents', callback),
    
    // Disease Outbreak Detection
    getDiseaseOutbreaks: () => realtimeDB.readData('dashboard/diseaseOutbreaks'),
    listenToDiseaseOutbreaks: (callback: (outbreaks: any) => void) => realtimeDB.listenToData('dashboard/diseaseOutbreaks', callback),
    
    // Resource Usage & Decay
    getResourceUsage: () => realtimeDB.readData('dashboard/resourceUsage'),
    listenToResourceUsage: (callback: (resources: any) => void) => realtimeDB.listenToData('dashboard/resourceUsage', callback)
  },

  // Smart OPD Services
  smartOPD: {
    // Token Management
    getTokens: async (hospitalId?: string) => {
      const tokens = await realtimeDB.readData('smartOPD/tokens');
      if (!hospitalId || !tokens) return tokens;
      
      const tokensObj = typeof tokens === 'object' && !Array.isArray(tokens) ? tokens : {};
      const filtered: any = {};
      
      Object.entries(tokensObj).forEach(([id, token]: [string, any]) => {
        if (token.hospitalId === hospitalId || !token.hospitalId) {
          filtered[id] = token;
        }
      });
      
      return filtered;
    },
    addToken: (tokenData: any) => realtimeDB.pushData('smartOPD/tokens', tokenData),
    updateToken: (tokenId: string, data: any) => realtimeDB.updateData(`smartOPD/tokens/${tokenId}`, data),
    updateTokenStatus: (tokenId: string, status: string) => realtimeDB.updateData(`smartOPD/tokens/${tokenId}`, { status, updatedAt: Date.now() }),
    deleteToken: (tokenId: string) => realtimeDB.deleteData(`smartOPD/tokens/${tokenId}`),
    listenToTokens: (callback: (tokens: any) => void, hospitalId?: string) => {
      return realtimeDB.listenToData('smartOPD/tokens', (tokens) => {
        if (!hospitalId || !tokens) {
          callback(tokens);
          return;
        }
        
        const tokensObj = typeof tokens === 'object' && !Array.isArray(tokens) ? tokens : {};
        const filtered: any = {};
        
        Object.entries(tokensObj).forEach(([id, token]: [string, any]) => {
          if (token.hospitalId === hospitalId || !token.hospitalId) {
            filtered[id] = token;
          }
        });
        
        callback(filtered);
      });
    },

    // Doctor Management
    getDoctors: () => realtimeDB.readData('smartOPD/doctors'),
    addDoctor: (doctorData: any) => realtimeDB.pushData('smartOPD/doctors', doctorData),
    updateDoctor: (doctorId: string, data: any) => realtimeDB.updateData(`smartOPD/doctors/${doctorId}`, data),
    updateDoctorDelay: (doctorId: string, delayMinutes: number) => 
      realtimeDB.updateData(`smartOPD/doctors/${doctorId}`, { delayBuffer: delayMinutes, delayUpdatedAt: Date.now() }),
    updateDoctorStatus: (doctorId: string, isAvailable: boolean) => 
      realtimeDB.updateData(`smartOPD/doctors/${doctorId}`, { isAvailable, statusUpdatedAt: Date.now() }),
    listenToDoctors: (callback: (doctors: any) => void) => realtimeDB.listenToData('smartOPD/doctors', callback),

    // Notifications
    addNotification: (tokenId: string, notification: any) => {
      const tokenRef = `smartOPD/tokens/${tokenId}`;
      return realtimeDB.readData(tokenRef).then((token: any) => {
        if (token) {
          const notifications = token.notifications || [];
          notifications.push({
            id: `notif-${Date.now()}`,
            ...notification,
            timestamp: new Date().toISOString(),
            read: false
          });
          return realtimeDB.updateData(tokenRef, { notifications });
        }
      });
    },
    markNotificationRead: (tokenId: string, notificationId: string) => {
      const tokenRef = `smartOPD/tokens/${tokenId}`;
      return realtimeDB.readData(tokenRef).then((token: any) => {
        if (token && token.notifications) {
          const notifications = token.notifications.map((notif: any) => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          );
          return realtimeDB.updateData(tokenRef, { notifications });
        }
      });
    },

    // Queue Analytics
    getQueueMetrics: () => realtimeDB.readData('smartOPD/metrics'),
    updateMetrics: (metrics: any) => realtimeDB.updateData('smartOPD/metrics', { ...metrics, lastUpdated: Date.now() }),
    listenToMetrics: (callback: (metrics: any) => void) => realtimeDB.listenToData('smartOPD/metrics', callback)
  },
};
