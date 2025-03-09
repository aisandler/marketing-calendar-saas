import { supabase } from './supabaseClient.js';
import type { Brief, Campaign } from '../types';

// Function to import briefs
async function importBriefs() {
  try {
    console.log('Starting brief import...');

    // First, get the admin user to use as the creator
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      throw adminError;
    }

    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    const adminId = adminUsers[0].id;
    console.log(`Using admin user with ID: ${adminId} as the creator`);

    // Get all campaigns to link briefs to them
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', '2025-03-10');

    if (campaignsError) {
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      throw new Error('No campaigns found. Please import campaigns first.');
    }

    console.log(`Found ${campaigns.length} campaigns to link briefs to`);

    // Clear existing briefs linked to these campaigns
    const { error: deleteError } = await supabase
      .from('briefs')
      .delete()
      .in('campaign_id', campaigns.map(c => c.id));

    if (deleteError) {
      throw deleteError;
    }

    console.log('Deleted existing briefs linked to the campaigns');

    // Create briefs for each campaign
    const briefs: Omit<Brief, 'id'>[] = [];

    // Helper to find a campaign by name
    const findCampaign = (name: string): Campaign | undefined => {
      return campaigns.find(c => c.name === name);
    };

    // Create briefs for print media campaigns
    const printMediaCampaigns = campaigns.filter(c => c.name.startsWith('MG Retail'));
    for (const campaign of printMediaCampaigns) {
      briefs.push(createBrief(
        `Print Media - ${campaign.name}`,
        'Print',
        campaign.start_date,
        campaign.end_date,
        'medium',
        campaign.id,
        adminId,
        `Double Truck, 2PG + Design Showcase for ${campaign.name}`
      ));
    }

    // Create briefs for digital media campaigns
    const digitalMediaCampaigns = campaigns.filter(c => c.name.startsWith('Digital Media'));
    for (const campaign of digitalMediaCampaigns) {
      briefs.push(createBrief(
        `Digital Media - ${campaign.name}`,
        'Digital',
        campaign.start_date,
        campaign.end_date,
        'medium',
        campaign.id,
        adminId,
        `Video Banner/ Right Square/ E-Newsletter Ad for ${campaign.name}`
      ));
    }

    // Create briefs for MONDO campaigns
    const mondoCampaigns = campaigns.filter(c => c.name.includes('MONDO'));
    for (const campaign of mondoCampaigns) {
      briefs.push(createBrief(
        `MONDO Campaign - ${campaign.name}`,
        'Digital',
        campaign.start_date,
        campaign.end_date,
        'medium',
        campaign.id,
        adminId,
        `MONDO Tag/SELLUTIONS Tag for ${campaign.name}`
      ));
    }

    // Create briefs for tradeshows
    const tradeshowCampaigns = campaigns.filter(c => c.campaign_type === 'tradeshow');
    for (const campaign of tradeshowCampaigns) {
      briefs.push(createBrief(
        `Tradeshow Preparation - ${campaign.name}`,
        'Event',
        // Start 30 days before the tradeshow
        new Date(new Date(campaign.start_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        campaign.start_date,
        'high',
        campaign.id,
        adminId,
        `Preparation for ${campaign.name} tradeshow`
      ));

      briefs.push(createBrief(
        `Tradeshow Materials - ${campaign.name}`,
        'Print',
        // Start 45 days before the tradeshow
        new Date(new Date(campaign.start_date).getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Due 15 days before the tradeshow
        new Date(new Date(campaign.start_date).getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'high',
        campaign.id,
        adminId,
        `Print materials for ${campaign.name} tradeshow`
      ));

      briefs.push(createBrief(
        `Tradeshow Follow-up - ${campaign.name}`,
        'Digital',
        campaign.end_date,
        // Due 14 days after the tradeshow
        new Date(new Date(campaign.end_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'medium',
        campaign.id,
        adminId,
        `Follow-up communications after ${campaign.name} tradeshow`
      ));
    }

    // Create briefs for events
    const eventCampaigns = campaigns.filter(c => c.campaign_type === 'event');
    for (const campaign of eventCampaigns) {
      briefs.push(createBrief(
        `Event Preparation - ${campaign.name}`,
        'Event',
        // Start 21 days before the event
        new Date(new Date(campaign.start_date).getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        campaign.start_date,
        'high',
        campaign.id,
        adminId,
        `Preparation for ${campaign.name} event`
      ));

      briefs.push(createBrief(
        `Event Materials - ${campaign.name}`,
        'Print',
        // Start 30 days before the event
        new Date(new Date(campaign.start_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Due 7 days before the event
        new Date(new Date(campaign.start_date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'high',
        campaign.id,
        adminId,
        `Print materials for ${campaign.name} event`
      ));

      briefs.push(createBrief(
        `Event Follow-up - ${campaign.name}`,
        'Digital',
        campaign.end_date,
        // Due 7 days after the event
        new Date(new Date(campaign.end_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'medium',
        campaign.id,
        adminId,
        `Follow-up communications after ${campaign.name} event`
      ));
    }

    // Create briefs for seasonal campaigns
    const seasonalCampaigns = campaigns.filter(c => c.campaign_type === 'seasonal_promotion');
    for (const campaign of seasonalCampaigns) {
      briefs.push(createBrief(
        `Seasonal Campaign - ${campaign.name}`,
        'Marketing',
        campaign.start_date,
        campaign.end_date,
        'medium',
        campaign.id,
        adminId,
        `Seasonal promotion for ${campaign.name}`
      ));

      briefs.push(createBrief(
        `Seasonal Materials - ${campaign.name}`,
        'Print',
        // Start 14 days before the campaign
        new Date(new Date(campaign.start_date).getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        campaign.start_date,
        'medium',
        campaign.id,
        adminId,
        `Print materials for ${campaign.name} seasonal promotion`
      ));

      briefs.push(createBrief(
        `Seasonal Digital - ${campaign.name}`,
        'Digital',
        campaign.start_date,
        // Due at the middle of the campaign
        new Date(new Date(campaign.start_date).getTime() + (new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / 2).toISOString().split('T')[0],
        'medium',
        campaign.id,
        adminId,
        `Digital materials for ${campaign.name} seasonal promotion`
      ));
    }

    // Insert briefs in batches to avoid hitting API limits
    const batchSize = 10;
    for (let i = 0; i < briefs.length; i += batchSize) {
      const batch = briefs.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('briefs')
        .insert(batch)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(briefs.length / batchSize)}`);
    }

    console.log('Brief import completed successfully!');
    console.log(`Total briefs imported: ${briefs.length}`);
  } catch (error) {
    console.error('Error importing briefs:', error);
  }
}

// Helper function to create a brief object
function createBrief(
  title: string,
  channel: string,
  start_date: string,
  due_date: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  campaign_id: string,
  created_by: string,
  description: string | null
): Omit<Brief, 'id'> {
  const now = new Date().toISOString();
  return {
    title,
    channel,
    start_date,
    due_date,
    resource_id: null,
    approver_id: null,
    campaign_id,
    status: 'draft',
    priority,
    description,
    specifications: null,
    estimated_hours: null,
    expenses: null,
    created_by,
    created_at: now,
    updated_at: now
  };
}

// Run the import
importBriefs(); 