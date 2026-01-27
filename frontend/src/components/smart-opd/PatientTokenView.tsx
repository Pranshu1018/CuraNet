import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { mediSyncServices } from "@/lib/firebase-services";
import { toast } from "sonner";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  RefreshCw,
  Stethoscope,
  Timer,
  Users,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientTokenViewProps {
  patientId: string;
  phoneNumber: string;
}

interface PatientToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  phone: string;
  doctor: any;
  department: string;
  roomNumber: string;
  checkInTime: string;
  estimatedConsultationTime: string;
  actualConsultationTime?: string;
  status: "waiting" | "in-consultation" | "checked-in" | "completed" | "delayed";
  priority: "urgent" | "high" | "normal" | "emergency";
  positionInQueue: number;
  patientsAhead: number;
  estimatedWaitTime: number;
  isEmergency: boolean;
  notifications: any[];
  symptoms: string;
  registrationTime: string;
}

export const PatientTokenView: React.FC<PatientTokenViewProps> = ({
  patientId,
  phoneNumber
}) => {
  const [token, setToken] = useState<PatientToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Load patient token
  useEffect(() => {
    loadPatientToken();
    
    // Set up real-time listener
    const unsubscribe = mediSyncServices.smartOPD.listenToTokens((tokensData) => {
      if (tokensData && Object.keys(tokensData).length > 0) {
        const patientTokens = Object.entries(tokensData).filter(([id, token]: [string, any]) => 
          token.phone === phoneNumber
        );
        
        if (patientTokens.length > 0) {
          const [tokenId, tokenData] = patientTokens[0];
          setToken({
            id: tokenId,
            ...tokenData
          } as PatientToken);
        }
      }
    });

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(timer);
    };
  }, [patientId, phoneNumber]);

  const loadPatientToken = async () => {
    try {
      setLoading(true);
      const tokensData = await mediSyncServices.smartOPD.getTokens();
      
      if (tokensData) {
        const patientTokens = Object.entries(tokensData).filter(([id, token]: [string, any]) => 
          token.phone === phoneNumber
        );
        
        if (patientTokens.length > 0) {
          const [tokenId, tokenData] = patientTokens[0];
          setToken({
            ...tokenData,
            id: tokenId
          } as PatientToken);
        }
      }
    } catch (error) {
      console.error('Error loading patient token:', error);
      toast.error('Failed to load token information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPatientToken();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-consultation": return "bg-blue-100 text-blue-800 border-blue-200";
      case "checked-in": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "delayed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency": return "bg-red-100 text-red-800";
      case "urgent": return "bg-orange-100 text-orange-800";
      case "high": return "bg-yellow-100 text-yellow-800";
      case "normal": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeRemaining = () => {
    if (!token || token.status === "completed" || token.status === "in-consultation") {
      return null;
    }

    const now = new Date();
    const estimatedTime = new Date();
    const [timeHours, timeMinutes] = token.estimatedConsultationTime.split(':');
    estimatedTime.setHours(parseInt(timeHours), parseInt(timeMinutes));
    
    const diffMs = estimatedTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return "Any moment now";
    if (diffMins <= 5) return `${diffMins} minutes`;
    if (diffMins <= 60) return `${diffMins} minutes`;
    
    const totalHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${totalHours}h ${remainingMins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Token Found</h3>
          <p className="text-muted-foreground mb-4">
            You don't have any active OPD tokens. Please register at the hospital reception.
          </p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Header */}
      <Card className={cn(
        "border-2",
        token.isEmergency && "border-red-200 bg-red-50"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "px-4 py-2 rounded-full text-lg font-bold",
                  token.isEmergency 
                    ? "bg-red-100 text-red-800" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {token.tokenNumber}
                </div>
                <Badge className={getStatusColor(token.status)}>
                  {token.status.replace('-', ' ')}
                </Badge>
                <Badge className={getPriorityColor(token.priority)}>
                  {token.priority.toUpperCase()}
                </Badge>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{token.patientName}</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                  <span>Dr. {token.doctor?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{token.roomNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{token.phone}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {token.positionInQueue}
              </div>
              <div className="text-sm text-muted-foreground">Position in Queue</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {token.patientsAhead}
              </div>
              <div className="text-sm text-muted-foreground">Patients Ahead</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {getTimeRemaining()}
              </div>
              <div className="text-sm text-muted-foreground">Estimated Wait</div>
            </div>
          </div>

          {/* Progress Bar */}
          {token.status === "waiting" && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Queue Progress</span>
                <span>{Math.max(0, 100 - (token.estimatedWaitTime * 2))}%</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (token.estimatedWaitTime * 2))} 
                className="h-3"
              />
            </div>
          )}

          {/* Status Messages */}
          <div className={cn(
            "p-4 rounded-lg border",
            token.status === "in-consultation" && "bg-blue-50 border-blue-200",
            token.status === "waiting" && token.positionInQueue <= 2 && "bg-green-50 border-green-200",
            token.status === "delayed" && "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2">
              {token.status === "in-consultation" && (
                <>
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Currently in consultation with Dr. {token.doctor?.name}
                  </span>
                </>
              )}
              {token.status === "waiting" && token.positionInQueue === 1 && (
                <>
                  <ArrowRight className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    You are next! Please proceed to {token.roomNumber}
                  </span>
                </>
              )}
              {token.status === "waiting" && token.positionInQueue === 2 && (
                <>
                  <Timer className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    1 patient ahead of you. Get ready!
                  </span>
                </>
              )}
              {token.status === "delayed" && (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">
                    Doctor is running late. Updated time: {token.estimatedConsultationTime}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Consultation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Department</h4>
              <p className="text-muted-foreground">{token.department}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Doctor</h4>
              <p className="text-muted-foreground">Dr. {token.doctor?.name}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Room</h4>
              <p className="text-muted-foreground">{token.roomNumber}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Check-in Time</h4>
              <p className="text-muted-foreground">{token.checkInTime}</p>
            </div>
          </div>

          {token.symptoms && (
            <div>
              <h4 className="font-medium mb-1">Visit Reason</h4>
              <p className="text-muted-foreground">{token.symptoms}</p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-1">Estimated Consultation Time</h4>
            <p className="text-lg font-semibold text-primary">
              {token.estimatedConsultationTime}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {token.notifications && token.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {token.notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg border",
                  notification.type === "success" && "bg-green-50 border-green-200 text-green-800",
                  notification.type === "warning" && "bg-yellow-50 border-yellow-200 text-yellow-800",
                  notification.type === "urgent" && "bg-red-50 border-red-200 text-red-800",
                  notification.type === "info" && "bg-blue-50 border-blue-200 text-blue-800"
                )}
              >
                <div className="font-medium">{notification.message}</div>
                <div className="text-sm opacity-75">
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Time */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {currentTime.toLocaleString()}
      </div>
    </div>
  );
};
