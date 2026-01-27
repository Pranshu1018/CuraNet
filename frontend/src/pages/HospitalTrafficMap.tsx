import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Activity, 
  Bed, 
  Users, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediSyncServices } from '@/lib/firebase-services';
import { typographyClasses } from '@/lib/typography';

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'normal' | 'high' | 'critical';
  beds: {
    total: number;
    available: number;
    icu: number;
    ventilators: number;
  };
  opdTraffic: {
    current: number;
    capacity: number;
    averageWaitTime: number;
    status: 'low' | 'medium' | 'high';
  };
  departments: {
    name: string;
    availableDoctors: number;
    currentPatients: number;
    waitTime: number;
  }[];
  distance?: number;
}

const HospitalTrafficMap = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'high' | 'critical'>('all');
  const [showTrafficOnly, setShowTrafficOnly] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const handleSelectHospital = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Load hospital data
  useEffect(() => {
    const loadHospitalData = async () => {
      try {
        const stats = await mediSyncServices.dashboard.getStats();
        const bedsData = await mediSyncServices.beds.getAll();
        const doctorsData = await mediSyncServices.smartOPD.getDoctors();
        
        if (stats && stats.hospitals) {
          const hospitalsArray = Array.isArray(stats.hospitals) ? stats.hospitals : [];
          
          // Enhanced hospital data with real-time information
          const enhancedHospitals = hospitalsArray.map((hospital: any, index) => {
            const hospitalBeds = bedsData ? Object.values(bedsData).filter((bed: any) => 
              bed.hospitalId === hospital.id || !bed.hospitalId
            ) : [];
            
            const hospitalDoctors = doctorsData ? Object.values(doctorsData).filter((doctor: any) => 
              doctor.hospitalId === hospital.id || !doctor.hospitalId
            ) : [];
            
            // Calculate OPD traffic based on doctors and current load
            const totalPatients = Math.floor(Math.random() * 150) + 50; // Simulated current patients
            const capacity = hospitalDoctors.length * 20; // 20 patients per doctor
            const trafficRatio = totalPatients / capacity;
            
            return {
              ...hospital,
              id: hospital.id || `hospital-${index}`,
              lat: hospital.lat || 19.0760 + (index * 0.05),
              lng: hospital.lng || 72.8777 + (index * 0.05),
              status: hospital.intensity > 0.7 ? 'critical' : hospital.intensity > 0.4 ? 'high' : 'normal',
              beds: {
                total: hospitalBeds.length || 200,
                available: hospitalBeds.filter((bed: any) => bed.status === 'available').length || 45,
                icu: hospitalBeds.filter((bed: any) => bed.type === 'icu').length || 20,
                ventilators: hospitalBeds.filter((bed: any) => bed.type === 'ventilator').length || 8
              },
              opdTraffic: {
                current: totalPatients,
                capacity: capacity,
                averageWaitTime: Math.floor(trafficRatio * 60) + 10,
                status: trafficRatio > 0.8 ? 'high' : trafficRatio > 0.5 ? 'medium' : 'low'
              },
              departments: [
                { name: 'General Medicine', availableDoctors: 8, currentPatients: 65, waitTime: 25 },
                { name: 'Cardiology', availableDoctors: 4, currentPatients: 35, waitTime: 45 },
                { name: 'Neurology', availableDoctors: 3, currentPatients: 28, waitTime: 55 },
                { name: 'Pediatrics', availableDoctors: 5, currentPatients: 42, waitTime: 30 },
                { name: 'Emergency', availableDoctors: 6, currentPatients: 89, waitTime: 15 }
              ]
            };
          });
          
          setHospitals(enhancedHospitals);
        }
      } catch (error) {
        console.error('Error loading hospital data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHospitalData();
    
    // Set up real-time updates
    const unsubscribeBeds = mediSyncServices.beds.listen(() => {
      loadHospitalData();
    });
    
    const unsubscribeStats = mediSyncServices.dashboard.listenToStats(() => {
      loadHospitalData();
    });

    return () => {
      if (unsubscribeBeds) unsubscribeBeds();
      if (unsubscribeStats) unsubscribeStats();
    };
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter hospitals based on status
  const filteredHospitals = useMemo(() => {
    if (filterStatus === 'all') return hospitals;
    return hospitals.filter(h => h.status === filterStatus);
  }, [hospitals, filterStatus]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrafficColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              Hospital Traffic & Bed Availability
            </h1>
            <p className="text-muted-foreground">
              Real-time hospital capacity and OPD traffic monitoring
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select 
                className="px-3 py-2 border rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Hospitals</option>
                <option value="normal">Normal Status</option>
                <option value="high">High Load</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Button 
              variant={showTrafficOnly ? "default" : "outline"}
              onClick={() => setShowTrafficOnly(!showTrafficOnly)}
            >
              <Activity className="w-4 h-4 mr-2" />
              {showTrafficOnly ? 'Show Beds' : 'Show Traffic Only'}
            </Button>
          </div>
        </div>

        {/* Current Time */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Hospitals Monitored</p>
                <p className="text-lg">{filteredHospitals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Interactive Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Hospital Locations & Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg p-8" style={{ minHeight: '500px' }}>
                {/* Simple Map Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Interactive Hospital Map</p>
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {filteredHospitals.map((hospital, index) => (
                        <div 
                          key={hospital.id}
                          className={cn(
                            "border-2 rounded-lg p-4",
                            typographyClasses.interactiveCard,
                            getStatusColor(hospital.status)
                          )}
                          role="button"
                          tabIndex={0}
                          aria-label={`Select ${hospital.name}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectHospital(hospital);
                            }
                          }}
                          onClick={() => handleSelectHospital(hospital)}
                        >
                          <div className="text-center">
                            <h4 className="font-bold mb-2">{hospital.name}</h4>
                            <div className="text-2xl mb-2">
                              {showTrafficOnly ? hospital.opdTraffic.current : hospital.beds.available}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {showTrafficOnly ? 'Current Patients' : 'Available Beds'}
                            </div>
                            <div className="mt-2 space-y-1">
                              <Badge className={cn("text-xs", getTrafficColor(hospital.opdTraffic.status))}>
                                OPD: {hospital.opdTraffic.status}
                              </Badge>
                              <div className="text-xs">
                                Wait: {hospital.opdTraffic.averageWaitTime}min
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md">
                  <h5 className="font-semibold mb-2">Legend</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Normal Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>High Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Hospital Information */}
        {selectedHospital && (
          <Card className="mb-6" ref={detailsRef}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {selectedHospital.name} - Details
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedHospital(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bed Information */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    Bed Availability
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Total Beds</span>
                      <Badge variant="secondary">{selectedHospital.beds.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-sm">Available</span>
                      <Badge className="bg-green-100 text-green-800">{selectedHospital.beds.available}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span className="text-sm">ICU Beds</span>
                      <Badge className="bg-orange-100 text-orange-800">{selectedHospital.beds.icu}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="text-sm">Ventilators</span>
                      <Badge className="bg-red-100 text-red-800">{selectedHospital.beds.ventilators}</Badge>
                    </div>
                  </div>
                </div>

                {/* OPD Traffic Information */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    OPD Traffic
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Current Patients</span>
                      <Badge variant="secondary">{selectedHospital.opdTraffic.current}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="text-sm">Capacity</span>
                      <Badge className="bg-blue-100 text-blue-800">{selectedHospital.opdTraffic.capacity}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                      <span className="text-sm">Avg Wait Time</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {selectedHospital.opdTraffic.averageWaitTime} min
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span className="text-sm">Traffic Status</span>
                      <Badge className={cn("bg-purple-100 text-purple-800", getTrafficColor(selectedHospital.opdTraffic.status))}>
                        {selectedHospital.opdTraffic.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department-wise Breakdown */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Department-wise Traffic
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedHospital.departments.map((dept, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">{dept.name}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Available Doctors:</span>
                          <span className="font-medium">{dept.availableDoctors}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Patients:</span>
                          <span className="font-medium">{dept.currentPatients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wait Time:</span>
                          <span className="font-medium">{dept.waitTime} min</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full",
                              (dept.currentPatients / (dept.availableDoctors * 20)) > 0.8 ? 'bg-red-500' :
                              (dept.currentPatients / (dept.availableDoctors * 20)) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ 
                              width: `${Math.min((dept.currentPatients / (dept.availableDoctors * 20)) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div className="text-2xl font-bold">{filteredHospitals.length}</div>
              <div className="text-sm text-muted-foreground">Total Hospitals</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Bed className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <div className="text-2xl font-bold">
                {filteredHospitals.reduce((sum, h) => sum + h.beds.available, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Available Beds</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-orange-600" />
              <div className="text-2xl font-bold">
                {filteredHospitals.reduce((sum, h) => sum + h.opdTraffic.current, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Current OPD Patients</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-red-600" />
              <div className="text-2xl font-bold">
                {Math.round(filteredHospitals.reduce((sum, h) => sum + h.opdTraffic.averageWaitTime, 0) / filteredHospitals.length)} min
              </div>
              <div className="text-sm text-muted-foreground">Average Wait Time</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default HospitalTrafficMap;
