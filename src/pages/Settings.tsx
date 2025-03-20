import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Users, ChevronRight } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  
  const settingsOptions = [
    {
      name: 'Brands Management',
      description: 'Manage brand profiles, logos, color schemes, and guidelines',
      href: '/brands',
      icon: Briefcase
    }
  ];
  
  // Only show user management for admins
  if (user?.role === 'admin') {
    settingsOptions.push({
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/users',
      icon: Users
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure and manage application settings, brands, and user access
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {settingsOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.name}
              to={option.href}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-full bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      {option.name}
                      <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Settings; 