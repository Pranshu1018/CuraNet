import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Clock, Phone, Radio, Ambulance as AmbulanceIcon } from 'lucide-react';
import { EmergencyMap } from './EmergencyMap';
import { Badge } from '@/components/ui/badge';

interface Location {
  latitude: number;
  longitude: number;
}

interface Ambulance {
  id: string;
  unitNumber: string;
  latitude: number;
  longitude: number;
  distance?: number;
  estimatedArrivalMinutes?: number;
  status: 'AVAILABLE' | 'BUSY';
}

interface EmergencyAlert {
  alertId: string;
  victimLocation: Location;
  assignedAmbulanceId: string;
  timestamp: Date;
  estimatedArrivalTime?: Date;
}

interface EmergencyPanelProps {
  alert: EmergencyAlert;
  ambulance: Ambulance;
  onClose: () => void;
}

/**
 * Emergency Panel Component
 * Displays emergency alert details, live map, and ambulance tracking
 */
export const EmergencyPanel = ({ alert, ambulance, onClose }: EmergencyPanelProps) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-red-600 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <CardTitle className="text-2xl flex items-center gap-2">
              <Radio className="w-6 h-6" />
              Emergency Alert Active
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alert Info Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">Emergency Location</h3>
                    <p className="text-sm text-gray-700">
                      Latitude: {alert.victimLocation.latitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-700">
                      Longitude: {alert.victimLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Alert ID: {alert.alertId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AmbulanceIcon className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Assigned Ambulance</h3>
                    <p className="text-lg font-bold text-blue-700 mb-1">{ambulance.unitNumber}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={ambulance.status === 'BUSY' ? 'bg-orange-500' : 'bg-green-500'}>
                        {ambulance.status}
                      </Badge>
                    </div>
                    {ambulance.distance && (
                      <p className="text-sm text-gray-700">
                        Distance: <span className="font-semibold">{ambulance.distance.toFixed(1)} km</span>
                      </p>
                    )}
                    {ambulance.estimatedArrivalMinutes && (
                      <p className="text-sm text-gray-700 mt-1">
                        ETA: <span className="font-semibold">{ambulance.estimatedArrivalMinutes} minutes</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timestamp Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Alert Time: {formatTime(alert.timestamp)}</span>
            </div>
            {alert.estimatedArrivalTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Estimated Arrival: {formatTime(alert.estimatedArrivalTime)}</span>
              </div>
            )}
          </div>

          {/* Live Map */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-600 animate-pulse" />
              Live Tracking Map
            </h3>
            <EmergencyMap
              victimLocation={alert.victimLocation}
              ambulanceLocation={ambulance}
            />
          </div>

          {/* Emergency Contact Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-yellow-700 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">Emergency Contacts</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('tel:911')}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call 911
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('tel:108')}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call 108 (Ambulance)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Emergency response activated!</strong> The nearest available ambulance ({ambulance.unitNumber}) 
              has been dispatched to your location. Real-time tracking is active. Stay calm and wait for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
