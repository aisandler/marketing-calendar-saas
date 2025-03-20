import React from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'complete' | 'cancelled';
  budget?: number;
  brand?: {
    id: string;
    name: string;
  };
  brief_count?: number;
  total_cost?: number;
}

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onClick }) => {
  // Calculate campaign duration
  const duration = differenceInDays(
    new Date(campaign.end_date),
    new Date(campaign.start_date)
  );
  
  // Calculate campaign progress
  const calculateProgress = () => {
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    const today = new Date();
    
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    
    const totalDuration = differenceInDays(endDate, startDate) || 1; // Avoid division by zero
    const elapsedDuration = differenceInDays(today, startDate);
    return Math.round((elapsedDuration / totalDuration) * 100);
  };
  
  const progress = calculateProgress();
  
  // Get status color
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-indigo-100 text-indigo-800';
      case 'complete':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status label
  const formatStatus = (status: Campaign['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <Link 
      to={`/campaigns/${campaign.id}`}
      onClick={e => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 truncate" title={campaign.name}>
            {campaign.name}
          </h3>
          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
            {formatStatus(campaign.status)}
          </span>
        </div>
        
        <div className="mt-1 flex items-center text-sm text-gray-500">
          {campaign.brand?.name && (
            <span className="truncate">{campaign.brand.name}</span>
          )}
        </div>
      </div>
      
      {/* Card Body */}
      <div className="px-4 py-3">
        {campaign.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3" title={campaign.description}>
            {campaign.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
            {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
          </div>
          <div>{duration} days</div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
          <div
            className={`h-1.5 rounded-full ${
              campaign.status === 'active' ? 'bg-blue-500' :
              campaign.status === 'complete' ? 'bg-green-500' :
              campaign.status === 'cancelled' ? 'bg-red-500' :
              'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Card Footer - Stats */}
        <div className="flex justify-between items-center mt-2 text-sm">
          <div className="flex items-center">
            <span className="text-gray-500">
              {progress}% Complete
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-500">
            {campaign.brief_count !== undefined && (
              <span>{campaign.brief_count} brief{campaign.brief_count !== 1 ? 's' : ''}</span>
            )}
            
            {campaign.total_cost !== undefined && (
              <span className="font-medium text-emerald-600">${campaign.total_cost.toLocaleString()}</span>
            )}
            
            {campaign.budget !== undefined && (
              <span className="font-medium text-gray-900">${campaign.budget.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CampaignCard; 