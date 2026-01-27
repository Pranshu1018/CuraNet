import React, { useState, useMemo, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { PatientRegistrationForm } from "@/components/smart-opd/PatientRegistrationForm";
import { 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw,
  Search,
  Filter,
  Plus,
  User,
  Phone,
  Calendar,
  MapPin,
  AlertTriangle,
  TrendingDown,
  UserCheck,
  Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types & Initial Data ---
type Priority = "low" | "medium" | "high" | "urgent" | "emergency";
type Status = "waiting" | "in-consultation" | "checked-in" | "completed";

interface Patient {
  token: string;
  name: string;
  age: number;
  department: string;
  checkInTime: string;
  waitTime: number;
  priority: Priority;
  status: Status;
  positionInQueue?: number;
  estimatedConsultationTime?: string;
  registrationTime?: string;
}

const initialQueue: Patient[] = [
  {
    token: "OPD-A-042",
    name: "Rajesh Kumar",
    age: 45,
    department: "Cardiology",
    checkInTime: "08:30 AM",
    waitTime: 35,
    priority: "medium",
    status: "waiting"
  },
  {
    token: "OPD-A-043",
    name: "Sunita Devi",
    age: 62,
    department: "Cardiology",
    checkInTime: "08:35 AM",
    waitTime: 0,
    priority: "high",
    status: "in-consultation"
  },
  {
    token: "OPD-B-089",
    name: "Arjun Reddy",
    age: 55,
    department: "General Medicine",
    checkInTime: "08:45 AM",
    waitTime: 5,
    priority: "urgent",
    status: "waiting"
  },
  {
    token: "OPD-C-012",
    name: "Priya Sharma",
    age: 28,
    department: "Pediatrics",
    checkInTime: "09:00 AM",
    waitTime: 15,
    priority: "low",
    status: "waiting"
  },
  {
    token: "OPD-D-023",
    name: "Michael Chen",
    age: 38,
    department: "Neurology",
    checkInTime: "09:15 AM",
    waitTime: 25,
    priority: "medium",
    status: "waiting"
  }
];

const priorityConfig = {
  emergency: { label: "Emergency", color: "bg-critical/10 text-critical border-critical/20" },
  urgent: { label: "Urgent", color: "bg-critical/10 text-critical border-critical/20" },
  high: { label: "High", color: "bg-warning/10 text-warning border-warning/20" },
  medium: { label: "Medium", color: "bg-muted text-muted-foreground border-border" },
  low: { label: "Low", color: "bg-muted text-muted-foreground border-border" },
};

const OPDQueue = () => {
  const [queue, setQueue] = useState<Patient[]>([]);
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadQueueData = async () => {
      try {
        setLoading(true);
        const queueData = await mediSyncServices.opdQueue.getQueue();
        
        if (queueData && Object.keys(queueData).length > 0) {
          // Convert Firebase object to array with proper type casting
          const queueArray = Object.entries(queueData).map(([id, patient]: [string, any]) => ({
            ...patient,
            firebaseId: id,
            priority: patient.priority as Priority,
            status: patient.status as Status
          }));
          setQueue(queueArray);
        } else {
          // Initialize with default data if no data exists
          const defaultQueue: Patient[] = [
            { token: "A-001", name: "Rajesh Kumar", age: 45, department: "Cardiology", checkInTime: "08:30 AM", waitTime: 45, priority: "high" as Priority, status: "waiting" as Status },
            { token: "A-002", name: "Sunita Devi", age: 62, department: "General Medicine", checkInTime: "08:35 AM", waitTime: 40, priority: "high" as Priority, status: "waiting" as Status },
            { token: "A-004", name: "Meera Patel", age: 28, department: "General Medicine", checkInTime: "08:48 AM", waitTime: 27, priority: "normal" as Priority, status: "in-consultation" as Status },
            { token: "A-005", name: "Arjun Reddy", age: 55, department: "Cardiology", checkInTime: "08:55 AM", waitTime: 20, priority: "urgent" as Priority, status: "waiting" as Status },
            { token: "A-008", name: "Anjali Gupta", age: 8, department: "Pediatrics", checkInTime: "09:15 AM", waitTime: 0, priority: "normal" as Priority, status: "checked-in" as Status },
          ];
          
          // Add to Firebase
          for (const patient of defaultQueue) {
            await mediSyncServices.opdQueue.addToQueue(patient);
          }
          
          setQueue(defaultQueue);
        }
      } catch (error) {
        console.error('Error loading queue data:', error);
        toast.error('Failed to load queue data');
      } finally {
        setLoading(false);
      }
    };

    loadQueueData();
    
    // Listen for real-time updates
    const unsubscribe = mediSyncServices.opdQueue.listenToQueue((queueData) => {
      if (queueData && Object.keys(queueData).length > 0) {
        const queueArray = Object.entries(queueData).map(([id, patient]: [string, any]) => ({
          ...patient,
          firebaseId: id,
          priority: patient.priority as Priority,
          status: patient.status as Status
        }));
        setQueue(queueArray);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Handlers ---

  const handleStatusChange = async (token: string, newStatus: Status) => {
  try {
    const patient = queue.find(p => p.token === token);
    if (patient && (patient as any).firebaseId) {
      await mediSyncServices.opdQueue.updateStatus((patient as any).firebaseId, newStatus);
      toast.success(`Patient ${token} status updated to ${newStatus}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    toast.error('Failed to update patient status');
  }
};

  const handleAddPatient = async (patientData: any) => {
    try {
      // Generate unique token number
      const departments = ["Cardiology", "General Medicine", "Pediatrics", "Neurology", "Orthopedics"];
      const deptCode = patientData.department.charAt(0).toUpperCase();
      const tokenNumber = `OPD-${deptCode}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      
      // Calculate initial estimated time
      const waitingTokens = queue.filter(t => 
        t.department === patientData.department && 
        t.status === "waiting" &&
        t.priority !== "emergency"
      );
      
      const avgTime = 10;
      const delayBuffer = 0;
      const estimatedWait = (waitingTokens.length * avgTime) + delayBuffer;
      
      const now = new Date();
      const consultationTime = new Date(now.getTime() + estimatedWait * 60000);
      
      // Create new patient with token
      const newToken: Patient = {
        token: tokenNumber,
        name: patientData.name,
        age: patientData.age,
        department: patientData.department,
        checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        waitTime: estimatedWait,
        priority: patientData.priority as Priority,
        status: "checked-in",
        positionInQueue: waitingTokens.length + 1,
        estimatedConsultationTime: consultationTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        registrationTime: patientData.registrationTime,
      };
      
      // Add to Firebase
      await mediSyncServices.opdQueue.addToQueue(newToken);
      
      toast.success(`Patient ${patientData.name} registered with token ${tokenNumber}. Position: ${newToken.positionInQueue}, Estimated time: ${newToken.estimatedConsultationTime}`);
      console.log('Patient registered successfully:', newToken);
      
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient');
    }
  };

  const openPatientModal = () => {
    console.log('Add Patient button clicked');
    setShowAddPatientModal(true);
  };

  // --- Calculations ---

  const stats = useMemo(() => {
    const active = queue.filter(p => p.status !== "completed");
    return {
      total: active.length,
      priority: active.filter(p => p.priority === "urgent" || p.priority === "high").length,
      seenToday: queue.filter(p => p.status === "completed").length + 89, // Initial mock offset
      avgWait: Math.floor(active.reduce((acc, p) => acc + p.waitTime, 0) / (active.length || 1))
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    return queue
      .filter(p => p.status !== "completed")
      .filter(p => {
        const matchesDept = selectedDept === "All Departments" || p.department === selectedDept;
        const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
                              (p.token?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        return matchesDept && matchesSearch;
      })
      .sort((a, b) => {
        // Priority sorting logic
        const weight = { urgent: 0, high: 1, normal: 2 };
        return weight[a.priority] - weight[b.priority];
      });
  }, [queue, selectedDept, searchQuery]);

  return (
    
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">OPD Queue Management</h1>
            <p className="text-muted-foreground font-medium">Real-time patient flow and prioritization</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button variant="outline" size="sm" onClick={() => setQueue(initialQueue)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset View
            </Button>
            <Button variant="hero" size="sm" onClick={openPatientModal}>
              <Plus className="w-4 h-4 mr-2" /> Add Patient
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
              <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">In Queue</div></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center"><Clock className="w-6 h-6 text-warning" /></div>
              <div><div className="text-2xl font-bold">{stats.avgWait} min</div><div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Wait</div></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-critical/10 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-critical" /></div>
              <div><div className="text-2xl font-bold">{stats.priority}</div><div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority Cases</div></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-success" /></div>
              <div><div className="text-2xl font-bold">{stats.seenToday}</div><div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seen Today</div></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <h3 className="font-bold text-sm uppercase text-muted-foreground mb-4 px-2">Departments</h3>
              {["All Departments", "General Medicine", "Cardiology", "Orthopedics", "Neurology", "Pediatrics"].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all",
                    selectedDept === dept ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "hover:bg-muted text-foreground"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div className="lg:col-span-3">
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or token..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredQueue.map((patient, index) => (
                <div key={`${patient.token}-${index}`} className={cn(
                  "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                  patient.status === "in-consultation" ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10" : "border-border"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-lg">
                        {patient.token}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{patient.name}</span>
                          <span className="text-sm text-muted-foreground">({patient.age}y)</span>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> {patient.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-bold text-primary ml-1">#{patient.positionInQueue || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Time:</span>
                          <span className="font-bold text-blue-600 ml-1">{patient.estimatedConsultationTime || 'Calculating...'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Wait:</span>
                          <span className={cn("font-bold ml-1", patient.waitTime > 30 ? "text-critical" : "text-success")}>
                            {patient.waitTime}m
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {patient.status === "in-consultation" ? (
                          <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={() => handleStatusChange(patient.token, "completed")}>
                            <UserCheck className="w-4 h-4 mr-2" /> Complete
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(patient.token, "in-consultation")}>
                            Call Next
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredQueue.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                  <p className="text-muted-foreground font-medium">No active patients found in this department.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Patient Registration Form */}
        <PatientRegistrationForm
          isOpen={showAddPatientModal}
          onClose={() => {
            console.log('Patient Registration Form closing');
            setShowAddPatientModal(false);
          }}
          onSubmit={handleAddPatient}
        />
      </div>
    
  );
};

export default OPDQueue;