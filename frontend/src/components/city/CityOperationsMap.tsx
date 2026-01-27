import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Bed, Activity, AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

 const MapContainerAny = MapContainer as any;
 const TileLayerAny = TileLayer as any;
 const MarkerAny = Marker as any;
 const PopupAny = Popup as any;

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  availableBeds?: number;
  totalBeds?: number;
  occupiedBeds?: number;
  status?: string;
}

interface CityOperationsMapProps {
  hospitals: Hospital[];
  onHospitalSelect: (hospital: any) => void;
}

const MapUpdater = ({ hospitals }: { hospitals: Hospital[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map(h => [h.lat, h.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Default to Mumbai center
      map.setView([19.0760, 72.8777], 12);
    }
  }, [hospitals, map]);
  
  return null;
};

const createHospitalIcon = (intensity: number, status?: string) => {
  const getColor = () => {
    if (intensity > 0.8 || status === 'Critical') return '#ef4444';
    if (intensity > 0.6 || status === 'Warning') return '#f59e0b';
    return '#10b981';
  };

  const color = getColor();
  const size = intensity > 0.8 ? 35 : intensity > 0.6 ? 30 : 25;

  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
      font-weight: bold;
      animation: ${intensity > 0.8 ? 'pulse 2s infinite' : 'none'};
    ">🏥</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export const CityOperationsMap = ({ hospitals, onHospitalSelect }: CityOperationsMapProps) => {
  const defaultCenter: [number, number] = [19.0760, 72.8777]; // Mumbai center

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 h-[600px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <MapPin className="w-5 h-5" />
          City Operations Map
        </h3>
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          Live
        </Badge>
      </div>

      <div style={{ height: 'calc(100% - 60px)', width: '100%' }} className="rounded-lg overflow-hidden">
        <MapContainerAny
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayerAny
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater hospitals={hospitals} />
          
          {hospitals.map((hospital) => (
            <MarkerAny
              key={hospital.id}
              position={[hospital.lat, hospital.lng]}
              icon={createHospitalIcon(hospital.intensity, hospital.status)}
              eventHandlers={{
                click: () => {
                  onHospitalSelect({
                    id: hospital.id,
                    name: hospital.name,
                    status: hospital.status || (hospital.intensity > 0.8 ? "critical" : hospital.intensity > 0.6 ? "high" : "normal"),
                    beds: {
                      total: hospital.totalBeds || 0,
                      available: hospital.availableBeds || 0,
                      icu: Math.floor((hospital.totalBeds || 0) * 0.1),
                      ventilators: Math.floor((hospital.totalBeds || 0) * 0.05)
                    },
                    emergency: hospital.intensity > 0.8,
                    location: { x: hospital.lat, y: hospital.lng }
                  });
                }
              }}
            >
              <PopupAny>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm">{hospital.name}</h3>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Occupancy:</span>
                      <Badge 
                        className={cn(
                          "text-xs",
                          hospital.intensity > 0.8 ? "bg-red-100 text-red-800" :
                          hospital.intensity > 0.6 ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        )}
                      >
                        {(hospital.intensity * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    
                    {hospital.totalBeds && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Beds:</span>
                          <span className="font-semibold">{hospital.totalBeds}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className={cn(
                            "font-semibold",
                            (hospital.availableBeds || 0) === 0 ? "text-red-600" :
                            (hospital.availableBeds || 0) < 5 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {hospital.availableBeds || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Occupied:</span>
                          <span className="font-semibold">{hospital.occupiedBeds || 0}</span>
                        </div>
                      </>
                    )}
                    
                    {hospital.intensity > 0.8 && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-semibold">High Load</span>
                      </div>
                    )}
                  </div>
                </div>
              </PopupAny>
            </MarkerAny>
          ))}
        </MapContainerAny>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000] border border-gray-200">
        <div className="space-y-2 text-xs">
          <div className="font-semibold mb-1">Status Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
            <span>Available (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
            <span>Warning (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white animate-pulse"></div>
            <span>Critical (&gt;80%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
