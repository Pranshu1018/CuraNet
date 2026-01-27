import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { 
  Bed, 
  Grid3X3, 
  PieChart,
  Building2,
  UserPlus,
  AlertTriangle,
  X,
  CheckCircle2,
  Wrench,
  ChevronDown,
  Activity,
  Clock,
  Zap,
  Bell,
  TrendingUp,
  Users,
  Filter,
  MapPin,
  Phone,
  Calendar,
  Heart,
  Thermometer,
  Shield,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Search,
  Maximize2,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Types & Initial Data ---
type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

interface BedData {
  id: string;
  status: BedStatus;
  lastUpdated: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientCondition?: string;
  admissionTime?: string;
  expectedDischarge?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  nurseAssigned?: string;
  doctorAssigned?: string;
  equipment?: string[];
  notes?: string;
  maintenanceReason?: string;
  reservedFor?: string;
  reservedUntil?: string;
  vitalSigns?: {
    heartRate?: number;
    temperature?: number;
    bloodPressure?: string;
    oxygenLevel?: number;
  };
  alerts?: string[];
}

interface DeptData {
  id: string;
  name: string;
  floor: string;
  totalBeds: number;
  beds: BedData[];
  headNurse?: string;
  contactNumber?: string;
  averageWaitTime?: number;
  occupancyTrend?: 'increasing' | 'decreasing' | 'stable';
  criticalPatients?: number;
}

const initialDepartments: DeptData[] = [
  { id: "emergency", name: "Emergency", floor: "Ground Floor", totalBeds: 10, beds: [] },
  { id: "icu", name: "ICU", floor: "1st Floor", totalBeds: 8, beds: [] },
  { id: "general", name: "General Ward", floor: "2nd Floor", totalBeds: 20, beds: [] },
];

const hydratedDepts = initialDepartments.map(dept => ({
  ...dept,
  headNurse: dept.id === 'icu' ? 'Sarah Johnson' : dept.id === 'emergency' ? 'Mike Chen' : 'Lisa Davis',
  contactNumber: 'Ext. ' + (dept.id === 'icu' ? '1001' : dept.id === 'emergency' ? '1002' : '1003'),
  averageWaitTime: Math.floor(Math.random() * 30) + 10,
  occupancyTrend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as 'increasing' | 'decreasing' | 'stable',
  criticalPatients: Math.floor(Math.random() * 5),
  beds: Array.from({ length: dept.totalBeds }, (_, i) => {
    const status = Math.random() > 0.5 ? "occupied" : "available";
    const isOccupied = status === "occupied";
    return {
      id: `${dept.id.toUpperCase().substring(0, 1)}-${String(i + 1).padStart(2, '0')}`,
      status,
      lastUpdated: "Today, 10:00 AM",
      ...(isOccupied && {
        patientId: `PAT-${Math.floor(Math.random() * 10000)}`,
        patientName: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Williams'][Math.floor(Math.random() * 4)],
        patientAge: Math.floor(Math.random() * 60) + 20,
        patientCondition: ['Stable', 'Critical', 'Recovering', 'Under Observation'][Math.floor(Math.random() * 4)],
        admissionTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
        expectedDischarge: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
        nurseAssigned: ['Nurse A', 'Nurse B', 'Nurse C'][Math.floor(Math.random() * 3)],
        doctorAssigned: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'][Math.floor(Math.random() * 3)],
        equipment: ['IV Drip', 'Heart Monitor', 'Oxygen Tank'].slice(0, Math.floor(Math.random() * 3) + 1),
        vitalSigns: {
          heartRate: Math.floor(Math.random() * 40) + 60,
          temperature: Math.floor(Math.random() * 3) + 36,
          bloodPressure: `${Math.floor(Math.random() * 40) + 100}/${Math.floor(Math.random() * 20) + 60}`,
          oxygenLevel: Math.floor(Math.random() * 10) + 90
        },
        alerts: Math.random() > 0.7 ? ['Medication Due', 'Vital Signs Check'] : []
      })
    };
  })
}));

const statusColors = {
  available: "bg-success border-success/20 text-white",
  occupied: "bg-critical border-critical/20 text-white",
  reserved: "bg-warning border-warning/20 text-white",
  maintenance: "bg-muted-foreground/30 border-muted-foreground/20 text-white",
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200 animate-pulse",
};

// Enhanced Bed Card Component with Vital Signs
const BedCard = ({ bed, deptId, onUpdateStatus, onViewDetails }: {
  bed: BedData;
  deptId: string;
  onUpdateStatus: (deptId: string, bedId: string, newStatus: BedStatus) => void;
  onViewDetails: (bed: BedData) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getPriorityColor = (priority?: string) => {
    if (!priority) return '';
    return priorityColors[priority as keyof typeof priorityColors] || '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "group relative h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 shadow-sm overflow-hidden",
            bed.status === "available" ? "border-success/20 bg-success/5 text-success hover:bg-success/10 hover:scale-105" :
            bed.status === "occupied" ? "border-critical/20 bg-critical/5 text-critical hover:bg-critical/10 hover:scale-105" :
            bed.status === "maintenance" ? "border-muted-foreground/20 bg-muted/10 text-muted-foreground" : 
            "border-warning/20 bg-warning/5 text-warning hover:bg-warning/10 hover:scale-105",
            isHovered && "ring-2 ring-primary/50"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => bed.status === "occupied" && onViewDetails(bed)}
        >
          {/* Priority Indicator */}
          {bed.priority && bed.priority !== 'low' && (
            <div className={cn("absolute top-1 right-1 w-2 h-2 rounded-full", getPriorityColor(bed.priority))} />
          )}
          
          {/* Bed ID */}
          <div className="absolute top-1 left-2 text-[9px] font-mono font-bold opacity-60">
            {bed.id}
          </div>
          
          {/* Alert Indicator */}
          {bed.alerts && bed.alerts.length > 0 && (
            <div className="absolute top-3 right-2">
              <Bell className="w-3 h-3 text-red-500 animate-pulse" />
            </div>
          )}
          
          <Bed className={cn(
            "w-6 h-6 transition-transform group-hover:scale-110",
            bed.status === "available" ? "opacity-30" : "opacity-100"
          )} />
          
          <span className="text-[8px] font-bold uppercase tracking-tighter">
            {bed.status}
          </span>
          
          {/* Patient Info for Occupied Beds */}
          {bed.status === "occupied" && isHovered && (
            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[7px] p-1">
              <div className="truncate">{bed.patientName}</div>
              {bed.vitalSigns && (
                <div className="flex gap-2 justify-center">
                  <Heart className="w-2 h-2" />
                  <span>{bed.vitalSigns.heartRate}</span>
                </div>
              )}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Bed Actions: {bed.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {bed.status === "available" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(deptId, bed.id, "occupied")} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" /> Admit Patient
          </DropdownMenuItem>
        )}
        {bed.status === "occupied" && (
          <>
            <DropdownMenuItem onClick={() => onViewDetails(bed)} className="cursor-pointer">
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(deptId, bed.id, "maintenance")} className="cursor-pointer text-critical">
              <X className="w-4 h-4 mr-2" /> Discharge & Clean
            </DropdownMenuItem>
          </>
        )}
        {bed.status === "maintenance" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(deptId, bed.id, "available")} className="cursor-pointer text-success">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Ready
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onUpdateStatus(deptId, bed.id, "reserved")} className="cursor-pointer">
          <AlertTriangle className="w-4 h-4 mr-2" /> Reserve Bed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Helper Component for Circular Visualization ---
const OccupancyCircle = ({ percent, colorClass }: { percent: number; colorClass: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          className="text-muted stroke-current"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          className={cn("stroke-current transition-all duration-1000 ease-out", colorClass)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold">{percent}%</span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Filled</span>
      </div>
    </div>
  );
};

const BedStatusDashboard = () => {
  const [departments, setDepartments] = useState<DeptData[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "viz" | "analytics">("grid");
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<BedStatus | "all">("all");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const animationFrameRef = useRef<number>();

  // Load data from Firebase on mount
  useEffect(() => {
    const loadBedData = async () => {
      try {
        setLoading(true);
        const bedData = await mediSyncServices.beds.getAll();
        
        if (bedData && Object.keys(bedData).length > 0) {
          // Convert Firebase data to department structure
          const bedsArray = Object.entries(bedData).map(([id, bed]: [string, any]) => ({
            id,
            ...bed
          }));
          
          // Organize beds by departments
          const emergencyBeds = bedsArray.filter(b => b.id.startsWith('E-'));
          const icuBeds = bedsArray.filter(b => b.id.startsWith('I-'));
          const generalBeds = bedsArray.filter(b => b.id.startsWith('G-'));
          
          const deptData: DeptData[] = [
            { 
              id: "emergency", 
              name: "Emergency", 
              floor: "Ground Floor", 
              totalBeds: 10, 
              beds: emergencyBeds.length > 0 ? emergencyBeds : Array.from({ length: 10 }, (_, i) => ({
                id: `E-${String(i + 1).padStart(2, '0')}`,
                status: (Math.random() > 0.5 ? "occupied" : "available") as BedStatus,
                lastUpdated: "Today, 10:00 AM"
              }))
            },
            { 
              id: "icu", 
              name: "ICU", 
              floor: "1st Floor", 
              totalBeds: 8, 
              beds: icuBeds.length > 0 ? icuBeds : Array.from({ length: 8 }, (_, i) => ({
                id: `I-${String(i + 1).padStart(2, '0')}`,
                status: (Math.random() > 0.3 ? "occupied" : "available") as BedStatus,
                lastUpdated: "Today, 10:00 AM"
              }))
            },
            { 
              id: "general", 
              name: "General Ward", 
              floor: "2nd Floor", 
              totalBeds: 20, 
              beds: generalBeds.length > 0 ? generalBeds : Array.from({ length: 20 }, (_, i) => ({
                id: `G-${String(i + 1).padStart(2, '0')}`,
                status: (Math.random() > 0.6 ? "occupied" : "available") as BedStatus,
                lastUpdated: "Today, 10:00 AM"
              }))
            }
          ];
          
          setDepartments(deptData);
        } else {
          // Initialize with default data
          const defaultDepts = [
            { id: "emergency", name: "Emergency", floor: "Ground Floor", totalBeds: 10, beds: [] },
            { id: "icu", name: "ICU", floor: "1st Floor", totalBeds: 8, beds: [] },
            { id: "general", name: "General Ward", floor: "2nd Floor", totalBeds: 20, beds: [] },
          ];
          
          const hydratedDepts = defaultDepts.map(dept => ({
            ...dept,
            beds: Array.from({ length: dept.totalBeds }, (_, i) => {
              const status = (Math.random() > 0.5 ? "occupied" : "available") as BedStatus;
              const isOccupied = status === "occupied";
              return {
                id: `${dept.id.toUpperCase().substring(0, 1)}-${String(i + 1).padStart(2, '0')}`,
                status,
                lastUpdated: "Today, 10:00 AM",
                patientId: isOccupied ? `PAT-${Math.floor(Math.random() * 10000)}` : null,
                patientName: isOccupied ? ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Williams'][Math.floor(Math.random() * 4)] : null,
                patientAge: isOccupied ? Math.floor(Math.random() * 60) + 20 : null,
                patientCondition: isOccupied ? ['Stable', 'Critical', 'Recovering', 'Under Observation'][Math.floor(Math.random() * 4)] : null,
                admissionTime: isOccupied ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString() : null,
                expectedDischarge: isOccupied ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null,
                priority: isOccupied ? ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical' : null,
                nurseAssigned: isOccupied ? ['Nurse A', 'Nurse B', 'Nurse C'][Math.floor(Math.random() * 3)] : null,
                doctorAssigned: isOccupied ? ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'][Math.floor(Math.random() * 3)] : null,
                equipment: isOccupied ? ['IV Drip', 'Heart Monitor', 'Oxygen Tank'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
                vitalSigns: isOccupied ? {
                  heartRate: Math.floor(Math.random() * 40) + 60,
                  temperature: Math.floor(Math.random() * 3) + 36,
                  bloodPressure: `${Math.floor(Math.random() * 40) + 100}/${Math.floor(Math.random() * 20) + 60}`,
                  oxygenLevel: Math.floor(Math.random() * 10) + 90
                } : null,
                alerts: isOccupied && Math.random() > 0.7 ? ['Medication Due', 'Vital Signs Check'] : []
              };
            })
          }));
          
          // Add to Firebase
          for (const dept of hydratedDepts) {
            for (const bed of dept.beds) {
              await mediSyncServices.beds.updateStatus(bed.id, bed.status);
            }
          }
          
          setDepartments(hydratedDepts);
        }
      } catch (error) {
        console.error('Error loading bed data:', error);
        toast.error('Failed to load bed data');
      } finally {
        setLoading(false);
      }
    };

    loadBedData();
    
    // Listen for real-time updates
    const unsubscribe = mediSyncServices.beds.listen((bedData) => {
      if (bedData && Object.keys(bedData).length > 0) {
        const bedsArray = Object.entries(bedData).map(([id, bed]: [string, any]) => ({
          id,
          ...bed
        }));
        
        // Reorganize into departments
        const emergencyBeds = bedsArray.filter(b => b.id.startsWith('E-'));
        const icuBeds = bedsArray.filter(b => b.id.startsWith('I-'));
        const generalBeds = bedsArray.filter(b => b.id.startsWith('G-'));
        
        const deptData: DeptData[] = [
          { 
            id: "emergency", 
            name: "Emergency", 
            floor: "Ground Floor", 
            totalBeds: 10, 
            beds: emergencyBeds.length > 0 ? emergencyBeds : Array.from({ length: 10 }, (_, i) => ({
              id: `E-${String(i + 1).padStart(2, '0')}`,
              status: "available" as BedStatus,
              lastUpdated: "Today, 10:00 AM"
            }))
          },
          { 
            id: "icu", 
            name: "ICU", 
            floor: "1st Floor", 
            totalBeds: 8, 
            beds: icuBeds.length > 0 ? icuBeds : Array.from({ length: 8 }, (_, i) => ({
              id: `I-${String(i + 1).padStart(2, '0')}`,
              status: "available" as BedStatus,
              lastUpdated: "Today, 10:00 AM"
            }))
          },
          { 
            id: "general", 
            name: "General Ward", 
            floor: "2nd Floor", 
            totalBeds: 20, 
            beds: generalBeds.length > 0 ? generalBeds : Array.from({ length: 20 }, (_, i) => ({
              id: `G-${String(i + 1).padStart(2, '0')}`,
              status: "available" as BedStatus,
              lastUpdated: "Today, 10:00 AM"
            }))
          }
        ];
        
        setDepartments(deptData);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Handlers ---
  const updateBedStatus = async (deptId: string, bedId: string, newStatus: BedStatus) => {
    try {
      await mediSyncServices.beds.updateStatus(bedId, newStatus);
      toast.success(`Bed ${bedId} status updated to ${newStatus}`);
      
      // Play sound effect if enabled
      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error('Error updating bed status:', error);
      toast.error('Failed to update bed status');
    }
  };

  const handleNewAdmission = async (deptId: string) => {
    try {
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return;
      
      const availableBed = dept.beds.find(b => b.status === "available");
      if (!availableBed) {
        toast.error('No available beds in this department');
        return;
      }
      
      await mediSyncServices.beds.updateStatus(availableBed.id, "occupied");
      toast.success(`Patient admitted to bed ${availableBed.id}`);
    } catch (error) {
      console.error('Error admitting patient:', error);
      toast.error('Failed to admit patient');
    }
  };

  const handleViewDetails = (bed: BedData) => {
    setSelectedBed(bed);
  };

  const exportBedData = () => {
    const csv = [
      ['Bed ID', 'Status', 'Patient Name', 'Department', 'Priority', 'Admission Time', 'Expected Discharge'],
      ...departments.flatMap(dept => 
        dept.beds.map(bed => [
          bed.id,
          bed.status,
          bed.patientName || '',
          dept.name,
          bed.priority || '',
          bed.admissionTime || '',
          bed.expectedDischarge || ''
        ])
      )
    ].map(row => row.join(','));

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bed-status-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter beds based on search and status
  const filteredDepartments = useMemo(() => {
    return departments.map(dept => ({
      ...dept,
      beds: dept.beds.filter(bed => {
        const matchesSearch = searchTerm === '' || 
          bed.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bed.patientName && bed.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === "all" || bed.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
    }));
  }, [departments, searchTerm, filterStatus]);

  // --- Calculations ---
  const stats = useMemo(() => {
    let total = 0;
    let occupied = 0;
    let available = 0;
    departments.forEach(d => {
      total += d.totalBeds;
      occupied += d.beds.filter(b => b.status === "occupied").length;
      available += d.beds.filter(b => b.status === "available").length;
    });
    return { total, occupied, available };
  }, [departments]);

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Ward Command Center
            </h1>
            <p className="text-muted-foreground">Real-time facility management and patient occupancy</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search beds or patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1 border border-border">
              <button 
                onClick={() => setViewMode("grid")} 
                className={cn("p-2 rounded-md transition-all", viewMode === "grid" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:bg-card/50")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("viz")} 
                className={cn("p-2 rounded-md transition-all", viewMode === "viz" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:bg-card/50")}
              >
                <PieChart className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("analytics")} 
                className={cn("p-2 rounded-md transition-all", viewMode === "analytics" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:bg-card/50")}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
            
            {/* Action Buttons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="hero" size="sm" className="shadow-lg shadow-primary/20">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Admit Patient
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Ward</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {departments.map(d => (
                  <DropdownMenuItem key={d.id} onClick={() => handleNewAdmission(d.id)} className="cursor-pointer">
                    {d.name} ({d.beds.filter(b => b.status === "available").length} Free)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Emergency Mode Toggle */}
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={cn("flex items-center gap-2", emergencyMode && "animate-pulse")}
            >
              <Zap className="w-4 h-4" />
              Emergency
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as BedStatus | "all")}
                    className="px-3 py-1 border border-border rounded-lg bg-card text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
                    Auto Refresh
                  </Button>
                  
                  <Button
                    variant={soundEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportBedData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Alert */}
        {emergencyMode && (
          <Alert className="mb-6 border-red-200 bg-red-50 animate-pulse">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Emergency Mode Active:</strong> Prioritizing critical patients and optimizing bed allocation for emergency admissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Global Stats with Enhanced Design */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Capacity" value={stats.total} icon={Bed} variant="default" />
          <StatCard title="Active Patients" value={stats.occupied} subtitle={`${Math.round((stats.occupied / stats.total) * 100)}% capacity`} icon={Users} variant="critical" />
          <StatCard title="Available Beds" value={stats.available} icon={CheckCircle2} variant="success" />
          <StatCard title="In Maintenance" value={stats.total - stats.occupied - stats.available} icon={Wrench} variant="warning" />
          <StatCard title="Critical Cases" value={departments.reduce((sum, d) => sum + (d.criticalPatients || 0), 0)} icon={AlertTriangle} variant="critical" />
        </div>

        {/* Ward Sections */}
        <div className={cn(
          "grid gap-6",
          viewMode === "viz" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : 
          viewMode === "analytics" ? "grid-cols-1" : "grid-cols-1"
        )}>
          {filteredDepartments.map((dept) => {
            const occupiedCount = dept.beds.filter(b => b.status === "occupied").length;
            const availableCount = dept.beds.filter(b => b.status === "available").length;
            const occupancyRate = Math.round((occupiedCount / dept.totalBeds) * 100);

            if (viewMode === "analytics") {
              // Analytics View
              return (
                <Card key={dept.id} className="overflow-hidden">
                  <CardHeader className={cn(
                    "bg-gradient-to-r",
                    occupancyRate > 85 ? "from-red-500 to-red-600" :
                    occupancyRate > 60 ? "from-yellow-500 to-orange-500" :
                    "from-green-500 to-green-600"
                  )}>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {dept.name} Analytics
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {occupancyRate}% Occupancy
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{dept.totalBeds}</div>
                        <div className="text-sm text-muted-foreground">Total Beds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{occupiedCount}</div>
                        <div className="text-sm text-muted-foreground">Occupied</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                        <div className="text-sm text-muted-foreground">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{dept.criticalPatients || 0}</div>
                        <div className="text-sm text-muted-foreground">Critical</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Occupancy Rate</span>
                          <span className="font-semibold">{occupancyRate}%</span>
                        </div>
                        <Progress value={occupancyRate} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Head Nurse: {dept.headNurse}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{dept.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Avg Wait: {dept.averageWaitTime}min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span>Trend: {dept.occupancyTrend}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return viewMode === "viz" ? (
              /* --- Circular Visualization Mode --- */
              <div key={dept.id} className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", occupancyRate > 85 ? "bg-critical animate-pulse" : "bg-success")} />
                  {dept.name} Ward
                </h3>
                
                <OccupancyCircle 
                  percent={occupancyRate} 
                  colorClass={occupancyRate > 85 ? "text-critical" : occupancyRate > 60 ? "text-warning" : "text-success"} 
                />

                <div className="mt-8 w-full space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Occupied</span>
                    <span className="text-sm font-bold text-critical">{occupiedCount} Beds</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Available</span>
                    <span className="text-sm font-bold text-success">{availableCount} Beds</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-muted-foreground">
                    <span className="text-[10px] font-medium uppercase tracking-wider italic">{dept.floor}</span>
                    <span className="text-[10px] font-bold uppercase">{dept.totalBeds} Total</span>
                  </div>
                </div>
              </div>
            ) : (
              /* --- Enhanced Detailed Bed Grid Mode --- */
              <div key={dept.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold", occupancyRate > 85 ? "bg-critical/10 text-critical" : "bg-primary/10 text-primary")}>
                      {dept.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{dept.name} Ward</h3>
                      <p className="text-xs text-muted-foreground">{dept.floor} • {dept.totalBeds} Total Beds</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Occupancy</p>
                      <p className={cn("font-bold", occupancyRate > 85 ? "text-critical" : "text-foreground")}>{occupancyRate}%</p>
                    </div>
                    <StatusBadge status={occupancyRate > 85 ? "critical" : "normal"} size="sm" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
                    {dept.beds.map((bed) => (
                      <BedCard 
                        key={bed.id} 
                        bed={bed} 
                        deptId={dept.id} 
                        onUpdateStatus={updateBedStatus}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bed Details Dialog */}
        <Dialog open={!!selectedBed} onOpenChange={() => setSelectedBed(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Bed Details: {selectedBed?.id}
              </DialogTitle>
            </DialogHeader>
            
            {selectedBed && (
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge 
                      variant={selectedBed.status === 'occupied' ? 'destructive' : 
                              selectedBed.status === 'available' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {selectedBed.status}
                    </Badge>
                  </div>
                  {selectedBed.priority && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <Badge className={cn("mt-1", priorityColors[selectedBed.priority])}>
                        {selectedBed.priority}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Patient Information */}
                {selectedBed.patientName && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{selectedBed.patientName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <span className="ml-2 font-medium">{selectedBed.patientAge}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Condition:</span>
                        <span className="ml-2 font-medium">{selectedBed.patientCondition}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Patient ID:</span>
                        <span className="ml-2 font-medium">{selectedBed.patientId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Admission:</span>
                        <span className="ml-2 font-medium">{selectedBed.admissionTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected Discharge:</span>
                        <span className="ml-2 font-medium">{selectedBed.expectedDischarge}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Vital Signs */}
                {selectedBed.vitalSigns && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs font-medium">Heart Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-red-700">{selectedBed.vitalSigns.heartRate}</div>
                        <div className="text-xs text-red-500">bpm</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <Thermometer className="w-4 h-4" />
                          <span className="text-xs font-medium">Temperature</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">{selectedBed.vitalSigns.temperature}</div>
                        <div className="text-xs text-blue-500">°C</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-medium">Blood Pressure</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700">{selectedBed.vitalSigns.bloodPressure}</div>
                        <div className="text-xs text-green-500">mmHg</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-medium">Oxygen Level</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-700">{selectedBed.vitalSigns.oxygenLevel}</div>
                        <div className="text-xs text-purple-500">%</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Staff Assignment */}
                {(selectedBed.nurseAssigned || selectedBed.doctorAssigned) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Staff Assignment</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedBed.nurseAssigned && (
                        <div>
                          <span className="text-muted-foreground">Nurse:</span>
                          <span className="ml-2 font-medium">{selectedBed.nurseAssigned}</span>
                        </div>
                      )}
                      {selectedBed.doctorAssigned && (
                        <div>
                          <span className="text-muted-foreground">Doctor:</span>
                          <span className="ml-2 font-medium">{selectedBed.doctorAssigned}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Alerts */}
                {selectedBed.alerts && selectedBed.alerts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-red-500" />
                      Active Alerts
                    </h4>
                    <div className="space-y-2">
                      {selectedBed.alerts.map((alert, index) => (
                        <Alert key={index} className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">{alert}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default BedStatusDashboard;