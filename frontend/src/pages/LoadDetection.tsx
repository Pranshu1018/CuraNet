import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  TrendingUp,
  Clock,
  Activity,
  BarChart3,
  Hospital
} from "lucide-react";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";

interface HospitalData {
  timestamp: string;
  hospital: string;
  avg_wait_time: number;
  bed_occupancy: number;
  [key: string]: any; // Allow additional properties
}

// Fallback data for when CSV is not available
const fallbackData: HospitalData[] = [
  { timestamp: "2024-01-20 09:00", hospital: "Mumbai Central", avg_wait_time: 45, bed_occupancy: 78 },
  { timestamp: "2024-01-20 09:00", hospital: "Lokmanya Tilak", avg_wait_time: 52, bed_occupancy: 92 },
  { timestamp: "2024-01-20 09:00", hospital: "KEM Hospital", avg_wait_time: 38, bed_occupancy: 71 },
  { timestamp: "2024-01-20 09:00", hospital: "Nair Hospital", avg_wait_time: 61, bed_occupancy: 88 },
  { timestamp: "2024-01-20 09:00", hospital: "Sion Hospital", avg_wait_time: 42, bed_occupancy: 76 },
  { timestamp: "2024-01-20 10:00", hospital: "Mumbai Central", avg_wait_time: 48, bed_occupancy: 81 },
  { timestamp: "2024-01-20 10:00", hospital: "Lokmanya Tilak", avg_wait_time: 58, bed_occupancy: 94 },
  { timestamp: "2024-01-20 10:00", hospital: "KEM Hospital", avg_wait_time: 41, bed_occupancy: 74 },
  { timestamp: "2024-01-20 10:00", hospital: "Nair Hospital", avg_wait_time: 67, bed_occupancy: 91 },
  { timestamp: "2024-01-20 10:00", hospital: "Sion Hospital", avg_wait_time: 46, bed_occupancy: 79 },
];

