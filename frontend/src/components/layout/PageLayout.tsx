import React from "react";
import { typographyClasses } from "@/lib/typography";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function PageLayout({ 
  children, 
  title, 
  description, 
  className = "",
  compact = false 
}: PageLayoutProps) {
  return (
    <div className={`${compact ? typographyClasses.pageCompact : typographyClasses.page} ${className}`}>
      {/* Page Header */}
      <div className={compact ? "mb-5" : "mb-6"}>
        <h1 className={typographyClasses.pageHeader}>{title}</h1>
        {description && (
          <p className={typographyClasses.pageDescription}>{description}</p>
        )}
      </div>
      
      {/* Page Content */}
      <div className={compact ? "space-y-4" : "space-y-6"}>
        {children}
      </div>
    </div>
  );
}

interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageSection({ 
  children, 
  title, 
  description, 
  className = "" 
}: PageSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {title && (
        <div>
          <h2 className={typographyClasses.sectionHeader}>{title}</h2>
          {description && (
            <p className={typographyClasses.description}>{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function PageCard({ 
  children, 
  title, 
  description, 
  className = "",
  compact = false 
}: PageCardProps) {
  return (
    <div className={`${typographyClasses.card} ${className}`}>
      <div className={compact ? typographyClasses.cardCompact : typographyClasses.cardContent}>
        {title && (
          <div className="mb-4">
            <h3 className={typographyClasses.cardHeader}>{title}</h3>
            {description && (
              <p className={typographyClasses.description}>{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
