import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [forceRedirect, setForceRedirect] = useState(false);

  // Force a redirect if we detect an authentication issue
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if we have a session but no user data
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && !user && !loading) {
          console.warn('Session exists but no user data found - forcing redirect to login');
          // We have a session but no user data - this is an inconsistent state
          await supabase.auth.signOut(); // Clear the session
          setForceRedirect(true);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setForceRedirect(true);
      }
    };
    
    checkAuthState();
  }, [user, loading]);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log('Loading timeout reached - forcing redirect to login');
        setLoadingTimeout(true);
      }, 3000); // Reduced to 3 seconds for better UX
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // If we're still loading and haven't hit the timeout, show loading spinner
  if (loading && !loadingTimeout && !forceRedirect) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // If loading timed out, force redirect, or we're not authenticated, redirect to login
  if (loadingTimeout || forceRedirect || !user) {
    console.log('Redirecting to login: timeout =', loadingTimeout, 'forceRedirect =', forceRedirect, 'user =', !!user);
    
    // Clear any existing session before redirecting
    supabase.auth.signOut().catch(error => {
      console.error('Error signing out before redirect:', error);
    });
    
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location, authError: true }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('Redirecting to dashboard: insufficient permissions');
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
