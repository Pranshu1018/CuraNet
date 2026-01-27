import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Stethoscope,
  Users,
  Clock,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Phone,
  Calendar,
  MapPin,
  User,
  Activity,
  Heart,
  Thermometer,
  FileText,
  Bell,
  SkipForward,
  Plus,
  Search,
  Filter,
  Eye,
  Timer,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediSyncServices } from "@/lib/firebase-services";

// --- Types & Interfaces ---
type Priority = "emergency" | "urgent" | "high" | "normal" | "low";
type Status = "waiting" | "in-consultation" | "checked-in" | "completed" | "delayed";
type ConsultationDecision = "DISCHARGE" | "ADMISSION_REQUIRED" | "FOLLOW_UP" | "REFERRAL";

interface Doctor {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string;
  room: string;
  isAvailable: boolean;
  averageConsultationTime: number;
  totalPatientsSeen: number;
  delayBuffer: number;
  currentPatient?: string;
}

interface PatientDetails {
  id: string;
  tokenNumber: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  symptoms: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  bloodGroup?: string;
  lastVisit?: string;
  registrationTime: string;
}

interface Token {
  id: string;
  tokenNumber: string;
  patientId: string;
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
  consultationNotes?: string;
  doctorDecision?: ConsultationDecision;
  decisionTime?: string;
  prescription?: string;
  followUpDate?: string;
  nextAppointment?: string;
}

interface QueueMetrics {
  totalPatients: number;
  averageWaitTime: number;
  patientsCompleted: number;
  patientsInConsultation: number;
  emergencyCount: number;
  highPriorityCount: number;
}

