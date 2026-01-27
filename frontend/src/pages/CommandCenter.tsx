import { useCallback, useEffect, useRef, useState } from "react";
import { 
  Users, 
  Bed, 
  UserPlus, 
  Package, 
  AlertTriangle, 
  Activity,
  Clock,
  Droplets,
  Building2,
  Ambulance,
  Heart,
  Shield,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { typographyClasses, colorClasses } from "@/lib/typography";
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";

const recentAdmissions = [
  { id: "P-2024-001", name: "Rahul Sharma", department: "Cardiology", time: "10:30 AM", status: "admitted" },
  { id: "P-2024-002", name: "Priya Patel", department: "Orthopedics", time: "10:15 AM", status: "pending" },
  { id: "P-2024-003", name: "Amit Kumar", department: "General Medicine", time: "09:45 AM", status: "admitted" },
  { id: "P-2024-004", name: "Sneha Reddy", department: "Pediatrics", time: "09:30 AM", status: "admitted" },
];

const alerts = [
  { type: "warning", message: "Low stock: Paracetamol 500mg", time: "5 min ago" },
  { type: "critical", message: "ICU Bed 12 - Critical patient alert", time: "12 min ago" },
  { type: "warning", message: "Blood Bank: O- units running low", time: "30 min ago" },
];

const StatCard = ({ title, value, icon: Icon, variant, trend, subtitle, onClick }: any) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case "primary": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "accent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "success": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "warning": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={
        "bg-white backdrop-blur-sm rounded-2xl border border-gray-200 p-6 transition-all shadow-sm " +
        (onClick
          ? "cursor-pointer hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : "")
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${getVariantStyles(variant)} flex items-center justify-center border`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${colorClasses.card.text} mb-1`}>{value}</div>
      <div className={typographyClasses.metricLabel}>{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

const StatusBadge = ({ status, label, size }: any) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "available": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "reserved": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${size === 'sm' ? 'text-xs' : ''}`}>
      {label || status}
    </span>
  );
};

const CommandCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const departmentRef = useRef<HTMLDivElement | null>(null);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const admissionsRef = useRef<HTMLDivElement | null>(null);

  const scrollToRef = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <PageLayout 
      title="CuraNet Command Center"
      description="Real-time hospital operations overview"
      compact
    >
      {/* Action Bar */}
      <div className="flex items-center gap-4 bg-muted p-3 rounded-xl border border-border">
        <div className="text-right">
          <div className="text-xs text-muted-foreground">System Time</div>
          <div className="text-lg font-mono font-bold text-primary">{currentTime.toLocaleTimeString()}</div>
        </div>
        <StatusBadge status="normal" label="Operational" />
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="OPD Patients Today"
            value={127}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
            onClick={() => scrollToRef(departmentRef)}
          />
          <StatCard
            title="Bed Occupancy"
            value="84%"
            subtitle="168 of 200 beds occupied"
            icon={Bed}
            variant="accent"
            onClick={() => scrollToRef(departmentRef)}
          />
          <StatCard
            title="Admissions Today"
            value={23}
            icon={UserPlus}
            variant="success"
            trend={{ value: 8, isPositive: true }}
            onClick={() => scrollToRef(admissionsRef)}
          />
          <StatCard
            title="Low Stock Alerts"
            value={3}
            icon={Package}
            variant="warning"
            onClick={() => scrollToRef(alertsRef)}
          />
        </div>

        {/* Action Modules */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {[
            { title: "Hospital Network", icon: Building2, desc: "Manage interconnected hospital facilities.", color: "blue", link: "/network" },
            { title: "Ambulance Fleet", icon: Ambulance, desc: "Real-time tracking of emergency services.", color: "purple", link: "/ambulance-detection" },
            { title: "Blood Bank", icon: Droplets, desc: "Manage cross-hospital blood inventory.", color: "green", link: "/blood-bank" },
            { title: "Inventory", icon: Package, desc: "Track medical supplies and low-stock alerts.", color: "orange", link: "/inventory" },
            { title: "Patient Flow", icon: Heart, desc: "Analyze and optimize care pathways.", color: "red", link: "/patient-flow" },
            { title: "Resilience", icon: Shield, desc: "Monitor system preparedness metrics.", color: "blue", link: "/resilience" },
          ].map((module) => (
            <div key={module.title} className={`bg-card rounded-2xl border border-border ${typographyClasses.cardContent} hover:shadow-md transition-all`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${module.color}-500/10 flex items-center justify-center`}>
                  <module.icon className={`w-5 h-5 text-${module.color}-400`} />
                </div>
                <h3 className={typographyClasses.cardHeader}>{module.title}</h3>
              </div>
              <p className={typographyClasses.description + " mb-4"}>{module.desc}</p>
              <Link to={module.link}>
                <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 text-gray-700">Open Module</Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Department Overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm" ref={departmentRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={typographyClasses.sectionHeader}>Department Status</h2>
              <Link to="/beds">
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">View All</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {[
                { name: "Emergency", beds: 20, occupied: 18, queue: 12, status: "critical" as const },
                { name: "ICU", beds: 15, occupied: 14, queue: 3, status: "warning" as const },
                { name: "General Ward", beds: 80, occupied: 62, queue: 8, status: "normal" as const },
                { name: "Pediatrics", beds: 30, occupied: 22, queue: 5, status: "normal" as const },
              ].map((dept) => (
                <div key={dept.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-teal-500" />
                    </div>
                    <div>
                      <div className={`font-medium ${colorClasses.card.text}`}>{dept.name}</div>
                      <div className={typographyClasses.small}>
                        {dept.occupied}/{dept.beds} beds • {dept.queue} in queue
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 md:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          dept.status === "critical" ? "bg-red-500" :
                          dept.status === "warning" ? "bg-orange-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(dept.occupied / dept.beds) * 100}%` }}
                      />
                    </div>
                    <StatusBadge status={dept.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity & Alerts Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm" ref={alertsRef}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={typographyClasses.sectionHeader}>Live Alerts</h2>
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${
                    alert.type === "critical" ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"
                  }`}>
                    <div className={`text-sm font-semibold ${
                      alert.type === "critical" ? "text-red-700" : "text-orange-700"
                    }`}>
                      {alert.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h2 className={typographyClasses.sectionHeader + " mb-4"}>Quick Navigation</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/opd-queue"><Button variant="outline" className="w-full text-xs">OPD Queue</Button></Link>
                <Link to="/beds"><Button variant="outline" className="w-full text-xs">Bed Status</Button></Link>
                <Link to="/blood-bank"><Button variant="outline" className="w-full text-xs">Blood Bank</Button></Link>
                <Link to="/admission"><Button variant="outline" className="w-full text-xs">Admission</Button></Link>
              </div>
            </div>
          </div>
        </div>

        {/* Admissions Table */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm" ref={admissionsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={typographyClasses.sectionHeader}>Recent Admissions</h2>
            <Button variant="ghost" size="sm" className="text-teal-600">View Archive</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className={typographyClasses.tableHeader}>Patient ID</th>
                  <th className={typographyClasses.tableHeader}>Name</th>
                  <th className={typographyClasses.tableHeader}>Department</th>
                  <th className={typographyClasses.tableHeader}>Time</th>
                  <th className={typographyClasses.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAdmissions.map((admission) => (
                  <tr key={admission.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{admission.id}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{admission.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{admission.department}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{admission.time}</td>
                    <td className="py-3 px-4">
                      <StatusBadge 
                        status={admission.status === "admitted" ? "available" : "reserved"} 
                        label={admission.status === "admitted" ? "Admitted" : "Pending"} 
                        size="sm" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </PageLayout>
  );
};

export default CommandCenter;