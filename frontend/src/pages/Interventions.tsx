import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Lightbulb, Play, CheckCircle, Clock, 
  TrendingUp, Activity, Bed, Package, Users,
  AlertTriangle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";

interface HospitalData {
  timestamp: string;
  hospital: string;
  avg_wait_time: number;
  bed_occupancy: number;
  inventory_days: number;
  patients_waiting: number;
}

/* ---------------- INTERVENTION ENGINE ---------------- */
const INTERVENTION_LOGIC = {
  "Extreme OPD Wait": {
    title: "Divert Arrivals to Secondary Clinics",
    description: "Current OPD queue exceeds extreme limits. Divert non-emergency cases to stabilize wait times.",
    impact: "high",
    type: "Queue Management",
    icon: Users
  },
  "High OPD Load": {
    title: "Deploy Additional Triage Nurses",
    description: "High patient load detected. Adding 2 nurses will reduce triage bottleneck by ~15 mins.",
    impact: "medium",
    type: "Staffing",
    icon: Activity
  },
  "Zero Bed Capacity": {
    title: "Initiate Emergency Discharge Protocol",
    description: "Critical capacity reached. Expedite medically stable discharges immediately.",
    impact: "critical",
    type: "Bed Management",
    icon: Bed
  },
  "Bed Stress": {
    title: "Verify Pending Discharge Orders",
    description: "Occupancy above 80%. Ensure all discharge orders are being processed efficiently.",
    impact: "medium",
    type: "Bed Management",
    icon: Bed
  },
  "Stockout Imminent": {
    title: "Authorize Emergency Procurement",
    description: "Inventory levels below 3 days. Execute immediate restock for critical supplies.",
    impact: "critical",
    type: "Supply Chain",
    icon: Package
  }
};