const LoadDetection = () => {
  const [data, setData] = useState<HospitalData[]>(fallbackData);
  const [timestamps, setTimestamps] = useState<string[]>([...new Set(fallbackData.map(r => r.timestamp))].sort());
  const [currentTimeIdx, setCurrentTimeIdx] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState("Mumbai Central");

  // 1. Load Real-time Dataset with fallback
  useEffect(() => {
    fetch('hospital_system_dataset.csv')
      .then(res => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const clean = (results.data as HospitalData[]).filter(r => r.timestamp && r.hospital);
            if (clean.length > 0) {
              setData(clean);
              const ts = [...new Set(clean.map(r => r.timestamp))].sort();
              setTimestamps(ts);
              setSelectedHospital(clean[0].hospital);
            }
          }
        });
      })
      .catch(() => {
        // Use fallback data if CSV fails to load
        console.log('Using fallback data for Load Detection');
      });
  }, []);

  // 2. Simulation Loop (Updates every 4 seconds)
  useEffect(() => {
    if (timestamps.length === 0) return;
    const timer = setInterval(() => {
      setCurrentTimeIdx(prev => (prev + 1) % timestamps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [timestamps]);

  const currentTime = timestamps[currentTimeIdx];
  const hospitalsNow = useMemo(() => 
    data.filter(d => d.timestamp === currentTime), 
  [data, currentTime]);

  const activeData = useMemo(() => 
    hospitalsNow.find(h => h.hospital === selectedHospital) || hospitalsNow[0], 
  [hospitalsNow, selectedHospital]);

  // Status Color Logic
  const getStatus = (val, type) => {
    if (type === 'OPD') {
      if (val > 60) return "Critical";
      if (val > 40) return "High";
      return "Normal";
    }
    if (val > 90) return "Critical";
    if (val > 80) return "High";
    return "Normal";
  };

  // Prediction mapping
  const predictions = useMemo(() => {
    if (!activeData) return [];
    return [
      { time: "Current Status", opdLoad: getStatus(activeData.avg_wait_time, 'OPD'), bedPressure: getStatus(activeData.bed_occupancy, 'Bed'), confidence: 99 },
      { time: "Next 2 Hours", opdLoad: activeData.avg_wait_time > 50 ? "Critical" : "High", bedPressure: "High", confidence: 88 },
      { time: "Next 4 Hours", opdLoad: "Moderate", bedPressure: "High", confidence: 76 },
      { time: "Next 8 Hours", opdLoad: "Normal", bedPressure: "Moderate", confidence: 62 },
    ];
  }, [activeData]);

  if (!activeData) {
  return (
    <PageLayout 
      title="Early Load Detection"
      description="Real-time predictive analysis for hospital capacity management"
    >
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hospital data...</p>
        </div>
      </div>
    </PageLayout>
  );
}

  return (
    <PageLayout 
      title="Early Load Detection"
      description="Real-time predictive analysis for hospital capacity management"
    >
      {/* Simulation Status */}
      <div className="flex items-center gap-2 mb-6 text-muted-foreground font-medium">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        Simulation Active: <span className="font-mono text-foreground font-bold">{currentTime}</span>
      </div>

      {/* Hospital Selection */}
      <div className="flex flex-wrap gap-2 mb-8">
        {hospitalsNow.map((h, i) => (
          <button 
            key={i}
            onClick={() => setSelectedHospital(h.hospital)}
            className={cn(
              "px-4 py-2 rounded-xl text-[11px] font-black uppercase border transition-all duration-200",
              selectedHospital === h.hospital 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-card border-border text-muted-foreground hover:border-primary"
            )}
          >
            {h.hospital}
          </button>
        ))}
      </div>

        {/* Global Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="OPD Wait Time" 
          value={`${Math.round(activeData.avg_wait_time)}m`} 
          icon={Clock} 
          variant={activeData.avg_wait_time > 50 ? "critical" : "primary"} 
        />
        <StatCard 
          title="Bed Occupancy" 
          value={`${Math.round(activeData.bed_occupancy)}%`} 
          icon={Activity} 
          variant={activeData.bed_occupancy > 85 ? "warning" : "success"} 
        />
        <StatCard 
          title="AI Confidence" 
          value="94%" 
          icon={BarChart3} 
          variant="primary" 
        />
        <StatCard 
          title="Update Cycle" 
          value="Real-time" 
          icon={TrendingUp} 
          variant="default" 
        />
      </div>

      {/* Operational Forecast */}
      <PageCard title="Operational Forecast" description={`Predictive analysis for ${activeData.hospital}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="px-4 py-2 bg-muted rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            4h Refresh Rate
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {predictions.map((pred, index) => (
            <div 
              key={index} 
              className={cn(
                "p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col justify-between min-h-[320px]",
                index === 0 
                  ? "border-primary bg-primary/5 shadow-xl scale-[1.02] z-10" 
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase mb-6 tracking-[0.2em]">{pred.time}</div>
                
                <div className="space-y-8">
                  <div>
                    <div className="text-[11px] text-muted-foreground font-bold uppercase mb-2">OPD Load Level</div>
                    <div className={cn(
                      "text-3xl font-black italic tracking-tighter uppercase",
                      pred.opdLoad === "Critical" ? "text-destructive" : pred.opdLoad === "High" ? "text-warning" : "text-success"
                    )}>
                      {pred.opdLoad}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground font-bold uppercase mb-2">Bed Capacity Pressure</div>
                    <div className={cn(
                      "text-3xl font-black italic tracking-tighter uppercase",
                      pred.bedPressure === "High" || pred.bedPressure === "Critical" ? "text-destructive" : "text-warning"
                    )}>
                      {pred.bedPressure}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/60 mt-8">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-muted-foreground font-black uppercase">Model Confidence</div>
                  <div className="font-black text-primary text-lg">{pred.confidence}%</div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  );
};

export default LoadDetection;