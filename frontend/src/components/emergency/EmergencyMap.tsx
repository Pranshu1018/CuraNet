import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface EmergencyMapProps {
  victimLocation: Location | null;
  ambulanceLocation: Ambulance | null;
  className?: string;
}

/**
 * Component to update map view when locations change
 */
const MapUpdater = ({ 
  victimLocation, 
  ambulanceLocation 
}: { 
  victimLocation: Location | null; 
  ambulanceLocation: Ambulance | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (victimLocation && ambulanceLocation) {
      // Fit map to show both locations
      const bounds = L.latLngBounds(
        [victimLocation.latitude, victimLocation.longitude],
        [ambulanceLocation.latitude, ambulanceLocation.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (victimLocation) {
      map.setView([victimLocation.latitude, victimLocation.longitude], 15);
    } else if (ambulanceLocation) {
      map.setView([ambulanceLocation.latitude, ambulanceLocation.longitude], 15);
    }
  }, [victimLocation, ambulanceLocation, map]);

  return null;
};

/**
 * Create custom icon for markers
 */
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      font-weight: bold;
    ">${iconHtml}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

/**
 * Emergency Map Component
 * Displays victim location, ambulance location, and route between them
 */
export const EmergencyMap = ({ 
  victimLocation, 
  ambulanceLocation,
  className = ''
}: EmergencyMapProps) => {
  const routeRef = useRef<L.Polyline | null>(null);

  // Calculate route coordinates between victim and ambulance
  const routeCoordinates: [number, number][] = [];
  if (victimLocation && ambulanceLocation) {
    routeCoordinates.push(
      [victimLocation.latitude, victimLocation.longitude],
      [ambulanceLocation.latitude, ambulanceLocation.longitude]
    );
  }

  // Default center (can be adjusted)
  const defaultCenter: [number, number] = [19.0760, 72.8777]; // Mumbai default
  const center: [number, number] = victimLocation 
    ? [victimLocation.latitude, victimLocation.longitude]
    : defaultCenter;

  if (!victimLocation && !ambulanceLocation) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '400px' }}>
        <p className="text-gray-500">Waiting for emergency location data...</p>
      </div>
    );
  }

  // Create custom icons
  const victimIcon = createCustomIcon('#dc2626', '⚠️'); // Red blinking marker
  const ambulanceIcon = createCustomIcon('#2563eb', '🚑'); // Blue ambulance marker

  return (
    <div className={`relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg ${className}`} style={{ height: '500px' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater 
          victimLocation={victimLocation} 
          ambulanceLocation={ambulanceLocation} 
        />

        {/* Victim Location Marker - Red blinking */}
        {victimLocation && (
          <Marker
            position={[victimLocation.latitude, victimLocation.longitude]}
            icon={victimIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-red-600">Emergency Location</p>
                <p className="text-sm text-gray-600">
                  Lat: {victimLocation.latitude.toFixed(6)}
                  <br />
                  Lng: {victimLocation.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ambulance Location Marker */}
        {ambulanceLocation && (
          <Marker
            position={[ambulanceLocation.latitude, ambulanceLocation.longitude]}
            icon={ambulanceIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-blue-600">{ambulanceLocation.unitNumber}</p>
                <p className="text-sm text-gray-600">
                  Distance: {ambulanceLocation.distance?.toFixed(1)} km
                  {ambulanceLocation.estimatedArrivalMinutes && (
                    <>
                      <br />
                      ETA: {ambulanceLocation.estimatedArrivalMinutes} minutes
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {ambulanceLocation.status}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line between victim and ambulance */}
        {routeCoordinates.length === 2 && (
          <Polyline
            positions={routeCoordinates}
            color="#ef4444"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
            ref={routeRef}
          />
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000] border border-gray-200">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>
            <span>Emergency Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
            <span>Ambulance</span>
          </div>
          {ambulanceLocation?.distance && (
            <div className="pt-2 border-t border-gray-200">
              <p className="font-semibold text-gray-700">
                Distance: {ambulanceLocation.distance.toFixed(1)} km
              </p>
              {ambulanceLocation.estimatedArrivalMinutes && (
                <p className="text-xs text-gray-600">
                  ETA: ~{ambulanceLocation.estimatedArrivalMinutes} min
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
