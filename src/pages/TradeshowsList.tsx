import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash, Download, Calendar, MapPin } from 'lucide-react';
import type { Tradeshow } from '../types';

const TradeshowsList = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tradeshows, setTradeshows] = useState<Tradeshow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTradeshow, setCurrentTradeshow] = useState<Tradeshow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  // Check if user has permission
  const canManageTradeshows = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const fetchTradeshows = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('tradeshows')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        
        setTradeshows(data as Tradeshow[]);
      } catch (error: any) {
        console.error('Error fetching tradeshows:', error);
        setError(error.message || 'Failed to load tradeshows.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTradeshows();
  }, []);

  const handleAddTradeshow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageTradeshows) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tradeshows')
        .insert([
          {
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            description: formData.description || null,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update tradeshows list
      setTradeshows([...tradeshows, data[0] as Tradeshow]);
      
      // Reset form and close modal
      setFormData({ name: '', start_date: '', end_date: '', description: '' });
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error adding tradeshow:', error);
      setError(error.message || 'Failed to add tradeshow.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTradeshow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageTradeshows || !currentTradeshow) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tradeshows')
        .update({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description || null
        })
        .eq('id', currentTradeshow.id)
        .select();
      
      if (error) throw error;
      
      // Update tradeshows list
      setTradeshows(tradeshows.map(t => 
        t.id === currentTradeshow.id ? (data[0] as Tradeshow) : t
      ));
      
      // Reset form and close modal
      setFormData({ name: '', start_date: '', end_date: '', description: '' });
      setCurrentTradeshow(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating tradeshow:', error);
      setError(error.message || 'Failed to update tradeshow.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTradeshow = async () => {
    if (!canManageTradeshows || !currentTradeshow) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('tradeshows')
        .delete()
        .eq('id', currentTradeshow.id);
      
      if (error) throw error;
      
      // Update tradeshows list
      setTradeshows(tradeshows.filter(t => t.id !== currentTradeshow.id));
      
      // Reset and close modal
      setCurrentTradeshow(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting tradeshow:', error);
      setError(error.message || 'Failed to delete tradeshow.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (tradeshow: Tradeshow) => {
    setCurrentTradeshow(tradeshow);
    setFormData({
      name: tradeshow.name,
      start_date: tradeshow.start_date,
      end_date: tradeshow.end_date,
      description: tradeshow.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (tradeshow: Tradeshow) => {
    setCurrentTradeshow(tradeshow);
    setIsDeleteModalOpen(true);
  };

  const exportToCsv = () => {
    const headers = [
      'Name',
      'Start Date',
      'End Date',
      'Description',
      'Created At'
    ].join(',');
    
    const rows = tradeshows.map(tradeshow => [
      `"${tradeshow.name.replace(/"/g, '""')}"`,
      tradeshow.start_date,
      tradeshow.end_date,
      `"${(tradeshow.description || '').replace(/"/g, '""')}"`,
      tradeshow.created_at
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tradeshows.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && tradeshows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sort tradeshows by start date
  const sortedTradeshows = [...tradeshows].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  // Determine if a tradeshow is upcoming, ongoing, or past
  const today = new Date();
  const upcoming = sortedTradeshows.filter(t => new Date(t.start_date) > today);
  const ongoing = sortedTradeshows.filter(t => 
    new Date(t.start_date) <= today && new Date(t.end_date) >= today
  );
  const past = sortedTradeshows.filter(t => new Date(t.end_date) < today);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tradeshows</h2>
            <p className="text-gray-600 mt-1">Plan and organize tradeshows and exhibitions</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canManageTradeshows && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2"
              >
                <Plus className="h-5 w-5" />
                <span className="ml-2">Add Tradeshow</span>
              </Button>
            )}
            
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
      
      {/* Ongoing Tradeshows */}
      {ongoing.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ongoing Tradeshows</h3>
          <div className="space-y-4">
            {ongoing.map((tradeshow) => (
              <div key={tradeshow.id} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{tradeshow.name}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tradeshow.start_date)} - {formatDate(tradeshow.end_date)}
                    </div>
                    {tradeshow.description && (
                      <p className="mt-2 text-sm text-gray-600">{tradeshow.description}</p>
                    )}
                  </div>
                  
                  {canManageTradeshows && (
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => openEditModal(tradeshow)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(tradeshow)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upcoming Tradeshows */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Tradeshows</h3>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((tradeshow) => (
              <div key={tradeshow.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{tradeshow.name}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tradeshow.start_date)} - {formatDate(tradeshow.end_date)}
                    </div>
                    {tradeshow.description && (
                      <p className="mt-2 text-sm text-gray-600">{tradeshow.description}</p>
                    )}
                  </div>
                  
                  {canManageTradeshows && (
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => openEditModal(tradeshow)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(tradeshow)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">No upcoming tradeshows.</p>
        )}
      </div>
      
      {/* Past Tradeshows */}
      {past.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Past Tradeshows</h3>
          <div className="space-y-4">
            {past.map((tradeshow) => (
              <div key={tradeshow.id} className="border-l-4 border-gray-300 pl-4 py-3 opacity-75">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{tradeshow.name}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tradeshow.start_date)} - {formatDate(tradeshow.end_date)}
                    </div>
                    {tradeshow.description && (
                      <p className="mt-2 text-sm text-gray-600">{tradeshow.description}</p>
                    )}
                  </div>
                  
                  {canManageTradeshows && (
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => openEditModal(tradeshow)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(tradeshow)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add Tradeshow Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Tradeshow</h3>
            
            <form onSubmit={handleAddTradeshow}>
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
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Tradeshow'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Tradeshow Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tradeshow</h3>
            
            <form onSubmit={handleEditTradeshow}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
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
                  {loading ? 'Updating...' : 'Update Tradeshow'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Tradeshow</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{currentTradeshow?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDeleteTradeshow}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Tradeshow'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeshowsList;