const DoctorOPD = () => {
  const { user } = useAuth();
  
  // --- State Management ---
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDoctorPanel, setShowDoctorPanel] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);

  // --- Load Doctor Information ---
  useEffect(() => {
    const loadDoctorInfo = async () => {
      if (!user?.email) return;
      
      try {
        // Get doctors from Firebase
        const doctorsData = await mediSyncServices.smartOPD.getDoctors();
        if (doctorsData) {
          const doctorsArray = Object.entries(doctorsData).map(([id, doctor]: [string, any]) => ({
            ...doctor,
            id
          }));
          
          // Find current doctor by email
          const currentDoctor = doctorsArray.find(doc => doc.email === user.email);
          if (currentDoctor) {
            setDoctorInfo(currentDoctor);
          }
        }
      } catch (error) {
        console.error('Error loading doctor info:', error);
        toast.error('Failed to load doctor information');
      }
    };

    loadDoctorInfo();
  }, [user?.email]);

  // --- Load Tokens ---
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const tokensData = await mediSyncServices.smartOPD.getTokens();
        
        if (tokensData && Object.keys(tokensData).length > 0) {
          const tokensArray = Object.entries(tokensData).map(([id, token]: [string, any]) => ({
            ...token,
            id,
            priority: token.priority as Priority,
            status: token.status as Status
          }));
          
          // Filter tokens for current doctor
          const doctorTokens = doctorInfo 
            ? tokensArray.filter(token => token.doctorId === doctorInfo.id)
            : tokensArray;
            
          setTokens(doctorTokens);
        } else {
          setTokens([]);
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast.error('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    if (doctorInfo) {
      loadTokens();
    }
  }, [doctorInfo]);

  // --- Real-time Updates ---
  useEffect(() => {
    if (!doctorInfo) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateEstimatedTimes();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [tokens, doctorInfo]);

  // --- Real-time Firebase Listeners ---
  useEffect(() => {
    if (!doctorInfo) return;

    const unsubscribeTokens = mediSyncServices.smartOPD.listenToTokens((tokensData) => {
      if (tokensData) {
        const tokensArray = Object.entries(tokensData).map(([id, token]: [string, any]) => ({
          ...token,
          id,
          priority: token.priority as Priority,
          status: token.status as Status
        }));
        
        // Filter tokens for current doctor
        const doctorTokens = tokensArray.filter(token => token.doctorId === doctorInfo.id);
        setTokens(doctorTokens);
      }
    });

    return () => {
      if (unsubscribeTokens) unsubscribeTokens();
    };
  }, [doctorInfo]);

  // --- Update Estimated Times ---
  const updateEstimatedTimes = useCallback(() => {
    if (!doctorInfo) return;
    
    setTokens(prevTokens => {
      return prevTokens.map(token => {
        if (token.status === "completed" || token.status === "in-consultation") {
          return token;
        }

        const waitingTokens = prevTokens.filter(t => 
          t.doctorId === doctorInfo.id && 
          t.status === "waiting" &&
          t.priority !== "emergency"
        );

        const position = waitingTokens.findIndex(t => t.id === token.id) + 1;
        const patientsAhead = position - 1;
        
        const avgTime = doctorInfo.averageConsultationTime;
        const delayBuffer = doctorInfo.delayBuffer;
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
  }, [doctorInfo]);

  // --- Queue Metrics ---
  const metrics = useMemo((): QueueMetrics => {
    const totalPatients = tokens.length;
    const completedPatients = tokens.filter(t => t.status === "completed").length;
    const inConsultation = tokens.filter(t => t.status === "in-consultation").length;
    const avgWaitTime = tokens.length > 0 
      ? Math.floor(tokens.reduce((acc, t) => acc + t.estimatedWaitTime, 0) / tokens.length)
      : 0;
    const emergencyCount = tokens.filter(t => t.priority === "emergency").length;
    const highPriorityCount = tokens.filter(t => t.priority === "urgent" || t.priority === "high").length;

    return {
      totalPatients,
      averageWaitTime: avgWaitTime,
      patientsCompleted: completedPatients,
      patientsInConsultation: inConsultation,
      emergencyCount,
      highPriorityCount: highPriorityCount
    };
  }, [tokens]);

  // --- Filtered Tokens ---
  const filteredTokens = useMemo(() => {
    return tokens
      .filter(token => {
        const matchesDept = selectedDepartment === "all" || token.department === selectedDepartment;
        const matchesSearch = token.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              token.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDept && matchesSearch;
      })
      .sort((a, b) => {
        // Emergency tokens first
        if (a.priority === "emergency" && b.priority !== "emergency") return -1;
        if (a.priority !== "emergency" && b.priority === "emergency") return 1;
        
        // Then by priority
        const priorityWeight = { emergency: 0, urgent: 1, high: 2, normal: 3, low: 4 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
        
        // Then by position in queue
        return a.positionInQueue - b.positionInQueue;
      });
  }, [tokens, selectedDepartment, searchQuery]);

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

      // Update doctor status
      if (doctorInfo) {
        await mediSyncServices.smartOPD.updateDoctor(doctorInfo.id, {
          currentPatient: token.patientName,
          isAvailable: false
        });
      }

      toast.success(`Consultation started for ${token.patientName}`);
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    }
  };

  const completeConsultation = async (tokenId: string, decision: ConsultationDecision = 'DISCHARGE') => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      // Update token status
      await mediSyncServices.smartOPD.updateToken(tokenId, {
        status: 'completed',
        doctorDecision: decision,
        decisionTime: new Date().toISOString()
      });

      // Update doctor status
      if (doctorInfo) {
        await mediSyncServices.smartOPD.updateDoctor(doctorInfo.id, {
          currentPatient: null,
          isAvailable: true,
          totalPatientsSeen: (doctorInfo.totalPatientsSeen || 0) + 1
        });
      }

      // Add notification to patient
      let message = '';
      switch (decision) {
        case 'DISCHARGE':
          message = `Your consultation with Dr. ${doctorInfo?.name} is complete. You have been discharged. Take your prescribed medicines and rest well.`;
          break;
        case 'ADMISSION_REQUIRED':
          message = `Your consultation is complete. Admission is required. Our staff will assist you with the admission process.`;
          break;
        case 'FOLLOW_UP':
          message = `Your consultation is complete. Please schedule a follow-up appointment within 7 days.`;
          break;
        case 'REFERRAL':
          message = `Your consultation is complete. You have been referred to a specialist for further evaluation.`;
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

  const delayPatient = async (tokenId: string, delayMinutes: number) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      await mediSyncServices.smartOPD.updateToken(tokenId, {
        status: 'delayed',
        estimatedWaitTime: token.estimatedWaitTime + delayMinutes
      });

      toast.warning(`Patient ${token.patientName} delayed by ${delayMinutes} minutes`);
    } catch (error) {
      toast.error('Failed to delay patient');
    }
  };

  const callNextPatient = async () => {
    try {
      const nextToken = filteredTokens.find(t => t.status === "waiting");
      if (!nextToken) {
        toast.info('No patients waiting');
        return;
      }

      await startConsultation(nextToken.id);
    } catch (error) {
      toast.error('Failed to call next patient');
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Check if user is a doctor
  if (!doctorInfo) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Doctor Access Required</h1>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to registered doctors. Please login with your doctor account to access the OPD management system.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
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
              <Stethoscope className="w-8 h-8 text-primary" />
              Dr. {doctorInfo.name}'s OPD
            </h1>
            <p className="text-muted-foreground">
              {doctorInfo.specialization} • {doctorInfo.department} • Room {doctorInfo.room}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button 
              onClick={() => setShowDoctorPanel(!showDoctorPanel)}
              variant={showDoctorPanel ? "default" : "outline"}
            >
              <Activity className="w-4 h-4 mr-2" />
              Doctor Panel
            </Button>
            <Button onClick={callNextPatient} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Call Next Patient
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Consultation</p>
                  <p className="text-2xl font-bold">{metrics.patientsInConsultation}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold">{metrics.averageWaitTime}m</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{metrics.patientsCompleted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emergency</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.emergencyCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.highPriorityCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

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
            {["all", "Cardiology", "General Medicine", "Pediatrics"].map(dept => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? "default" : "outline"}
                onClick={() => setSelectedDepartment(dept)}
                className="whitespace-nowrap"
              >
                {dept === "all" ? "All Departments" : dept}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Patient */}
        {doctorInfo.currentPatient && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">Current Consultation</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  In Progress
                </Badge>
              </div>
              <div className="text-blue-800">
                <p className="font-medium">{doctorInfo.currentPatient}</p>
                <p className="text-sm">Started: {new Date().toLocaleTimeString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Queue */}
        <div className="space-y-4">
          {filteredTokens.map((token) => (
            <Card key={token.id} className={cn(
              "transition-all duration-200 hover:shadow-md",
              token.priority === "emergency" && "border-red-200 bg-red-50"
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        token.priority === "emergency" ? "bg-red-100 text-red-800" : 
                        token.priority === "urgent" ? "bg-orange-100 text-orange-800" :
                        "bg-primary text-primary-foreground"
                      )}>
                        {token.tokenNumber}
                      </div>
                      <Badge className={getStatusColor(token.status)}>
                        {token.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(token.priority)}>
                        {token.priority}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{token.patientName}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Age: {token.age}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {token.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {token.roomNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Wait: {token.estimatedWaitTime}m
                      </div>
                    </div>

                    {/* Symptoms Preview */}
                    {token.symptoms && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="font-medium text-yellow-800">Symptoms:</p>
                        <p className="text-yellow-700">{token.symptoms.substring(0, 100)}{token.symptoms.length > 100 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>

                  {/* Queue Status */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-primary mb-1">
                        #{token.positionInQueue}
                      </div>
                      <div className="text-sm text-muted-foreground">Position</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      Est. Time: {token.estimatedConsultationTime}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {token.status === "waiting" && (
                        <Button 
                          size="sm" 
                          onClick={() => startConsultation(token.id)}
                          className="bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start Consultation
                        </Button>
                      )}
                      
                      {token.status === "in-consultation" && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => setShowPatientDetails(true)}
                            variant="outline"
                            className="w-full"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => completeConsultation(token.id, 'DISCHARGE')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Discharge
                            </Button>
                            
                            <Button 
                              size="sm" 
                              onClick={() => completeConsultation(token.id, 'ADMISSION_REQUIRED')}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Admit
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => delayPatient(token.id, 5)}
                        className="w-full"
                      >
                        <SkipForward className="w-3 h-3 mr-1" />
                        Delay 5min
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredTokens.length === 0 && (
            <Card>
              <CardContent className="text-center py-20">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Patients in Queue</h3>
                <p className="text-muted-foreground">
                  No patients are currently waiting in the selected department.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Patient Details Modal */}
        <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Patient Details - {selectedToken?.patientName}
              </DialogTitle>
            </DialogHeader>
            
            {selectedToken && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Token Number:</span>
                        <span className="font-semibold">{selectedToken.tokenNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-semibold">{selectedToken.patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-semibold">{selectedToken.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-semibold">{selectedToken.phone}</span>
                      </div>
                      {selectedToken.email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-semibold">{selectedToken.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority:</span>
                        <Badge className={getPriorityColor(selectedToken.priority)}>
                          {selectedToken.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Medical Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedToken.symptoms && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            Current Symptoms
                          </h4>
                          <p className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                            {selectedToken.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {selectedToken.medicalHistory && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Medical History
                          </h4>
                          <p className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            {selectedToken.medicalHistory}
                          </p>
                        </div>
                      )}
                      
                      {selectedToken.allergies && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Allergies
                          </h4>
                          <p className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                            {selectedToken.allergies}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Consultation Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Consultation Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        onClick={() => completeConsultation(selectedToken.id, 'DISCHARGE')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Discharge
                      </Button>
                      
                      <Button 
                        onClick={() => completeConsultation(selectedToken.id, 'ADMISSION_REQUIRED')}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Admit
                      </Button>
                      
                      <Button 
                        onClick={() => completeConsultation(selectedToken.id, 'FOLLOW_UP')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Follow Up
                      </Button>
                      
                      <Button 
                        onClick={() => completeConsultation(selectedToken.id, 'REFERRAL')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Refer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DoctorOPD;
