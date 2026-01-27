import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users,
  Clock,
  Bell,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Heart,
  Stethoscope,
  RefreshCw,
  Volume2,
  Eye,
  LogOut,
  Bed,
  Building2,
  Droplets,
  Ambulance,
  TrendingUp,
  Shield,
  Zap,
  Timer,
  User,
  Pill,
  FileText,
  Map,
  Route,
  Navigation,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediSyncServices, realtimeDB } from "@/lib/firebase-services";
import { MessageSquare, X } from "lucide-react";
import Papa from 'papaparse';

interface SymptomData { 
  Symptom: string; 
  Weight: number; 
}

interface PrecautionData { 
  Disease: string; 
  Precaution_1: string; 
  Precaution_2: string; 
}
// --- Types & Interfaces ---
type Priority = "emergency" | "urgent" | "high" | "normal" | "low";
type Status = "waiting" | "in-consultation" | "checked-in" | "completed" | "delayed";

interface PatientToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  phone: string;
  email?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  checkInTime: string;
  registrationTime: string;
  estimatedConsultationTime: string;
  actualConsultationTime?: string;
  status: Status;
  priority: Priority;
  positionInQueue: number;
  patientsAhead: number;
  estimatedWaitTime: number;
  isEmergency: boolean;
  symptoms?: string;
  medicalHistory?: string;
  allergies?: string;
  notifications: Notification[];
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  timestamp: string;
  read: boolean;
}

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  lastVisit?: string;
  upcomingAppointments?: any[];
}

interface HospitalStats {
  totalHospitals: number;
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  ventilators: number;
  emergencyCases: number;
  averageWaitTime: number;
}

interface BloodBankStats {
  totalUnits: number;
  availableUnits: {
    'A+': number;
    'A-': number;
    'B+': number;
    'B-': number;
    'O+': number;
    'O-': number;
    'AB+': number;
    'AB-': number;
  };
  urgentRequests: number;
}

interface AmbulanceStats {
  totalAmbulances: number;
  availableAmbulances: number;
  activeAmbulances: number;
  averageResponseTime: number;
}

