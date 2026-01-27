import { useState } from 'react';
import { AlertCircle, Phone, MapPin, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmergencyButtonProps {
  onEmergencyClick: () => void;
  isActive?: boolean;
}

/**
 * Visually perfect red Emergency button component
 * Features: Red color, blinking animation, prominent design
 */
export const EmergencyButton = ({ onEmergencyClick, isActive = false }: EmergencyButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Main Emergency Button */}
      <button
        onClick={onEmergencyClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={`
          relative w-32 h-32 md:w-40 md:h-40 rounded-full
          bg-gradient-to-br from-red-600 to-red-700
          border-4 border-white shadow-2xl
          flex items-center justify-center
          transform transition-all duration-200
          ${isPressed ? 'scale-95' : 'scale-100'}
          ${isActive ? 'animate-pulse-slow' : ''}
          hover:shadow-red-500/50 hover:shadow-2xl
          active:scale-90
          focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-offset-2
          group
        `}
        aria-label="Emergency SOS Button"
      >
        {/* Blinking ring effect */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        {/* Inner glow effect */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-80 blur-sm" />

        {/* Button content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 mb-1 drop-shadow-lg" strokeWidth={2.5} />
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider drop-shadow-lg">
            SOS
          </span>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Emergency Label */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white text-sm md:text-base font-semibold flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-400" />
          Emergency Response
        </p>
        <p className="text-white/70 text-xs text-center max-w-xs">
          Click to send your location and alert nearby ambulances
        </p>
      </div>

      {/* Emergency Features Icons */}
      <div className="flex items-center gap-6 mt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-white/70">GPS</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-white/70">Alert</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-white/70">Live</span>
        </div>
      </div>
    </div>
  );
};
