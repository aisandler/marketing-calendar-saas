import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash, Download, Calendar, MapPin, Tag } from 'lucide-react';
import type { Campaign, CampaignType } from '../types';

const CampaignsList = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'tradeshow' as CampaignType,
    start_date: '',
    end_date: '',
    location: '',
    description: ''
  });

  // Check if user has permission
  const canManageCampaigns = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        
        setCampaigns(data as Campaign[]);
      } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        setError(error.message || 'Failed to load campaigns.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageCampaigns) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            name: formData.name,
            campaign_type: formData.campaign_type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            location: formData.location || null,
            description: formData.description || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update campaigns list
      setCampaigns([...campaigns, data[0] as Campaign]);
      
      // Reset form and close modal
      setFormData({ 
        name: '', 
        campaign_type: 'tradeshow', 
        start_date: '', 
        end_date: '', 
        location: '', 
        description: '' 
      });
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error adding campaign:', error);
      setError(error.message || 'Failed to add campaign.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageCampaigns || !currentCampaign) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          campaign_type: formData.campaign_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location || null,
          description: formData.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCampaign.id)
        .select();
      
      if (error) throw error;
      
      // Update campaigns list
      setCampaigns(campaigns.map(campaign => 
        campaign.id === currentCampaign.id ? (data[0] as Campaign) : campaign
      ));
      
      // Reset form and close modal
      setFormData({ 
        name: '', 
        campaign_type: 'tradeshow', 
        start_date: '', 
        end_date: '', 
        location: '', 
        description: '' 
      });
      setCurrentCampaign(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      setError(error.message || 'Failed to update campaign.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!canManageCampaigns || !currentCampaign) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', currentCampaign.id);
      
      if (error) throw error;
      
      // Update campaigns list
      setCampaigns(campaigns.filter(campaign => campaign.id !== currentCampaign.id));
      
      // Reset and close modal
      setCurrentCampaign(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      setError(error.message || 'Failed to delete campaign.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setFormData({
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date.split('T')[0],
      location: campaign.location || '',
      description: campaign.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setIsDeleteModalOpen(true);
  };

  const getCampaignTypeLabel = (type: CampaignType) => {
    switch (type) {
      case 'tradeshow':
        return 'Tradeshow';
      case 'product_launch':
        return 'Product Launch';
      case 'seasonal_promotion':
        return 'Seasonal Promotion';
      case 'digital_campaign':
        return 'Digital Campaign';
      case 'event':
        return 'Event';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const getCampaignTypeColor = (type: CampaignType) => {
    switch (type) {
      case 'tradeshow':
        return 'bg-blue-100 text-blue-800';
      case 'product_launch':
        return 'bg-green-100 text-green-800';
      case 'seasonal_promotion':
        return 'bg-orange-100 text-orange-800';
      case 'digital_campaign':
        return 'bg-purple-100 text-purple-800';
      case 'event':
        return 'bg-pink-100 text-pink-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          
          {canManageCampaigns && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Campaign
            </Button>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {/* Campaigns List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {canManageCampaigns && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={canManageCampaigns ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No campaigns found. {canManageCampaigns && 'Click "Add Campaign" to create one.'}
                  </td>
                </tr>
              ) : (
                campaigns.map(campaign => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCampaignTypeColor(campaign.campaign_type)}`}>
                        {getCampaignTypeLabel(campaign.campaign_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {campaign.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {campaign.description}
                    </td>
                    {canManageCampaigns && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(campaign)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(campaign)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Campaign Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Campaign</h3>
            
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="campaign_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <select
                  id="campaign_type"
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as CampaignType })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="tradeshow">Tradeshow</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="seasonal_promotion">Seasonal Promotion</option>
                  <option value="digital_campaign">Digital Campaign</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
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
                  End Date *
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
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ 
                      name: '', 
                      campaign_type: 'tradeshow', 
                      start_date: '', 
                      end_date: '', 
                      location: '', 
                      description: '' 
                    });
                    setIsAddModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Campaign Modal */}
      {isEditModalOpen && currentCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Campaign</h3>
            
            <form onSubmit={handleEditCampaign} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-campaign_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type *
                </label>
                <select
                  id="edit-campaign_type"
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as CampaignType })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="tradeshow">Tradeshow</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="seasonal_promotion">Seasonal Promotion</option>
                  <option value="digital_campaign">Digital Campaign</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="edit-start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
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
                  End Date *
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
                <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ 
                      name: '', 
                      campaign_type: 'tradeshow', 
                      start_date: '', 
                      end_date: '', 
                      location: '', 
                      description: '' 
                    });
                    setCurrentCampaign(null);
                    setIsEditModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the campaign "{currentCampaign.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentCampaign(null);
                  setIsDeleteModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCampaign}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsList; 