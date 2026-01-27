import { useState } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

interface Ambulance3DProps {
  onAlert: () => void;
}

export const Ambulance3D = ({ onAlert }: Ambulance3DProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex justify-center items-center py-8">
      <div 
        className={`relative cursor-pointer transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        onClick={onAlert}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 2D Ambulance SVG */}
        <svg 
          width="200" 
          height="100" 
          viewBox="0 0 200 100" 
          className={`drop-shadow-lg transition-all duration-300 ${isHovered ? 'drop-shadow-2xl' : ''}`}
        >
          {/* Ambulance Body */}
          <rect 
            x="20" 
            y="30" 
            width="120" 
            height="40" 
            fill={isHovered ? "#ff4444" : "#ffffff"} 
            stroke="#333" 
            strokeWidth="2"
            rx="5"
          />
          
          {/* Ambulance Cab */}
          <rect 
            x="100" 
            y="20" 
            width="40" 
            height="50" 
            fill={isHovered ? "#ff4444" : "#ffffff"} 
            stroke="#333" 
            strokeWidth="2"
            rx="3"
          />
          
          {/* Red Cross */}
          <rect x="65" y="40" width="30" height="20" fill="#ff0000" />
          <rect x="75" y="30" width="10" height="40" fill="#ff0000" />
          
          {/* Windows */}
          <rect x="105" y="25" width="30" height="15" fill="#87CEEB" stroke="#333" strokeWidth="1" />
          
          {/* Wheels */}
          <circle cx="45" cy="75" r="8" fill="#333" />
          <circle cx="135" cy="75" r="8" fill="#333" />
          
          {/* Lights */}
          <circle cx="15" cy="45" r="4" fill={isHovered ? "#ffff00" : "#ffd700"} />
          <circle cx="15" cy="55" r="4" fill="#ff0000" />
          
          {/* Emergency Text */}
          <text x="80" y="55" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
            911
          </text>
        </svg>
        
        {/* Hover Effect */}
        {isHovered && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            Click to Alert!
          </div>
        )}
        
        {/* Pulsing Effect */}
        <div className={`absolute inset-0 rounded-lg ${isHovered ? 'bg-red-400/20 animate-ping' : ''}`} />
      </div>
      
      <div className="text-center mt-6">
        <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Click the ambulance to alert nearby hospitals
          <Phone className="w-4 h-4 text-red-400" />
        </p>
      </div>
    </div>
  );
};
