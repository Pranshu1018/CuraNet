import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Bed,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  FileText,
  X,
  Zap,
  AlertCircle
} from "lucide-react";

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

// Mock services for demonstration
const mockMediSyncServices = {
  admissions: {
    getAll: async () => null,
    create: async (data) => ({ id: data.id, ...data }),
    update: async (id, data) => ({ id, ...data }),
    listen: (callback) => {
      // Mock listener - in real app would be Firebase listener
      return () => {};
    }
  },
  beds: {
    updateStatus: async (id, status) => ({ id, status })
  },
  smartOPD: {
    updateToken: async (id, data) => ({ id, ...data })
  },
  patients: {
    create: async (data) => ({ id: Math.random().toString(), ...data })
  }
};

// Types
interface Patient {
  id: string;
  name: string;
  age: number;
  department: string;
  priority: "urgent" | "high" | "normal";
  waitTime: string;
}

interface BedSuggestion {
  id: string;
  hospitalName: string;
  department: string;
  floor: string;
  bedType: string;
  availableBeds: number;
  totalBeds: number;
  occupancyRate: number;
  score: number;
  features?: string[];
}

const Button = ({ children, onClick, variant = "default", size = "default", className = "", disabled = false }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border-2 border-gray-300 bg-white hover:bg-gray-50 focus:ring-gray-500",
    hero: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-base"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const StatusBadge = ({ status, label, size = "default" }) => {
  const colors = {
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    success: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300"
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    default: "px-3 py-1 text-sm"
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors[status]} ${sizes[size]}`}>
      {label}
    </span>
  );
};

const PageLayout = ({ title, description, children }) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      {children}
    </div>
  </div>
);

const PageCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const Admission = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [assignedBed, setAssignedBed] = useState<string | null>(null);
  const [checkingBeds, setCheckingBeds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const [bedSuggestions, setBedSuggestions] = useState<BedSuggestion[]>([]);

  const admissionSteps = [
    { id: 1, title: "Registration", icon: User },
    { id: 2, title: "Assessment", icon: ShieldCheck },
    { id: 3, title: "Bed Assignment", icon: Bed },
    { id: 4, title: "Documentation", icon: FileText },
    { id: 5, title: "Confirmation", icon: CheckCircle2 },
  ];

  const calculateBedMatch = (hospital: any, department: string, bedType: string) => {
    let score = 50;
    const availabilityScore = Math.min((hospital.availableBeds / hospital.totalBeds) * 30, 30);
    score += availabilityScore;
    const occupancyScore = (1 - hospital.occupancyRate / 100) * 20;
    score += occupancyScore;
    
    if (hospital.department === department) {
      score += 15;
    } else if (hospital.department?.includes(department) || department?.includes(hospital.department)) {
      score += 10;
    }
    
    if (bedType === 'icu' && hospital.hasICU) {
      score += 10;
    } else if (bedType === 'emergency' && hospital.hasEmergency) {
      score += 10;
    }
    
    return Math.min(Math.round(score), 100);
  };

  const getFallbackBedData = (): BedSuggestion[] => {
    return [
      {
        id: "BED-001",
        hospitalName: "Mumbai Central Hospital",
        department: "General Medicine",
        floor: "Floor 3",
        bedType: "general",
        availableBeds: 12,
        totalBeds: 50,
        occupancyRate: 76,
        score: 85,
        features: ["General Ward", "24/7 Nursing", "Near Emergency"]
      },
      {
        id: "BED-002",
        hospitalName: "Lokmanya Tilak Hospital",
        department: "Cardiology",
        floor: "Floor 2",
        bedType: "general",
        availableBeds: 8,
        totalBeds: 40,
        occupancyRate: 80,
        score: 78,
        features: ["Cardiac ICU", "Specialized Equipment", "Senior Cardiologists"]
      },
      {
        id: "BED-003",
        hospitalName: "KEM Hospital",
        department: "Emergency",
        floor: "Ground Floor",
        bedType: "emergency",
        availableBeds: 5,
        totalBeds: 20,
        occupancyRate: 75,
        score: 92,
        features: ["Emergency Bay", "Trauma Center", "24/7 ER Staff"]
      }
    ];
  };

  const checkBedAvailability = async (department: string, bedType: 'general' | 'icu' | 'emergency' = 'general') => {
    try {
      setCheckingBeds(true);
      
      // Use fallback data for demo
      const fallbackBeds = getFallbackBedData()
        .filter(hospital => {
          if (bedType === 'icu' && !hospital.features?.includes('ICU')) return false;
          if (bedType === 'emergency' && !hospital.features?.includes('Emergency')) return false;
          
          const deptMatch = hospital.department === department || 
                           hospital.department?.includes(department) || 
                           department?.includes(hospital.department);
          
          return deptMatch && hospital.availableBeds > 0;
        })
        .map(hospital => ({
          ...hospital,
          score: calculateBedMatch(hospital, department, bedType)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      setBedSuggestions(fallbackBeds);
      return fallbackBeds;
    } catch (error) {
      console.error('Error checking bed availability:', error);
      setBedSuggestions([]);
      return [];
    } finally {
      setCheckingBeds(false);
    }
  };

  useEffect(() => {
    const loadAdmissionData = async () => {
      try {
        setLoading(true);
        
        const defaultPatients: Patient[] = [
          { id: "ADM-001", name: "Suresh Verma", age: 56, department: "Cardiology", priority: "high", waitTime: "45 min" },
          { id: "ADM-002", name: "Lakshmi Devi", age: 72, department: "General Medicine", priority: "urgent", waitTime: "20 min" },
          { id: "ADM-003", name: "Kiran Kumar", age: 34, department: "Orthopedics", priority: "normal", waitTime: "1h 30min" },
        ];
        
        setPendingPatients(defaultPatients);
      } catch (error) {
        console.error('Error loading admission data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdmissionData();
  }, []);

  const handleProcessPatient = async (patient: Patient) => {
    try {
      setActivePatient(patient);
      setAssignedBed(null);
      setCurrentStep(3);
      await checkBedAvailability(patient.department);
    } catch (error) {
      console.error('Error processing patient:', error);
    }
  };

  const handleDirectAdmission = async () => {
    try {
      const directPatient: Patient = {
        id: `DIR-${Math.floor(100 + Math.random() * 900)}`,
        name: "Emergency Entry",
        age: 0,
        department: "Emergency",
        priority: "urgent",
        waitTime: "0 min"
      };
      
      setActivePatient(directPatient);
      setAssignedBed(null);
      setCurrentStep(3);
      await checkBedAvailability("Emergency", "emergency");
    } catch (error) {
      console.error('Error creating direct admission:', error);
    }
  };

  const handleAssignBed = async (bed: BedSuggestion) => {
    try {
      setAssignedBed(bed.id);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error assigning bed:', error);
    }
  };

  const handleCompleteDocumentation = async () => {
    try {
      if (!activePatient || !assignedBed) {
        alert('Please complete all required steps first');
        return;
      }
      setCurrentStep(5);
    } catch (error) {
      console.error('Error completing documentation:', error);
    }
  };

  const handleFinalizeAdmission = async () => {
    try {
      if (!activePatient || !assignedBed) {
        alert('Admission not complete');
        return;
      }

      setTimeout(() => {
        resetWorkflow();
      }, 2000);
    } catch (error) {
      console.error('Error finalizing admission:', error);
    }
  };

  const resetWorkflow = () => {
    setActivePatient(null);
    setAssignedBed(null);
    setCurrentStep(1);
    setBedSuggestions([]);
  };

  if (loading) {
    return (
      <PageLayout 
        title="Admission Operations"
        description="Manage hospital intake and real-time bed allocation"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admission system...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Admission Operations"
      description="Manage hospital intake and real-time bed allocation"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetWorkflow}>
            <X className="w-4 h-4 mr-2" /> Cancel Workflow
          </Button>
          <Button variant="hero" size="sm" onClick={handleDirectAdmission}>
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            Direct Admission
          </Button>
        </div>
      </div>

      {/* Progress Tracker */}
      <PageCard className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {admissionSteps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                    isCompleted ? "bg-green-600 border-green-600 text-white" :
                    isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg" :
                    "bg-gray-100 border-transparent text-gray-400"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-bold mt-2 uppercase ${isCurrent ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </span>
                </div>
                {index < admissionSteps.length - 1 && (
                  <div className={`w-12 lg:w-24 h-0.5 mx-4 ${isCompleted ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </PageCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side: Pending Queue */}
        <PageCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Admission Queue</h2>
            <StatusBadge status="warning" label={`${pendingPatients.length} Active`} size="sm" />
          </div>
          <div className="space-y-3">
            {pendingPatients.map((patient) => (
              <div 
                key={patient.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activePatient?.id === patient.id 
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-200" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => handleProcessPatient(patient)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{patient.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    patient.priority === "urgent" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {patient.priority}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{patient.department} • {patient.id}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {patient.waitTime}</span>
                </div>
              </div>
            ))}
          </div>
        </PageCard>

        {/* Right Side: Step Actions */}
        <PageCard>
          <h2 className="text-lg font-semibold mb-6">
            {currentStep === 3 ? "Select Bed Allocation" : "Workflow Action"}
          </h2>

          {activePatient ? (
            <div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Processing Patient</p>
                  <p className="text-sm font-bold">{activePatient.name} ({activePatient.department})</p>
                </div>
              </div>

              {currentStep === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Available Beds</h3>
                    {checkingBeds && <span className="text-xs text-gray-500">Checking availability...</span>}
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bedSuggestions.length > 0 ? (
                      bedSuggestions.map((bed) => (
                        <div 
                          key={bed.id}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            assignedBed === bed.id 
                              ? "border-blue-600 bg-blue-50" 
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                          onClick={() => handleAssignBed(bed)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-sm">{bed.hospitalName}</p>
                              <p className="text-xs text-gray-600">{bed.department} • {bed.floor}</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                              {bed.availableBeds} beds
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {bed.features?.slice(0, 2).map((feature, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Occupancy: {bed.occupancyRate}%</span>
                            <span>Match: {bed.score}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No available beds found</p>
                      </div>
                    )}
                  </div>
                  {assignedBed && (
                    <Button 
                      variant="default" 
                      className="w-full mt-4"
                      onClick={() => setCurrentStep(4)}
                    >
                      Continue to Documentation <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="font-semibold mb-4">Complete Documentation</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                      <label className="text-sm">Medical records reviewed</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                      <label className="text-sm">Insurance confirmed</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                      <label className="text-sm">Bed assignment confirmed</label>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleCompleteDocumentation}
                  >
                    Complete Documentation <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : currentStep === 5 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Admission Complete!</h2>
              <div className="max-w-md mx-auto space-y-2 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-800">
                    Patient: {activePatient?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    ID: {activePatient?.id} • Department: {activePatient?.department}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800">
                    Assigned: {bedSuggestions.find(b => b.id === assignedBed)?.hospitalName || 'Hospital'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Bed: {assignedBed} • {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={resetWorkflow}>
                  Start New Admission
                </Button>
                <Button variant="success" onClick={handleFinalizeAdmission}>
                  Finalize Admission
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Select a patient from the queue to begin admission process</p>
            </div>
          )}
        </PageCard>
      </div>
    </PageLayout>
  );
};

export default Admission;