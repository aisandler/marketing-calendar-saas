import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Edit, Trash } from 'lucide-react';
import type { Team, Resource } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface TeamManagementProps {
  teams?: Team[];
  resources?: Resource[];
  onTeamChange?: () => void;
}

const TeamManagement = ({ teams: propTeams, resources: propResources, onTeamChange }: TeamManagementProps = {}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Check if user has permission
  const canManageTeams = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    // If teams are provided as props, use them instead of fetching
    if (propTeams && propTeams.length > 0) {
      setTeams(propTeams);
      setLoading(false);
      return;
    }

    const fetchTeams = async () => {
      try {
        setLoading(true);
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (teamsError) throw teamsError;
        
        setTeams(teamsData);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setError(error.message || 'Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageTeams) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .insert([
          {
            name: formData.name,
            description: formData.description || null
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update teams list
      setTeams([...teams, data[0] as Team]);
      
      // Reset form and close modal
      setFormData({ name: '', description: '' });
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error adding team:', error);
      setError(error.message || 'Failed to add team.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageTeams || !currentTeam) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          description: formData.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTeam.id)
        .select();
      
      if (error) throw error;
      
      // Update teams list
      setTeams(teams.map(t => 
        t.id === currentTeam.id ? (data[0] as Team) : t
      ));
      
      // Reset form and close modal
      setFormData({ name: '', description: '' });
      setCurrentTeam(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating team:', error);
      setError(error.message || 'Failed to update team.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!canManageTeams || !currentTeam) return;
    
    try {
      setLoading(true);
      
      // First, check if there are resources assigned to this team
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('id')
        .eq('team_id', currentTeam.id);
      
      if (resourcesError) throw resourcesError;
      
      if (resourcesData && resourcesData.length > 0) {
        throw new Error(`Cannot delete team. There are ${resourcesData.length} resources assigned to this team.`);
      }
      
      // If no resources are assigned, delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', currentTeam.id);
      
      if (error) throw error;
      
      // Update teams list
      setTeams(teams.filter(t => t.id !== currentTeam.id));
      
      // Reset and close modal
      setCurrentTeam(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting team:', error);
      setError(error.message || 'Failed to delete team.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (team: Team) => {
    setCurrentTeam(team);
    setFormData({
      name: team.name,
      description: team.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (team: Team) => {
    setCurrentTeam(team);
    setIsDeleteModalOpen(true);
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Teams</h3>
          <p className="text-sm text-gray-500">Manage teams for resource grouping and reporting</p>
        </div>
        
        {canManageTeams && (
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2"
          >
            <Plus className="h-5 w-5" />
            <span className="ml-2">Add Team</span>
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      {/* Teams Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              {canManageTeams && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.length > 0 ? (
              teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.description || 'No description'}</div>
                  </td>
                  {canManageTeams && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => openEditModal(team)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(team)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManageTeams ? 3 : 2} className="px-6 py-4 text-center text-sm text-gray-500">
                  No teams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Team Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team</h3>
            
            <form onSubmit={handleAddTeam}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {loading ? 'Adding...' : 'Add Team'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Team Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Team</h3>
            
            <form onSubmit={handleEditTeam}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {loading ? 'Updating...' : 'Update Team'}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Team</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{currentTeam?.name}</span>? This action cannot be undone.
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
                onClick={handleDeleteTeam}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Team'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;