import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  
  // Simple loading state management
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (loading) {
      // Add a slight delay to prevent flicker
      timer = setTimeout(() => {
        setShowLoading(true);
      }, 200);
    } else {
      setShowLoading(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);
  
  // Loading state
  if (loading) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    ) : null;
  }
  
  // No user - redirect to login
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Role-based access checking
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute: User role ${user.role} not allowed, redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;