import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "critical" | "primary" | "accent";
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
  critical: "bg-critical/5 border-critical/20",
  primary: "bg-primary/5 border-primary/20",
  accent: "bg-accent/5 border-accent/20",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) => {
  return (
    <div className={cn(
      "p-6 rounded-2xl border transition-all duration-200 hover:shadow-medium",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            trend.isPositive ? "bg-success/10 text-success" : "bg-critical/10 text-critical"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
      <div className="text-3xl font-display font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground/70 mt-1">{subtitle}</div>
      )}
    </div>
  );
};
