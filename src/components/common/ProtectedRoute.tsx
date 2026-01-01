import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import type { Permission } from '../../types';
import { ROUTES } from '../../config/constants';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
}) => {
  const { currentUser, userData, loading, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If user is admin, allow access to everything
  if (userData?.role === 'admin') {
    return <>{children}</>;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      const hasAll = requiredPermissions.every((p) => hasPermission(p));
      if (!hasAll) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
      }
    } else {
      if (!hasAnyPermission(requiredPermissions)) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
