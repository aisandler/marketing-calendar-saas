import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import BriefsList from './pages/BriefsList';
import BriefDetail from './pages/BriefDetail';
import CreateBrief from './pages/CreateBrief';
import ResourceManagement from './pages/ResourceManagement';
import TradeshowsList from './pages/TradeshowsList';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import CampaignsList from './pages/CampaignsList';
import CampaignDetail from './pages/CampaignDetail';
import CreateCampaign from './pages/CreateCampaign';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/campaigns" element={<CampaignsList />} />
            <Route path="/campaigns/new" element={<CreateCampaign />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/campaigns/:id/edit" element={<CreateCampaign />} />
            <Route path="/briefs" element={<BriefsList />} />
            <Route path="/briefs/:id" element={<BriefDetail />} />
            <Route path="/briefs/create" element={<CreateBrief />} />
            <Route path="/briefs/:id/edit" element={<CreateBrief />} />
            <Route path="/resources" element={<ResourceManagement />} />
            <Route path="/tradeshows" element={<TradeshowsList />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
