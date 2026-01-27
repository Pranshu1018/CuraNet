import React, { useState, useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Shield, Activity, TrendingUp, Map as MapIcon, Globe, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// LEAFLET IMPORTS
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Component to set map view
const MapView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// 1. STATIC DATASET: 5 Zones with ~50 Sub-Areas
const MUMBAI_STATIC_DATA: Record<string, { areas: Record<string, number>, avg: number }> = {
  "South District": {
    avg: 84,
    areas: { "Colaba": 88, "Fort": 82, "Marine Lines": 85, "Malabar Hill": 91, "Byculla": 78, "Mazgaon": 76, "Tardeo": 84, "Parel": 80, "Worli": 87 }
  },
  "Central District": {
    avg: 76,
    areas: { "Dadar": 82, "Matunga": 79, "Wadala": 72, "Sion": 70, "Mahim": 75, "Dharavi": 68, "Prabhadevi": 83, "Lower Parel": 81 }
  },
  "West District": {
    avg: 81,
    areas: { "Bandra West": 89, "Bandra East": 77, "Khar": 84, "Santacruz": 80, "Vile Parle": 82, "Andheri West": 85, "Andheri East": 74, "Versova": 81, "Juhu": 88, "Oshiwara": 79 }
  },
  "East District": {
    avg: 72,
    areas: { "Kurla": 65, "Powai": 86, "Chembur": 78, "Mankhurd": 62, "Govandi": 60, "Trombay": 64, "Ghatkopar": 74, "Vikhroli": 71, "Bhandup": 69, "Mulund": 81 }
  },
  "North District": {
    avg: 78,
    areas: { "Goregaon": 80, "Malad": 77, "Kandivali": 79, "Borivali": 83, "Dahisar": 75, "Charkop": 74, "Magathane": 72, "Gorai": 82 }
  }
};

// 2. COORDINATES FOR THE 5 ZONES
const DISTRICT_BOUNDS = {
  "North District": [[19.295, 72.850], [19.295, 72.960], [19.240, 72.980], [19.180, 72.960], [19.180, 72.820], [19.220, 72.800], [19.280, 72.820]],
  "Central District": [[19.180, 72.820], [19.180, 72.960], [19.120, 72.940], [19.060, 72.930], [19.060, 72.820], [19.180, 72.820]],
  "West District": [[19.180, 72.820], [19.060, 72.820], [19.030, 72.810], [19.080, 72.770], [19.140, 72.760], [19.180, 72.770], [19.180, 72.820]],
  "East District": [[19.180, 72.960], [19.180, 72.990], [19.100, 73.020], [19.040, 72.980], [18.980, 72.950], [19.060, 72.930], [19.120, 72.940], [19.180, 72.960]],
  "South District": [[19.060, 72.820], [19.060, 72.930], [18.980, 72.950], [18.900, 72.860], [18.880, 72.820], [18.920, 72.770], [18.980, 72.780], [19.030, 72.810], [19.060, 72.820]],
};

const StaticResilience = () => {
  const [selectedArea, setSelectedArea] = useState("Colaba");
  
  // Find which zone the selected area belongs to
  const currentZone = Object.keys(MUMBAI_STATIC_DATA).find(zone => 
    Object.keys(MUMBAI_STATIC_DATA[zone].areas).includes(selectedArea)
  ) || "South District";

  const areaScore = MUMBAI_STATIC_DATA[currentZone].areas[selectedArea];
  const zoneAverage = MUMBAI_STATIC_DATA[currentZone].avg;

  // Calculate City-wide Average
  const cityAverage = useMemo(() => {
    const zones = Object.values(MUMBAI_STATIC_DATA);
    return Math.round(zones.reduce((acc, z) => acc + z.avg, 0) / zones.length);
  }, []);

  const getStatusColor = (score: number) => {
    if (score > 85) return "text-emerald-500";
    if (score > 75) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-black tracking-tighter uppercase italic">
            City <span className="text-primary">Resilience</span> Index
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Static Comprehensive Analysis of Mumbai Metropolitan</p>
        </div>

        {/* Top Tier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Mumbai City Average" value={`${cityAverage}/100`} icon={Globe} variant="primary" />
          <StatCard title={`${currentZone} Avg`} value={`${zoneAverage}/100`} icon={Activity} variant="success" />
          <StatCard title={`${selectedArea} Index`} value={`${areaScore}/100`} icon={MapIcon} variant={areaScore < 70 ? "critical" : "primary"} />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Area Navigation */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2rem] border p-6 shadow-sm h-[600px] flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Info className="w-4 h-4" /> Regional Breakdown
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(MUMBAI_STATIC_DATA).map(([zone, data]) => (
                  <div key={zone} className="mb-6">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-bold text-primary uppercase">{zone}</span>
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500">AVG: {data.avg}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.keys(data.areas).map(area => (
                        <button
                          key={area}
                          onClick={() => setSelectedArea(area)}
                          className={cn(
                            "text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                            selectedArea === area 
                              ? "bg-primary text-white border-primary shadow-lg" 
                              : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content: Map & Details */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 h-[600px]">
              
              {/* Map Visualization */}
              <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm relative z-0">
                <MapContainer 
                  className="h-full w-full grayscale-[0.2]"
                >
                  <MapView center={[19.0760, 72.8777]} zoom={10.5} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {Object.entries(DISTRICT_BOUNDS).map(([name, coords]) => {
                    const isSelectedZone = name === currentZone;
                    return (
                      <Polygon
                        key={name}
                        positions={coords as any}
                        pathOptions={{
                          fillColor: isSelectedZone ? "#3b82f6" : "#94a3b8",
                          fillOpacity: isSelectedZone ? 0.6 : 0.2,
                          color: isSelectedZone ? "#2563eb" : "#64748b",
                          weight: isSelectedZone ? 3 : 1
                        }}
                      />
                    );
                  })}
                </MapContainer>
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border shadow-xl">
                  <span className="text-[10px] font-black uppercase text-slate-500">Live Zone: </span>
                  <span className="text-[10px] font-black uppercase text-primary">{currentZone}</span>
                </div>
              </div>

              {/* Detailed Performance */}
              <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 shadow-2xl flex flex-col justify-between border border-slate-200">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/20 rounded-2xl">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedArea}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{currentZone}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {[
                      { label: "Stability Index", val: areaScore },
                      { label: "Infrastructure Readiness", val: Math.round(areaScore * 0.95) },
                      { label: "Emergency Response", val: Math.round(areaScore * 1.05) },
                      { label: "Resource Redundancy", val: Math.round(areaScore * 0.88) }
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                          <span className={cn("text-xl font-black italic", getStatusColor(m.val))}>{m.val}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-700" 
                            style={{ width: `${m.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <p className="text-[11px] font-bold text-slate-400 leading-tight">
                      This area is operating at {areaScore}% efficiency compared to the city average of {cityAverage}%.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
  );
};

export default StaticResilience;