/* ---------------- MINI HOSPITAL CARD ---------------- */
const HospitalNodeCard = ({ 
  data, 
  isActive, 
  onClick, 
  alerts 
}: { 
  data: HospitalData; 
  isActive: boolean; 
  onClick: () => void; 
  alerts: string[] 
}) => {
  const isCritical = alerts.some(a => a.includes("Extreme") || a.includes("Zero") || a.includes("Stockout"));
  
  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label={`Select ${data.hospital}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex-shrink-0 w-64 p-5 rounded-3xl cursor-pointer transition-all duration-300 border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive 
          ? "border-primary bg-card shadow-xl scale-105 z-10" 
          : "border-border bg-muted/50 hover:bg-muted hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-sm tracking-tight uppercase truncate w-40">{data.hospital}</h3>
        {alerts.length > 0 && (
          <span className={cn(
            "w-2.5 h-2.5 rounded-full",
            isCritical ? "bg-destructive animate-pulse" : "bg-warning"
          )} />
        )}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Wait Time</p>
          <p className="text-lg font-black">{Math.round(data.avg_wait_time)}m</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Occupancy</p>
          <p className="text-lg font-black">{Math.round(data.bed_occupancy)}%</p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN DASHBOARD ---------------- */
const Dashboard = () => {
  const [data, setData] = useState<HospitalData[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [currentTimeIdx, setCurrentTimeIdx] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [completedActions, setCompletedActions] = useState(new Set());
  const interventionsRef = useRef<HTMLDivElement | null>(null);

  const handleSelectHospital = useCallback((hospitalName: string) => {
    setSelectedHospital(hospitalName);
    requestAnimationFrame(() => {
      interventionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Data Loading & Simulation Loop
  useEffect(() => {
    fetch('hospital_system_dataset.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results: { data: HospitalData[] }) => {
            const clean = results.data.filter((r: HospitalData) => r.timestamp && r.hospital);
            setData(clean);
            const ts = [...new Set(clean.map(r => r.timestamp))].sort();
            setTimestamps(ts);
            if (clean.length > 0) setSelectedHospital(clean[0].hospital);
          }
        });
      });
  }, []);

  useEffect(() => {
    if (timestamps.length === 0) return;
    const timer = setInterval(() => {
      setCurrentTimeIdx(prev => (prev + 1) % timestamps.length);
    }, 4000); // 4-second "Real-time" tick
    return () => clearInterval(timer);
  }, [timestamps]);

  const currentTime = timestamps[currentTimeIdx];
  const hospitalsNow = useMemo(() => data.filter(d => d.timestamp === currentTime), [data, currentTime]);
  const activeData = useMemo(() => 
    hospitalsNow.find(h => h.hospital === selectedHospital) || hospitalsNow[0] || undefined, 
  [hospitalsNow, selectedHospital]);

  // Alert generation logic from index1.html
  const getAlertsForHosp = (h: HospitalData | undefined) => {
    const alerts = [];
    if (!h) return alerts;
    if (h.avg_wait_time > 60) alerts.push("Extreme OPD Wait");
    else if (h.avg_wait_time > 45) alerts.push("High OPD Load");
    if (h.bed_occupancy > 90) alerts.push("Zero Bed Capacity");
    else if (h.bed_occupancy > 80) alerts.push("Bed Stress");
    if (h.inventory_days < 3) alerts.push("Stockout Imminent");
    return alerts;
  };

  const currentAlerts = getAlertsForHosp(activeData);

  if (!activeData) {
    return (
      <PageLayout 
        title="Hospital Core 4.0"
        description="Real-time micro interventions and hospital network management"
        compact
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hospital network data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Hospital Core 4.0"
      description="Real-time micro interventions and hospital network management"
      compact
    >
      {/* Live Status Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-widest">
          Live Network Status
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted text-muted-foreground text-[10px] font-mono rounded">
          <Clock className="w-3 h-3" /> {currentTime}
        </div>
      </div>

      {/* Network Topology */}
      <PageSection title="Network Topology">
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 no-scrollbar scroll-smooth">
          {hospitalsNow.map((h, i) => (
            <HospitalNodeCard 
              key={i} 
              data={h} 
              isActive={selectedHospital === h.hospital}
              onClick={() => handleSelectHospital(h.hospital)}
              alerts={getAlertsForHosp(h)}
            />
          ))}
        </div>
      </PageSection>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: DETAILED STATS */}
        <div className="lg:col-span-7 space-y-6">
          <PageCard>
            <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tight">{activeData?.hospital}</h2>
            <div className="grid grid-cols-2 gap-6">
              <StatCard
                title="Avg Wait Time"
                value={`${Math.round(activeData?.avg_wait_time || 0)}m`}
                icon={Clock}
                variant={activeData?.avg_wait_time > 45 ? "critical" : "primary"}
              />
              <StatCard
                title="Bed Occupancy"
                value={`${Math.round(activeData?.bed_occupancy || 0)}%`}
                icon={Bed}
                variant={activeData?.bed_occupancy > 85 ? "warning" : "success"}
              />
              <StatCard
                title="Inventory Level"
                value={`${activeData?.inventory_days?.toFixed(1) || 0}d`}
                icon={Package}
                variant={activeData?.inventory_days < 3 ? "critical" : "accent"}
              />
              <StatCard
                title="Incoming Pax"
                value={activeData?.patients_waiting || 0}
                icon={Users}
                variant="primary"
              />
            </div>
          </PageCard>

          {/* Stress Matrix */}
          <PageCard className="bg-slate-900 text-white border-slate-800">
            <h3 className="text-sm font-black mb-6 italic uppercase tracking-widest flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Stress Detection Matrix
            </h3>
            <div className="flex flex-wrap gap-3">
              {currentAlerts.length > 0 ? currentAlerts.map((a, i) => (
                <div key={i} className="px-4 py-2 bg-card/10 border border-border rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span className="text-[11px] font-black uppercase tracking-wider">{a}</span>
                </div>
              )) : (
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">All Statuses Nominal</p>
              )}
            </div>
          </PageCard>
        </div>

        {/* RIGHT: INTERVENTIONS */}
        <div className="lg:col-span-5 lg:sticky lg:top-8" ref={interventionsRef}>
          <PageCard className="bg-primary text-white border-primary">
            <h3 className="text-xs font-black text-primary-foreground/60 uppercase tracking-[0.3em] mb-8 italic">Intervention Protocol</h3>
            <div className="space-y-4">
              {currentAlerts.length > 0 ? currentAlerts.map((alertKey, i) => {
                const action = INTERVENTION_LOGIC[alertKey];
                const isDone = activeData ? completedActions.has(`${activeData.hospital}-${action.title}`) : false;
                const Icon = action.icon;

                return (
                  <div key={i} className={cn(
                    "p-5 rounded-3xl transition-all border",
                    isDone ? "bg-card/5 border-border opacity-60" : "bg-card/10 border-border"
                  )}>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-card text-primary flex items-center justify-center shrink-0">
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1 leading-tight">{action.title}</h4>
                        <p className="text-[11px] text-primary-foreground/70 leading-relaxed mb-4">{action.description}</p>
                        {!isDone && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider"
                            onClick={() => activeData && setCompletedActions(prev => new Set(prev).add(`${activeData.hospital}-${action.title}`))}
                          >
                            Execute Protocol
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center opacity-40">
                  <div className="w-12 h-12 bg-card/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="uppercase tracking-[0.2em] text-[10px] font-black">No Actions Required</p>
                </div>
              )}
            </div>
          </PageCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;