import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface DiseaseOutbreak {
  id?: string;
  zone: string;
  lat: number;
  lng: number;
  disease: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active_cases: number;
  reported_at: any;
  last_updated: any;
}

interface DiseaseOutbreakMapProps {
  outbreaks: DiseaseOutbreak[];
  loading?: boolean;
  onOutbreakClick?: (outbreak: DiseaseOutbreak) => void;
}

const DiseaseOutbreakMap: React.FC<DiseaseOutbreakMapProps> = ({ 
  outbreaks = [], 
  loading = false,
  onOutbreakClick 
}) => {
  // Mumbai center coordinates
  const mumbaiCenter = [19.0760, 72.8777];

  // Color logic based on disease severity
  const getOutbreakColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626'; // red
      case 'high': return '#F97316'; // orange
      case 'medium': return '#EAB308'; // yellow
      case 'low': return '#22C55E'; // green
      default: return '#6B7280'; // gray
    }
  };

  // Filter out outbreaks with invalid coordinates
  const validOutbreakData = outbreaks.filter(outbreak => {
    const lat = parseFloat(outbreak.lat.toString());
    const lng = parseFloat(outbreak.lng.toString());
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });

  return (
    <div className="relative" style={{ height: '500px', width: '100%' }}>
      {/* Warning overlay for data issues */}
      {(!loading && validOutbreakData.length === 0) && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm">
          ⚠️ No outbreak data available
        </div>
      )}

      <MapContainer
        center={mumbaiCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        {...({} as any)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          {...({} as any)}
        />
        
        {/* Permanent debug marker at Mumbai center */}
        <CircleMarker
          center={mumbaiCenter}
          radius={20}
          fillColor="#3B82F6"
          color="#3B82F6"
          weight={2}
          opacity={0.8}
          fillOpacity={0.5}
          {...({} as any)}
        >
          <Popup>
            <div>Mumbai Center</div>
          </Popup>
        </CircleMarker>
        
        {/* Disease outbreak markers */}
        {validOutbreakData.map((outbreak) => {
          const radius = 8 + (outbreak.active_cases / 10);
          const color = getOutbreakColor(outbreak.severity);
          const lat = parseFloat(outbreak.lat.toString());
          const lng = parseFloat(outbreak.lng.toString());
          
          return (
            <CircleMarker
              key={`outbreak-${outbreak.id}`}
              center={[lat, lng]}
              radius={radius}
              fillColor={color}
              color={color}
              weight={outbreak.severity === 'critical' ? 3 : 2}
              opacity={0.8}
              fillOpacity={0.6}
              eventHandlers={{
                click: () => onOutbreakClick && onOutbreakClick(outbreak)
              }}
              {...({} as any)}
            >
              <Popup>
                <div>
                  <strong>{outbreak.disease}</strong><br/>
                  Zone: {outbreak.zone}<br/>
                  Severity: {outbreak.severity.toUpperCase()}<br/>
                  Active Cases: {outbreak.active_cases}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default DiseaseOutbreakMap;
