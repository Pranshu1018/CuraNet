import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Phone, 
  Clock,
  Users,
  Bed,
  Navigation,
  Filter,
  Heart,
  Activity,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediSyncServices } from '@/lib/firebase-services';
import { typographyClasses } from '@/lib/typography';

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  rating: number;
  distance: number;
  status: 'normal' | 'high' | 'critical';
  beds: {
    total: number;
    available: number;
    icu: number;
    ventilators: number;
  };
  departments: {
    name: string;
    availableDoctors: number;
    specialties: string[];
    avgWaitTime: number;
  }[];
  specialties: string[];
  emergencyServices: boolean;
  ambulanceAvailable: boolean;
  bloodBankAvailable: boolean;
}

const HospitalRecommendations = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'availability'>('distance');
  const [userLocation, setUserLocation] = useState({ lat: 19.0760, lng: 72.8777 });
  const [mapCenter, setMapCenter] = useState({ lat: 19.0760, lng: 72.8777 });

  const handleSelectHospital = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    requestAnimationFrame(() => {
      const el = document.getElementById(`hospital-card-${hospital.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  // Demo hospital data
  const demoHospitals: Hospital[] = [
    {
      id: '1',
      name: 'City General Hospital',
      lat: 19.0760,
      lng: 72.8777,
      address: '123 Main Street, Mumbai',
      phone: '+91 22 1234 5678',
      rating: 4.5,
      distance: 0.8,
      status: 'normal',
      beds: { total: 500, available: 125, icu: 50, ventilators: 25 },
      departments: [
        { name: 'Cardiology', availableDoctors: 8, specialties: ['Heart Surgery', 'ECG', 'Angioplasty'], avgWaitTime: 25 },
        { name: 'Neurology', availableDoctors: 6, specialties: ['Brain Surgery', 'Stroke Care'], avgWaitTime: 45 },
        { name: 'Orthopedics', availableDoctors: 10, specialties: ['Joint Replacement', 'Sports Medicine'], avgWaitTime: 30 },
        { name: 'Pediatrics', availableDoctors: 12, specialties: ['Child Care', 'Vaccination'], avgWaitTime: 20 }
      ],
      specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency'],
      emergencyServices: true,
      ambulanceAvailable: true,
      bloodBankAvailable: true
    },
    {
      id: '2',
      name: 'St. Mary Medical Center',
      lat: 19.0870,
      lng: 72.8877,
      address: '456 Park Avenue, Mumbai',
      phone: '+91 22 2345 6789',
      rating: 4.2,
      distance: 2.3,
      status: 'high',
      beds: { total: 350, available: 45, icu: 30, ventilators: 15 },
      departments: [
        { name: 'General Medicine', availableDoctors: 15, specialties: ['Primary Care', 'Diabetes'], avgWaitTime: 35 },
        { name: 'Surgery', availableDoctors: 8, specialties: ['General Surgery', 'Laparoscopic'], avgWaitTime: 60 },
        { name: 'Maternity', availableDoctors: 6, specialties: ['Pregnancy Care', 'Delivery'], avgWaitTime: 40 }
      ],
      specialties: ['General Medicine', 'Surgery', 'Maternity', 'Emergency'],
      emergencyServices: true,
      ambulanceAvailable: true,
      bloodBankAvailable: false
    },
    {
      id: '3',
      name: 'Memorial Regional Hospital',
      lat: 19.0660,
      lng: 72.8667,
      address: '789 Hospital Road, Mumbai',
      phone: '+91 22 3456 7890',
      rating: 4.8,
      distance: 3.5,
      status: 'critical',
      beds: { total: 600, available: 20, icu: 60, ventilators: 30 },
      departments: [
        { name: 'Emergency', availableDoctors: 10, specialties: ['Trauma Care', 'Emergency Medicine'], avgWaitTime: 15 },
        { name: 'ICU', availableDoctors: 12, specialties: ['Critical Care', 'Ventilation'], avgWaitTime: 5 },
        { name: 'Oncology', availableDoctors: 8, specialties: ['Cancer Treatment', 'Chemotherapy'], avgWaitTime: 90 }
      ],
      specialties: ['Emergency', 'ICU', 'Oncology', 'Radiology', 'Pathology'],
      emergencyServices: true,
      ambulanceAvailable: true,
      bloodBankAvailable: true
    },
    {
      id: '4',
      name: 'Riverside Medical Center',
      lat: 19.0970,
      lng: 72.8997,
      address: '321 River Side, Mumbai',
      phone: '+91 22 4567 8901',
      rating: 3.9,
      distance: 5.2,
      status: 'normal',
      beds: { total: 250, available: 80, icu: 20, ventilators: 10 },
      departments: [
        { name: 'Dermatology', availableDoctors: 4, specialties: ['Skin Care', 'Cosmetic'], avgWaitTime: 25 },
        { name: 'ENT', availableDoctors: 6, specialties: ['Ear, Nose, Throat'], avgWaitTime: 30 }
      ],
      specialties: ['Dermatology', 'ENT', 'Ophthalmology'],
      emergencyServices: false,
      ambulanceAvailable: false,
      bloodBankAvailable: true
    },
    {
      id: '5',
      name: 'Emergency Care Hospital',
      lat: 19.0560,
      lng: 72.8557,
      address: '999 Emergency Lane, Mumbai',
      phone: '+91 22 108 AMBULANCE',
      rating: 4.6,
      distance: 6.8,
      status: 'normal',
      beds: { total: 150, available: 60, icu: 25, ventilators: 20 },
      departments: [
        { name: 'Emergency', availableDoctors: 15, specialties: ['Trauma', 'Critical Care'], avgWaitTime: 10 },
        { name: 'Ambulance Services', availableDoctors: 8, specialties: ['Emergency Transport'], avgWaitTime: 5 }
      ],
      specialties: ['Emergency Medicine', 'Trauma Care', 'Ambulance'],
      emergencyServices: true,
      ambulanceAvailable: true,
      bloodBankAvailable: true
    },
    {
      id: '6',
      name: 'Community Health Center',
      lat: 19.1170,
      lng: 72.9107,
      address: '555 Community Drive, Mumbai',
      phone: '+91 22 5678 9012',
      rating: 3.5,
      distance: 8.1,
      status: 'normal',
      beds: { total: 100, available: 40, icu: 10, ventilators: 5 },
      departments: [
        { name: 'Primary Care', availableDoctors: 8, specialties: ['General Health', 'Preventive Care'], avgWaitTime: 15 },
        { name: 'Vaccination', availableDoctors: 4, specialties: ['Immunization', 'Flu Shots'], avgWaitTime: 10 }
      ],
      specialties: ['Primary Care', 'Vaccination', 'Health Screening'],
      emergencyServices: false,
      ambulanceAvailable: false,
      bloodBankAvailable: false
    }
  ];

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Use default Mumbai coordinates
        }
      );
    }
  }, []);

  // Initialize with demo data
  useEffect(() => {
    setTimeout(() => {
      setHospitals(demoHospitals);
      setLoading(false);
    }, 1000);
  }, []);

  // Get unique specialties from all hospitals
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    hospitals.forEach(hospital => {
      hospital.specialties.forEach(spec => specialties.add(spec));
    });
    return Array.from(specialties).sort();
  }, [hospitals]);

  // Filter and sort hospitals
  const filteredHospitals = useMemo(() => {
    let filtered = hospitals;
    
    // Filter by specialty
    if (filterSpecialty !== 'all') {
      filtered = filtered.filter(hospital => 
        hospital.specialties.includes(filterSpecialty)
      );
    }
    
    // Sort by selected criteria
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'availability':
          return b.beds.available - a.beds.available;
        default:
          return a.distance - b.distance;
      }
    });
  }, [hospitals, filterSpecialty, sortBy]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get rating stars
  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-4 h-4 fill-yellow-200 text-yellow-200" />}
        {Array(emptyStars).fill(0).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-2 text-sm">{rating}</span>
      </div>
    );
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
              <MapPin className="w-8 h-8 text-primary" />
              Hospital Recommendations
            </h1>
            <p className="text-muted-foreground">
              Find the best hospitals near you with specialist doctors and real-time availability
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select 
                className="px-3 py-2 border rounded-md"
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
              >
                <option value="all">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <select 
                className="px-3 py-2 border rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="availability">Availability</option>
              </select>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Interactive Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Hospital Locations Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-blue-50 rounded-lg p-8" style={{ minHeight: '400px' }}>
                {/* Simple Map Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="text-blue-600 mb-4">Interactive Hospital Map</p>
                    <p className="text-sm text-blue-500 mb-6">
                      Showing {filteredHospitals.length} hospitals near your location
                    </p>
                    
                    {/* Hospital Markers */}
                    <div className="relative w-64 h-48 mx-auto bg-white rounded-lg shadow-inner p-4">
                      <div className="grid grid-cols-3 gap-2">
                        {filteredHospitals.slice(0, 6).map((hospital, index) => (
                          <div
                            key={hospital.id}
                            className={cn(
                              "w-8 h-8 rounded-full border-2",
                              typographyClasses.focusRing,
                              "cursor-pointer transition-all hover:scale-110",
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
                            title={hospital.name}
                          >
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* User Location Marker */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white animate-pulse"></div>
                        <div className="text-xs text-blue-600 mt-1">You</div>
                      </div>
                    </div>
                    
                    {/* Map Legend */}
                    <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md">
                      <h5 className="font-semibold mb-2">Legend</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Normal Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>High Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Critical</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span>Your Location</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hospital Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <Card 
              key={hospital.id} 
              className={cn(
                typographyClasses.interactiveCard,
                "border-2",
                getStatusColor(hospital.status),
                selectedHospital?.id === hospital.id && "ring-2 ring-primary"
              )}
              id={`hospital-card-${hospital.id}`}
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${hospital.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectHospital(hospital);
                }
              }}
              onClick={() => handleSelectHospital(hospital)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{hospital.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getRatingStars(hospital.rating)}
                    </div>
                  </div>
                  <Badge variant={hospital.distance <= 2 ? "default" : "secondary"}>
                    {hospital.distance <= 2 ? "Nearest" : `${hospital.distance} km`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{hospital.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{hospital.phone}</span>
                  </div>

                  {/* Services */}
                  <div className="flex gap-2">
                    {hospital.emergencyServices && (
                      <Badge variant="destructive" className="text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        24/7 Emergency
                      </Badge>
                    )}
                    {hospital.ambulanceAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        Ambulance
                      </Badge>
                    )}
                    {hospital.bloodBankAvailable && (
                      <Badge variant="outline" className="text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        Blood Bank
                      </Badge>
                    )}
                  </div>

                  {/* Bed Availability */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{hospital.beds.available}</div>
                      <div className="text-xs text-muted-foreground">Available Beds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{hospital.beds.total}</div>
                      <div className="text-xs text-muted-foreground">Total Beds</div>
                    </div>
                  </div>

                  {/* Departments */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Departments & Specialists
                    </h4>
                    <div className="space-y-2">
                      {hospital.departments.slice(0, 3).map((dept, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <div className="font-medium text-sm">{dept.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {dept.availableDoctors} doctors • {dept.avgWaitTime}min wait
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-600">{dept.specialties[0]}</div>
                            <div className="text-xs text-green-600">{dept.specialties[1]}</div>
                          </div>
                        </div>
                      ))}
                      {hospital.departments.length > 3 && (
                        <div className="text-center text-sm text-muted-foreground pt-2">
                          +{hospital.departments.length - 3} more departments
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button size="sm" className="flex-1">
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Hospital Detail Modal */}
        {selectedHospital && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedHospital.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getRatingStars(selectedHospital.rating)}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedHospital(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hospital Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedHospital.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{selectedHospital.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedHospital.distance} km away</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Available Services</h4>
                      <div className="space-y-2">
                        {selectedHospital.emergencyServices && (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>24/7 Emergency Services</span>
                          </div>
                        )}
                        {selectedHospital.ambulanceAvailable && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span>Ambulance Services</span>
                          </div>
                        )}
                        {selectedHospital.bloodBankAvailable && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            <span>Blood Bank Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bed Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Bed Availability</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">{selectedHospital.beds.available}</div>
                          <div className="text-sm">Available</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-2xl font-bold text-gray-600">{selectedHospital.beds.total}</div>
                          <div className="text-sm">Total Beds</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-600">{selectedHospital.beds.icu}</div>
                          <div className="text-sm">ICU Beds</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-2xl font-bold text-red-600">{selectedHospital.beds.ventilators}</div>
                          <div className="text-sm">Ventilators</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHospital.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button className="flex-1">
                    Book Appointment
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Hospital
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HospitalRecommendations;
