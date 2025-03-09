import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Note: For this script, you need to manually add the service role key to your .env file
// as SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Supabase URL and service role key are required.');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('You can find this in your Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    const briefs = [];

    // Helper to find a campaign by name
    const findCampaign = (name) => {
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
    let successCount = 0;
    
    for (let i = 0; i < briefs.length; i += batchSize) {
      const batch = briefs.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('briefs')
          .insert(batch)
          .select();
        
        if (error) {
          console.error('Error inserting batch:', error);
        } else {
          console.log(`Imported batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(briefs.length / batchSize)}`);
          successCount += data.length;
        }
      } catch (error) {
        console.error('Error importing batch:', error);
      }
    }

    console.log('Brief import completed!');
    console.log(`Successfully imported ${successCount} of ${briefs.length} briefs`);
  } catch (error) {
    console.error('Error importing briefs:', error);
  }
}

// Helper function to create a brief object
function createBrief(
  title,
  channel,
  start_date,
  due_date,
  priority,
  campaign_id,
  created_by,
  description
) {
  const now = new Date().toISOString();
  return {
    title,
    channel,
    start_date,
    due_date,
    priority,
    campaign_id,
    created_by,
    description,
    status: 'draft',
    created_at: now,
    updated_at: now
  };
}

// Run the import
importBriefs(); 