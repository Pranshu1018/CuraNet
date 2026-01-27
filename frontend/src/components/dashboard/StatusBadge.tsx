import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "available" | "occupied" | "reserved" | "maintenance" | "critical" | "warning" | "normal";
  label?: string;
  size?: "sm" | "md";
}

const statusConfig = {
  available: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Available" },
  occupied: { bg: "bg-critical/10", text: "text-critical", dot: "bg-critical", label: "Occupied" },
  reserved: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning", label: "Reserved" },
  maintenance: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Maintenance" },
  critical: { bg: "bg-critical/10", text: "text-critical", dot: "bg-critical", label: "Critical" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning", label: "Warning" },
  normal: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Normal" },
};

export const StatusBadge = ({ status, label, size = "md" }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      config.bg,
      config.text,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <span className={cn(
        "rounded-full animate-pulse-soft",
        config.dot,
        size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"
      )} />
      {label || config.label}
    </div>
  );
};
