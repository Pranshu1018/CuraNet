# CuraNet Page Layout & Styling Guide

## 🎯 Overview
All feature pages should follow the consistent layout system using the `PageLayout`, `PageSection`, and `PageCard` components.

## 📐 Layout Structure

### Basic Page Structure
```tsx
import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";

export default function YourPage() {
  return (
    <PageLayout 
      title="Page Title"
      description="Brief description of the page purpose"
    >
      {/* Page Content */}
      <PageSection title="Section Title">
        <PageCard title="Card Title">
          Card content
        </PageCard>
      </PageSection>
    </PageLayout>
  );
}
```

## 🎨 Typography System

### Font Hierarchy
- **Headings**: Space Grotesk (display font)
- **Body Text**: Inter (clean, professional)
- **Code/Mono**: System monospace

### Typography Classes
```tsx
import { typographyClasses } from "@/lib/typography";

// Page Headers
typographyClasses.pageHeader        // h1 equivalent
typographyClasses.pageDescription   // Page subtitle

// Section Headers  
typographyClasses.sectionHeader     // h2 equivalent
typographyClasses.subsectionHeader  // h3 equivalent
typographyClasses.cardHeader        // Card title

// Text Elements
typographyClasses.description       // Secondary text
typographyClasses.small            // Small text
typographyClasses.metricLabel      // Metric labels
```

## 📦 Layout Components

### PageLayout
- **Purpose**: Main page wrapper with consistent spacing
- **Props**: `title`, `description`, `className`, `compact`
- **Spacing**: `container mx-auto px-4 py-6 md:py-8 max-w-7xl`

### PageSection  
- **Purpose**: Logical sections within a page
- **Props**: `title`, `description`, `className`
- **Spacing**: `space-y-4`

### PageCard
- **Purpose**: Content containers with consistent styling
- **Props**: `title`, `description`, `className`, `compact`
- **Styling**: `bg-card border border-border rounded-xl shadow-sm`

## 🎯 Color System

### Semantic Colors
```tsx
import { typographyClasses } from "@/lib/typography";

// Status Colors
typographyClasses.status.critical   // Red/Destructive
typographyClasses.status.warning    // Orange/Warning  
typographyClasses.status.success     // Green/Success
typographyClasses.status.info       // Blue/Info
```

### Design Tokens
- **Primary**: Teal (#40E0D0)
- **Foreground**: Slate colors
- **Background**: White/Light slate
- **Border**: Light slate
- **Muted**: Subtle gray

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Grid System
```tsx
// Stats Grid (4 columns on desktop)
typographyClasses.grid.stats

// Cards Grid (3 columns on desktop)
typographyClasses.grid.cards

// Full Width Grid
typographyClasses.grid.fullWidth
```

## 🔧 Common Patterns

### Stats Cards
```tsx
<div className={typographyClasses.grid.stats}>
  <PageCard>
    <StatCard title="Metric" value="123" icon={Icon} />
  </PageCard>
</div>
```

### Data Tables
```tsx
<PageCard title="Data Table">
  <table className="w-full">
    <thead>
      <tr className={typographyClasses.tableHeader}>
        <th>Column</th>
      </tr>
    </thead>
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
</PageCard>
```

### Action Bar
```tsx
<div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-2 rounded-xl border border-border shadow-sm">
    <Clock className="w-4 h-4 text-primary" />
    <span className="font-mono font-bold">{time}</span>
  </div>
  <Button variant="outline" size="icon">
    <Icon className="w-4 h-4" />
  </Button>
</div>
```

## ✅ Implementation Checklist

For each page:
- [ ] Use `PageLayout` as root wrapper
- [ ] Include meaningful title and description
- [ ] Use `PageSection` for logical groupings
- [ ] Use `PageCard` for content containers
- [ ] Apply consistent typography classes
- [ ] Use semantic color classes
- [ ] Ensure responsive design
- [ ] Test on mobile/tablet/desktop

## 🚀 Migration Steps

1. **Import Layout Components**
   ```tsx
   import { PageLayout, PageSection, PageCard } from "@/components/layout/PageLayout";
   ```

2. **Replace Root Container**
   ```tsx
   // Before
   <div className="container mx-auto px-4 py-8">
   
   // After  
   <PageLayout title="Title" description="Description">
   ```

3. **Update Typography**
   ```tsx
   // Before
   <h1 className="text-4xl font-bold">Title</h1>
   
   // After
   <h1 className={typographyClasses.pageHeader}>Title</h1>
   ```

4. **Standardize Cards**
   ```tsx
   // Before
   <div className="bg-white border rounded-lg p-4">
   
   // After
   <PageCard>
   ```

## 🎯 Best Practices

1. **Consistency First**: Always use layout components
2. **Semantic HTML**: Use proper heading hierarchy
3. **Accessibility**: Include proper ARIA labels
4. **Performance**: Lazy load heavy components
5. **Mobile First**: Design for mobile, enhance for desktop
