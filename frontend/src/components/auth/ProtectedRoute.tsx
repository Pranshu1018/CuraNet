import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof typeof ROLE_PERMISSIONS[UserRole];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}) => {
  const { isAuthenticated, user, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user?.role || !roles.includes(user.role)) {
      const fallbackComponent = fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
      return <>{fallbackComponent}</>;
    }
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const fallbackComponent = fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have the required permissions to access this page.</p>
        </div>
      </div>
    );
    return <>{fallbackComponent}</>;
  }

  return <>{children}</>;
};

// Higher-order component for role-based protection
export const withRoleProtection = (
  requiredRole: UserRole,
  fallback?: React.ReactNode
) => {
  return (Component: React.ComponentType<any>) => {
    return (props: any) => (
      <ProtectedRoute requiredRole={requiredRole} fallback={fallback}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Higher-order component for permission-based protection
export const withPermissionProtection = (
  requiredPermission: keyof typeof ROLE_PERMISSIONS[UserRole],
  fallback?: React.ReactNode
) => {
  return (Component: React.ComponentType<any>) => {
    return (props: any) => (
      <ProtectedRoute requiredPermission={requiredPermission} fallback={fallback}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};
