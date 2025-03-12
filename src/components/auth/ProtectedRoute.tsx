import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Only show loading spinner after a short delay to prevent flash
    const loadingTimer = setTimeout(() => {
      if (loading) {
        setShowLoading(true);
      }
    }, 500);

    // Force redirect to login after a timeout
    const redirectTimer = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout reached');
        setShouldRedirect(true);
      }
    }, 5000); // 5 second timeout

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(redirectTimer);
    };
  }, [loading]);

  // Clear loading state when user or error state changes
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
    }
  }, [loading]);

  // Handle redirect timeout
  if (shouldRedirect) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Handle normal loading state
  if (loading) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading your account...</p>
          <p className="text-xs text-gray-400">Please wait...</p>
        </div>
      </div>
    ) : null;
  }

  // Handle unauthenticated access
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Handle role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
