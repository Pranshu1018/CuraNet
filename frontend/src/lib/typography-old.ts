// src/lib/typography.ts

export const typographyClasses = {
  // Page headers - consistent across all pages
  pageHeader: "font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2",
  pageDescription: "text-muted-foreground text-sm md:text-base mb-8 max-w-3xl",
  
  // Section headers
  sectionHeader: "text-xl md:text-2xl font-semibold text-foreground mb-4",
  subsectionHeader: "text-lg font-semibold text-foreground mb-3",
  cardHeader: "text-lg font-semibold text-foreground",
  
  // Descriptions and small text
  description: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  metricLabel: "text-sm text-muted-foreground font-medium",
  
  // Tables
  tableHeader: "text-left py-3 px-4 text-sm font-semibold text-muted-foreground bg-muted/50",
  
  // Page layout containers
  page: "container mx-auto px-4 py-6 md:py-8 max-w-7xl",
  pageCompact: "container mx-auto px-4 py-4 max-w-7xl",
  
  // Card layouts
  card: "bg-card border border-border rounded-xl shadow-sm",
  cardContent: "p-6",
  cardCompact: "p-4",
  
  // Grid layouts
  grid: {
    stats: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
    cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    fullWidth: "grid grid-cols-1 gap-6"
  },
  
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