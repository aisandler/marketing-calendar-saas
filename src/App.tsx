import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import BriefsList from './pages/BriefsList';
import BriefDetail from './pages/BriefDetail';
import CreateBrief from './pages/CreateBrief';
import ResourceHub from './pages/ResourceHub';
import BrandsManagement from './pages/BrandsManagement';
import UserManagement from './pages/UserManagement';
import DiagnosticsPage from './pages/DiagnosticsPage';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import CampaignsList from './pages/CampaignsList';
import CampaignDetail from './pages/CampaignDetail';
import CreateCampaign from './pages/CreateCampaign';
import BrandsDiagnosticsSimple from './pages/BrandsDiagnosticsSimple';
import MinimalBrandsTest from './pages/MinimalBrandsTest';
import SimpleBrands from './pages/SimpleBrands';
import ResetPassword from './pages/auth/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes with Dashboard Layout */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<CampaignsList />} />
            <Route path="/campaigns/new" element={<CreateCampaign />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/campaigns/:id/edit" element={<CreateCampaign />} />
            <Route path="/briefs" element={<BriefsList />} />
            <Route path="/briefs/:id" element={<BriefDetail />} />
            <Route path="/briefs/create" element={<CreateBrief />} />
            <Route path="/briefs/:id/edit" element={<CreateBrief />} />
            <Route path="/resources" element={<ResourceHub />} />
            <Route path="/brands" element={<SimpleBrands />} />
            <Route path="/brands/management" element={<BrandsManagement />} />
            <Route path="/brands/diagnostics" element={<BrandsDiagnosticsSimple />} />
            <Route path="/brands/test" element={<MinimalBrandsTest />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
