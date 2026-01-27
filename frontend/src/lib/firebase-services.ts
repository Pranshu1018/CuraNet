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

// Realtime Database helpers
export const realtimeDB = {
  // Write data
  writeData: (path: string, data: any) => {
    const dbRef = ref(database, path);
    return set(dbRef, data);
  },

  // Push data (generates unique key)
  pushData: (path: string, data: any) => {
    const dbRef = ref(database, path);
    return push(dbRef, data);
  },

  // Read data once
  readData: async (path: string) => {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update data
  updateData: (path: string, data: any) => {
    const dbRef = ref(database, path);
    return update(dbRef, data);
  },

  // Delete data
  deleteData: (path: string) => {
    const dbRef = ref(database, path);
    return remove(dbRef);
  },

  // Listen for real-time updates
  listenToData: (path: string, callback: (data: any) => void) => {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return unsubscribe;
  },

  // Query helpers
  queryData: (path: string, constraints: any[]) => {
    let q = query(ref(database, path));
    constraints.forEach(constraint => {
      q = query(q, constraint);
    });
    return q;
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
