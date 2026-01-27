import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { 
  Building2, 
  Share2, 
  Wifi,
  ArrowRightLeft,
  Bed,
  MapPin,
  X,
  Send,
  Loader2,
  List,
  Map as MapIcon,
  Navigation,
  ExternalLink,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Initial Data Models - Added X/Y for Map Positioning and coordinates for directions
const INITIAL_HOSPITALS = [
  { 
    name: "City General Hospital", 
    distance: "2.5 km", 
    status: "online", 
    beds: { available: 12, total: 150 }, 
    queue: 45, 
    lastSync: "2 min ago", 
    x: 25, 
    y: 35,
    address: "123 Main Street, Mumbai, Maharashtra 400001",
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  { 
    name: "Metro Medical Center", 
    distance: "4.2 km", 
    status: "online", 
    beds: { available: 28, total: 200 }, 
    queue: 32, 
    lastSync: "1 min ago", 
    x: 75, 
    y: 25,
    address: "456 Park Avenue, Mumbai, Maharashtra 400002",
    coordinates: { lat: 19.0860, lng: 72.8877 }
  },
  { 
    name: "Regional Health Hub", 
    distance: "6.8 km", 
    status: "online", 
    beds: { available: 5, total: 80 }, 
    queue: 67, 
    lastSync: "5 min ago", 
    x: 45, 
    y: 75,
    address: "789 Highway Road, Mumbai, Maharashtra 400003",
    coordinates: { lat: 19.0660, lng: 72.8677 }
  },
  { 
    name: "Central District Hospital", 
    distance: "8.1 km", 
    status: "offline", 
    beds: { available: 0, total: 120 }, 
    queue: 0, 
    lastSync: "15 min ago", 
    x: 85, 
    y: 85,
    address: "321 Central Road, Mumbai, Maharashtra 400004",
    coordinates: { lat: 19.0560, lng: 72.8577 }
  },
];

const INITIAL_TRANSFERS = [
  { id: "TRF-001", patient: "Anonymous", from: "Metro Medical", to: "Our Hospital", type: "ICU", status: "in-transit" },
  { id: "TRF-002", patient: "Anonymous", from: "Our Hospital", to: "City General", type: "General", status: "completed" },
  { id: "TRF-003", patient: "Anonymous", from: "Regional Hub", to: "Our Hospital", type: "Emergency", status: "pending" },
];

const HospitalNetwork = () => {
  // 2. State Management
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Form State for new transfers
  const [newTransfer, setNewTransfer] = useState({
    to: "",
    type: "General",
    patientName: "Anonymous"
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // Default to Mumbai coordinates if location access denied
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
        }
      );
    } else {
      // Default to Mumbai coordinates if geolocation not supported
      setUserLocation({ lat: 19.0760, lng: 72.8777 });
    }
  }, []);

  // Handle directions to hospital
  const handleGetDirections = (hospital: any) => {
    const destination = `${hospital.coordinates.lat},${hospital.coordinates.lng}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  // 3. Computed Stats
  const totalConnected = hospitals.filter(h => h.status === "online").length;
  const totalBedsAvailable = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
  const activeTransfers = transfers.filter(t => t.status !== "completed").length;

  // 4. Functional Logic
  const handleBroadcast = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Local capacity data has been broadcasted to the regional network.");
    }, 1500);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.to) return;

    const transferEntry = {
      id: `TRF-00${transfers.length + 1}`,
      patient: newTransfer.patientName,
      from: "Our Hospital",
      to: newTransfer.to,
      type: newTransfer.type,
      status: "pending"
    };

    setTransfers([transferEntry, ...transfers]);
    setShowTransferModal(false);
    setSelectedNode(null);
    setNewTransfer({ to: "", type: "General", patientName: "Anonymous" });
  };

  return (
    
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black uppercase italic tracking-tighter">
              Inter-Hospital <span className="text-primary">Network</span>
            </h1>
            <p className="text-muted-foreground font-medium">City-wide capacity sharing and patient coordination</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-slate-400")}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("map")}
                className={cn("p-2 rounded-lg transition-all", viewMode === "map" ? "bg-white text-primary shadow-sm" : "text-slate-400")}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBroadcast}
              disabled={isSyncing}
              className="rounded-xl border-slate-200 font-bold"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              Broadcast Capacity
            </Button>
            <Button 
              variant="hero" 
              size="sm" 
              onClick={() => setShowTransferModal(true)}
              className="rounded-xl font-bold"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Request Transfer
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Connected Hospitals" value={totalConnected} subtitle={`${hospitals.length} in network`} icon={Building2} variant="primary" />
          <StatCard title="Network Beds Available" value={totalBedsAvailable} icon={Bed} variant="success" />
          <StatCard title="Active Transfers" value={activeTransfers} icon={ArrowRightLeft} variant="accent" />
          <StatCard 
            title="Data Sync Status" 
            value={isSyncing ? "Syncing..." : "Live"} 
            subtitle="Real-time updates" 
            icon={Wifi} 
            variant={isSyncing ? "warning" : "default"} 
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-black uppercase tracking-tight">
                    {viewMode === "list" ? "Network Hospitals" : "Strategic Map View"}
                </h2>
                {/* Switch Back Logic Added Here */}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode(viewMode === "list" ? "map" : "list")} 
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                >
                    {viewMode === "list" ? "Switch to Map" : "Switch to List"}
                </Button>
              </div>

              {viewMode === "list" ? (
                <div className="space-y-4">
                  {hospitals.map((hospital) => (
                    <div key={hospital.name} className={cn(
                        "p-5 rounded-2xl border transition-all duration-300",
                        hospital.status === "online" ? "border-slate-100 bg-slate-50/30 hover:shadow-md" : "border-slate-50 opacity-50 bg-slate-50/10"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", hospital.status === "online" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-400")}>
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">{hospital.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <MapPin className="w-3 h-3" />
                              <span>{hospital.distance} away</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-100">
                          <div className={cn("w-2 h-2 rounded-full", hospital.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">{hospital.status}</span>
                        </div>
                      </div>
                      {hospital.status === "online" && (
                        <div className="grid grid-cols-4 gap-4">
                          <div className="p-3 rounded-xl bg-white border border-slate-100">
                            <div className="text-xl font-black text-emerald-600 italic tracking-tighter">{hospital.beds.available}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Beds Free</div>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-100">
                            <div className="text-xl font-black text-slate-800 italic tracking-tighter">{hospital.queue}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Queue</div>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-100">
                            <div className="text-[11px] font-black text-slate-400 py-1.5">{hospital.lastSync}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Sync</div>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 border border-teal-200">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full h-full text-white hover:bg-white/20 font-black text-[10px] uppercase tracking-widest"
                              onClick={() => handleGetDirections(hospital)}
                            >
                              <Route className="w-3 h-3 mr-1" />
                              Directions
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[1.5rem] w-full h-[600px] overflow-hidden border-4 border-slate-100">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(64, 224, 208, 0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  
                  {/* Animated Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {hospitals.filter(h => h.status === "online").map((hospital, i) => {
                      const centerX = 50;
                      const centerY = 50;
                      const nextHospital = hospitals.filter(h => h.status === "online")[(i + 1) % hospitals.filter(h => h.status === "online").length];
                      return (
                        <line
                          key={`line-${hospital.name}`}
                          x1={`${centerX}%`}
                          y1={`${centerY}%`}
                          x2={`${nextHospital.x}%`}
                          y2={`${nextHospital.y}%`}
                          stroke="rgba(64, 224, 208, 0.3)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                        />
                      );
                    })}
                  </svg>

                  {/* Central Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-2xl">
                      <Navigation className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-cyan-600/30 animate-ping rounded-full scale-150 -z-10" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-teal-400 uppercase tracking-widest">
                      Our Hospital
                    </div>
                  </div>

                  {/* Hospital Nodes */}
                  {hospitals.map((hospital) => (
                    <button 
                      key={hospital.name} 
                      onClick={() => setSelectedNode(hospital)} 
                      style={{ left: `${hospital.x}%`, top: `${hospital.y}%` }} 
                      className="absolute group -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 active:scale-95 z-20"
                    >
                      {/* Connection Pulse */}
                      {hospital.status === "online" && (
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150" />
                      )}
                      
                      {/* Hospital Node */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl border-3 flex items-center justify-center shadow-lg transition-all duration-300 backdrop-blur-sm",
                        hospital.status === "online" 
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-white shadow-emerald-500/50" 
                          : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500"
                      )}>
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Status Indicator */}
                      <div className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
                        hospital.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                      )} />

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap bg-slate-800/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-slate-600 pointer-events-none">
                        <p className="text-xs font-black uppercase text-white mb-1">{hospital.name}</p>
                        <div className="flex items-center gap-3 text-[10px]">
                          {hospital.status === "online" ? (
                            <>
                              <span className="font-bold text-emerald-400 uppercase">{hospital.beds.available} Beds Free</span>
                              <span className="font-bold text-slate-400">{hospital.queue} Queue</span>
                            </>
                          ) : (
                            <span className="font-bold text-slate-500 uppercase">Offline</span>
                          )}
                        </div>
                        <div className="text-[8px] text-slate-500 mt-1">{hospital.distance} away</div>
                      </div>
                    </button>
                  ))}

                  {/* Selected Node Detail Panel */}
                  {selectedNode && (
                    <div className="absolute bottom-8 left-8 right-8 bg-slate-800/95 backdrop-blur-md p-6 rounded-[2rem] border border-slate-600 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-6 z-30">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            selectedNode.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                          )} />
                          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
                            {selectedNode.name}
                          </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance</span>
                            <span className="text-sm font-black text-teal-400">{selectedNode.distance}</span>
                          </div>
                          {selectedNode.status === "online" && (
                            <>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Beds Available</span>
                                <span className="text-sm font-black text-emerald-400">{selectedNode.beds.available}/{selectedNode.beds.total}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Queue</span>
                                <span className="text-sm font-black text-white">{selectedNode.queue}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {selectedNode.status === "online" && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Last sync</span>
                            <span className="text-sm font-black text-slate-300">{selectedNode.lastSync}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
                          <span className="text-xs font-black text-teal-400">{selectedNode.address}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-xl h-10 px-4 font-black uppercase text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700" 
                          onClick={() => setSelectedNode(null)}
                        >
                          Dismiss
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="rounded-xl h-10 px-4 font-black uppercase text-[10px] border-teal-600 text-teal-400 hover:bg-teal-700" 
                          onClick={() => handleGetDirections(selectedNode)}
                        >
                          <Route className="w-3 h-3 mr-1" />
                          Directions
                        </Button>
                        {selectedNode.status === "online" && (
                          <Button 
                            size="sm" 
                            className="rounded-xl h-10 px-4 font-black uppercase text-[10px] bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700" 
                            onClick={() => { 
                              setNewTransfer({...newTransfer, to: selectedNode.name}); 
                              setShowTransferModal(true); 
                            }}
                          >
                            Request Transfer
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Map Legend */}
                  <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-slate-600">
                    <div className="text-xs font-black text-teal-400 uppercase mb-2">Network Status</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-slate-300">Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full" />
                        <span className="text-[9px] text-slate-300">Offline</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transfers Sidebar */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm h-fit">
            <h2 className="font-display text-lg font-black uppercase tracking-tight mb-4 text-primary">Live Transfers</h2>
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-[10px] text-slate-400 tracking-widest uppercase">{transfer.id}</span>
                    <StatusBadge status={transfer.status === "completed" ? "normal" : transfer.status === "in-transit" ? "warning" : "critical"} label={transfer.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="truncate">{transfer.from}</span>
                      <ArrowRightLeft className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{transfer.to}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transfer Modal - Same Logic as Provided */}
        {showTransferModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowTransferModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Patient <span className="text-primary">Transfer</span></h2>
              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Destination Hospital</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 h-12 px-4 rounded-xl outline-none font-bold"
                    value={newTransfer.to}
                    onChange={e => setNewTransfer({...newTransfer, to: e.target.value})}
                  >
                    <option value="">Select Destination...</option>
                    {hospitals.filter(h => h.status === "online").map(h => (
                      <option key={h.name} value={h.name}>{h.name} ({h.beds.available} beds free)</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full py-7 rounded-2xl font-black uppercase tracking-widest mt-4">
                  <Send className="w-4 h-4 mr-2" /> Dispatch Request
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default HospitalNetwork;