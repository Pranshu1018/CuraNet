import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { 
  Droplets, Plus, AlertTriangle, Building2, ArrowRightLeft, 
  Activity, ChevronDown, Send, ClipboardCheck, Megaphone, 
  BellRing, X, Calendar, Clock, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BloodBatch {
  id: string;
  units: number;
  entryDate: Date;
  expiryDate: Date;
}

const BloodBank = () => {
  // 1. Core State: Inventory with Batch Tracking
  const [inventory, setInventory] = useState<Record<string, { demand: number; batches: BloodBatch[] }>>({});
  const [systemAlert, setSystemAlert] = useState<{type: string, message: string} | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [incomingRequests, setIncomingRequests] = useState([
    { id: "REQ-9901", hospital: "City General", type: "O-", units: 2, priority: "emergency" },
    { id: "REQ-9902", hospital: "Metro Medical", type: "B+", units: 5, priority: "standard" },
  ]);

  const [logs, setLogs] = useState([
    { id: "TX-402", action: "INBOUND", type: "A+", units: 1, time: "10:30 AM" },
  ]);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadBloodBankData = async () => {
      try {
        setLoading(true);
        const inventoryData = await mediSyncServices.bloodBank.getInventory();
        
        if (inventoryData && Object.keys(inventoryData).length > 0) {
          // Convert Firebase data to local format
          const formattedInventory: Record<string, { demand: number; batches: BloodBatch[] }> = {};
          
          Object.entries(inventoryData).forEach(([bloodType, data]: [string, any]) => {
            formattedInventory[bloodType] = {
              demand: data.demand || Math.floor(Math.random() * 40) + 10,
              batches: data.units ? [{
                id: `BAT-${Math.floor(Math.random() * 9000 + 1000)}`,
                units: data.units,
                entryDate: new Date(data.lastUpdated || Date.now()),
                expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
              }] : []
            };
          });
          
          setInventory(formattedInventory);
        } else {
          // Initialize with default data
          const defaultInventory = {
            "A+": { demand: 38, batches: [{ id: "BAT-001", units: 45, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "A-": { demand: 15, batches: [{ id: "BAT-002", units: 12, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "B+": { demand: 32, batches: [{ id: "BAT-003", units: 38, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "B-": { demand: 12, batches: [{ id: "BAT-004", units: 8, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "AB+": { demand: 18, batches: [{ id: "BAT-005", units: 22, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "AB-": { demand: 6, batches: [{ id: "BAT-006", units: 5, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "O+": { demand: 55, batches: [{ id: "BAT-007", units: 52, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
            "O-": { demand: 25, batches: [{ id: "BAT-008", units: 15, entryDate: new Date(), expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) }] },
          };
          
          // Add to Firebase
          for (const [bloodType, data] of Object.entries(defaultInventory)) {
            await mediSyncServices.bloodBank.updateInventory(bloodType, data.batches[0].units);
          }
          
          setInventory(defaultInventory);
        }
      } catch (error) {
        console.error('Error loading blood bank data:', error);
        toast.error('Failed to load blood bank data');
      } finally {
        setLoading(false);
      }
    };

    loadBloodBankData();
    
    // Listen for real-time updates
    const unsubscribe = mediSyncServices.bloodBank.listenToInventory((inventoryData) => {
      if (inventoryData && Object.keys(inventoryData).length > 0) {
        const formattedInventory: Record<string, { demand: number; batches: BloodBatch[] }> = {};
        
        Object.entries(inventoryData).forEach(([bloodType, data]: [string, any]) => {
          formattedInventory[bloodType] = {
            demand: data.demand || Math.floor(Math.random() * 40) + 10,
            batches: data.units ? [{
              id: `BAT-${Math.floor(Math.random() * 9000 + 1000)}`,
              units: data.units,
              entryDate: new Date(data.lastUpdated || Date.now()),
              expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
            }] : []
          };
        });
        
        setInventory(formattedInventory);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Logic Handlers ---

  const getTotalUnits = (type: string) => inventory[type].batches.reduce((sum, b) => sum + b.units, 0);

  const getStatus = (type: string) => {
    const units = getTotalUnits(type);
    const ratio = units / inventory[type].demand;
    if (ratio < 0.6) return "critical";
    if (ratio < 1.0) return "warning";
    return "normal";
  };

  const alertMessages = useMemo(() => {
    return Object.keys(inventory).map(type => {
      const status = getStatus(type);
      if (status === "critical") return { type, level: "critical", msg: `URGENT: ${type} group is critically low. Manual entry or network request required.` };
      if (status === "warning") return { type, level: "warning", msg: `Notice: Encouraging ${type} donations to stabilize local demand.` };
      return null;
    }).filter(Boolean);
  }, [inventory]);

  const addLog = (action: "INBOUND" | "OUTBOUND", type: string, units: number) => {
    setLogs(prev => [{
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      action, type, units,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);
  };

  const handleInbound = async (bloodType: string, amount: number) => {
  try {
    const newBatch: BloodBatch = {
      id: `BAT-${Math.floor(Math.random() * 9000 + 1000)}`,
      units: amount,
      entryDate: new Date(),
      expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
    };
    
    await mediSyncServices.bloodBank.addDonation({
      ...newBatch,
      bloodType,
      donorName: "Anonymous Donor",
      donationDate: new Date().toISOString()
    });
    
    await mediSyncServices.bloodBank.updateInventory(bloodType, getTotalUnits(bloodType) + amount);
    
    addLog("INBOUND", bloodType, amount);
    toast.success(`${amount} units of ${bloodType} blood added to inventory`);
  } catch (error) {
    console.error('Error adding blood donation:', error);
    toast.error('Failed to add blood donation');
  }
};

  const handleOutbound = async (reqId: string, status: 'accept' | 'reject') => {
  try {
    const request = incomingRequests.find(r => r.id === reqId);
    if (status === 'accept' && request) {
      const type = request.type;
      const currentUnits = getTotalUnits(type);
      
      if (currentUnits < request.units) {
        toast.error(`Insufficient ${type} blood units. Available: ${currentUnits}, Requested: ${request.units}`);
        return;
      }
      
      await mediSyncServices.bloodBank.updateInventory(type, currentUnits - request.units);
      addLog("OUTBOUND", type, request.units);
      toast.success(`${request.units} units of ${type} blood dispatched to ${request.hospital}`);
      
      // Remove request from incoming requests
      setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
    } else if (status === 'reject') {
      setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
      toast.info(`Blood request ${reqId} rejected`);
    }
  } catch (error) {
    console.error('Error processing blood request:', error);
    toast.error('Failed to process blood request');
  }
};

  const triggerEmergencyBroadcast = (bloodType: string) => {
    setSystemAlert({
      type: bloodType,
      message: `🚨 EMERGENCY BROADCAST: Critical shortage of ${bloodType}. Priority node dispatch active.`
    });
    setTimeout(() => setSystemAlert(null), 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 🚨 Emergency System Banner */}
      {systemAlert && (
        <div className="bg-critical py-3 px-4 flex items-center justify-between sticky top-0 z-50 animate-pulse shadow-xl">
          <div className="flex items-center gap-3 text-white">
            <BellRing className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wider">{systemAlert.message}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setSystemAlert(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Blood Bank Operations</h1>
            <p className="text-muted-foreground">Unified logistics: Expiry tracking, network requests, and emergency dispatch</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* EMERGENCY FEATURE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-critical text-critical hover:bg-critical/5 font-bold shadow-sm">
                  <Megaphone className="w-4 h-4 mr-2" /> Broadcast Alert
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase">Trigger Network Alert</div>
                <DropdownMenuSeparator />
                {Object.keys(inventory).map(type => (
                  <DropdownMenuItem key={type} onClick={() => triggerEmergencyBroadcast(type)} className="text-critical font-bold cursor-pointer">
                    Alert {type} Shortage
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* REQUEST STOCK FEATURE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/5 shadow-sm">
                  <Send className="w-4 h-4 mr-2" /> Request Stock <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Pull Batch from Network</div>
                <DropdownMenuSeparator />
                {Object.keys(inventory).map(type => (
                  <DropdownMenuItem key={type} onClick={() => handleInbound(type, 5)} className="cursor-pointer flex justify-between">
                    <span className="font-bold">{type} Group</span>
                    <span className="text-[10px] text-primary font-mono">+5 Units</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="hero" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Direct Entry <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2"><ClipboardCheck className="w-3 h-3" /> Manual Registration</div>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1 p-1">
                  {Object.keys(inventory).map(type => (
                    <DropdownMenuItem key={type} onClick={() => handleInbound(type, 1)} className="flex justify-between cursor-pointer">
                      {type} <span className="text-success text-[10px] font-bold">+1U</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* INCOMING REQUESTS (OUTBOUND) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Incoming
                  {incomingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-critical text-white text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md font-bold">
                      {incomingRequests.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase p-2 tracking-widest">External Fulfillment Required</h3>
                {incomingRequests.map(req => (
                  <div key={req.id} className="p-3 bg-muted/30 rounded-lg mb-2 border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold">{req.hospital}</p>
                        <p className="text-[10px] font-mono opacity-60 uppercase tracking-tighter">{req.id}</p>
                      </div>
                      <span className="bg-critical text-white text-[10px] px-2 py-0.5 rounded font-bold">{req.type}: {req.units}U</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 flex-1 bg-success hover:bg-success/90" onClick={() => handleOutbound(req.id, 'accept')}>Approve</Button>
                      <Button size="sm" variant="ghost" className="h-7 flex-1 text-critical" onClick={() => handleOutbound(req.id, 'reject')}>Reject</Button>
                    </div>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 📢 Notification Area (Black Text) */}
        <div className="mb-8 space-y-2">
          {alertMessages.map((alert, idx) => (
            <div key={idx} className={cn(
              "p-3 rounded-lg border border-l-4 flex items-center gap-3 animate-in slide-in-from-left duration-300",
              alert?.level === "critical" ? "bg-critical/10 border-critical" : "bg-warning/10 border-warning"
            )}>
              <AlertTriangle className={cn("w-5 h-5 shrink-0", alert?.level === "critical" ? "text-critical" : "text-warning")} />
              <p className="text-sm font-extrabold text-black tracking-tight">{alert?.msg}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Live Inventory Monitor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(inventory).map(type => {
                const total = getTotalUnits(type);
                const status = getStatus(type);
                const isExpanded = expandedGroup === type;

                return (
                  <div key={type} className={cn(
                    "rounded-xl border transition-all duration-300 overflow-hidden",
                    status === "critical" ? "bg-critical/5 border-critical/30 ring-1 ring-critical/20" : "bg-card shadow-sm border-border"
                  )}>
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedGroup(isExpanded ? null : type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm",
                          status === "critical" ? "bg-critical text-white" : "bg-primary/10 text-primary"
                        )}>
                          {type}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-none mb-1">{total} Units</p>
                          <StatusBadge status={status as any} size="sm" />
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top duration-200">
                        <DropdownMenuSeparator className="mb-2 opacity-50" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Batches (Expiry tracking)</p>
                        {inventory[type].batches.map((batch) => (
                          <div key={batch.id} className="flex justify-between items-center bg-muted/40 p-2 rounded text-[11px] border border-border/50">
                            <span className="font-mono font-bold text-muted-foreground">{batch.id}</span>
                            <div className="text-right">
                              <p className="font-bold text-primary">EXP: {batch.expiryDate.toLocaleDateString()}</p>
                              <p className="text-[9px] opacity-60 font-medium">Batch Qty: {batch.units}U</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full">
            <h2 className="font-display text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <Activity className="w-5 h-5" /> Operational Ledger
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold shadow-sm",
                      log.action === "INBOUND" ? "bg-success/20 text-success" : "bg-blue-500/20 text-blue-500"
                    )}>
                      {log.type}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground leading-none mb-1">{log.id}</p>
                      <p className="text-[11px] font-bold tracking-tight">{log.action}</p>
                    </div>
                  </div>
                  <p className={cn("text-xs font-bold", log.action === "INBOUND" ? "text-success" : "text-blue-500")}>
                    {log.action === "INBOUND" ? "+" : "-"}{log.units}U
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default BloodBank;