import React, { useEffect, useState, useRef } from 'react';
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
  const initialLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [maxLoadTimeReached, setMaxLoadTimeReached] = useState(false);
  
  // Check for session in localStorage as fallback
  const sessionFallback = () => {
    try {
      // Check if we have a session in localStorage
      const storageKey = 'marketing-cal-auth';
      const session = localStorage.getItem(storageKey);
      
      if (!session) return false;
      
      // Verify session is not expired (24 hours max)
      try {
        const { timestamp } = JSON.parse(session);
        // Only use local storage if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return true;
        }
        // Clear expired session
        localStorage.removeItem(storageKey);
        return false;
      } catch (parseError) {
        console.error('Error parsing session:', parseError);
        return false;
      }
    } catch (e) {
      console.error('Error checking local session:', e);
      return false;
    }
  };
  
  useEffect(() => {
    // Clean up any existing timers
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
    }
    
    if (maxLoadTimerRef.current) {
      clearTimeout(maxLoadTimerRef.current);
    }
    
    // Only show loading spinner after a short delay to prevent flash
    initialLoadTimerRef.current = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute: Showing loading spinner');
        setShowLoading(true);
      }
    }, 200); // Shorter delay for better UX

    // Force timeout after 5 seconds (longer to accommodate slow networks)
    maxLoadTimerRef.current = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Maximum loading time reached');
        setMaxLoadTimeReached(true);
      }
    }, 5000);

    return () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
      if (maxLoadTimerRef.current) {
        clearTimeout(maxLoadTimerRef.current);
      }
    };
  }, [loading]);

  // Reset state when loading changes
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      
      // Only reset max load time if we have a user or explicitly no user
      // This prevents flashing during auth state changes
      if (user !== null || maxLoadTimeReached) {
        setMaxLoadTimeReached(false);
      }
    }
  }, [loading, user, maxLoadTimeReached]);

  // If we have a localStorage session but auth is taking too long,
  // we'll show a nicer full-page loading instead of redirecting
  const hasLocalSession = sessionFallback();

  // If we've hit max load time but have a local session, keep showing loading
  // This prevents redirects when we likely have a valid session that's just slow to load
  if (maxLoadTimeReached) {
    if (hasLocalSession) {
      console.log('ProtectedRoute: Using fallback loading due to stored session');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-500">Reconnecting to your account...</p>
            <p className="text-xs text-gray-400">This is taking longer than usual. Please wait...</p>
          </div>
        </div>
      );
    } else {
      console.log('ProtectedRoute: Redirecting to login due to timeout with no stored session');
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
  }

  // Normal loading state
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
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Handle role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute: User role ${user.role} not allowed, redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
