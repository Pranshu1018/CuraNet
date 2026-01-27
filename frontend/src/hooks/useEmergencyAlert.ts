import { useState } from 'react';
import { toast } from 'sonner';

interface Hospital {
  id: string;
  name: string;
  distance: number;
  status: 'normal' | 'high' | 'critical';
  bedsAvailable: number;
  erWaitTime: number;
}

interface Ambulance {
  id: string;
  unitNumber: string;
  distance: number;
  status: 'available' | 'responding' | 'transporting';
}

export const useEmergencyAlert = () => {
  const [isAlerting, setIsAlerting] = useState(false);
  const [alertedHospitals, setAlertedHospitals] = useState<Hospital[]>([]);
  const [alertedAmbulances, setAlertedAmbulances] = useState<Ambulance[]>([]);

  const alertNearbyServices = async () => {
    if (isAlerting) return;

    setIsAlerting(true);
    
    // Simulate API call to find nearby hospitals and ambulances
    try {
      // Mock data for demonstration
      const mockHospitals: Hospital[] = [
        {
          id: '1',
          name: 'City General Hospital',
          distance: 2.3,
          status: 'normal',
          bedsAvailable: 45,
          erWaitTime: 15
        },
        {
          id: '2',
          name: 'St. Mary Medical Center',
          distance: 3.7,
          status: 'high',
          bedsAvailable: 12,
          erWaitTime: 45
        },
        {
          id: '3',
          name: 'Memorial Hospital',
          distance: 5.1,
          status: 'normal',
          bedsAvailable: 67,
          erWaitTime: 20
        }
      ];

      const mockAmbulances: Ambulance[] = [
        {
          id: '1',
          unitNumber: 'AMB-001',
          distance: 1.2,
          status: 'available'
        },
        {
          id: '2',
          unitNumber: 'AMB-003',
          distance: 2.8,
          status: 'available'
        },
        {
          id: '3',
          unitNumber: 'AMB-005',
          distance: 4.5,
          status: 'responding'
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAlertedHospitals(mockHospitals);
      setAlertedAmbulances(mockAmbulances);

      // Show success notification
      toast.success(`Emergency alert sent to ${mockHospitals.length} hospitals and ${mockAmbulances.filter(a => a.status === 'available').length} available ambulances`, {
        duration: 5000,
        description: 'Nearest services have been notified and are preparing response'
      });

    } catch (error) {
      toast.error('Failed to send emergency alert', {
        description: 'Please try again or call emergency services directly'
      });
    } finally {
      setIsAlerting(false);
    }
  };

  const clearAlert = () => {
    setAlertedHospitals([]);
    setAlertedAmbulances([]);
  };

  return {
    isAlerting,
    alertedHospitals,
    alertedAmbulances,
    alertNearbyServices,
    clearAlert
  };
};
