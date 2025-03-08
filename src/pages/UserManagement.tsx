import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash, Download, UserCog, Shield, UserCircle, UserPlus } from 'lucide-react';
import type { User } from '../types';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'contributor' as User['role']
  });

  // Only admins can access this page
  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setUsers(data as User[]);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setError(error.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEditUser) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          role: formData.role
        })
        .eq('id', currentEditUser.id)
        .select();
      
      if (error) throw error;
      
      // Update users list
      setUsers(users.map(u => 
        u.id === currentEditUser.id ? (data[0] as User) : u
      ));
      
      // Reset form and close modal
      setFormData({ name: '', role: 'contributor' });
      setCurrentEditUser(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setCurrentEditUser(user);
    setFormData({
      name: user.name,
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const exportToCsv = () => {
    const headers = [
      'Name',
      'Email',
      'Role',
      'Created At'
    ].join(',');
    
    const rows = users.map(user => [
      `"${user.name.replace(/"/g, '""')}"`,
      `"${user.email.replace(/"/g, '""')}"`,
      user.role,
      user.created_at
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'manager':
        return <UserCog className="h-5 w-5 text-blue-600" />;
      case 'contributor':
        return <UserCircle className="h-5 w-5 text-green-600" />;
      default:
        return <UserCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage users and their permissions</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={exportToCsv}
              className="px-3 py-2"
            >
              <Download className="h-5 w-5" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt={user.name}
                          />
                        ) : (
                          <div className="text-gray-600 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-1.5 text-sm text-gray-500 capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => openEditModal(user)}
                      disabled={user.id === currentUser?.id} // Can't edit yourself
                    >
                      <Edit className={`h-4 w-4 ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="contributor">Contributor</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
