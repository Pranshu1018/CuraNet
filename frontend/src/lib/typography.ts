// src/lib/typography.ts

export const typographyClasses = {
  // Headings - using Inter with consistent sizing
  h1: "font-sans text-[32px] font-[700] leading-[1.2] tracking-[-0.02em] text-foreground",
  h2: "font-sans text-[24px] font-[600] leading-[1.3] tracking-[-0.01em] text-foreground",
  h3: "font-sans text-[20px] font-[600] leading-[1.4] text-foreground",
  
  // Command Center - optimized for critical decisions
  commandHeader: "font-sans text-[28px] font-[700] leading-[1.2] tracking-[-0.01em] text-foreground mb-6",
  commandSubheader: "font-sans text-[20px] font-[600] leading-[1.3] text-foreground mb-3",
  commandValue: "font-sans text-[32px] md:text-[36px] font-[700] leading-[1.2] text-foreground",
  commandLabel: "font-sans text-[14px] font-[500] leading-[1.4] text-muted-foreground",
  
  // Critical alerts - immediate visibility
  alert: "font-sans text-[16px] md:text-[18px] font-[600] leading-[1.2] text-destructive bg-destructive/10 border border-destructive/20",
  alertLarge: "font-sans text-[20px] md:text-[24px] font-[600] leading-[1.2] text-destructive",
  alertCritical: "font-sans text-[14px] font-[600] leading-[1.4] text-destructive",
  
  // Status indicators - clear at a glance
  statusCritical: "text-destructive bg-destructive/10 border-destructive/20",
  statusHigh: "text-warning bg-warning/10 border-warning/20",
  statusNormal: "text-success bg-success/10 border-success/20",
  statusInfo: "text-info bg-info/10 border-info/20",
  
  // Body text
  body: "font-sans text-[14px] md:text-[16px] font-[400] leading-[1.6] text-foreground",
  bodySmall: "font-sans text-[14px] font-[400] leading-[1.5] text-foreground",
  bodyQuiet: "font-sans text-[14px] font-[400] leading-[1.5] text-muted-foreground",
  description: "font-sans text-[14px] font-[400] leading-[1.5] text-muted-foreground",
  
  // UI elements
  ui: "font-sans text-[14px] font-[500] leading-[1.4] text-foreground",
  button: "font-sans text-[14px] font-[500] leading-[1.4]",
  label: "font-sans text-[14px] font-[500] leading-[1.4] text-foreground",
  input: "font-sans text-[14px] font-[400] leading-[1.5]",
  
  // Metrics and numbers - high visibility
  metric: "font-sans text-[16px] md:text-[18px] font-[600] leading-[1.2] text-foreground",
  metricLarge: "font-sans text-[20px] md:text-[24px] font-[700] leading-[1.2] text-foreground",
  metricValue: "font-sans text-[28px] md:text-[32px] font-[700] leading-[1.2] text-foreground",
  metricLabel: "font-sans text-[14px] font-[500] leading-[1.4] text-muted-foreground",
  metricCritical: "font-sans text-[24px] md:text-[28px] font-[700] leading-[1.2] text-destructive",
  
  // Small text
  small: "font-sans text-xs font-[400] leading-[1.4] text-muted-foreground",
  caption: "font-sans text-xs font-[500] leading-[1.4] text-muted-foreground",
  
  // Page layouts - command center design
  pageHeader: "font-sans text-[32px] font-[700] leading-[1.2] tracking-[-0.02em] text-foreground mb-4",
  pageDescription: "font-sans text-[14px] md:text-[16px] font-[400] leading-[1.6] text-muted-foreground mb-6 max-w-7xl",
  sectionHeader: "font-sans text-[24px] font-[600] leading-[1.3] tracking-[-0.01em] text-foreground mb-4",
  subsectionHeader: "font-sans text-[20px] font-[600] leading-[1.4] text-foreground mb-3",
  cardHeader: "font-sans text-[20px] font-[600] leading-[1.4] text-foreground",
  
  // Tables
  tableHeader: "font-sans text-left py-3 px-4 text-[14px] font-[500] leading-[1.4] text-muted-foreground bg-muted/50",
  tableCell: "font-sans text-[14px] font-[400] leading-[1.5] text-foreground py-2 px-4",
  
  // Navigation
  navBrand: "font-sans text-[24px] font-[700] leading-[1.3] tracking-[-0.01em]",
  navItem: "font-sans text-[14px] font-[500] leading-[1.4]",
  
  // Page layout containers
  page: "container mx-auto px-6 pt-4 pb-8 md:pt-5 md:pb-10 max-w-7xl",
  pageCompact: "container mx-auto px-4 pt-3 pb-6 md:pt-4 md:pb-8 max-w-7xl",
  
  // Card layouts
  card: "bg-card border border-border rounded-xl shadow-sm",
  cardContent: "p-6",
  cardCompact: "p-4",
  cardCommand: "bg-card border border-border rounded-xl shadow-sm p-4",

  // Micro-interactions (calm, command-center friendly)
  focusRing: "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  hoverLift: "transition-all hover:-translate-y-0.5 hover:shadow-md",
  interactiveCard: "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  interactiveRow: "cursor-pointer transition-all hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  
  // Grid layouts - optimized for admin decisions
  grid: {
    command: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    dashboard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    metrics: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
    cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    fullWidth: "grid grid-cols-1 gap-6"
  },
  
  // Command center layouts
  commandCenter: "flex flex-col lg:flex-row gap-8 mb-8",
  commandGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  commandSidebar: "flex-1 lg:flex lg:flex-col gap-6",
  commandMain: "flex-1 lg:col-span-2",
  commandAlerts: "flex-1 lg:col-span-1",
  
  // Status colors
  status: {
    critical: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-warning bg-warning/10 border-warning/20", 
    success: "text-success bg-success/10 border-success/20",
    info: "text-info bg-info/10 border-info/20"
  }
};

export const colorClasses = {
  card: {
    bg: "bg-card",
    border: "border-border",
    text: "text-foreground",
  },
  status: {
    critical: "text-destructive bg-destructive/50 border-destructive",
    warning: "text-warning bg-warning/50 border-warning",
    success: "text-success bg-success/50 border-success",
    info: "text-info bg-info/50 border-info",
  }
};
