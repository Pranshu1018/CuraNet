import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Heart, User, Clock, AlertTriangle, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { mediSyncServices } from '@/lib/firebase-services';
import { useEmergencyResponse } from '@/hooks/useEmergencyResponse';
import { EmergencyPanel } from '@/components/emergency/EmergencyPanel';
import { cn } from '@/lib/utils';
import { typographyClasses } from '@/lib/typography';

export const PatientPortal = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showEmergencyTracking, setShowEmergencyTracking] = useState(false);
  
  const { 
    triggerEmergency, 
    clearEmergency, 
    isLoading: emergencyLoading, 
    currentAlert, 
    ambulanceLocation,
    victimLocation,
    error
  } = useEmergencyResponse();

  // Load patient data from Firebase on mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;
      
      try {
        // Load patient appointments
        const patientData = await mediSyncServices.patients.get(user.id);
        if (patientData && patientData.appointments) {
          setAppointments(patientData.appointments);
        } else {
          // Set default appointments
          const defaultAppointments = [
            { id: 1, doctor: "Dr. Sarah Johnson", date: "2024-01-25", time: "10:00 AM", type: "General Checkup" },
            { id: 2, doctor: "Dr. Michael Chen", date: "2024-01-28", time: "2:30 PM", type: "Cardiology Consultation" },
          ];
          setAppointments(defaultAppointments);
        }

        // Load medical records
        if (patientData && patientData.medicalRecords) {
          setMedicalRecords(patientData.medicalRecords);
        } else {
          // Set default medical records
          const defaultRecords = [
            { id: 1, date: "2024-01-15", diagnosis: "Hypertension", doctor: "Dr. Sarah Johnson", notes: "Blood pressure elevated, monitor diet" },
            { id: 2, date: "2024-01-10", diagnosis: "Annual Physical", doctor: "Dr. Michael Chen", notes: "Overall health good, maintain exercise routine" },
          ];
          setMedicalRecords(defaultRecords);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
        toast.error('Failed to load patient data');
      }
    };

    loadPatientData();
  }, [user]);

  const handleBookAppointment = async () => {
    if (!user) return;
    
    setIsLoading(true);
    toast.loading('Opening appointment scheduler...');
    
    try {
      // Create appointment in Firebase
      const newAppointment = {
        id: Date.now(),
        doctor: "Dr. Sarah Johnson",
        date: new Date().toISOString().split('T')[0],
        time: "10:00 AM",
        type: "General Checkup",
        status: "scheduled",
        patientId: user.id,
        createdAt: new Date().toISOString()
      };

      await mediSyncServices.patients.update(user.id, {
        appointments: [...appointments, newAppointment]
      });
      
      setIsLoading(false);
      toast.success('Appointment scheduled successfully', {
        description: 'Your appointment has been booked with Dr. Sarah Johnson',
        action: {
          label: 'View Appointment',
          onClick: () => console.log('Navigate to appointment details')
        }
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      setIsLoading(false);
      toast.error('Failed to book appointment');
    }
  };

  const handleViewRecords = async () => {
    if (!user) return;
    
    setIsLoading(true);
    toast.loading('Loading medical records...');
    
    try {
      // Update patient record access
      await mediSyncServices.patients.update(user.id, {
        lastRecordAccess: new Date().toISOString()
      });
      
      setIsLoading(false);
      toast.success('Medical records loaded', {
        description: 'Your complete medical history is now available',
        action: {
          label: 'View Details',
          onClick: () => console.log('Navigate to detailed records')
        }
      });
    } catch (error) {
      console.error('Error loading records:', error);
      setIsLoading(false);
      toast.error('Failed to load medical records');
    }
  };

  const handleViewSummary = () => {
    setIsLoading(true);
    toast.loading('Generating health summary...');
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Health summary ready', {
        description: 'Your latest health metrics and trends are available',
        action: {
          label: 'View Summary',
          onClick: () => console.log('Navigate to health summary')
        }
      });
    }, 1000);
  };

  const handleEmergency = async () => {
    try {
      await triggerEmergency();
      setShowEmergencyTracking(true);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleAppointmentClick = (doctor: string, time: string) => {
    toast.info(`Appointment with ${doctor}`, {
      description: `Scheduled for ${time}`,
      action: {
        label: 'Reschedule',
        onClick: () => console.log('Reschedule appointment')
      }
    });
  };

  const handleContactHospital = () => {
    toast.success('Connecting to hospital...', {
      description: 'Your call is being connected to the hospital operator',
      action: {
        label: 'Video Call',
        onClick: () => console.log('Start video call')
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your health information and appointments</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
            role="group"
          >
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Book Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schedule a visit with your healthcare provider
              </CardDescription>
              <Button 
                className="w-full mt-3" 
                size="sm"
                onClick={handleBookAppointment}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Book Now'}
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
            role="group"
          >
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View your medical history and test results
              </CardDescription>
              <Button 
                variant="outline" 
                className="w-full mt-3" 
                size="sm"
                onClick={handleViewRecords}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'View Records'}
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
            role="group"
          >
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Health Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your vital signs and health metrics
              </CardDescription>
              <Button 
                variant="outline" 
                className="w-full mt-3" 
                size="sm"
                onClick={handleViewSummary}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'View Summary'}
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(typographyClasses.interactiveCard, "hover:shadow-lg hover-lift border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50")}
            role="group"
          >
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2 animate-pulse-slow">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Emergency</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Quick access to emergency services with real-time ambulance tracking
              </CardDescription>
              <Button 
                variant="destructive" 
                className="w-full mt-3 animate-pulse-slow" 
                size="sm"
                onClick={handleEmergency}
                disabled={emergencyLoading || isLoading}
              >
                {emergencyLoading ? 'Activating...' : '🚨 Emergency SOS'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Emergency Tracking Panel */}
          {showEmergencyTracking && currentAlert && ambulanceLocation && (
            <EmergencyPanel
              alert={currentAlert.alert}
              ambulance={ambulanceLocation}
              onClose={() => {
                setShowEmergencyTracking(false);
                clearEmergency();
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50",
                    typographyClasses.interactiveRow
                  )}
                  onClick={() => handleAppointmentClick('Dr. Sarah Johnson', 'Tomorrow, 10:30 AM')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAppointmentClick('Dr. Sarah Johnson', 'Tomorrow, 10:30 AM');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Dr. Sarah Johnson</p>
                      <p className="text-sm text-gray-600">General Checkup</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Tomorrow</p>
                    <p className="text-sm text-gray-600">10:30 AM</p>
                  </div>
                </div>

                <div 
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50",
                    typographyClasses.interactiveRow
                  )}
                  onClick={() => handleAppointmentClick('Dr. Michael Chen', 'Dec 28, 2:00 PM')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAppointmentClick('Dr. Michael Chen', 'Dec 28, 2:00 PM');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Dr. Michael Chen</p>
                      <p className="text-sm text-gray-600">Cardiology Consultation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Dec 28</p>
                    <p className="text-sm text-gray-600">2:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blood Pressure</span>
                  <Badge variant="secondary">120/80</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Heart Rate</span>
                  <Badge variant="secondary">72 bpm</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Temperature</span>
                  <Badge variant="secondary">98.6°F</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Checkup</span>
                  <Badge variant="outline">2 weeks ago</Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => toast.info('Health monitoring active', {
                    description: 'Your vital signs are being monitored continuously'
                  })}
                >
                  View Detailed Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Lab results uploaded</p>
                  <p className="text-xs text-gray-500">Blood test results from Dec 15</p>
                </div>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Appointment completed</p>
                  <p className="text-xs text-gray-500">Visit with Dr. Johnson</p>
                </div>
                <span className="text-xs text-gray-500">1 week ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleContactHospital}
              >
                <Phone className="w-4 h-4" />
                Call Hospital
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => toast.info('Emergency services location', {
                  description: 'Nearest emergency room: City General Hospital - 2.3 miles',
                  action: {
                    label: 'Get Directions',
                    onClick: () => {
                      window.open('https://maps.google.com/?q=City+General+Hospital');
                      toast.success('Opening maps...', { description: 'Getting directions to hospital' });
                    }
                  }
                })}
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
