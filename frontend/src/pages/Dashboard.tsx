import { useCallback, useRef, useState, useEffect } from "react";
import { mediSyncServices } from "@/lib/firebase-services";
import { 
  Activity, 
  Building2, 
  Bed, 
  Ambulance, 
  Droplets, 
  Clock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Phone,
  Users,
  Heart,
  Shield,
  Zap,
  RefreshCw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CityOperationsMap } from "@/components/city/CityOperationsMap";
import { typographyClasses, colorClasses } from "@/lib/typography";
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";

interface Hospital {
  id: string;
  name: string;
  status: "normal" | "high" | "critical";
  intensity?: number;
  beds: {
    total: number;
    available: number;
    icu: number;
    ventilators: number;
  };
  emergency: boolean;
  location: { x: number; y: number };
}

interface Ambulance {
  id: string;
  status: "active" | "dispatched" | "available";
  location: { x: number; y: number };
  destination?: { x: number; y: number };
  eta?: number;
}

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const handleHospitalSelect = useCallback((hospital: any) => {
    setSelectedHospital(hospital);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Fetch hospital data from Firebase with Real-time listener
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const data = await mediSyncServices.dashboard.getStats();
        if (data && data.hospitals) {
          setHospitals(Array.isArray(data.hospitals) ? data.hospitals : []);
        } else {
          const defaultHospitals = [
            { id: '1', name: 'City General Hospital', lat: 19.0760, lng: 72.8777, intensity: 0.3 },
            { id: '2', name: 'St. Mary Medical Center', lat: 19.0870, lng: 72.8887, intensity: 0.7 },
            { id: '3', name: 'Memorial Regional Hospital', lat: 19.0660, lng: 72.8667, intensity: 0.9 },
            { id: '4', name: 'Riverside Medical Center', lat: 19.0970, lng: 72.8997, intensity: 0.4 },
            { id: '5', name: 'Emergency Care Hospital', lat: 19.0560, lng: 72.8557, intensity: 0.6 },
            { id: '6', name: 'Community Health Center', lat: 19.1170, lng: 72.9107, intensity: 0.2 }
          ];
          setHospitals(defaultHospitals);
          await mediSyncServices.dashboard.updateStats({
            hospitals: defaultHospitals,
            lastUpdated: Date.now()
          });
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    initializeDashboard();
    
    const unsubscribe = mediSyncServices.dashboard.listenToStats((data) => {
      if (data && data.hospitals) {
        setHospitals(Array.isArray(data.hospitals) ? data.hospitals : []);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.loading('Refreshing dashboard data...');
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard updated');
    }, 1500);
  };

  const getStatusColor = (intensity: number) => {
    if (intensity > 0.8) return "text-red-500";
    if (intensity > 0.6) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusBg = (intensity: number) => {
    if (intensity > 0.8) return "bg-red-50 border-red-100";
    if (intensity > 0.6) return "bg-yellow-50 border-yellow-100";
    return "bg-green-50 border-green-100";
  };

  const metrics = [
    {
      title: "Active Hospitals",
      value: hospitals.length,
      icon: Building2,
      color: "from-blue-500 to-blue-600",
      glow: "shadow-blue-500/10"
    },
    {
      title: "Available Beds",
      value: hospitals.reduce((sum, h) => sum + Math.floor((1 - (h.intensity || 0.5)) * 200 + 50), 0),
      icon: Bed,
      color: "from-green-500 to-green-600",
      glow: "shadow-green-500/10"
    },
    {
      title: "Critical Load",
      value: hospitals.filter(h => (h.intensity || 0.5) > 0.8).length,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      glow: "shadow-red-500/10"
    },
    {
      title: "Average Load",
      value: `${Math.round(hospitals.reduce((sum, h) => sum + (h.intensity || 0.5), 0) / (hospitals.length || 1) * 100)}%`,
      icon: Activity,
      color: "from-orange-500 to-orange-600",
      glow: "shadow-orange-500/10"
    },
  ];

  return (
    <PageLayout 
      title="CuraNet Healthcare Dashboard"
      description="Real-time hospital operations and city-wide healthcare coordination"
      compact
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-2 rounded-xl border border-border shadow-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold">{currentTime.toLocaleTimeString()}</span>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-sm">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:border-teal-300 ${metric.glow}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-md`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className={`text-3xl font-bold ${colorClasses.card.text} mb-1`}>{metric.value.toLocaleString()}</div>
              <div className={`font-sans text-[16px] md:text-[18px] font-[600] leading-[1.2] text-muted-foreground`}>{metric.title}</div>
            </div>
          ))}
        </div>

        {/* Main Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Hospital List Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-full">
              <h3 className={`${typographyClasses.cardHeader} flex items-center gap-2 mb-4`}>
                <Building2 className="w-5 h-5 text-teal-500" /> Hospital Status
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                {hospitals.map((hospital, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${hospital.name || `Facility ${index + 1}`}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleHospitalSelect({
                          ...hospital,
                          status: (hospital as any).intensity > 0.8 ? "critical" : (hospital as any).intensity > 0.6 ? "high" : "normal",
                          beds: { total: 200, available: Math.floor((1 - (hospital as any).intensity) * 200), icu: 20, ventilators: 10 },
                        });
                      }
                    }}
                    onClick={() =>
                      handleHospitalSelect({
                        ...hospital,
                        status: (hospital as any).intensity > 0.8 ? "critical" : (hospital as any).intensity > 0.6 ? "high" : "normal",
                        beds: { total: 200, available: Math.floor((1 - (hospital as any).intensity) * 200), icu: 20, ventilators: 10 },
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      selectedHospital?.id === hospital.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-sans text-[14px] font-[600] leading-[1.4] text-slate-800">{hospital.name || `Facility ${index + 1}`}</div>
                      <div className={`w-2 h-2 rounded-full ${(hospital as any).intensity > 0.8 ? 'bg-red-500' : 'bg-green-500'}`} />
                    </div>
                    <div className={`font-sans text-xs font-[600] leading-[1.4] px-2 py-0.5 rounded-full inline-block font-bold bg-teal-500/10 border-teal-400/30`}>{Math.round((hospital as any).intensity * 100)}% Load</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map View Central Section */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm h-[600px] relative overflow-hidden">
                <CityOperationsMap 
                  hospitals={hospitals}
                  onHospitalSelect={handleHospitalSelect}
                />
            </div>
          </div>

          {/* Facility Details Sidebar */}
          <div className="lg:col-span-3" ref={detailsRef}>
            {selectedHospital ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-4">
                <h3 className="font-sans text-[24px] font-[600] leading-[1.3] tracking-[-0.01em] text-slate-900 mb-6">{selectedHospital.name}</h3>
                
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl border ${getStatusBg(selectedHospital.intensity || 0.5)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-bold text-slate-700 uppercase">Emergency Status</span>
                    </div>
                    <div className={`text-sm font-bold ${getStatusColor(selectedHospital.intensity || 0.5)}`}>
                      {(selectedHospital.status || "NORMAL").toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Bed className="w-4 h-4" /> Resource Allocation
                    </div>
                    <div className="space-y-3">
                        {['Total Beds', 'ICU Units', 'Ventilators'].map((label, idx) => (
                            <div key={label}>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase">
                                    <span>{label}</span>
                                    <span>{idx === 0 ? '78%' : idx === 1 ? '45%' : '12%'}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: idx === 0 ? '78%' : idx === 1 ? '45%' : '12%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                      <Phone className="w-4 h-4 mr-2" /> Contact Facility
                    </Button>
                    <Button variant="outline" className="w-full border-slate-200 text-slate-600">
                      <Eye className="w-4 h-4 mr-2" /> View Full Report
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Select a hospital on the map or list to monitor live performance telemetry.</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            {[
                { title: "System Capacity", icon: TrendingUp, val: "78%", color: "teal" },
                { title: "Network Demand", icon: Zap, val: "+12%", color: "orange" },
                { title: "Active Emergencies", icon: Heart, val: "4 Units", color: "red" }
            ].map((item) => (
                <div key={item.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                            <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{item.title}</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">{item.val}</span>
                </div>
            ))}
        </div>
    </PageLayout>
  );
};

export default Dashboard;