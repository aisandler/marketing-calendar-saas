import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import BriefsList from './pages/BriefsList';
import BriefDetail from './pages/BriefDetail';
import CreateBrief from './pages/CreateBrief';
import ResourceManagement from './pages/ResourceManagement';
import CampaignsList from './pages/CampaignsList';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

// Root component to handle initial redirect
const Root = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Root: Error checking session:', error);
          navigate('/login', { replace: true });
          return;
        }
        
        console.log('Root: Auth initialized, user:', !!user, 'session:', !!session);
        
        if (session?.user) {
          console.log('Root: Session found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Root: No session found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Root: Error checking session:', error);
        navigate('/login', { replace: true });
      }
    };
    
    if (!loading) {
      if (user) {
        console.log('Root: User authenticated, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('Root: User not authenticated, checking session');
        checkSession();
      }
    }
  }, [user, loading, navigate]);
  
  // Show loading state while determining where to redirect
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  
  // This should not be visible as we redirect in the useEffect
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
};

// App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Dashboard Routes (Protected) */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/briefs" element={<BriefsList />} />
            <Route path="/briefs/:id" element={<BriefDetail />} />
            <Route path="/briefs/create" element={<CreateBrief />} />
            <Route path="/briefs/:id/edit" element={<CreateBrief />} />
            <Route path="/resources" element={<ResourceManagement />} />
            <Route path="/campaigns" element={<CampaignsList />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          
          {/* Root path */}
          <Route path="/" element={<Root />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
