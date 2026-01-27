import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { initializeSampleBedData } from "@/data/bedSampleData";
import { 
  Bed, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  Bell,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface BedData {
  id: string;
  hospitalName: string;
  department: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  lastUpdated: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactInfo?: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  averageWaitTime?: number;
  occupancyRate: number;
}

interface DepartmentStats {
  general: BedData[];
  icu: BedData[];
  emergency: BedData[];
  ventilator: BedData[];
}

const BedAvailabilityDashboard = () => {
  const [bedData, setBedData] = useState<BedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Load real-time bed data
  useEffect(() => {
    const loadBedData = async () => {
      try {
        setLoading(true);
        const data = await mediSyncServices.beds.getAllBeds();
        
        if (data && Object.keys(data).length > 0) {
          const bedArray = Object.entries(data).map(([id, bed]: [string, any]) => ({
            id,
            ...bed,
            occupancyRate: bed.totalBeds > 0 ? (bed.occupiedBeds / bed.totalBeds) * 100 : 0
          }));
          setBedData(bedArray);
        } else {
          // Initialize sample data if no data exists
          await initializeSampleBedData();
          const sampleData = await mediSyncServices.beds.getAllBeds();
          if (sampleData) {
            const bedArray = Object.entries(sampleData).map(([id, bed]: [string, any]) => ({
              id,
              ...bed,
              occupancyRate: bed.totalBeds > 0 ? (bed.occupiedBeds / bed.totalBeds) * 100 : 0
            }));
            setBedData(bedArray);
          }
        }
      } catch (error) {
        console.error('Error loading bed data:', error);
        toast.error('Failed to load bed availability data');
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    };

    loadBedData();

    // Set up real-time listener
    const unsubscribe = mediSyncServices.beds.listenToBedUpdates((data) => {
      if (data) {
        const bedArray = Object.entries(data).map(([id, bed]: [string, any]) => ({
          id,
          ...bed,
          occupancyRate: bed.totalBeds > 0 ? (bed.occupiedBeds / bed.totalBeds) * 100 : 0
        }));
        setBedData(bedArray);
        setLastRefresh(new Date());
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter and group data
  const filteredData = useMemo(() => {
    let filtered = bedData;

    if (selectedHospital !== "all") {
      filtered = filtered.filter(bed => bed.hospitalName === selectedHospital);
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(bed => bed.department === selectedDepartment);
    }

    return filtered;
  }, [bedData, selectedHospital, selectedDepartment]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalBeds = filteredData.reduce((sum, bed) => sum + bed.totalBeds, 0);
    const availableBeds = filteredData.reduce((sum, bed) => sum + bed.availableBeds, 0);
    const occupiedBeds = filteredData.reduce((sum, bed) => sum + bed.occupiedBeds, 0);
    const criticalBeds = filteredData.filter(bed => 
      bed.department === "ICU" || bed.department === "Emergency"
    ).reduce((sum, bed) => sum + bed.availableBeds, 0);

    return {
      totalBeds,
      availableBeds,
      occupiedBeds,
      criticalBeds,
      occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
    };
  }, [filteredData]);

  // Group by hospital
  const hospitalGroups = useMemo(() => {
    const groups: { [key: string]: BedData[] } = {};
    filteredData.forEach(bed => {
      if (!groups[bed.hospitalName]) {
        groups[bed.hospitalName] = [];
      }
      groups[bed.hospitalName].push(bed);
    });
    return groups;
  }, [filteredData]);

  // Get unique hospitals and departments
  const hospitals = useMemo(() => {
    const unique = Array.from(new Set(bedData.map(bed => bed.hospitalName)));
    return unique.sort();
  }, [bedData]);

  const departments = useMemo(() => {
    const unique = Array.from(new Set(bedData.map(bed => bed.department)));
    return unique.sort();
  }, [bedData]);

  // Export data
  const exportData = () => {
    const csv = [
      ['Hospital', 'Department', 'Total Beds', 'Available', 'Occupied', 'Reserved', 'Maintenance', 'Occupancy Rate %'],
      ...filteredData.map(bed => [
        bed.hospitalName,
        bed.department,
        bed.totalBeds,
        bed.availableBeds,
        bed.occupiedBeds,
        bed.reservedBeds,
        bed.maintenanceBeds,
        bed.occupancyRate.toFixed(1)
      ])
    ].map(row => row.join(','));

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bed-availability-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Hospital Bed Availability Dashboard</h1>
            <p className="text-muted-foreground font-medium">
              Real-time bed status across hospitals for emergency services and city authorities
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              onClick={() => setEmergencyMode(!emergencyMode)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Emergency Mode
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
              Auto Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className={cn(
            "border-l-4",
            statistics.criticalBeds > 10 ? "border-l-red-500" : 
            statistics.criticalBeds > 5 ? "border-l-yellow-500" : 
            "border-l-green-500"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Beds Available</p>
                  <p className="text-2xl font-bold">{statistics.criticalBeds}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-full",
                  statistics.criticalBeds > 10 ? "bg-red-100" : 
                  statistics.criticalBeds > 5 ? "bg-yellow-100" : 
                  "bg-green-100"
                )}>
                  <Bed className={cn(
                    "w-6 h-6",
                    statistics.criticalBeds > 10 ? "text-red-600" : 
                    statistics.criticalBeds > 5 ? "text-yellow-600" : 
                    "text-green-600"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Beds</p>
                  <p className="text-2xl font-bold">{statistics.totalBeds}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Bed className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Beds</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.availableBeds}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{statistics.occupancyRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Hospital</label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-card"
                >
                  <option value="all">All Hospitals</option>
                  {hospitals.map(hospital => (
                    <option key={hospital} value={hospital}>{hospital}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-card"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hospital Groups */}
        <div className="space-y-6">
          {Object.entries(hospitalGroups).map(([hospitalName, beds]) => (
            <Card key={hospitalName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {hospitalName}
                  </div>
                  <Badge variant={beds.some(bed => bed.department === "ICU" || bed.department === "Emergency") ? "destructive" : "secondary"}>
                    {beds.filter(bed => bed.department === "ICU" || bed.department === "Emergency").length} Critical Units
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {beds.map((bed, index) => (
                    <div
                      key={bed.id}
                      className={cn(
                        "p-4 border rounded-lg transition-all duration-200 hover:shadow-md hover-lift animate-slide-up",
                        emergencyMode && (bed.department === "ICU" || bed.department === "Emergency") && "border-red-200 bg-red-50",
                        bed.availableBeds === 0 && "opacity-75"
                      )}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{bed.department}</h3>
                        <Badge
                          variant={bed.availableBeds === 0 ? "destructive" : 
                                   bed.availableBeds < 5 ? "secondary" : "default"}
                          className="text-sm"
                        >
                          {bed.availableBeds === 0 ? "Full" : 
                           bed.availableBeds < 5 ? "Limited" : "Available"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-semibold ml-1">{bed.totalBeds}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Available:</span>
                          <span className={cn(
                            "font-semibold ml-1",
                            bed.availableBeds === 0 ? "text-red-600" : 
                            bed.availableBeds < 5 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {bed.availableBeds}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Occupied:</span>
                          <span className="font-semibold ml-1">{bed.occupiedBeds}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reserved:</span>
                          <span className="font-semibold ml-1">{bed.reservedBeds}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Maintenance:</span>
                          <span className="font-semibold ml-1">{bed.maintenanceBeds}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Occupancy:</span>
                          <span className={cn(
                            "font-semibold ml-1",
                            bed.occupancyRate > 90 ? "text-red-600" :
                            bed.occupancyRate > 75 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {bed.occupancyRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {bed.contactInfo && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{bed.contactInfo.phone}</span>
                            </div>
                            {bed.averageWaitTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Avg Wait: {bed.averageWaitTime}min</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {emergencyMode && (bed.department === "ICU" || bed.department === "Emergency") && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold">Emergency Priority Unit</span>
                          </div>
                          {bed.availableBeds > 0 && (
                            <div className="mt-1 text-red-700">
                              Immediate bed availability - Contact emergency services
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-20">
              <Bed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Bed Data Available</h3>
              <p className="text-muted-foreground">
                No bed availability information found for the selected filters.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
  );
};

export default BedAvailabilityDashboard;
