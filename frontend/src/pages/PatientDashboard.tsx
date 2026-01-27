import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  Phone,
  Stethoscope,
  Calendar,
  MapPin,
  CheckCircle,
  Bell,
  Timer,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediSyncServices } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';

interface PatientToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  phone: string;
  email?: string;
  doctor: {
    name: string;
    department: string;
    room: string;
  };
  department: string;
  roomNumber: string;
  checkInTime: string;
  registrationTime: string;
  estimatedConsultationTime: string;
  actualConsultationTime?: string;
  status: "checked-in" | "waiting" | "in-consultation" | "completed" | "admission-pending";
  priority: "low" | "medium" | "high" | "urgent" | "emergency";
  positionInQueue: number;
  patientsAhead: number;
  estimatedWaitTime: number;
  isEmergency: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: "info" | "warning" | "success" | "urgent";
    timestamp: string;
    read: boolean;
  }>;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  const [patientTokens, setPatientTokens] = useState<PatientToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<PatientToken | null>(null);

  useEffect(() => {
    const loadPatientTokens = async () => {
      try {
        setLoading(true);
        
        // Get all tokens and filter by patient phone/email
        const allTokens = await mediSyncServices.smartOPD.getTokens();
        
        if (allTokens && Object.keys(allTokens).length > 0) {
          // Filter tokens by logged-in user's email or patientId
          const patientTokensArray = Object.entries(allTokens)
            .filter(([id, token]: [string, any]) => {
              // Filter by email or patientId
              const matchesEmail = user?.email && token.email === user.email;
              const matchesPatientId = user?.patientId && token.patientId === user.patientId;
              return matchesEmail || matchesPatientId;
            })
            .map(([id, token]: [string, any]) => ({
              ...token,
              id
            }));
          
          console.log(`Found ${patientTokensArray.length} tokens for user:`, user?.email || user?.patientId);
          setPatientTokens(patientTokensArray);
        }
      } catch (error) {
        console.error('Error loading patient tokens:', error);
        toast.error('Failed to load your tokens');
      } finally {
        setLoading(false);
      }
    };

    loadPatientTokens();

    // Set up real-time listener for token updates
    const unsubscribe = mediSyncServices.smartOPD.listenToTokens((tokens) => {
      if (tokens && Object.keys(tokens).length > 0) {
        // Filter tokens by logged-in user's email or patientId
        const patientTokensArray = Object.entries(tokens)
          .filter(([id, token]: [string, any]) => {
            // Filter by email or patientId
            const matchesEmail = user?.email && token.email === user.email;
            const matchesPatientId = user?.patientId && token.patientId === user.patientId;
            return matchesEmail || matchesPatientId;
          })
          .map(([id, token]: [string, any]) => ({
            ...token,
            id
          }));
        
        setPatientTokens(patientTokensArray);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in-consultation': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'admission-pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateWaitProgress = (token: PatientToken) => {
    if (token.status === 'completed' || token.status === 'in-consultation') return 100;
    if (token.status === 'checked-in') return 0;
    
    const totalWait = token.estimatedWaitTime;
    const elapsed = Math.max(0, totalWait - token.estimatedWaitTime);
    return Math.min(100, (elapsed / totalWait) * 100);
  };

  const filteredTokens = patientTokens.filter(token => 
    token.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your tokens...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
          <p className="text-muted-foreground">Track your consultation tokens and appointments in real-time</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by token number, name, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Active Tokens */}
        <div className="space-y-6">
          {filteredTokens.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Tokens</h3>
                <p className="text-muted-foreground">You don't have any active consultation tokens.</p>
                <Button className="mt-4">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTokens.map((token) => (
              <Card key={token.id} className={cn(
                "transition-all duration-200 hover:shadow-md",
                token.isEmergency && "border-red-200 bg-red-50"
              )}>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        token.isEmergency 
                          ? "bg-red-100 text-red-800" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {token.tokenNumber}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{token.patientName}</h3>
                        <p className="text-sm text-muted-foreground">{token.department} • Dr. {token.doctor.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(token.status)}>
                        {token.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(token.priority)}>
                        {token.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Queue Position */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">#{token.positionInQueue}</div>
                      <p className="text-sm text-muted-foreground">Queue Position</p>
                      {token.patientsAhead > 0 && (
                        <p className="text-xs text-muted-foreground">{token.patientsAhead} ahead</p>
                      )}
                    </div>

                    {/* Wait Time */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{token.estimatedWaitTime}m</div>
                      <p className="text-sm text-muted-foreground">Est. Wait Time</p>
                      <div className="mt-2">
                        <Progress value={calculateWaitProgress(token)} className="h-2" />
                      </div>
                    </div>

                    {/* Consultation Time */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{token.estimatedConsultationTime}</div>
                      <p className="text-sm text-muted-foreground">Est. Consultation</p>
                      {token.actualConsultationTime && (
                        <p className="text-xs text-green-600">Started: {token.actualConsultationTime}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{token.roomNumber}</div>
                      <p className="text-sm text-muted-foreground">Consultation Room</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{token.doctor.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  {token.notifications && token.notifications.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">Latest Updates</span>
                      </div>
                      <div className="space-y-1">
                        {token.notifications.slice(-3).map((notification) => (
                          <div key={notification.id} className="text-xs text-blue-700">
                            {notification.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Hospital
                    </Button>
                    {token.status === 'completed' && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Book Follow-up
                      </Button>
                    )}
                    {token.status === 'admission-pending' && (
                      <Button size="sm" variant="destructive">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        View Admission Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Current Time Display */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Current Time: {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientDashboard;
