import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";
import { 
  Plus,
  Search,
  Clock,
  Users,
  UserCheck,
  Stethoscope,
  Play,
  Pause,
  SkipForward,
  Bell,
  Activity,
  Timer,
  Calendar,
  MapPin,
  Phone,
  User,
  ArrowRight,
  AlertTriangle,
  Bed,
  CheckCircle,
  Eye,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediSyncServices } from "@/lib/firebase-services";
import { EnhancedPatientRegistrationModal } from "@/components/smart-opd/EnhancedPatientRegistrationModal";

// --- Types & Interfaces ---
type Priority = "urgent" | "high" | "normal" | "emergency";
type Status = "waiting" | "in-consultation" | "checked-in" | "completed" | "delayed";
type QueueHealth = "smooth" | "busy" | "overloaded";

interface Doctor {
  id: string;
  name: string;
  department: string;
  room: string;
  specialization: string;
  averageConsultationTime: number; // in minutes
  isAvailable: boolean;
  currentPatient?: string;
  totalPatientsSeen: number;
  delayBuffer: number; // current delay in minutes
}

interface SmartToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  phone: string;
  email?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  symptoms?: string;
  allergies?: string;
  medications?: string;
  bloodGroup?: string;
  doctor: Doctor;
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
  estimatedWaitTime: number; // in minutes
  isEmergency: boolean;
  notifications: Notification[];
  hospitalId?: string; // Add optional hospitalId for filtering
  patientId?: string; // Add optional patientId for tracking
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  timestamp: string;
  read: boolean;
}

interface QueueMetrics {
  totalPatients: number;
  averageWaitTime: number;
  patientsCompleted: number;
  patientsInConsultation: number;
  queueHealth: QueueHealth;
  emergencyCount: number;
}

