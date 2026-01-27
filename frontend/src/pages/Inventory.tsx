import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { 
  Package, AlertTriangle, TrendingDown, Plus, Search, 
  Filter, ArrowUpRight, ArrowDownRight, X, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Medicine", "Consumable", "Equipment"];

const Inventory = () => {
  // 1. State Management
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New States for Restocking Feature
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const [newItem, setNewItem] = useState({
    name: "", category: "Medicine", stock: 0, minStock: 0, unit: "units"
  });

  // Load data from Firebase on mount
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        const inventoryData = await mediSyncServices.inventory.getAll();
        
        if (inventoryData && Object.keys(inventoryData).length > 0) {
          // Convert Firebase object to array
          const itemsArray = Object.entries(inventoryData).map(([id, item]: [string, any]) => ({
            id,
            ...item
          }));
          setItems(itemsArray);
        } else {
          // Initialize with default data
          const defaultItems = [
            { id: 1, name: "Paracetamol 500mg", category: "Medicine", stock: 150, minStock: 500, unit: "tablets", trend: "down", usage: 45 },
            { id: 2, name: "Surgical Gloves (L)", category: "Consumable", stock: 2500, minStock: 1000, unit: "pairs", trend: "stable", usage: 120 },
            { id: 3, name: "IV Saline 500ml", category: "Medicine", stock: 80, minStock: 200, unit: "bottles", trend: "down", usage: 25 },
            { id: 4, name: "Oxygen Cylinders", category: "Equipment", stock: 12, minStock: 20, unit: "cylinders", trend: "down", usage: 3 },
          ];
          
          // Add to Firebase
          for (const item of defaultItems) {
            await mediSyncServices.inventory.addItem(item);
          }
          
          setItems(defaultItems);
        }
      } catch (error) {
        console.error('Error loading inventory data:', error);
        toast.error('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
    
    // Listen for real-time updates
    const unsubscribe = mediSyncServices.inventory.listen((inventoryData) => {
      if (inventoryData && Object.keys(inventoryData).length > 0) {
        const itemsArray = Object.entries(inventoryData).map(([id, item]: [string, any]) => ({
          id,
          ...item
        }));
        setItems(itemsArray);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Functional Filtering Logic
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.filter(item => {
      if (!item || !item.name) return false;
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // 3. Add Item Functionality
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    try {
      const itemToAdd = {
        ...newItem,
        id: Date.now(),
        trend: "stable",
        usage: 0
      };

      await mediSyncServices.inventory.addItem(itemToAdd);
      setShowAddModal(false);
      setNewItem({ name: "", category: "Medicine", stock: 0, minStock: 0, unit: "units" });
      toast.success(`Item "${newItem.name}" added to inventory`);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item to inventory');
    }
  };

  // 4. Restock Functionality
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockAmount <= 0) return;

    try {
      await mediSyncServices.inventory.updateStock(restockItem.id, restockItem.stock + restockAmount);
      
      setRestockItem(null);
      setRestockAmount(0);
      toast.success(`Restocked ${restockAmount} units of ${restockItem.name}`);
    } catch (error) {
      console.error('Error restocking item:', error);
      toast.error('Failed to restock item');
    }
  };

  const lowStockCount = items.filter(i => i.stock < i.minStock).length;

  return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Section (Unchanged) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 tracking-tight">Inventory Tracking</h1>
            <p className="text-muted-foreground">Functional stock management and real-time filtering.</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    selectedCategory === cat ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button variant="hero" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* Stats Section (Unchanged) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Inventory Size" value={items.length} icon={Package} variant="primary" />
          <StatCard title="Critical Alerts" value={lowStockCount} icon={AlertTriangle} variant="critical" />
          <StatCard title="Items Found" value={filteredItems.length} icon={Search} variant="accent" />
          <StatCard title="System Status" value="Live" icon={TrendingDown} variant="success" />
        </div>

        {/* Main Content - Table with added "Actions" Column */}
        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold">Stock Inventory</h2>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Quick search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-4 px-4 text-xs font-black uppercase text-slate-400">Item Details</th>
                  <th className="pb-4 px-4 text-xs font-black uppercase text-slate-400">Category</th>
                  <th className="pb-4 px-4 text-xs font-black uppercase text-slate-400">Current Stock</th>
                  <th className="pb-4 px-4 text-xs font-black uppercase text-slate-400">Status</th>
                  <th className="pb-4 px-4 text-xs font-black uppercase text-slate-400 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-sm">{item.name}</td>
                    <td className="py-4 px-4"><span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 rounded-md">{item.category}</span></td>
                    <td className="py-4 px-4 font-bold">{item.stock} <span className="text-[10px] text-slate-400">{item.unit}</span></td>
                    <td className="py-4 px-4">
                      <StatusBadge status={item.stock < item.minStock ? "critical" : "normal"} label={item.stock < item.minStock ? "Low Stock" : "OK"} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl font-black uppercase text-[10px] h-8 border-slate-200 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => setRestockItem(item)}
                      >
                        <RefreshCw className="w-3 h-3 mr-2" /> Restock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restock Modal Overlay */}
        {restockItem && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setRestockItem(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-2">Restock <span className="text-primary">Supply</span></h2>
              <p className="text-xs font-bold text-slate-400 uppercase mb-6">{restockItem.name}</p>
              
              <form onSubmit={handleRestock} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Amount to Add ({restockItem.unit})</label>
                  <input 
                    type="number"
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 h-14 px-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xl font-black"
                    placeholder="0"
                    value={restockAmount || ''} 
                    onChange={e => setRestockAmount(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-4 px-1">
                    <span>Current: {restockItem.stock}</span>
                    <span className="text-primary">New Total: {restockItem.stock + (restockAmount || 0)}</span>
                  </div>
                  <Button type="submit" className="w-full py-7 rounded-2xl font-black uppercase tracking-widest">
                    Confirm Restock
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Existing Add Item Modal (Unchanged) */}
        {showAddModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              <h2 className="text-2xl font-black uppercase italic italic tracking-tighter mb-6">New Inventory <span className="text-primary">Node</span></h2>
              
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Item Name</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 h-12 px-4 rounded-xl outline-none focus:border-primary"
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Surgical Mask"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Category</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 h-12 px-2 rounded-xl outline-none"
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Unit Type</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 h-12 px-4 rounded-xl outline-none"
                      value={newItem.unit} 
                      onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Initial Stock</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 h-12 px-4 rounded-xl outline-none"
                      value={newItem.stock} 
                      onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Min Threshold</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 h-12 px-4 rounded-xl outline-none"
                      value={newItem.minStock} 
                      onChange={e => setNewItem({...newItem, minStock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full py-7 rounded-2xl font-black uppercase tracking-widest mt-4">
                  Confirm Addition
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default Inventory;