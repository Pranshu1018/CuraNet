import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Building2, Users, AlertTriangle, Heart, Stethoscope, Shield, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { EmergencyButton } from "@/components/emergency/EmergencyButton";
import { EmergencyPanel } from "@/components/emergency/EmergencyPanel";
import { useEmergencyResponse } from "@/hooks/useEmergencyResponse";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const HeroSection = () => {
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const { 
    triggerEmergency, 
    clearEmergency, 
    isLoading, 
    currentAlert, 
    ambulanceLocation 
  } = useEmergencyResponse();

  const handleEmergencyClick = async () => {
    await triggerEmergency();
  };

  // Show panel when emergency alert is successfully created
  useEffect(() => {
    if (currentAlert && ambulanceLocation) {
      setShowEmergencyPanel(true);
    }
  }, [currentAlert, ambulanceLocation]);

  const handleClosePanel = () => {
    setShowEmergencyPanel(false);
    clearEmergency();
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Healthcare-themed Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        }}
      />
      
      {/* Medical-themed Teal Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-900/80 via-blue-900/60 to-slate-900/80" />

      {/* Medical Cross Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container relative mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Healthcare Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 mb-8 animate-fade-in">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Healthcare Management System</span>
          </div>

          {/* Heading with CuraNet Branding */}
          <h1 className="font-sans text-[32px] md:text-[48px] lg:text-[56px] font-[700] leading-[1.2] tracking-[-0.02em] text-white mb-6 animate-slide-up">
            Transforming Healthcare{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
              One Patient at a Time
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Intelligent hospital operations management with real-time patient care coordination, 
            resource optimization, and life-saving emergency response systems.
          </p>

          {/* CTA Buttons - Styled for CuraNet */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/login">
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg border-2 border-teal-500"
                onClick={() => toast.success('Accessing CuraNet Dashboard...', {
                  description: 'Please sign in to access your healthcare dashboard'
                })}
              >
                <Stethoscope className="w-5 h-5 mr-2" />
                CuraNet Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                className="border-2 border-teal-400/50 text-teal-100 bg-teal-500/10 backdrop-blur-sm hover:bg-teal-500/20 px-8 py-4 text-lg"
                onClick={() => toast.info('Exploring CuraNet Features...', {
                  description: 'Please sign in to discover comprehensive medical management tools'
                })}
              >
                <Shield className="w-5 h-5 mr-2" />
                CuraNet Features
              </Button>
            </Link>
          </div>

          {/* Emergency Alert Section - SOS System */}
          <div className="mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-gradient-to-br from-red-600/20 via-teal-900/40 to-red-900/20 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl p-8 md:p-10 max-w-4xl mx-auto shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <span className="text-white text-2xl font-bold">SOS</span>
                  </div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center drop-shadow-lg">
                  Emergency Medical Response
                </h3>
                <p className="text-white/90 text-center mb-8 max-w-2xl text-lg">
                  In case of medical emergency, press SOS button below. We'll instantly locate you, 
                  dispatch the nearest ambulance, and track it in real-time until help arrives.
                </p>
                
                {/* SOS Emergency Button - Using Advanced Emergency System */}
                <div className="flex flex-col items-center gap-6">
                  <EmergencyButton 
                    onEmergencyClick={handleEmergencyClick}
                    isActive={isLoading}
                  />
                  
                  <div className="text-center space-y-2">
                    <div className="text-white/80 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Emergency: 108</span>
                      </div>
                    </div>
                    <div className="text-white/60 text-xs">
                      Available 24/7 • Instant Dispatch • Real-time Tracking
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Healthcare Stats - Teal Themed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-6 rounded-2xl bg-teal-500/10 backdrop-blur-sm border border-teal-400/30">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-teal-300" />
              </div>
              <div className="font-sans text-[32px] font-[700] leading-[1.2] text-white mb-1">45%</div>
              <div className="font-sans text-sm text-teal-200">Reduced Wait Times</div>
            </div>
            <div className="p-6 rounded-2xl bg-cyan-500/10 backdrop-blur-sm border border-cyan-400/30">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-cyan-300" />
              </div>
              <div className="font-sans text-[32px] font-[700] leading-[1.2] text-white mb-1">Real-time</div>
              <div className="font-sans text-sm text-cyan-200">Bed Availability</div>
            </div>
            <div className="p-6 rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-400/30">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-blue-300" />
              </div>
              <div className="font-sans text-[32px] font-[700] leading-[1.2] text-white mb-1">12+</div>
              <div className="font-sans text-sm text-blue-200">Hospitals Connected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Kept your functional Emergency Panel with Live Map tracking */}
      {showEmergencyPanel && currentAlert && ambulanceLocation && (
        <EmergencyPanel
          alert={currentAlert.alert}
          ambulance={currentAlert.ambulance || ambulanceLocation}
          onClose={handleClosePanel}
        />
      )}

      {/* Scroll Indicator - Updated to Teal */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-teal-400/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-teal-400/50 animate-pulse-soft" />
        </div>
      </div>
    </section>
  );
};