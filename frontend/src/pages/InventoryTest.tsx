import React, { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Clock, TrendingDown, Bell, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

const InventoryTest = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Establish socket connection for live system-wide alerts
    const socket = io('http://localhost:5000');
    
    socket.on('inventory_alert', (alert) => {
      setAlerts(prev => [...prev, { ...alert, type: 'expiry', id: Date.now() }]);
    });
    
    socket.on('low_stock_alert', (alert) => {
      setAlerts(prev => [...prev, { ...alert, type: 'low_stock', id: Date.now() }]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleManualReorder = async (itemName: string) => {
    try {
      // Logic for triggering a socket event or API call
      alert(`Procurement request for ${itemName} has been broadcasted.`);
      // Mock update to inventory
      setInventory(prev => prev.map(item => 
        item.name === itemName ? { ...item, stock: item.stock + 50 } : item
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hospital/heatmap-data');
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const selectHospital = async (hospital: any, index: number) => {
    setLoading(true);
    setSelectedHospital(`Hospital #${index + 1}`);
    // Simulate fetching specific hospital inventory
    setTimeout(() => {
      setInventory([
        { name: 'Paracetamol', stock: 12, unit: 'packs', expiryDate: '2026-02-15', category: 'Medicine' },
        { name: 'IV Kits', stock: 45, unit: 'units', expiryDate: null, category: 'Consumable' },
        { name: 'Oxygen', stock: 5, unit: 'cylinders', expiryDate: null, category: 'Equipment' }
      ]);
      setLoading(false);
    }, 800);
  };

  useEffect(() => { fetchHospitals(); }, []);

  return (
    
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="font-display text-4xl font-black uppercase italic tracking-tighter">
              Live <span className="text-primary">Inventory</span> Testbed
            </h1>
            <p className="text-muted-foreground font-medium">Socket-enabled real-time monitoring & manual override.</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase">Socket Connected</span>
          </div>
        </div>

        {/* Live Alerts Tray */}
        {alerts.length > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" /> System Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.slice(-3).map((alert) => (
                <div key={alert.id} className="p-4 rounded-2xl border-2 border-red-100 bg-red-50/50 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-black text-red-600 text-sm uppercase">{alert.hospitalName}</div>
                      <div className="font-bold text-slate-800">{alert.itemName}</div>
                    </div>
                    <Badge variant="destructive" className="uppercase text-[9px]">Critical</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Action: Reorder initiated via automation.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Node Explorer</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {hospitals.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => selectHospital(h, i)}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between",
                      selectedHospital === `Hospital #${i + 1}` ? "border-primary bg-primary/5 shadow-inner" : "hover:bg-slate-50 border-transparent"
                    )}
                  >
                    <div>
                      <div className="font-black text-sm uppercase tracking-tight">Hospital Unit {i + 1}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Connection</div>
                    </div>
                    <Package className={cn("w-5 h-5", selectedHospital === `Hospital #${i + 1}` ? "text-primary" : "text-slate-300")} />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 min-h-[500px]">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Manifest View</CardTitle>
                  <div className="text-xl font-black italic uppercase mt-1 text-primary">{selectedHospital || "Select Unit"}</div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                    <span className="font-black text-xs uppercase tracking-widest text-slate-400">Syncing Data...</span>
                  </div>
                ) : inventory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inventory.map((item, idx) => (
                      <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-lg uppercase italic tracking-tighter">{item.name}</h3>
                            <Badge className="bg-white text-slate-500 border-slate-200 uppercase text-[9px]">{item.category}</Badge>
                          </div>
                          <div className="flex items-center gap-6">
                            <div>
                              <div className="text-[9px] font-black text-slate-400 uppercase">Available</div>
                              <div className={cn("text-2xl font-black", item.stock < 15 ? "text-red-500" : "text-slate-800")}>
                                {item.stock} <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleManualReorder(item.name)}
                          className="mt-6 rounded-2xl font-black uppercase text-[10px] tracking-widest py-6"
                        >
                          Manual Restock
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <TrendingDown className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p className="font-black text-xs uppercase tracking-widest text-slate-400">No active manifest selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  );
};

export default InventoryTest;