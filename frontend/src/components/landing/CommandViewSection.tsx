import { LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, Monitor, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CommandViewSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* CuraNet Branded Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-sm font-medium mb-6">
              <Monitor className="w-4 h-4" />
              CuraNet Command Center
            </div>
            
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-6">
              Real-Time Healthcare Intelligence
            </h2>
            
            <p className="text-teal-200 mb-8 text-lg">
              Advanced medical dashboard providing critical insights into patient flow, bed occupancy, 
              emergency response, and resource allocation for superior healthcare management.
            </p>

            {/* Medical-themed Feature Points */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-white">Live Patient Monitoring</h4>
                  <p className="text-sm text-slate-300">Real-time patient status and care coordination across all departments</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-white">Critical Care Alerts</h4>
                  <p className="text-sm text-slate-300">Automated emergency notifications and medical response coordination</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-white">Healthcare Analytics</h4>
                  <p className="text-sm text-slate-300">Predictive insights for patient care optimization and resource planning</p>
                </div>
              </div>
            </div>

            {/* Action Buttons with updated routing and styles */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white border-teal-500">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Access CuraNet Command
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-teal-400 text-teal-300 hover:bg-teal-800">
                  View Healthcare Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* Medical Dashboard Mockup with Activity Feed */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-400 text-sm ml-4">CuraNet Command Center</span>
              </div>
              
              {/* Mock Metrics: Patient Status and ICU Capacity */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-slate-400">Patient Status</span>
                  </div>
                  <div className="text-2xl font-sans font-bold text-white">247</div>
                  <div className="text-xs text-green-400">+12% from yesterday</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-400">ICU Capacity</span>
                  </div>
                  <div className="text-2xl font-sans font-bold text-white">89%</div>
                  <div className="text-xs text-orange-400">Near capacity</div>
                </div>
              </div>

              {/* Mock Live Activity Feed */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-slate-300">Emergency admission - Cardiology</span>
                  <span className="text-xs text-slate-500 ml-auto">2m ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm text-slate-300">Blood bank alert - Type O- low</span>
                  <span className="text-xs text-slate-500 ml-auto">5m ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-slate-300">Ambulance dispatched - Emergency</span>
                  <span className="text-xs text-slate-500 ml-auto">8m ago</span>
                </div>
              </div>
            </div>

            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};