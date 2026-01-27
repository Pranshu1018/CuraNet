import { useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  Bed,
  UserCheck,
  Building2,
  Package,
  BarChart3,
  Lightbulb,
  GitBranch,
  AlertTriangle,
  Shield,
  Droplets,
  Map,
  Trash2,
  Ambulance,
  Bug,
  ShieldCheck,
  Zap
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/types/auth";

const features = [
  { title: "Command Center", url: "/command-center", icon: BarChart3, role: ['admin'] },
  { title: "City Operations", url: "/dashboard", icon: Activity, role: ['admin', 'hospital_staff'] },
  { title: "Smart OPD", url: "/smart-opd", icon: Users, role: ['hospital_staff', 'doctor', 'nurse'] },
  { title: "Bed Availability", url: "/beds", icon: Bed, role: ['hospital_staff', 'nurse'] },
  { title: "Admission Workflow", url: "/admission", icon: UserCheck, role: ['hospital_staff', 'doctor', 'nurse'] },
  { title: "Hospital Network", url: "/network", icon: Building2, role: ['admin', 'hospital_staff'] },
  { title: "Inventory Tracking", url: "/inventory", icon: Package, role: ['hospital_staff'] },
  { title: "Micro-Interventions", url: "/interventions", icon: Lightbulb, role: ['admin'] },
  { title: "City Patient Flow", url: "/patient-flow", icon: GitBranch, role: ['admin', 'hospital_staff'] },
  { title: "Early Load Detection", url: "/load-detection", icon: AlertTriangle, role: ['admin'] },
  { title: "Resilience Index", url: "/resilience", icon: Shield, role: ['admin'] },
  { title: "Blood Bank", url: "/blood-bank", icon: Droplets, role: ['hospital_staff'] },
  { title: "City Health Heatmap", url: "/heatmap", icon: Map, role: ['admin', 'hospital_staff'] },
  { title: "Resource Decay Predictor", url: "/resource-decay", icon: Trash2, role: ['admin'] },
  { title: "Ambulance Detection", url: "/ambulance-detection", icon: Ambulance, role: ['hospital_staff', 'doctor', 'nurse'] },
  { title: "Disease Outbreak Detection", url: "/outbreak-detection", icon: Bug, role: ['admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  
  const filteredFeatures = features.filter(feature => {
    if (!feature.role) return true;
    return feature.role.includes(user?.role || '');
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-teal-800 bg-slate-900">
      <SidebarHeader className="p-0 overflow-hidden">
        <div className="p-4 space-y-4 bg-gradient-to-b from-teal-950/50 to-slate-900 border-b border-teal-800/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-medium shrink-0 border-2 border-teal-400 bg-white">
              <img src="/logo.png" alt="CuraNet Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <span 
                className="font-bold text-xl italic" 
                style={{ fontFamily: "'Lobster', cursive" }}
              >
                <span style={{ color: '#40E0D0' }}>Cura</span>
                <span className="text-white">Net</span>
              </span>
            )}
          </Link>

          {!collapsed && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-teal-700/50 backdrop-blur-md shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">
                  Authorized Access
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-teal-900/50 pb-1">
                  <span className="text-[10px] text-slate-400">Node Access</span>
                  <span className="text-[10px] text-teal-400 font-mono uppercase">
                    {user?.role ? ROLE_LABELS[user.role] : 'Guest'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Security</span>
                  <span className="text-[10px] text-teal-400 flex items-center gap-1">
                    <Zap className="w-2 h-2 fill-current" /> Encrypted
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/"
                  end
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive("/")
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                  activeClassName="bg-teal-500/10 text-teal-400"
                >
                  <Activity className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-teal-500/50 px-3 mb-2">
              Features
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredFeatures.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-teal-500/10 text-teal-400 font-medium"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      activeClassName="bg-teal-500/10 text-teal-400 font-medium"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {user?.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin/hospital-verification"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive("/admin/hospital-verification")
                          ? "bg-teal-500/10 text-teal-400 font-medium"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      activeClassName="bg-teal-500/10 text-teal-400 font-medium"
                    >
                      <Building2 className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>Hospital Verification</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-teal-400">System Online</span>
            </div>
            <p className="text-xs text-slate-400">
              All services operational
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}