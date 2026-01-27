import { 
  Users, 
  Bed, 
  ClipboardList, 
  Building2, 
  Package, 
  Droplets,
  ArrowRight,
  Lightbulb,
  GitBranch,
  AlertTriangle,
  Shield,
  Map,
  Trash2,
  Ambulance,
  Bug,
  Heart,
  Stethoscope,
  Monitor
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Users,
    title: "Patient Queue Management",
    description: "Intelligent patient triage and flow optimization using historical data to reduce wait times and improve care delivery.",
    color: "teal",
    link: "/opd-queue"
  },
  {
    icon: Bed,
    title: "Real-Time Bed Management",
    description: "Live bed availability tracking with smart allocation algorithms for optimal patient placement and visibility.",
    color: "cyan",
    link: "/beds"
  },
  {
    icon: ClipboardList,
    title: "Smart Patient Admissions",
    description: "AI-powered admission workflow that matches patient clinical needs with available hospital resources automatically.",
    color: "blue",
    link: "/admission"
  },
  {
    icon: Building2,
    title: "Hospital Network Coordination",
    description: "Seamless inter-hospital resource sharing and patient transfer management across the central healthcare network.",
    color: "teal",
    link: "/network"
  },
  {
    icon: Package,
    title: "Medical Supply Tracking",
    description: "Comprehensive inventory management for pharmaceuticals and equipment with predictive low-stock alerting.",
    color: "orange",
    link: "/inventory"
  },
  {
    icon: Droplets,
    title: "Blood Bank Operations",
    description: "Advanced blood inventory management with cross-hospital sharing and emergency donor coordination.",
    color: "red",
    link: "/blood-bank"
  },
  {
    icon: Lightbulb,
    title: "Clinical Decision Support",
    description: "AI-driven insights and micro-interventions for optimized patient care pathways and resource utilization.",
    color: "teal",
    link: "/interventions"
  },
  {
    icon: GitBranch,
    title: "Patient Flow Analytics",
    description: "Advanced analytics tracking patient journeys across the city to identify bottlenecks and optimize referral networks.",
    color: "cyan",
    link: "/patient-flow"
  },
  {
    icon: AlertTriangle,
    title: "Early Warning Systems",
    description: "Predictive analytics for capacity planning and emergency preparedness with real-time alerting for hospital loads.",
    color: "orange",
    link: "/load-detection"
  },
  {
    icon: Shield,
    title: "Healthcare Resilience Metrics",
    description: "Comprehensive dashboard measuring system preparedness, response capabilities, and operational health index.",
    color: "blue",
    link: "/resilience"
  },
  {
    icon: Map,
    title: "Regional Health Intelligence",
    description: "Geospatial visualization of healthcare resources, disease patterns, and population health metrics on a city heatmap.",
    color: "red",
    link: "/heatmap"
  },
  {
    icon: Trash2,
    title: "Resource Optimization",
    description: "Smart algorithms to minimize medical waste by predicting expirations and tracking usage velocity.",
    color: "orange",
    link: "/resource-decay"
  },
  {
    icon: Ambulance,
    title: "Emergency Response Coordination",
    description: "Real-time ambulance fleet management with intelligent dispatch and hospital routing systems for rapid response.",
    color: "teal",
    link: "/ambulance-detection"
  },
  {
    icon: Bug,
    title: "Public Health Surveillance",
    description: "Disease pattern analysis and outbreak prediction with automated response coordination for seasonal health trends.",
    color: "red",
    link: "/outbreak-detection"
  },
];

const colorMap = {
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
};

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          {/* Healthcare Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 mb-6 animate-fade-in">
            <Stethoscope className="w-4 h-4" />
            <span className="text-sm font-medium">Comprehensive Healthcare Solutions</span>
          </div>
          
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-4">
            Advanced Medical Management
          </h2>
          <p className="text-teal-200 max-w-2xl mx-auto text-lg">
            Cutting-edge technology solutions designed to optimize every aspect of healthcare delivery and patient care within the CuraNet ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              to="/login"
              className={cn(
                "group p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border transition-all duration-300 hover:shadow-xl animate-slide-up",
                colorMap[feature.color as keyof typeof colorMap]
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                colorMap[feature.color as keyof typeof colorMap]
              )}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-sans text-lg font-semibold mb-2 text-white group-hover:text-teal-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {feature.description}
              </p>
              <div className="flex items-center text-sm font-medium text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Sign In to Access <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Healthcare Trust Indicators Section */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex flex-wrap justify-center items-center gap-4 md:gap-8 px-8 py-6 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              <span className="text-white font-medium">HIPAA Compliant</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-teal-400" />
              <span className="text-white font-medium">Secure Medical Data</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <Monitor className="w-6 h-6 text-cyan-400" />
              <span className="text-white font-medium">24/7 Medical Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};