const PatientOPDPortal = () => {
	
  
  // --- State Management ---
  const [tokens, setTokens] = useState<PatientToken[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<PatientToken | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats | null>(null);
  const [bloodBankStats, setBloodBankStats] = useState<BloodBankStats | null>(null);
  const [ambulanceStats, setAmbulanceStats] = useState<AmbulanceStats | null>(null);
  const [pushNotificationSupported, setPushNotificationSupported] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [recommendedHospitals, setRecommendedHospitals] = useState<any[]>([]);
  const [patientLocation, setPatientLocation] = useState<{lat: number, lng: number}>({lat: 19.0760, lng: 72.8777}); // Default Mumbai coordinates

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [symptomsData, setSymptomsData] = useState<SymptomData[]>([]);
  const [precautionsData, setPrecautionData] = useState<PrecautionData[]>([]);

  // Load CSV Data for Chatbot
  useEffect(() => {
    const loadCSVs = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch('/data/Symptom_severity.csv'),
          fetch('/data/symptoms_precautions.csv')
        ]);
        const sText = await sRes.text();
        const pText = await pRes.text();
        Papa.parse(sText, { header: true, dynamicTyping: true, complete: (r) => setSymptomsData(r.data as any) });
        Papa.parse(pText, { header: true, complete: (r) => setPrecautionData(r.data as any) });
      } catch (e) { console.error("Medical Data Load Error", e); }
    };
    loadCSVs();
  }, []);

  // Get user's geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPatientLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Keep default Mumbai coordinates if geolocation fails
        }
      );
    }
  }, []);

  // ... rest of your logic

  // --- Get Patient Email from URL or Storage ---
  const getPatientEmail = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const emailFromStorage = localStorage.getItem('patientEmail');
    
    return emailFromUrl || emailFromStorage || '';
  };

  const patientEmail = getPatientEmail();


  // --- Calculate Distance Function ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // --- Check Push Notification Support ---
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushNotificationSupported(true);
    }
  }, []);

  // --- Request Push Notification Permission ---
  const requestPushNotificationPermission = async () => {
    if (!pushNotificationSupported) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
        });
        setPushSubscription(subscription);
        toast.success('Push notifications enabled!');
      }
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  // --- Load Patient Data ---
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Set up real-time listener for tokens
        const unsubscribeTokens = mediSyncServices.smartOPD.listenToTokens((tokensData) => {
          if (tokensData) {
            const tokensArray = Object.entries(tokensData).map(([id, token]: [string, any]) => ({
              ...token,
              id,
              priority: token.priority as Priority,
              status: token.status as Status
            }));
            
            // Filter tokens for this patient by email or phone
            console.log('All tokens available:', tokensArray);
            console.log('Filtering for patient email:', patientEmail);
            console.log('Patient profile available:', patientProfile);
            
            const patientTokens = tokensArray.filter(token => {
              // Primary match by email
              if (token.email && token.email === patientEmail) {
                console.log('Matched by email:', token);
                return true;
              }
              // Secondary match by phone if email not found
              if (patientProfile && token.phone === patientProfile.phone) {
                console.log('Matched by phone:', token);
                return true;
              }
              // Also check if patient profile matches
              if (patientProfile && token.patientName === patientProfile.name && token.age === patientProfile.age) {
                console.log('Matched by name and age:', token);
                return true;
              }
              return false;
            });
            console.log('Filtered patient tokens:', patientTokens);
            setTokens(patientTokens);
            
            // Check for status changes and show notifications
            const previousTokens = tokens;
            patientTokens.forEach(newToken => {
              const oldToken = previousTokens.find(t => t.id === newToken.id);
              if (oldToken && oldToken.status !== newToken.status) {
                // Status changed, show notification
                if (soundEnabled) {
                  // Play notification sound
                  const audio = new Audio('/notification.mp3');
                  audio.play().catch(() => {});
                }
                
                toast.success(`Status updated: ${newToken.status.replace('-', ' ')}`, {
                  description: `Token ${newToken.tokenNumber} is now ${newToken.status.replace('-', ' ')}`
                });

                // Send push notification if enabled
                if (pushSubscription && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification(`MediSync - Token Status Update`, {
                    body: `Token ${newToken.tokenNumber} is now ${newToken.status.replace('-', ' ')}`,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: `token-${newToken.id}`
                  });
                }
              }
            });
          }
        });

        // Load patient profile
        const patientsData = await mediSyncServices.patients.getAll();
        if (patientsData) {
          const patientsArray = Object.entries(patientsData).map(([id, patient]: [string, any]) => ({
            ...patient,
            id
          }));
          
          const currentPatient = patientsArray.find(p => p.email === patientEmail);
          if (currentPatient) {
            setPatientProfile(currentPatient);
          }
        }

        // Also check localStorage for test profiles
        const localProfile = localStorage.getItem('patientProfile');
        if (localProfile && !patientProfile) {
          const profile = JSON.parse(localProfile);
          if (profile.email === patientEmail) {
            setPatientProfile(profile);
          }
        }

        // Load hospital statistics
        const loadHospitalStats = async () => {
          try {
            const stats = await mediSyncServices.dashboard.getStats();
            if (stats) {
              setHospitalStats({
                totalHospitals: stats.hospitals?.length || 6,
                totalBeds: (stats.totalBeds as number) || 1200,
                availableBeds: (stats.availableBeds as number) || 450,
                icuBeds: (stats.icuBeds as number) || 120,
                ventilators: (stats.ventilators as number) || 45,
                emergencyCases: (stats.emergencyCases as number) || 23,
                averageWaitTime: (stats.averageWaitTime as number) || 25
              });
            }
          } catch (error) {
            console.error('Error loading hospital stats:', error);
          }
        };

        // Load blood bank statistics
        const loadBloodBankStats = async () => {
          try {
            const bloodBankData = await mediSyncServices.bloodBank.getInventory();
            if (bloodBankData) {
              const inventory = bloodBankData || {};
              setBloodBankStats({
                totalUnits: Object.values(inventory as Record<string, any>).reduce((sum: number, count: any) => {
                  const units = typeof count === 'object' && count !== null && 'units' in count ? Number(count.units) : Number(count) || 0;
                  return sum + units;
                }, 0),
                availableUnits: {
                  'A+': inventory['A+']?.units || 45,
                  'A-': inventory['A-']?.units || 12,
                  'B+': inventory['B+']?.units || 38,
                  'B-': inventory['B-']?.units || 8,
                  'O+': inventory['O+']?.units || 67,
                  'O-': inventory['O-']?.units || 15,
                  'AB+': inventory['AB+']?.units || 22,
                  'AB-': inventory['AB-']?.units || 5
                },
                urgentRequests: 3
              });
            }
          } catch (error) {
            console.error('Error loading blood bank stats:', error);
          }
        };

        // Load ambulance statistics
        const loadAmbulanceStats = async () => {
          try {
            const ambulanceData = await mediSyncServices.dashboard.getAmbulanceEvents();
            if (ambulanceData) {
              const ambulances = Object.values(ambulanceData);
              setAmbulanceStats({
                totalAmbulances: ambulances.length || 15,
                availableAmbulances: ambulances.filter((a: any) => a.status === 'available').length || 8,
                activeAmbulances: ambulances.filter((a: any) => a.status === 'dispatched').length || 5,
                averageResponseTime: 12
              });
            }
          } catch (error) {
            console.error('Error loading ambulance stats:', error);
          }
        };

        // Load all statistics
        loadHospitalStats();
        loadBloodBankStats();
        loadAmbulanceStats();

        // Load available doctors for appointments
        const loadDoctors = async () => {
          try {
            const doctorsData = await mediSyncServices.smartOPD.getDoctors();
            if (doctorsData) {
              const doctorsArray = Object.entries(doctorsData).map(([id, doctor]: [string, any]) => ({
                ...doctor,
                id
              }));
              setAvailableDoctors(doctorsArray.filter((d: any) => d.isAvailable !== false));
            }
          } catch (error) {
            console.error('Error loading doctors:', error);
          }
        };
        loadDoctors();

        // Load hospital recommendations
        const loadHospitalRecommendations = async () => {
          try {
            const stats = await mediSyncServices.dashboard.getStats();
            if (stats && stats.hospitals) {
              const hospitals = Array.isArray(stats.hospitals) ? stats.hospitals : [];
              
              // Enhanced hospital data with coordinates and addresses for Mumbai area
              const enhancedHospitals = hospitals.map((hospital: any, index: number) => {
                const baseCoords = [
                  { lat: 19.0760, lng: 72.8777 }, // Mumbai Central
                  { lat: 19.0860, lng: 72.8877 }, // Near Mumbai Central
                  { lat: 19.0660, lng: 72.8677 }, // Andheri area
                  { lat: 19.0560, lng: 72.8577 }, // Bandra area
                ];
                
                const addresses = [
                  "123 Main Street, Mumbai, Maharashtra 400001",
                  "456 Park Avenue, Mumbai, Maharashtra 400002", 
                  "789 Highway Road, Mumbai, Maharashtra 400003",
                  "321 Central Road, Mumbai, Maharashtra 400004"
                ];
                
                const coords = baseCoords[index % baseCoords.length];
                const distance = calculateDistance(
                  patientLocation.lat, 
                  patientLocation.lng, 
                  coords.lat, 
                  coords.lng
                );
                
                return { 
                  ...hospital, 
                  distance,
                  coordinates: coords,
                  address: addresses[index % addresses.length]
                };
              }).sort((a, b) => a.distance - b.distance);

              setRecommendedHospitals(enhancedHospitals.slice(0, 3));
            }
          } catch (error) {
            console.error('Error loading hospital recommendations:', error);
            // Fallback data with coordinates
            const fallbackHospitals = [
              { 
                name: "City General Hospital", 
                distance: 2.5,
                bedsAvailable: 12,
                queue: 15,
                rating: 4.5,
                coordinates: { lat: 19.0760, lng: 72.8777 },
                address: "123 Main Street, Mumbai, Maharashtra 400001"
              },
              { 
                name: "Metro Medical Center", 
                distance: 4.2,
                bedsAvailable: 28,
                queue: 20,
                rating: 4.7,
                coordinates: { lat: 19.0860, lng: 72.8877 },
                address: "456 Park Avenue, Mumbai, Maharashtra 400002"
              },
              { 
                name: "Regional Health Hub", 
                distance: 6.8,
                bedsAvailable: 5,
                queue: 35,
                rating: 4.2,
                coordinates: { lat: 19.0660, lng: 72.8677 },
                address: "789 Highway Road, Mumbai, Maharashtra 400003"
              }
            ];
            setRecommendedHospitals(fallbackHospitals);
          }
        };
        loadHospitalRecommendations();
        
        setLoading(false);
        
        return () => {
          if (unsubscribeTokens) unsubscribeTokens();
        };
      } catch (error) {
        console.error('Error loading patient data:', error);
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientEmail, soundEnabled, patientLocation]);

  // --- Real-time Updates ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateWaitTimes();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [tokens]);

  // --- Update Wait Times ---
  const updateWaitTimes = () => {
    setTokens(prevTokens => {
      return prevTokens.map(token => {
        if (token.status === "completed" || token.status === "in-consultation") {
          return token;
        }

        // Simple wait time calculation for display
        const now = new Date();
        const estimatedTime = new Date(token.estimatedConsultationTime);
        const waitMinutes = Math.max(0, Math.floor((estimatedTime.getTime() - now.getTime()) / 60000));
        
        return {
          ...token,
          estimatedWaitTime: waitMinutes
        };
      });
    });
  };

  // --- Get Status Color ---
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-consultation": return "bg-blue-100 text-blue-800 border-blue-200";
      case "checked-in": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "delayed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "emergency": return "bg-red-100 text-red-800 border-red-200";
      case "urgent": return "bg-orange-100 text-orange-800 border-orange-200";
      case "high": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "normal": return "bg-blue-100 text-blue-800 border-blue-200";
      case "low": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- Mark Notification as Read ---
  const markNotificationRead = async (tokenId: string, notificationId: string) => {
    try {
      await mediSyncServices.smartOPD.markNotificationRead(tokenId, notificationId);
      
      setTokens(prevTokens => 
        prevTokens.map(token => {
          if (token.id === tokenId) {
            return {
              ...token,
              notifications: token.notifications.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
              )
            };
          }
          return token;
        })
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // --- Get Unread Notifications Count ---
  const unreadCount = useMemo(() => {
    return tokens.reduce((count, token) => 
      count + token.notifications.filter(notif => !notif.read).length, 0
    );
  }, [tokens]);

  // --- Interactive Hospital Map Component ---
const HospitalMap = () => {
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  
  // Hospital data with coordinates
  const hospitals = [
    {
      id: 1,
      name: "CuraNet General Hospital",
      address: "123 Medical Center Drive, Mumbai",
      coordinates: { lat: 19.0760, lng: 72.8777 },
      phone: "+91-22-1234-5678",
      emergency: true,
      beds: 450,
      rating: 4.5,
      distance: "0.5 km"
    },
    {
      id: 2,
      name: "City Medical Center",
      address: "456 Health Avenue, Mumbai",
      coordinates: { lat: 19.0860, lng: 72.8877 },
      phone: "+91-22-2345-6789",
      emergency: true,
      beds: 320,
      rating: 4.2,
      distance: "1.2 km"
    },
    {
      id: 3,
      name: "Metro Hospital",
      address: "789 Care Boulevard, Mumbai",
      coordinates: { lat: 19.0660, lng: 72.8677 },
      phone: "+91-22-3456-7890",
      emergency: false,
      beds: 280,
      rating: 4.0,
      distance: "2.1 km"
    },
    {
      id: 4,
      name: "Emergency Care Center",
      address: "321 Urgent Street, Mumbai",
      coordinates: { lat: 19.0960, lng: 72.8977 },
      phone: "+91-22-4567-8901",
      emergency: true,
      beds: 150,
      rating: 4.7,
      distance: "1.8 km"
    }
  ];

  const handleGetDirections = (hospital: any) => {
    const destination = `${hospital.coordinates.lat},${hospital.coordinates.lng}`;
    const origin = `${19.0760},${72.8777}`; // Default Mumbai coordinates
    
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  const openMapWithHospital = (hospital: any) => {
    // Open Google Maps centered on hospital
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${hospital.coordinates.lat},${hospital.coordinates.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg overflow-hidden relative">
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-8 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-gray-300"></div>
          ))}
        </div>
      </div>
      
      {/* Hospital Markers */}
      <div className="absolute inset-0 p-4">
        <div className="relative w-full h-full">
          {hospitals.map((hospital, index) => {
            // Calculate position based on coordinates (simplified)
            const x = ((hospital.coordinates.lng - 72.8677) / 0.03) * 100; // Rough positioning
            const y = ((19.0960 - hospital.coordinates.lat) / 0.03) * 100; // Rough positioning
            
            return (
              <div
                key={hospital.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => setSelectedHospital(hospital)}
              >
                {/* Hospital Marker */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 group-hover:scale-110",
                  hospital.emergency ? "bg-red-500" : "bg-blue-500"
                )}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                
                {/* Hospital Label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div className="text-xs font-semibold">{hospital.name}</div>
                  <div className="text-xs text-gray-500">{hospital.distance}</div>
                </div>
              </div>
            );
          })}
          
          {/* User Location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-semibold">
              Your Location
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 space-y-2">
        <button
          onClick={() => window.open('https://www.google.com/maps/@19.0760,72.8777,12z', '_blank')}
          className="block w-full text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          🗺️ Open in Google Maps
        </button>
        <button
          onClick={() => window.open('tel:108', '_self')}
          className="block w-full text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          🚑 Emergency: 108
        </button>
      </div>
      
      {/* Selected Hospital Details */}
      {selectedHospital && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{selectedHospital.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{selectedHospital.address}</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs">⭐ {selectedHospital.rating}</span>
                <span className="text-xs">🛏️ {selectedHospital.beds} beds</span>
                <span className="text-xs">📍 {selectedHospital.distance}</span>
                {selectedHospital.emergency && <span className="text-xs bg-red-100 text-red-700 px-1 rounded">24/7</span>}
              </div>
            </div>
            <button
              onClick={() => setSelectedHospital(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGetDirections(selectedHospital)}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              🗺️ Directions
            </button>
            <button
              onClick={() => window.open(`tel:${selectedHospital.phone}`)}
              className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              📞 Call
            </button>
            <button
              onClick={() => openMapWithHospital(selectedHospital)}
              className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              📍 View on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Active Token ---
  const activeToken = useMemo(() => {
    console.log('Current tokens:', tokens);
    console.log('Patient email:', patientEmail);
    console.log('Patient profile:', patientProfile);
    const active = tokens.find(token => 
      token.status === "waiting" || token.status === "in-consultation" || token.status === "checked-in"
    );
    console.log('Active token found:', active);
    return active;
  }, [tokens]);

  // --- Get Directions to Hospital ---
  const handleGetDirections = (hospital: any) => {
    const destination = `${hospital.coordinates.lat},${hospital.coordinates.lng}`;
    const origin = `${19.0760},${72.8777}`; // Default Mumbai coordinates
    
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  // --- Create Test Token (for debugging) ---
  const createTestToken = async () => {
    // Create a test patient profile if none exists
    if (!patientProfile) {
      const testProfile = {
        id: `patient-${Date.now()}`,
        name: "Test Patient",
        email: patientEmail || "test@example.com",
        phone: "+91 12345 67890",
        age: 30,
        gender: "Male",
        address: "Test Address",
        emergencyContact: "+91 09876 54321",
        bloodGroup: "O+",
        medicalHistory: "None",
        allergies: "None",
        medications: "None"
      };
      
      // Save test profile to localStorage (in a real app, this would be saved to database)
      localStorage.setItem('patientProfile', JSON.stringify(testProfile));
      setPatientProfile(testProfile);
      toast.success('Test patient profile created!');
    }

    try {
      const profile = patientProfile || JSON.parse(localStorage.getItem('patientProfile') || '{}');
      const testToken = {
        id: `test-token-${Date.now()}`,
        tokenNumber: `TEST-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        patientName: profile.name,
        age: profile.age,
        phone: profile.phone,
        email: profile.email,
        doctorName: "Dr. Test Doctor",
        department: "General Medicine",
        roomNumber: "Room 101",
        checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        registrationTime: new Date().toISOString(),
        estimatedConsultationTime: new Date(Date.now() + 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: "waiting",
        priority: "normal",
        positionInQueue: 1,
        patientsAhead: 0,
        estimatedWaitTime: 15,
        isEmergency: false,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            message: `Welcome! Your token has been created for testing.`,
            type: "success",
            timestamp: new Date().toISOString(),
            read: false
          }
        ]
      };

      await mediSyncServices.smartOPD.addToken(testToken);
      toast.success('Test token created successfully!');
    } catch (error) {
      console.error('Error creating test token:', error);
      toast.error('Failed to create test token');
    }
  };

  // --- Book Appointment ---
  const bookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !appointmentTime || !patientProfile) {
      toast.error('Please fill all appointment details');
      return;
    }

    try {
      const appointmentData = {
        patientId: patientProfile.id,
        patientName: patientProfile.name,
        patientEmail: patientProfile.email,
        patientPhone: patientProfile.phone,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        department: selectedDoctor.department,
        date: appointmentDate,
        time: appointmentTime,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        notes: ''
      };

      await mediSyncServices.smartOPD.addToken({
        ...appointmentData,
        tokenNumber: `TKN${Date.now().toString().slice(-6)}`,
        priority: 'normal',
        status: 'scheduled',
        registrationTime: new Date().toISOString(),
        estimatedConsultationTime: `${appointmentDate} ${appointmentTime}`,
        positionInQueue: 0,
        patientsAhead: 0,
        estimatedWaitTime: 0,
        isEmergency: false,
        notifications: []
      });

      toast.success('Appointment booked successfully!');
      setShowAppointmentDialog(false);
      setAppointmentDate('');
      setAppointmentTime('');
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Check if patient email is provided
  if (!patientEmail) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Patient Portal Access</h1>
            <p className="text-muted-foreground mb-4">
              Please provide your email address to access your OPD queue information.
            </p>
            <div className="max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="mb-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const email = (e.target as HTMLInputElement).value;
                    if (email) {
                      localStorage.setItem('patientEmail', email);
                      window.location.search = `?email=${encodeURIComponent(email)}`;
                    }
                  }
                }}
              />
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[type="email"]') as HTMLInputElement;
                  const email = input?.value;
                  if (email) {
                    localStorage.setItem('patientEmail', email);
                    window.location.search = `?email=${encodeURIComponent(email)}`;
                  }
                }}
                className="w-full"
              >
                Access Portal
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Patient OPD Portal
            </h1>
            <p className="text-muted-foreground">
              Welcome, {patientProfile?.name || patientEmail}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
            
            <Button 
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
              Auto Refresh
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                localStorage.removeItem('patientEmail');
                window.location.search = '';
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Current Time & Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Time</p>
                  <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-lg">{currentTime.toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
                Hospital Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {hospitalStats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{hospitalStats.totalHospitals}</div>
                    <div className="text-xs text-muted-foreground">Hospitals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{hospitalStats.availableBeds}</div>
                    <div className="text-xs text-muted-foreground">Available Beds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{hospitalStats.emergencyCases}</div>
                    <div className="text-xs text-muted-foreground">Emergency Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{hospitalStats.averageWaitTime}m</div>
                    <div className="text-xs text-muted-foreground">Avg Wait Time</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">Loading statistics...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Blood Bank & Ambulance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Blood Bank Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Droplets className="w-5 h-5 text-red-600" />
                Blood Bank Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bloodBankStats ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Total Units</span>
                    <Badge variant="secondary" className="text-red-600">
                      {bloodBankStats.totalUnits}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(bloodBankStats.availableUnits).map(([type, units]) => (
                      <div key={type} className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-700">{type}</div>
                        <div className="text-red-600">{units}</div>
                      </div>
                    ))}
                  </div>
                  {bloodBankStats.urgentRequests > 0 && (
                    <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {bloodBankStats.urgentRequests} urgent requests
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">Loading blood bank data...</div>
              )}
            </CardContent>
          </Card>

          {/* Ambulance Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ambulance className="w-5 h-5 text-green-600" />
                Emergency Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {ambulanceStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{ambulanceStats.availableAmbulances}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{ambulanceStats.activeAmbulances}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{ambulanceStats.averageResponseTime}m</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">Loading ambulance data...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hospital Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              Hospital Locations Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HospitalMap />
          </CardContent>
        </Card>

        {/* Nearby Hospitals with Directions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Nearby Hospitals & Directions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedHospitals.length > 0 ? (
                recommendedHospitals.map((hospital, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{hospital.name || `Hospital ${index + 1}`}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {hospital.distance ? `${hospital.distance.toFixed(1)} km away` : 'Distance calculating...'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGetDirections(hospital)}
                          className="flex items-center gap-1"
                        >
                          <Route className="w-3 h-3" />
                          Directions
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-700">{hospital.bedsAvailable || 12}</div>
                        <div className="text-green-600">Beds Available</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-700">{hospital.queue || 15}</div>
                        <div className="text-blue-600">Queue Time</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-700">{hospital.rating || '4.5'}</div>
                        <div className="text-purple-600">Rating</div>
                      </div>
                    </div>
                    
                    {hospital.address && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <strong>Address:</strong> {hospital.address}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading nearby hospitals...</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Navigation className="w-4 h-4" />
                  <span className="font-semibold">Need Directions?</span>
                </div>
                <p className="text-sm text-blue-600">
                  Click on any hospital's "Directions" button to get turn-by-turn navigation using Google Maps. 
                  This will show you the fastest route from your current location to the hospital.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Find Hospitals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Looking for hospitals with specific specialists or better facilities?
                </p>
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => window.location.href = '/hospital-recommendations'}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Hospital Map & Recommendations
                </Button>
                <div className="mt-4 text-sm text-muted-foreground">
                  <div>🗺 Interactive map with nearby hospitals</div>
                  <div>👨‍⚕️ Specialist doctor information</div>
                  <div>🏥 Real-time bed availability</div>
                  <div>⭐ Hospital ratings and reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Hospital Traffic
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Want to see current hospital traffic and bed availability across the city?
                </p>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = '/hospital-traffic'}
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Traffic & Bed Availability
                </Button>
                <div className="mt-4 text-sm text-muted-foreground">
                  <div>📊 Live hospital traffic monitoring</div>
                  <div>🏥 Real-time bed availability</div>
                  <div>⏱️ Wait time predictions</div>
                  <div>📍 Department-wise analytics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment Booking Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Book Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Doctor</label>
                <select 
                  className="w-full p-3 border rounded-md"
                  value={selectedDoctor?.id || ''}
                  onChange={(e) => {
                    const doctor = availableDoctors.find(d => d.id === e.target.value);
                    setSelectedDoctor(doctor || null);
                  }}
                >
                  <option value="">Choose a doctor...</option>
                  {availableDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Appointment Date</label>
                <Input 
                  type="date" 
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Time</label>
                <Input 
                  type="time" 
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={bookAppointment}
                  disabled={!selectedDoctor || !appointmentDate || !appointmentTime}
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Token Display */}
        {activeToken && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">Your Current Token</h2>
                <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {activeToken.tokenNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">Token Number</div>
                  </div>
                  
                  <div className="text-center">
                    <Badge className={cn("text-lg px-4 py-2", getStatusColor(activeToken.status))}>
                      {activeToken.status.replace('-', ' ')}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">Status</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-left">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Doctor</div>
                      <div className="font-semibold">{activeToken.doctorName || 'Assigned Doctor'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Room</div>
                      <div className="font-semibold">{activeToken.roomNumber || 'TBA'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Est. Time</div>
                      <div className="font-semibold">{activeToken.estimatedConsultationTime || 'TBA'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Queue Position</div>
                      <div className="font-semibold">#{activeToken.positionInQueue}</div>
                    </div>
                  </div>
                </div>

                {/* Wait Time Progress */}
                {activeToken.status === "waiting" && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Estimated Wait Time</span>
                      <span>{activeToken.estimatedWaitTime} minutes</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (activeToken.estimatedWaitTime * 2))} 
                      className="h-3"
                    />
                  </div>
                )}

                {/* Medical Information */}
                {(activeToken.symptoms || activeToken.allergies || activeToken.medicalHistory) && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900">Your Medical Information</h4>
                    {activeToken.symptoms && (
                      <div className="mb-2">
                        <span className="text-sm text-blue-700">Symptoms: </span>
                        <span className="text-sm">{activeToken.symptoms}</span>
                      </div>
                    )}
                    {activeToken.allergies && (
                      <div className="mb-2">
                        <span className="text-sm text-red-700 font-medium">Allergies: </span>
                        <span className="text-sm text-red-600">{activeToken.allergies}</span>
                      </div>
                    )}
                    {activeToken.medicalHistory && (
                      <div>
                        <span className="text-sm text-blue-700">Medical History: </span>
                        <span className="text-sm">{activeToken.medicalHistory}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Profile */}
        {patientProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {patientProfile.name}</div>
                    <div><span className="text-muted-foreground">Email:</span> {patientProfile.email}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {patientProfile.phone}</div>
                    <div><span className="text-muted-foreground">Age:</span> {patientProfile.age}</div>
                    {patientProfile.bloodGroup && (
                      <div><span className="text-muted-foreground">Blood Group:</span> {patientProfile.bloodGroup}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Medical Information</h4>
                  <div className="space-y-2 text-sm">
                    {patientProfile.allergies && (
                      <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                        <span className="text-muted-foreground">Allergies:</span> {patientProfile.allergies}
                      </div>
                    )}
                    {patientProfile.medicalHistory && (
                      <div>
                        <span className="text-muted-foreground">Medical History:</span>
                        <p className="mt-1">{patientProfile.medicalHistory}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications ({unreadCount} unread)
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tokens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications available
                  </div>
                ) : (
                  tokens.flatMap(token => 
                    token.notifications.map(notification => ({
                      ...notification,
                      tokenId: token.id,
                      patientName: token.patientName,
                      tokenNumber: token.tokenNumber
                    }))
                  ).sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  ).map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        notification.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200",
                        !notification.read && "hover:bg-blue-100"
                      )}
                      onClick={() => !notification.read && markNotificationRead(notification.tokenId, notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={cn("text-xs", getPriorityColor(
                              (tokens.find(t => t.id === notification.tokenId) as any)?.priority || 'normal'
                            ))}>
                              {notification.tokenNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className={cn("text-sm", 
                            notification.read ? "text-gray-600" : "text-gray-900 font-medium"
                          )}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Active Token */}
        {!activeToken && tokens.length === 0 && (
          <Card>
            <CardContent className="text-center py-20">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Active Appointments</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any active OPD appointments. Please register at the hospital to get a token.
              </p>
            </CardContent>
          </Card>
        )}

              </div>
		{/* --- FLOATING CHATBOT --- */}
      <div className="fixed bottom-6 right-6 z-[60]">
        {isChatOpen ? (
          <Card className="w-80 md:w-96 h-[600px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 overflow-hidden">
            <CardHeader className="bg-primary p-4 text-primary-foreground flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-bold">HealthBot</span>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsChatOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden bg-white">
              <iframe 
                src="/templates/index.html" 
                className="w-full h-full border-none"
                title="AI Disease Diagnostic Assistant"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </CardContent>
          </Card>
        ) : (
          <Button 
            onClick={() => setIsChatOpen(true)} 
            className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:scale-110 transition-transform flex items-center justify-center"
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default PatientOPDPortal;
