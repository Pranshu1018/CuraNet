import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hospital, Ambulance, X, MapPin, Clock, Bed } from 'lucide-react';
import { useEmergencyAlert } from '@/hooks/useEmergencyAlert';

interface EmergencyAlertPanelProps {
  onClose: () => void;
}

export const EmergencyAlertPanel = ({ onClose }: EmergencyAlertPanelProps) => {
  const { alertedHospitals, alertedAmbulances, clearAlert } = useEmergencyAlert();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'high': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'available': return 'bg-green-500';
      case 'responding': return 'bg-blue-500';
      case 'transporting': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleClose = () => {
    clearAlert();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Emergency Alert Sent
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Hospitals Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Hospital className="w-5 h-5" />
              Nearby Hospitals Alerted ({alertedHospitals.length})
            </h3>
            <div className="space-y-3">
              {alertedHospitals.map((hospital) => (
                <div key={hospital.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{hospital.name}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hospital.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        {hospital.bedsAvailable} beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hospital.erWaitTime} min wait
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(hospital.status)}>
                    {hospital.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Ambulances Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Ambulance className="w-5 h-5" />
              Nearby Ambulances Alerted ({alertedAmbulances.length})
            </h3>
            <div className="space-y-3">
              {alertedAmbulances.map((ambulance) => (
                <div key={ambulance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{ambulance.unitNumber}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      {ambulance.distance} km away
                    </div>
                  </div>
                  <Badge className={getStatusColor(ambulance.status)}>
                    {ambulance.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              All nearby hospitals and available ambulances have been notified. 
              Emergency services are preparing to respond to your location.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
