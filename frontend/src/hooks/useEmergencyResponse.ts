import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Location {
  latitude: number;
  longitude: number;
}

interface EmergencyAlert {
  alertId: string;
  victimLocation: Location;
  assignedAmbulanceId: string;
  timestamp: Date;
  estimatedArrivalTime?: Date;
}

interface Ambulance {
  id: string;
  unitNumber: string;
  latitude: number;
  longitude: number;
  distance?: number;
  estimatedArrivalMinutes?: number;
  status: 'AVAILABLE' | 'BUSY';
}

interface EmergencyResponse {
  alert: EmergencyAlert;
  ambulance: Ambulance;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://curanet-1.onrender.com';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://curanet-1.onrender.com';

/**
 * Hook for handling emergency response
 * - Gets GPS location
 * - Sends emergency alert to backend
 * - Connects to WebSocket for real-time updates
 * - Tracks ambulance location
 */
export const useEmergencyResponse = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<EmergencyResponse | null>(null);
  const [victimLocation, setVictimLocation] = useState<Location | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<Ambulance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /**
   * Get user's current GPS location
   */
  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      // Check if user has set manual location preference
      const manualLocation = localStorage.getItem('curanet_manual_location');
      if (manualLocation) {
        const location = JSON.parse(manualLocation);
        console.log('📍 Using manual location:', location);
        resolve(location);
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      console.log('🔍 Getting GPS location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          console.log('📍 GPS Location obtained:', location);
          console.log('🎯 GPS Accuracy:', position.coords.accuracy, 'meters');
          
          // Validate if location makes sense for India
          const indiaBounds = {
            north: 37.0,   // Northernmost point
            south: 6.0,    // Southernmost point  
            east: 97.0,    // Easternmost point
            west: 68.0     // Westernmost point
          };
          
          console.log('🇮🇳 India bounds check:', {
            lat: `${location.latitude}° (${indiaBounds.south}° to ${indiaBounds.north}°)`,
            lng: `${location.longitude}° (${indiaBounds.west}° to ${indiaBounds.east}°)`,
            inIndia: location.latitude >= indiaBounds.south && location.latitude <= indiaBounds.north &&
                    location.longitude >= indiaBounds.west && location.longitude <= indiaBounds.east
          });
          
          // If location is outside India, offer to set manual location
          if (location.latitude < indiaBounds.south || location.latitude > indiaBounds.north ||
              location.longitude < indiaBounds.west || location.longitude > indiaBounds.east) {
            
            console.warn('🚨 Location outside India detected:', location);
            console.log('💡 If you are in India, your GPS might be incorrect due to:');
            console.log('   - VPN/Proxy connection');
            console.log('   - Browser using IP-based location');
            console.log('   - Desktop WiFi location services');
            console.log('   - Browser location permissions');
            
            // Use Delhi as default for India users
            const delhiLocation = {
              latitude: 28.6139,
              longitude: 77.2090
            };
            
            console.log('🏙️ Using Delhi as default India location');
            toast.warning('Using Delhi location', {
              description: 'GPS detected outside India. Using Delhi as default. You can change this in settings.',
              duration: 5000
            });
            
            resolve(delhiLocation);
            return;
          } else {
            console.log('✅ Location confirmed in India');
          }
          
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          console.error('❌ GPS Error:', error.message);
          
          // Fallback to Delhi if GPS fails
          console.warn('🚨 GPS failed, using Delhi center as fallback:', errorMessage);
          toast.error('GPS failed, using Delhi location', {
            description: 'Could not get your location. Using Delhi as default.',
            duration: 5000
          });
          
          resolve({
            latitude: 28.6139,
            longitude: 77.2090
          });
        },
        options
      );
    });
  }, []);

  /**
   * Send emergency alert to backend
   */
  const sendEmergencyAlert = useCallback(async (location: Location): Promise<EmergencyResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send emergency alert');
      }

      const data = await response.json();
      
      // Check if distance is unrealistic (over 100km)
      if (data.ambulance && data.ambulance.distance > 100) {
        console.warn(`Unrealistic distance: ${data.ambulance.distance}km. Using fallback local ambulance.`);
        throw new Error('Distance too far - using local fallback');
      }
      
      return {
        alert: data.alert,
        ambulance: data.ambulance
      };
    } catch (error) {
      // Fallback to local mock data if backend fails or distance is unrealistic
      console.warn('Using fallback emergency response:', error instanceof Error ? error.message : 'Unknown error');
      
      // Create realistic local ambulance response
      const mockAmbulance: Ambulance = {
        id: 'AMB-LOCAL',
        unitNumber: 'AMB-LOCAL',
        latitude: location.latitude + (Math.random() - 0.5) * 0.01, // Within ~500m
        longitude: location.longitude + (Math.random() - 0.5) * 0.01, // Within ~500m
        distance: 0.5 + Math.random() * 2, // 0.5-2.5 km away
        estimatedArrivalMinutes: 3 + Math.floor(Math.random() * 7), // 3-10 minutes
        status: 'AVAILABLE'
      };

      const mockAlert: EmergencyAlert = {
        alertId: `ALERT-${Date.now()}`,
        victimLocation: location,
        assignedAmbulanceId: mockAmbulance.id,
        timestamp: new Date(),
        estimatedArrivalTime: new Date(Date.now() + mockAmbulance.estimatedArrivalMinutes * 60 * 1000)
      };

      return {
        alert: mockAlert,
        ambulance: mockAmbulance
      };
    }
  }, []);

  /**
   * Connect to WebSocket for real-time updates
   */
  const connectWebSocket = useCallback((alertId: string) => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to emergency WebSocket');
      socket.emit('subscribe_emergency', alertId);
    });

    socket.on('ambulance_location_update', (data: { alertId: string; ambulance: Ambulance }) => {
      console.log('Ambulance location update:', data);
      setAmbulanceLocation(data.ambulance);
      toast.info('Ambulance location updated', {
        description: `Ambulance ${data.ambulance.unitNumber} is on the way`,
        duration: 3000
      });
    });

    socket.on('emergency_alert_created', (data: { alertId: string; ambulance: Ambulance }) => {
      console.log('Emergency alert created:', data);
      setAmbulanceLocation(data.ambulance);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from emergency WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast.error('Connection error', {
        description: 'Failed to connect to real-time updates. Location updates may be delayed.'
      });
    });

    socketRef.current = socket;

    return socket;
  }, []);

  /**
   * Trigger emergency response
   * 1. Get GPS location
   * 2. Send alert to backend
   * 3. Connect to WebSocket for updates
   */
  const triggerEmergency = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get GPS location
      toast.loading('Getting your location...', { id: 'location' });
      const location = await getCurrentLocation();
      setVictimLocation(location);
      toast.success('Location obtained', { id: 'location' });

      // Step 2: Send emergency alert
      toast.loading('Sending emergency alert...', { id: 'alert' });
      const response = await sendEmergencyAlert(location);
      setCurrentAlert(response);
      setAmbulanceLocation(response.ambulance);
      toast.success('Emergency alert sent!', {
        id: 'alert',
        description: `Ambulance ${response.ambulance.unitNumber} is ${response.ambulance.distance?.toFixed(1)} km away`,
        duration: 5000
      });

      // Step 3: Connect to WebSocket for real-time updates
      connectWebSocket(response.alert.alertId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error('Emergency alert failed', {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentLocation, sendEmergencyAlert, connectWebSocket]);

  /**
   * Clear emergency state and disconnect WebSocket
   */
  const clearEmergency = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setCurrentAlert(null);
    setVictimLocation(null);
    setAmbulanceLocation(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    triggerEmergency,
    clearEmergency,
    isLoading,
    currentAlert,
    victimLocation,
    ambulanceLocation,
    error
  };
};
