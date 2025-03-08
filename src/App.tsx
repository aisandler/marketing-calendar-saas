import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import TradeshowsList from './pages/TradeshowsList';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
            <Route path="/tradeshows" element={<TradeshowsList />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
