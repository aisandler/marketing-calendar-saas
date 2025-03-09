import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check for session if no user is found
  useEffect(() => {
    const checkSession = async () => {
      if (!user && !loading && !isCheckingSession) {
        setIsCheckingSession(true);
        
        try {
          console.log('ProtectedRoute: Checking for session');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('ProtectedRoute: Error checking session:', error);
            navigate('/login', { state: { from: location }, replace: true });
            return;
          }
          
          if (session?.user) {
            console.log('ProtectedRoute: Session found, but no user data');
            setHasSession(true);
            // Don't navigate yet, wait for user data to be fetched
          } else {
            console.log('ProtectedRoute: No session found, redirecting to login');
            navigate('/login', { state: { from: location }, replace: true });
          }
        } catch (error) {
          console.error('ProtectedRoute: Error checking session:', error);
          navigate('/login', { state: { from: location }, replace: true });
        } finally {
          setIsCheckingSession(false);
        }
      }
    };
    
    checkSession();
  }, [user, loading, navigate, location, isCheckingSession]);

  // If we're still loading or checking session, show loading spinner
  if (loading || isCheckingSession) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // If we have a session but no user data, show a different message
  if (hasSession && !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Retrieving your account data...</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
          Return to login
        </button>
      </div>
    );
  }

  // If not authenticated and no session, redirect to login
  if (!user && !hasSession) {
    console.log('ProtectedRoute: No user and no session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: User does not have required role, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;