const SmartOPD = () => {
  const { user } = useAuth();
  // --- State Management ---
  const [tokens, setTokens] = useState<SmartToken[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showDoctorPanel, setShowDoctorPanel] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Mock Data ---
  const mockDoctors: Doctor[] = [
    {
      id: "doc-1",
      name: "Dr. Sarah Johnson",
      department: "Cardiology",
      room: "Room 101",
      specialization: "Cardiologist",
      averageConsultationTime: 15,
      isAvailable: true,
      totalPatientsSeen: 12,
      delayBuffer: 0
    },
    {
      id: "doc-2", 
      name: "Dr. Michael Chen",
      department: "General Medicine",
      room: "Room 102",
      specialization: "General Physician",
      averageConsultationTime: 10,
      isAvailable: true,
      totalPatientsSeen: 18,
      delayBuffer: 5
    },
    {
      id: "doc-3",
      name: "Dr. Emily Davis", 
      department: "Pediatrics",
      room: "Room 103",
      specialization: "Pediatrician",
      averageConsultationTime: 12,
      isAvailable: false,
      totalPatientsSeen: 8,
      delayBuffer: 15
    }
  ];

  // --- Initialize Data ---
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Load doctors
        const doctorsData = await mediSyncServices.smartOPD.getDoctors();
        if (doctorsData && Object.keys(doctorsData).length > 0) {
          const doctorsArray = Object.entries(doctorsData).map(([id, doctor]: [string, any]) => ({
            ...doctor,
            id
          }));
          setDoctors(doctorsArray);
        } else {
          setDoctors(mockDoctors);
          // Initialize doctors in Firebase
          for (const doctor of mockDoctors) {
            await mediSyncServices.smartOPD.addDoctor(doctor);
          }
        }

        // Load tokens
        await loadTokens();
        
      } catch (error) {
        console.error('Error initializing Smart OPD:', error);
        toast.error('Failed to initialize Smart OPD system');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // --- Real-time Updates ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateEstimatedTimes();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [tokens]);

  // --- Real-time Firebase Listeners ---
  useEffect(() => {
    // Listen to tokens updates
    const unsubscribeTokens = mediSyncServices.smartOPD.listenToTokens((tokensData) => {
      if (tokensData && Object.keys(tokensData).length > 0) {
        const tokensArray = Object.entries(tokensData).map(([id, token]: [string, any]) => ({
          ...token,
          id,
          priority: token.priority as Priority,
          status: token.status as Status,
          hospitalId: user?.hospitalId
        }));
        setTokens(tokensArray);
      }
    }, user?.hospitalId);

    // Listen to doctors updates
    const unsubscribeDoctors = mediSyncServices.smartOPD.listenToDoctors((doctorsData) => {
      if (doctorsData && Object.keys(doctorsData).length > 0) {
        const doctorsArray = Object.entries(doctorsData).map(([id, doctor]: [string, any]) => ({
          ...doctor,
          id
        }));
        setDoctors(doctorsArray);
      }
    });

    return () => {
      unsubscribeTokens?.();
      unsubscribeDoctors?.();
    };
  }, [user?.hospitalId]);

  // --- Load Tokens ---
  const loadTokens = async () => {
    try {
      const tokensData = await mediSyncServices.smartOPD.getTokens(user?.hospitalId);
      
      if (tokensData && Object.keys(tokensData).length > 0) {
        const tokensArray = Object.entries(tokensData).map(([id, token]: [string, any]) => ({
          ...token,
          id,
          priority: token.priority as Priority,
          status: token.status as Status,
          hospitalId: user?.hospitalId // Add hospital ID for filtering
        }));
        setTokens(tokensArray);
      } else {
        // Initialize with sample tokens
        const sampleTokens = generateSampleTokens();
        setTokens(sampleTokens);
        
        // Add to Firebase
        for (const token of sampleTokens) {
          await mediSyncServices.smartOPD.addToken({
            ...token,
            hospitalId: user?.hospitalId // Add hospital ID to sample tokens
          });
        }
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error('Failed to load tokens');
    }
  };

  // --- Generate Sample Tokens ---
  const generateSampleTokens = (): SmartToken[] => {
    const timestamp = Date.now();
    const sampleTokens: SmartToken[] = [
      {
        id: `token-${timestamp}-1`, // Ensure unique IDs
        tokenNumber: "OPD-A-042",
        patientName: "Rajesh Kumar",
        age: 45,
        phone: "+91 98765 43210",
        email: "rajesh.kumar@example.com", // Add email for patient portal testing
        doctor: mockDoctors[0],
        department: "Cardiology",
        roomNumber: "Room 101",
        checkInTime: "08:30 AM",
        registrationTime: new Date().toISOString(),
        estimatedConsultationTime: "09:15 AM",
        status: "waiting",
        priority: "urgent",
        positionInQueue: 1,
        patientsAhead: 0,
        estimatedWaitTime: 5,
        isEmergency: false,
        hospitalId: user?.hospitalId, // Add hospital ID for filtering
        notifications: []
      },
      {
        id: `token-${timestamp}-2`,
        tokenNumber: "OPD-G-001",
        patientName: "Priya Sharma",
        age: 32,
        phone: "+91 87654 32109",
        email: "priya.sharma@example.com", // Add email for patient portal testing
        doctor: mockDoctors[1],
        department: "General Medicine",
        roomNumber: "Room 205",
        checkInTime: "09:00 AM",
        registrationTime: new Date().toISOString(),
        estimatedConsultationTime: "09:30 AM",
        status: "checked-in",
        priority: "normal",
        positionInQueue: 1,
        patientsAhead: 0,
        estimatedWaitTime: 0,
        isEmergency: false,
        hospitalId: user?.hospitalId,
        notifications: []
      },
      {
        id: `token-${timestamp}-3`,
        tokenNumber: "OPD-N-003",
        patientName: "Amit Patel",
        age: 28,
        phone: "+91 76543 21098",
        email: "amit.patel@example.com", // Add email for patient portal testing
        doctor: mockDoctors[2],
        department: "Neurology",
        roomNumber: "Room 310",
        checkInTime: "08:45 AM",
        registrationTime: new Date().toISOString(),
        estimatedConsultationTime: "10:00 AM",
        status: "in-consultation",
        priority: "high",
        positionInQueue: 1,
        patientsAhead: 0,
        estimatedWaitTime: 0,
        isEmergency: false,
        hospitalId: user?.hospitalId,
        notifications: []
      }
    ];
    
    return sampleTokens;
  };

  // --- Update Estimated Times ---
  const updateEstimatedTimes = useCallback(() => {
    setTokens(prevTokens => {
      if (!prevTokens || !Array.isArray(prevTokens)) return prevTokens;
      
      return prevTokens.map(token => {
        if (!token || token.status === "completed") {
          return token;
        }

        const doctor = doctors && doctors.length > 0 ? doctors.find(d => d.id === token.doctor?.id) : null;
        if (!doctor || !token.doctor?.id) return token;

        // Get all active tokens for this doctor (excluding completed)
        const activeTokens = prevTokens.filter(t => 
          t && t.doctor?.id && token.doctor?.id &&
          t.doctor?.id === token.doctor?.id && 
          t.status !== "completed"
        );

        // Sort by priority and creation time for proper queue ordering
        const sortedTokens = activeTokens.sort((a, b) => {
          // Emergency first
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;
          
          // Then by priority
          const priorityWeight = { emergency: 0, urgent: 1, high: 2, normal: 3, low: 4 };
          const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by creation time (earlier tokens first)
          return new Date(a.registrationTime || 0).getTime() - 
                 new Date(b.registrationTime || 0).getTime();
        });

        const position = sortedTokens.findIndex(t => t.id === token.id) + 1;
        const patientsAhead = Math.max(0, position - 1);
        
        // Calculate wait time based on patients ahead and average consultation time
        const avgTime = doctor.averageConsultationTime || 15;
        const delayBuffer = doctor.delayBuffer || 5;
        const estimatedWait = (patientsAhead * avgTime) + delayBuffer;

        const now = new Date();
        const consultationTime = new Date(now.getTime() + estimatedWait * 60000);
        
        return {
          ...token,
          positionInQueue: position,
          patientsAhead,
          estimatedWaitTime: estimatedWait,
          estimatedConsultationTime: consultationTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
      });
    });
  }, [doctors]);

  // --- Queue Metrics ---
  const metrics = useMemo((): QueueMetrics => {
    const totalPatients = tokens.length;
    const completedPatients = tokens.filter(t => t.status === "completed").length;
    const inConsultation = tokens.filter(t => t.status === "in-consultation").length;
    const avgWaitTime = tokens.length > 0 
      ? Math.floor(tokens.reduce((acc, t) => acc + t.estimatedWaitTime, 0) / tokens.length)
      : 0;
    const emergencyCount = tokens.filter(t => t.isEmergency).length;
    
    let queueHealth: QueueHealth = "smooth";
    if (avgWaitTime > 30) queueHealth = "busy";
    if (avgWaitTime > 60 || emergencyCount > 0) queueHealth = "overloaded";

    return {
      totalPatients,
      averageWaitTime: avgWaitTime,
      patientsCompleted: completedPatients,
      patientsInConsultation: inConsultation,
      queueHealth,
      emergencyCount
    };
  }, [tokens]);

  // --- Filtered Tokens ---
  const filteredTokens = useMemo(() => {
    return tokens
      .filter(token => {
        const matchesDept = selectedDepartment === "All Departments" || token.department === selectedDepartment;
        const matchesSearch = token.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              token.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDept && matchesSearch;
      })
      .sort((a, b) => {
        // Emergency tokens first
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        
        // Then by priority
        const priorityWeight = { emergency: 0, urgent: 1, high: 2, normal: 3 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
        
        // Then by position in queue
        return a.positionInQueue - b.positionInQueue;
      });
  }, [tokens, selectedDepartment, searchQuery]);

  // --- Check-in Patient Function ---
  const checkInPatient = async (tokenId: string) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      // Update token status to checked-in
      await mediSyncServices.smartOPD.updateToken(tokenId, {
        status: 'checked-in',
        checkInTime: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      toast.success(`Patient ${token.patientName} checked in successfully`);
    } catch (error) {
      console.error('Error checking in patient:', error);
      toast.error('Failed to check in patient');
    }
  };

  // --- Doctor Actions ---
  const startConsultation = async (tokenId: string) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      // Update token status
      await mediSyncServices.smartOPD.updateToken(tokenId, {
        status: 'in-consultation',
        actualConsultationTime: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      // Add notification to patient
      await mediSyncServices.smartOPD.addNotification(tokenId, {
        message: `Your consultation with Dr. ${token.doctor.name} has started. Please proceed to ${token.roomNumber}.`,
        type: 'success'
      });

      toast.success(`Consultation started for ${token.patientName}`);
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    }
  };

  // --- Complete Consultation ---
  const completeConsultation = async (tokenId: string, decision: 'DISCHARGE' | 'ADMISSION_REQUIRED' | 'FOLLOW_UP' = 'DISCHARGE') => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      // Update token status
      await mediSyncServices.smartOPD.updateToken(tokenId, {
        status: 'completed',
        doctorDecision: decision,
        decisionTime: new Date().toISOString()
      });

      // Add notification to patient
      let message = '';
      switch (decision) {
        case 'DISCHARGE':
          message = `Your consultation is complete. You have been discharged. Take your prescribed medicines and rest well.`;
          break;
        case 'ADMISSION_REQUIRED':
          message = `Your consultation is complete. Admission is required. Our staff will assist you with the admission process.`;
          break;
        case 'FOLLOW_UP':
          message = `Your consultation is complete. Please schedule a follow-up appointment within 7 days.`;
          break;
      }

      await mediSyncServices.smartOPD.addNotification(tokenId, {
        message,
        type: decision === 'ADMISSION_REQUIRED' ? 'warning' : 'success'
      });

      toast.success(`Consultation completed for ${token.patientName}. Decision: ${decision}`);
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Failed to complete consultation');
    }
  };

  const delayConsultation = async (doctorId: string, delayMinutes: number) => {
    try {
      await mediSyncServices.smartOPD.updateDoctorDelay(doctorId, delayMinutes);
      
      setDoctors(prev => prev.map(doctor => {
        if (doctor.id === doctorId) {
          return {
            ...doctor,
            delayBuffer: doctor.delayBuffer + delayMinutes
          };
        }
        return doctor;
      }));
      
      // Recalculate all waiting times for this doctor
      updateEstimatedTimes();
      
      toast.warning(`Consultation delayed by ${delayMinutes} minutes`);
    } catch (error) {
      toast.error('Failed to update delay');
    }
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

  // --- Get Queue Health Color ---
  const getQueueHealthColor = (health: QueueHealth) => {
    switch (health) {
      case "smooth": return "text-green-600";
      case "busy": return "text-yellow-600";
      case "overloaded": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  // --- Add New Patient ---
  const addNewPatient = async (patientData: any) => {
    try {
      const doctor = doctors.find(d => d.id === patientData.doctorId);
      if (!doctor) {
        toast.error('Please select a doctor');
        return;
      }

      // Generate sequential token number
      const deptCode = doctor.department.charAt(0).toUpperCase();
      const doctorTokens = (tokens || []).filter(t => t.doctor?.id === doctor.id);
      const nextNumber = Math.max(1, ...doctorTokens.map(t => {
        const match = t.tokenNumber?.match(/OPD-[A-Z]-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })) + 1;
      const tokenNumber = `OPD-${deptCode}-${String(nextNumber).padStart(3, '0')}`;

      // Calculate initial estimated time and position
      const activeTokens = (tokens || []).filter(t => 
        t.doctor?.id === doctor.id && 
        t.status !== "completed"
      );
      
      // Sort for proper positioning
      const sortedTokens = activeTokens.sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        
        const priorityWeight = { emergency: 0, urgent: 1, high: 2, normal: 3, low: 4 };
        const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.registrationTime || 0).getTime() - 
               new Date(b.registrationTime || 0).getTime();
      });
      
      const position = sortedTokens.length + 1;
      const patientsAhead = sortedTokens.length;
      
      const avgTime = doctor.averageConsultationTime || 15;
      const delayBuffer = doctor.delayBuffer || 5;
      const estimatedWait = (patientsAhead * avgTime) + delayBuffer;
      
      const now = new Date();
      const consultationTime = new Date(now.getTime() + estimatedWait * 60000);

      const newToken: SmartToken = {
        id: `token-${Date.now()}`,
        tokenNumber,
        patientName: patientData.name,
        age: patientData.age,
        phone: patientData.phone,
        email: patientData.email,
        gender: patientData.gender,
        address: patientData.address,
        emergencyContact: patientData.emergencyContact,
        medicalHistory: patientData.medicalHistory,
        symptoms: patientData.symptoms,
        doctor,
        department: doctor.department,
        roomNumber: doctor.room,
        checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        registrationTime: patientData.registrationTime,
        estimatedConsultationTime: consultationTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: "checked-in",
        priority: patientData.priority,
        positionInQueue: position,
        patientsAhead: patientsAhead,
        estimatedWaitTime: estimatedWait,
        isEmergency: patientData.priority === "emergency",
        hospitalId: user?.hospitalId, // Add hospital ID for filtering
        patientId: user?.patientId || `PAT-${Date.now()}`, // Add patient ID for tracking
        notifications: [
          {
            id: `notif-${Date.now()}`,
            message: `Welcome! Your token ${tokenNumber} has been generated. Please wait in the waiting area.`,
            type: "success",
            timestamp: new Date().toISOString(),
            read: false
          }
        ]
      };

      // Add to Firebase
      await mediSyncServices.smartOPD.addToken({
        ...newToken,
        hospitalId: user?.hospitalId || 'default-hospital' // Ensure hospitalId is never undefined
      });
      
      toast.success(`Token ${tokenNumber} created for ${patientData.name}. Estimated time: ${newToken.estimatedConsultationTime}`, {
        description: `Position in queue: ${newToken.positionInQueue}`,
        duration: 5000
      });
      
      setShowAddPatientModal(false);
    } catch (error) {
      console.error('Failed to register patient:', error);
      toast.error(`Failed to register patient: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is a doctor
  const isDoctor = user?.role === 'doctor' || user?.email?.includes('doctor') || user?.email?.includes('dr.');
  
  if (!isDoctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-4">
            This page is only accessible to doctors. Please login with a doctor account.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
          <p>Modal state: {showAddPatientModal ? 'OPEN' : 'CLOSED'}</p>
          <p>Click the button to test!</p>
        </div>
        {showAddPatientModal && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
            <p>Modal is open! Check for the dialog overlay.</p>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 tracking-tight">Smart OPD Management</h1>
            <p className="text-muted-foreground">Intelligent token system with real-time queue tracking</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button 
              onClick={() => setShowDoctorPanel(!showDoctorPanel)}
              variant={showDoctorPanel ? "default" : "outline"}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Doctor Panel
            </Button>
            <Button onClick={() => {
              alert('Button clicked!');
              console.log('Add Patient button clicked');
              setShowAddPatientModal(true);
              console.log('State set to true');
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold">{metrics.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold">{metrics.averageWaitTime}m</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Consultation</p>
                  <p className="text-2xl font-bold">{metrics.patientsInConsultation}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{metrics.patientsCompleted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Queue Health</p>
                  <p className={`text-2xl font-bold capitalize ${getQueueHealthColor(metrics.queueHealth)}`}>
                    {metrics.queueHealth}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${getQueueHealthColor(metrics.queueHealth)}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Panel - Next Patient Details */}
        {showDoctorPanel && (
          <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Next Patient - Preparation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const nextPatient = filteredTokens
                  .filter(t => t.status === 'waiting' || t.status === 'checked-in')
                  .sort((a, b) => {
                    // Emergency first
                    if (a.isEmergency && !b.isEmergency) return -1;
                    if (!a.isEmergency && b.isEmergency) return 1;
                    // Then by priority
                    const priorityWeight = { emergency: 0, urgent: 1, high: 2, normal: 3 };
                    return priorityWeight[a.priority] - priorityWeight[b.priority];
                  })[0];

                if (!nextPatient) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No patients in queue</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Basic Info */}
                    <div>
                      <h4 className="font-semibold mb-3 text-primary">Patient Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{nextPatient.patientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Token:</span>
                          <span className="font-medium">{nextPatient.tokenNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Age:</span>
                          <span className="font-medium">{nextPatient.age} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{nextPatient.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(nextPatient.status)}>
                            {nextPatient.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Medical Information */}
                    <div>
                      <h4 className="font-semibold mb-3 text-primary">Medical Details</h4>
                      <div className="space-y-3">
                        {nextPatient.symptoms && (
                          <div>
                            <span className="text-muted-foreground text-sm">Symptoms:</span>
                            <p className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                              {nextPatient.symptoms}
                            </p>
                          </div>
                        )}
                        
                        {nextPatient.allergies && (
                          <div>
                            <span className="text-muted-foreground text-sm">Allergies:</span>
                            <p className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-400">
                              {nextPatient.allergies}
                            </p>
                          </div>
                        )}
                        
                        {nextPatient.medicalHistory && (
                          <div>
                            <span className="text-muted-foreground text-sm">Medical History:</span>
                            <p className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                              {nextPatient.medicalHistory}
                            </p>
                          </div>
                        )}
                        
                        {nextPatient.priority !== 'normal' && (
                          <div>
                            <span className="text-muted-foreground text-sm">Priority:</span>
                            <Badge className={cn(
                              nextPatient.priority === 'emergency' && 'bg-red-100 text-red-800',
                              nextPatient.priority === 'urgent' && 'bg-orange-100 text-orange-800',
                              nextPatient.priority === 'high' && 'bg-yellow-100 text-yellow-800'
                            )}>
                              {nextPatient.priority.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["All Departments", "Cardiology", "General Medicine", "Pediatrics"].map(dept => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? "default" : "outline"}
                onClick={() => setSelectedDepartment(dept)}
                className="whitespace-nowrap"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        {/* Tokens List */}
        <div className="space-y-4">
          {filteredTokens.map((token) => (
            <Card key={token.id} className={cn(
              "transition-all duration-200 hover:shadow-md",
              token.isEmergency && "border-red-200 bg-red-50"
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Token Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        token.isEmergency 
                          ? "bg-red-100 text-red-800" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {token.tokenNumber}
                      </div>
                      <Badge className={getStatusColor(token.status)}>
                        {token.status.replace('-', ' ')}
                      </Badge>
                      {token.isEmergency && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{token.patientName}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Age: {token.age}
                      </div>
                      <div className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        Dr. {token.doctor.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {token.roomNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {token.phone}
                      </div>
                    </div>
                  </div>

                  {/* Queue Status */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {token.positionInQueue}
                      </div>
                      <div className="text-sm text-muted-foreground">Position in Queue</div>
                    </div>
                    
                    {token.status === "waiting" && (
                      <div className="mb-2">
                        <div className="text-lg font-semibold text-orange-600 mb-1">
                          {token.estimatedWaitTime}m
                        </div>
                        <div className="text-sm text-muted-foreground">Estimated Wait</div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground mb-2">
                      Est. Time: {token.estimatedConsultationTime}
                    </div>

                    {/* Progress Bar */}
                    {token.status === "waiting" && (
                      <div className="w-full max-w-xs mb-2">
                        <Progress 
                          value={Math.max(0, 100 - (token.estimatedWaitTime * 2))} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {token.status === "checked-in" && (
                        <Button 
                          size="sm" 
                          onClick={() => startConsultation(token.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start Consultation
                        </Button>
                      )}
                      
                      {token.status === "waiting" && (
                        <Button 
                          size="sm" 
                          onClick={() => checkInPatient(token.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Check In
                        </Button>
                      )}
                      
                      {token.status === "in-consultation" && (
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                // Show decision modal
                                const decision = window.confirm(
                                  `Complete consultation for ${token.patientName}?\n\n` +
                                  `Click OK for OPD Only\n` +
                                  `Click Cancel to mark for Admission`
                                );
                                completeConsultation(token.id, decision ? 'DISCHARGE' : 'ADMISSION_REQUIRED');
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete OPD
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => completeConsultation(token.id, 'ADMISSION_REQUIRED')}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Bed className="w-3 h-3 mr-1" />
                              Mark for Admission
                            </Button>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => delayConsultation(token.doctor.id, 5)}
                        >
                          <SkipForward className="w-3 h-3 mr-1" />
                          Delay
                        </Button>
                      </div>
                  </div>
                </div>

                {/* Notifications */}
                {token.notifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4" />
                      <span className="font-medium">Notifications</span>
                    </div>
                    <div className="space-y-1">
                      {token.notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={cn(
                            "text-sm p-2 rounded",
                            notif.type === "success" && "bg-green-50 text-green-800",
                            notif.type === "warning" && "bg-yellow-50 text-yellow-800",
                            notif.type === "urgent" && "bg-red-50 text-red-800"
                          )}
                        >
                          {notif.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTokens.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No patients in queue</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "No patients registered yet"}
              </p>
              <Button onClick={() => setShowAddPatientModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Patient
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Patient Registration Modal */}
        <EnhancedPatientRegistrationModal
          isOpen={showAddPatientModal}
          onClose={() => {
            console.log('Patient Registration Modal closing');
            setShowAddPatientModal(false);
          }}
          onRegisterPatient={addNewPatient}
          doctors={doctors}
        />
      </div>
  );
};

export default SmartOPD;
