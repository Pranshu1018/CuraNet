import { useState, useEffect } from "react";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { toast } from "sonner";
import { 
  Ambulance, 
  MapPin, 
  Navigation, 
  Phone, 
  Clock,
  AlertTriangle,
  Activity,
  Users,
  Filter,
  Search,
  RefreshCw,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const AmbulanceDetection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAmbulance, setSelectedAmbulance] = useState<any>(null);
  const { ambulances = [], loading, trackAmbulance, refetch } = useAmbulanceTracking(selectedStatus);

  // Helper function to format time ago
  function formatTimeAgo(timestamp: string | null | undefined): string {
    if (!timestamp) return "Unknown";
    
    try {
      const now = new Date();
      const past = new Date(timestamp);
      if (isNaN(past.getTime())) return "Unknown";
      
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} mins ago`;
      } else if (diffMins < 1440) {
        return `${Math.floor(diffMins / 60)} hours ago`;
      } else {
        return `${Math.floor(diffMins / 1440)} days ago`;
      }
    } catch (error) {
      return "Unknown";
    }
  }

  // Safe array for all operations
  const safeAmbulances = Array.isArray(ambulances) ? ambulances : [];

  // Transform data to match UI expectations
  const transformedAmbulances = safeAmbulances.map((position, index) => ({
    id: position.ambulance_id,
    unitNumber: position.ambulance_id,
    status: position.status,
    location: {
      lat: position.lat,
      lng: position.lng,
      address: `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` // Simple address from coordinates
    },
    destination: position.status === 'active' ? {
      lat: position.lat + 0.01,
      lng: position.lng + 0.01,
      address: 'Destination Hospital'
    } : undefined,
    eta: position.status === 'active' ? Math.floor(Math.random() * 15) + 5 : undefined,
    crew: {
      driver: `Driver ${index + 1}`,
      paramedic: `Paramedic ${index + 1}`,
      emt: `EMT ${index + 1}`
    },
    patient: position.status === 'active' ? {
      name: `Patient ${index + 1}`,
      condition: index % 2 === 0 ? 'critical' : 'stable',
      destination: 'City General Hospital'
    } : undefined,
    lastUpdate: formatTimeAgo(position.updated_at)
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100 border-green-500";
      case "dispatched": return "text-blue-600 bg-blue-100 border-blue-500";
      case "available": return "text-gray-600 bg-gray-100 border-gray-500";
      case "maintenance": return "text-orange-600 bg-orange-100 border-orange-500";
      default: return "text-gray-600 bg-gray-100 border-gray-500";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "critical": return "text-red-600 bg-red-100";
      case "stable": return "text-yellow-600 bg-yellow-100";
      case "minor": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Handle Directions button click
  const handleDirections = (ambulance: any) => {
    if (ambulance.location.lat && ambulance.location.lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${ambulance.location.lat},${ambulance.location.lng}`;
      window.open(googleMapsUrl, '_blank');
      toast.success('Opening directions in Google Maps', {
        description: `Navigating to ${ambulance.unitNumber}`
      });
    } else {
      toast.error('Unable to get directions', {
        description: 'Location coordinates not available'
      });
    }
  };

  // Handle Contact Crew button click
  const handleContactCrew = (ambulance: any) => {
    setSelectedAmbulance(ambulance);
    toast.info('Crew Contact Information', {
      description: `Driver: ${ambulance.crew.driver}, Paramedic: ${ambulance.crew.paramedic}, EMT: ${ambulance.crew.emt}`,
      action: {
        label: 'Call Driver',
        onClick: () => {
          window.open(`tel:+1234567890`, '_blank');
          toast.success('Initiating call to driver');
        }
      }
    });
  };

  // Handle Contact Patient button click
  const handleContactPatient = (ambulance: any) => {
    if (ambulance.patient) {
      toast.info('Patient Contact', {
        description: `Contacting ${ambulance.patient.name}'s family...`,
        action: {
          label: 'Call Family',
          onClick: () => {
            window.open(`tel:+1234567890`, '_blank');
            toast.success('Calling patient family');
          }
        }
      });
    }
  };

  // Handle Dispatch Unit button click
  const handleDispatchUnit = (ambulance: any) => {
    toast.loading('Dispatching ambulance...', {
      description: `Preparing ${ambulance.unitNumber} for dispatch`
    });

    // Simulate dispatch process
    setTimeout(() => {
      toast.success('Ambulance Dispatched!', {
        description: `${ambulance.unitNumber} has been dispatched to emergency location`,
        action: {
          label: 'Track Unit',
          onClick: () => handleTrackAmbulance(ambulance)
        }
      });
      refetch(); // Refresh data to show updated status
    }, 2000);
  };

  // Handle Track button click
  const handleTrackAmbulance = (ambulance: any) => {
    trackAmbulance(ambulance.id);
    toast.success('Tracking Activated', {
      description: `Now tracking ${ambulance.unitNumber} in real-time`,
      action: {
        label: 'View Live Map',
        onClick: () => {
          if (ambulance.location.lat && ambulance.location.lng) {
            const mapUrl = `https://www.google.com/maps/@${ambulance.location.lat},${ambulance.location.lng},15z`;
            window.open(mapUrl, '_blank');
          }
        }
      }
    });
  };

  const filteredAmbulances = transformedAmbulances.filter(ambulance => {
    const matchesSearch = ambulance.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ambulance.crew.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ambulance.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || ambulance.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "active", "dispatched", "available", "maintenance"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Ambulance className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dynamic Ambulance Detection</h1>
                <p className="text-gray-600">Real-time tracking and optimization of ambulance fleet deployment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">System Time</div>
              <div className="text-lg font-semibold">{currentTime.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Units</p>
                  <p className="text-2xl font-bold text-green-600">{transformedAmbulances.filter(a => a.status === 'active').length}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dispatched</p>
                  <p className="text-2xl font-bold text-blue-600">{transformedAmbulances.filter(a => a.status === 'dispatched').length}</p>
                </div>
                <Navigation className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-600">{transformedAmbulances.filter(a => a.status === 'available').length}</p>
                </div>
                <Zap className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600">{transformedAmbulances.filter(a => a.status === 'maintenance').length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by unit number, crew, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {statuses.map(status => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Ambulance Fleet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {transformedAmbulances.map((ambulance) => (
            <Card key={ambulance.id} className={`border-l-4 ${getStatusColor(ambulance.status).split(' ')[2]}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getStatusColor(ambulance.status)} flex items-center justify-center`}>
                      <Ambulance className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ambulance.unitNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ambulance.status)}`}>
                        {ambulance.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Last Update</div>
                    <div className="text-sm font-medium">{ambulance.lastUpdate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      Current Location
                    </div>
                    <div className="text-sm font-medium">{ambulance.location.address}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1 text-xs"
                      onClick={() => handleDirections(ambulance)}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Get Directions
                    </Button>
                  </div>
                  
                  {ambulance.destination && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Navigation className="w-4 h-4" />
                        Destination
                      </div>
                      <div className="text-sm font-medium">{ambulance.destination.address}</div>
                      {ambulance.eta && (
                        <div className="text-sm text-blue-600">ETA: {ambulance.eta} mins</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Users className="w-4 h-4" />
                    Crew Members
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Driver:</span>
                      <div className="font-medium">{ambulance.crew.driver}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Paramedic:</span>
                      <div className="font-medium">{ambulance.crew.paramedic}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">EMT:</span>
                      <div className="font-medium">{ambulance.crew.emt}</div>
                    </div>
                  </div>
                </div>

                {ambulance.patient && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Users className="w-4 h-4" />
                          Patient Information
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Name:</span>
                          <span className="ml-2 font-medium">{ambulance.patient.name}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-gray-600">Condition:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(ambulance.patient.condition)}`}>
                            {ambulance.patient.condition.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleContactPatient(ambulance)}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleTrackAmbulance(ambulance)}
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {ambulance.status === "available" && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleContactCrew(ambulance)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Crew
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDispatchUnit(ambulance)}
                      >
                        Dispatch Unit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {transformedAmbulances.length === 0 && (
          <div className="text-center py-12">
            <Ambulance className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ambulances found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDetection;
