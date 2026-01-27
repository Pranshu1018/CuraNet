import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from './firebase';

// Utility functions for disease outbreaks
export const outbreakUtils = {
  getSeverityColor: (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-800' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  },

  formatTimestamp: (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },

  getRelativeTime: (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  }
};

// Firestore services for advanced features
export const firestoreServices = {
  // Disease Outbreak services
  outbreaks: {
    add: async (outbreak: any) => {
      try {
        const docRef = await addDoc(collection(firestore, 'disease_outbreaks'), {
          ...outbreak,
          created_at: new Date(),
          updated_at: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Error adding outbreak:', error);
        throw error;
      }
    },

    update: async (id: string, outbreak: any) => {
      try {
        await updateDoc(doc(firestore, 'disease_outbreaks', id), {
          ...outbreak,
          updated_at: new Date()
        });
      } catch (error) {
        console.error('Error updating outbreak:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        await deleteDoc(doc(firestore, 'disease_outbreaks', id));
      } catch (error) {
        console.error('Error deleting outbreak:', error);
        throw error;
      }
    },

    getAll: async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'disease_outbreaks'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching outbreaks:', error);
        return [];
      }
    },

    listen: (callback: (data: any[]) => void) => {
      return onSnapshot(collection(firestore, 'disease_outbreaks'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    }
  },

  // Ambulance tracking services
  ambulances: {
    add: async (ambulance: any) => {
      try {
        const docRef = await addDoc(collection(firestore, 'ambulance_positions'), {
          ...ambulance,
          created_at: new Date(),
          updated_at: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Error adding ambulance position:', error);
        throw error;
      }
    },

    update: async (id: string, position: any) => {
      try {
        await updateDoc(doc(firestore, 'ambulance_positions', id), {
          ...position,
          updated_at: new Date()
        });
      } catch (error) {
        console.error('Error updating ambulance position:', error);
        throw error;
      }
    },

    getAll: async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'ambulance_positions'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching ambulance positions:', error);
        return [];
      }
    },

    listen: (callback: (data: any[]) => void) => {
      return onSnapshot(collection(firestore, 'ambulance_positions'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    }
  },

  // Resource decay services
  resources: {
    add: async (resource: any) => {
      try {
        const docRef = await addDoc(collection(firestore, 'resource_decay'), {
          ...resource,
          created_at: new Date(),
          updated_at: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.error('Error adding resource data:', error);
        throw error;
      }
    },

    update: async (id: string, resource: any) => {
      try {
        await updateDoc(doc(firestore, 'resource_decay', id), {
          ...resource,
          updated_at: new Date()
        });
      } catch (error) {
        console.error('Error updating resource data:', error);
        throw error;
      }
    },

    getAll: async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'resource_decay'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching resource data:', error);
        return [];
      }
    },

    listen: (callback: (data: any[]) => void) => {
      return onSnapshot(collection(firestore, 'resource_decay'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    }
  }
};
