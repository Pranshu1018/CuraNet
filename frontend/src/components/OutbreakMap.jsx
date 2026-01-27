import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const OutbreakMap = ({ hospitalData = [], diseaseOutbreaks = [], loading = false }) => {
  // Mumbai center coordinates
  const mumbaiCenter = [19.0760, 72.8777];

  // Color logic based on occupancy_ratio
  const getHospitalColor = (ratio) => {
    if (ratio > 0.8) return '#DC2626'; // red - critical
    if (ratio >= 0.6) return '#F97316'; // orange - warning
    return '#EAB308'; // yellow - normal
  };

  // Color logic based on disease severity
  const getOutbreakColor = (severity) => {
    switch (severity) {
      case 'critical': return '#DC2626'; // red
      case 'high': return '#F97316'; // orange
      case 'medium': return '#EAB308'; // yellow
      case 'low': return '#22C55E'; // green
      default: return '#6B7280'; // gray
    }
  };

  // Filter out hospitals with invalid coordinates
  const validHospitalData = hospitalData.filter(hospital => {
    const lat = parseFloat(hospital.lat);
    const lng = parseFloat(hospital.lng);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });

  // Filter out outbreaks with invalid coordinates
  const validOutbreakData = diseaseOutbreaks.filter(outbreak => {
    const lat = parseFloat(outbreak.lat);
    const lng = parseFloat(outbreak.lng);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });

  return (
    <div className="relative" style={{ height: '500px', width: '100%' }}>
      {/* Warning overlay for data issues */}
      {(!loading && validHospitalData.length === 0) && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm">
          ⚠️ No hospital data available
        </div>
      )}

      <MapContainer
        center={mumbaiCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        >
          <div>Mumbai Center</div>
        </CircleMarker>
        
        {/* Hospital data markers */}
        {validHospitalData.map((hospital) => {
          const ratio = parseFloat(hospital.occupancy_ratio) || 0;
          const radius = 10 + ratio * 30;
          const color = getHospitalColor(ratio);
          const lat = parseFloat(hospital.lat);
          const lng = parseFloat(hospital.lng);
          
          return (
            <CircleMarker
              key={`hospital-${hospital.id}`}
              center={[lat, lng]}
              radius={radius}
              fillColor={color}
              color={color}
              weight={2}
              opacity={0.8}
              fillOpacity={0.5}
            >
              <Popup>
                <div>
                  <strong>{hospital.name}</strong><br/>
                  Occupancy: {(ratio * 100).toFixed(1)}%<br/>
                  Beds: {hospital.total_beds || 'N/A'}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Disease outbreak markers */}
        {validOutbreakData.map((outbreak) => {
          const radius = 8 + (outbreak.active_cases / 10);
          const color = getOutbreakColor(outbreak.severity);
          const lat = parseFloat(outbreak.lat);
          const lng = parseFloat(outbreak.lng);
          
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

export default OutbreakMap;
