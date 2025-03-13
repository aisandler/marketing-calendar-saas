import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Resource {
  id: string;
  name: string;
  type: string;
  team?: string;
  media_type?: string;
  capacity?: number;
}

const Resources: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (resourcesError) {
          throw resourcesError;
        }

        setResources(data || []);
      } catch (err) {
        console.error('Error loading resources:', err);
        setError('Failed to load resources. Please try again.');
        toast.error('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Resources</h1>
      </div>
      
      {error ? (
        <div className="text-center text-gray-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Loading
          </button>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">{resource.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{resource.type}</p>
              {resource.team && (
                <p className="text-sm text-gray-500 mt-1">Team: {resource.team}</p>
              )}
              {resource.media_type && (
                <p className="text-sm text-gray-500 mt-1">Media: {resource.media_type}</p>
              )}
              {resource.capacity && (
                <p className="text-sm text-gray-500 mt-1">Capacity: {resource.capacity}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <p>No resources available</p>
        </div>
      )}
    </div>
  );
};

export default Resources; 