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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
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
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, []);

  /**
   * Send emergency alert to backend
   */
  const sendEmergencyAlert = useCallback(async (location: Location): Promise<EmergencyResponse> => {
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
    return {
      alert: data.alert,
      ambulance: data.ambulance
    };
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
