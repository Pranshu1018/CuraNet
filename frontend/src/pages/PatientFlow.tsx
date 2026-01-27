import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, AlertCircle, Clock, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

// LEAFLET IMPORTS
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to set initial view
const MapInitializer = () => {
  const map = useMap();
  map.setView([19.0760, 72.8777], 11);
  return null;
};

/**
 * SNAP-TO-POINT COORDINATES
 * East District coordinates modified to "bend" and snap to Central District.
 */
const MUMBAI_BOUNDS = {
  "North District": [
    [19.295, 72.850], [19.295, 72.960], [19.240, 72.980], 
    [19.180, 72.960], 
    [19.180, 72.820], 
    [19.220, 72.800], [19.280, 72.820]
  ],
  "Central District": [
    [19.180, 72.820], 
    [19.180, 72.960], // TOP SHARED WITH EAST
    [19.120, 72.940], // MIDDLE SHARED WITH EAST
    [19.060, 72.930], // BOTTOM SHARED WITH EAST
    [19.060, 72.820], 
    [19.180, 72.820]
  ],
  "West District": [
    [19.180, 72.820], 
    [19.060, 72.820], 
    [19.030, 72.810], 
    [19.080, 72.770], [19.140, 72.760], [19.180, 72.770],
    [19.180, 72.820]
  ],
  "East District": [
    // FORCING BEND: Snapping exactly to Central's right-side coordinates
    [19.180, 72.960], // Snapped to Central Top-Right
    [19.180, 72.990], 
    [19.100, 73.020], 
    [19.040, 72.980], 
    [18.980, 72.950], 
    [19.060, 72.930], // Snapped to Central Bottom-Right
    [19.120, 72.940], // Snapped to Central Mid-Right
    [19.180, 72.960]
  ],
  "South District": [
    [19.060, 72.820], 
    [19.060, 72.930], 
    [18.980, 72.950], 
    [18.900, 72.860], [18.880, 72.820], [18.920, 72.770], 
    [18.980, 72.780], [19.030, 72.810],
    [19.060, 72.820]
  ],
};

interface PatientFlowRecord {
  timestamp?: string;
  origin_district: string;
  patient_count: number;
  priority_level: string;
}

interface ProcessedDistrict {
  id: string;
  from: string;
  patients: number;
  criticalCount: number;
  bounds: [number, number][];
}

const PatientFlow = () => {
  const [rawData, setRawData] = useState<PatientFlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("10");

  useEffect(() => {
    fetch("/patient_flow_history.json")
      .then((res) => res.json())
      .then((data) => {
        setRawData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const processedData = useMemo(() => {
    if (!rawData.length) return [];
    const summary: Record<string, ProcessedDistrict> = {};
    rawData.forEach((record) => {
      const recordHour = record.timestamp?.split('T')[1]?.split(':')[0];
      if (recordHour !== timeFilter) return;
      const key = record.origin_district;
      if (!MUMBAI_BOUNDS[key as keyof typeof MUMBAI_BOUNDS]) return;
      if (!summary[key]) {
        summary[key] = { id: key, from: key, patients: 0, criticalCount: 0, bounds: MUMBAI_BOUNDS[key] };
      }
      summary[key].patients += record.patient_count;
      if (record.priority_level === "Critical") summary[key].criticalCount++;
    });
    return Object.values(summary);
  }, [rawData, timeFilter]);

  const getHeatColor = (patients: number, critical: number) => {
    if (critical > 11 && patients > 470) return "#ef4444"; 
    if (critical > 6 && patients > 350) return "#fbbf24";  
    return "#22c55e"; 
  };

  const totalPatients = processedData.reduce((acc, f) => acc + f.patients, 0);
  const totalCritical = processedData.reduce((acc, f) => acc + f.criticalCount, 0);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Hourly Volume" value={totalPatients.toLocaleString()} icon={Users} variant="primary" />
          <StatCard title="Critical Alert" value={totalCritical.toLocaleString()} icon={AlertCircle} variant="critical" />
          <StatCard title="Live Status" value="Active" icon={Activity} variant="success" />
          <StatCard title="Selected Time" value={`${timeFilter}:00`} icon={Clock} variant="warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-white rounded-[1.5rem] border relative min-h-[550px] shadow-sm overflow-hidden z-0">
            <MapContainer 
              className="h-full w-full grayscale-[0.2] brightness-[0.95]"
              style={{ height: "550px" }}
            >
              <MapInitializer />
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />
              {processedData.map((district: ProcessedDistrict) => {
                const zoneColor = getHeatColor(district.patients, district.criticalCount);
                return (
                  <Polygon
                    key={district.id}
                    positions={district.bounds}
                    pathOptions={{
                      fillColor: zoneColor,
                      fillOpacity: hoveredZone === district.id ? 0.8 : 0.6,
                      color: zoneColor, // SEALS GAP: Border matches fill
                      weight: 3,        // SEALS GAP: Thicker border covers anti-aliasing slivers
                      opacity: 1,
                      lineJoin: "round",
                      smoothFactor: 0   // SEALS GAP: Prevents line simplification
                    }}
                    eventHandlers={{
                      mouseover: () => setHoveredZone(district.id),
                      mouseout: () => setHoveredZone(null),
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-bold text-slate-800">
                        <p className="border-b mb-1 pb-1">{district.from}</p>
                        <p>Total: {district.patients.toLocaleString()}</p>
                        <p className="text-red-500 font-bold">Critical: {district.criticalCount}</p>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-xl border shadow-lg">
              <select className="text-xs font-bold outline-none cursor-pointer" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                {Array.from({length: 24}).map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}:00 hrs</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-[1.5rem] border p-5 h-[240px] shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Load Profile</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={processedData}>
                  <XAxis dataKey="id" hide />
                  <Bar dataKey="patients" radius={[6, 6, 6, 6]}>
                    {processedData.map((e, i) => (
                      <Cell key={i} fill={getHeatColor(e.patients, e.criticalCount)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-[1.5rem] border p-3 h-[294px] overflow-y-auto shadow-sm custom-scrollbar">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Regional Logs</h3>
              {processedData.sort((a,b) => b.patients - a.patients).map((flow) => (
                <div 
                  key={flow.id} 
                  className={cn(
                    "flex justify-between items-center px-3 py-2.5 mb-1.5 rounded-xl border transition-all", 
                    hoveredZone === flow.id ? "bg-slate-50 border-slate-300" : "bg-white border-transparent"
                  )}
                >
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: getHeatColor(flow.patients, flow.criticalCount)}} />
                     <span className="text-xs font-bold text-slate-700">{flow.from}</span>
                   </div>
                   <div className="text-right">
                     <div className="text-xs font-black text-slate-900">{flow.patients.toLocaleString()}</div>
                     <div className="text-[9px] text-red-500 font-bold uppercase">{flow.criticalCount} Critical</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default PatientFlow;
