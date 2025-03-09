import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Calendar, 
  LayoutDashboard, 
  FileText, 
  Users, 
  MapPin,
  LogOut, 
  Menu, 
  X, 
  Bell,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

const DashboardLayout: React.FC = () => {
  const { user, signOut, refreshSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Ensure we have a user
  useEffect(() => {
    if (!user) {
      console.log('DashboardLayout: No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      console.log('DashboardLayout: Signing out');
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation to login even if signOut fails
      navigate('/login');
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      console.log('DashboardLayout: Refreshing session');
      await refreshSession();
      // Show a brief success message or visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setIsRefreshing(false);
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Briefs', href: '/briefs', icon: FileText },
    { name: 'Campaigns', href: '/campaigns', icon: MapPin },
    { name: 'Resources', href: '/resources', icon: Users },
  ];

  // Only show user management for admins
  if (user?.role === 'admin') {
    navigation.push({ name: 'Users', href: '/users', icon: Users });
  }

  // If no user data is available, show a loading state
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
          Return to login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-opacity ease-linear duration-300`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          } transition-opacity ease-linear duration-300`}
          onClick={() => setSidebarOpen(false)}
        />

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition ease-in-out duration-300`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold">Marketing Calendar</span>
          </div>

          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`${
                          isActivePath(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                      >
                        <Icon
                          className={`${
                            isActivePath(item.href)
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-gray-500'
                          } mr-4 flex-shrink-0 h-6 w-6`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold">Marketing Calendar</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActivePath(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        isActivePath(item.href)
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex flex-col border-t border-gray-200 p-4 space-y-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="w-full flex items-center"
            >
              <RefreshCw className={`mr-3 h-5 w-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Session'}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full flex items-center"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Top navigation */}
        <div className="flex-1 relative z-0 focus:outline-none">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex-1">
              {navigation.find(item => isActivePath(item.href))?.name || 'Dashboard'}
            </h1>
            
            {/* Refresh button (visible on mobile) */}
            <div className="md:hidden mr-4">
              <button
                onClick={handleRefreshSession}
                disabled={isRefreshing}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Refresh session</span>
                <RefreshCw className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Notifications */}
            <div className="flex items-center md:ml-6">
              <button
                type="button"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 uppercase">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="ml-2 text-sm text-gray-700">{user?.name}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {userMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div 
                      className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100"
                    >
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <button
                      onClick={handleRefreshSession}
                      disabled={isRefreshing}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
