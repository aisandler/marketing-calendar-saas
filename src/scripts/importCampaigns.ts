import { supabase } from './supabaseClient';
import type { Campaign, CampaignType } from '../types';

// Function to import campaigns
async function importCampaigns() {
  try {
    console.log('Starting campaign import...');

    // First, let's clear any existing data to avoid duplicates
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .gte('start_date', '2025-03-10');

    if (deleteError) {
      throw deleteError;
    }

    console.log('Deleted existing campaigns from March 10th, 2025 onward');

    // Prepare campaign data
    const campaigns: Omit<Campaign, 'id'>[] = [
      // Tradeshows (SHOW ATT)
      createCampaign('CANNACON MINNESOTA', 'tradeshow', '2025-08-11', '2025-08-13', 'Minnesota', 'CANNACON MINNESOTA tradeshow'),
      createCampaign('HAMPTONS CANNABIS EXPO', 'tradeshow', '2025-08-18', '2025-08-18', 'Hamptons', 'HAMPTONS CANNABIS EXPO (DATE TBD)'),
      createCampaign('MJBiz', 'tradeshow', '2025-09-01', '2025-09-06', 'NJ', 'NECANN NJ'),
      createCampaign('HALL OF FLOWERS', 'tradeshow', '2025-09-29', '2025-09-29', null, 'HALL OF FLOWERS'),
      createCampaign('NECANN CT', 'tradeshow', '2025-10-06', '2025-10-06', 'Connecticut', 'NECANN CT (DATE TBD)'),
      createCampaign('COLUMBUS OHIO', 'tradeshow', '2025-10-13', '2025-10-17', 'Ohio', 'COLUMBUS OHIO (DATE TBD)'),
      createCampaign('MJ UNPACKED', 'tradeshow', '2025-11-03', '2025-11-03', 'St. Louis', 'MJ UNPACKED ST LOUIS'),
      createCampaign('CANNABIS CUP', 'tradeshow', '2025-11-17', '2025-11-17', null, 'CANNABIS CUP - LI CANNABIS COALITION'),
      createCampaign('MJ BIZ', 'tradeshow', '2025-12-08', '2025-12-08', null, 'MJ BIZ'),
      createCampaign('WWD RETAIL SUMMIT', 'tradeshow', '2025-12-15', '2025-12-15', null, 'WWD Retail Summit'),
      
      // Other events (EVENT)
      createCampaign('ASD MARKET SHOW', 'event', '2025-08-25', '2025-08-25', null, 'ASD MARKET SHOW'),
      createCampaign('WOMEN IN CANNABIS', 'event', '2025-09-01', '2025-09-01', null, 'Women in Cannabis Dinner Sponsorship $800'),
      createCampaign('BIZ INTERNATIONAL DESIGN AWARD', 'event', '2025-10-20', '2025-10-20', null, 'BIZ International Design Award event sponsor'),
      createCampaign('STUDIO 5 STUDENT TOUR', 'event', '2025-10-27', '2025-10-27', null, 'STUDIO 5 STUDENT TOUR'),
      createCampaign('PAVE GALA', 'event', '2025-12-08', '2025-12-08', null, 'PAVE GALA'),
      createCampaign('STUDIO X PAVE', 'event', '2025-12-08', '2025-12-08', null, 'STUDIO X - PAVE PIN/ PANEL DISCUSSION/ CENTENNIAL CELEBRATION FOR ALL BRANDS'),
      
      // Events we host (EVENT WE HOST)
      createCampaign('BIZ Sip Into Summer', 'event', '2025-07-28', '2025-07-28', null, 'BIZ Sip Into Summer'),
      createCampaign('STUDIO 5 CENTENNIAL INDUSTRY PARTY', 'event', '2025-10-06', '2025-10-06', null, 'STUDIO 5 - CENTENNIAL INDUSTRY PARTY!'),
      
      // Print Media Campaigns
      createCampaign('MG Retail - July', 'digital_campaign', '2025-07-01', '2025-07-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - August', 'digital_campaign', '2025-08-01', '2025-08-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - September', 'digital_campaign', '2025-09-01', '2025-09-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - October', 'digital_campaign', '2025-10-01', '2025-10-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - November', 'digital_campaign', '2025-11-01', '2025-11-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - December', 'digital_campaign', '2025-12-01', '2025-12-31', null, 'Double Truck, 2PG + Design Showcase'),
      
      // Digital Media Campaigns
      createCampaign('Digital Media - July', 'digital_campaign', '2025-07-01', '2025-07-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - August', 'digital_campaign', '2025-08-01', '2025-08-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - September', 'digital_campaign', '2025-09-01', '2025-09-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - October', 'digital_campaign', '2025-10-01', '2025-10-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - November', 'digital_campaign', '2025-11-01', '2025-11-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - December', 'digital_campaign', '2025-12-01', '2025-12-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      
      // MONDO Tag/SELLUTIONS Tag Campaigns
      createCampaign('MONDO July/August', 'digital_campaign', '2025-07-01', '2025-08-31', null, 'MONDO - July/ August'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - July', 'digital_campaign', '2025-07-28', '2025-07-28', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO Sept/Oct', 'digital_campaign', '2025-09-22', '2025-10-31', null, 'MONDO - Sept/ Oct'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - September', 'digital_campaign', '2025-09-29', '2025-09-29', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO Nov/Dec', 'digital_campaign', '2025-11-01', '2025-12-31', null, 'MONDO - Nov/ Dec'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - November', 'digital_campaign', '2025-11-03', '2025-11-03', null, 'MONDO Tag/SELLUTIONS Tag'),
      
      // Seasonal campaigns
      createCampaign('SHOWROOM REFRESH - Q3', 'seasonal_promotion', '2025-07-01', '2025-09-30', null, 'SHOWROOM REFRESH - DISPLAY DISPENSARY OR CENTENNIAL'),
      createCampaign('SHOWROOM REFRESH - Q4', 'seasonal_promotion', '2025-10-01', '2025-12-31', null, 'SHOWROOM REFRESH - DISPLAY DISPENSARY FOR MJ BIZ & CENTENNIAL'),
    ];

    // Insert campaigns in batches to avoid hitting API limits
    const batchSize = 10;
    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert(batch)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(campaigns.length / batchSize)}`);
    }

    console.log('Campaign import completed successfully!');
    console.log(`Total campaigns imported: ${campaigns.length}`);
  } catch (error) {
    console.error('Error importing campaigns:', error);
  }
}

// Helper function to create a campaign object
function createCampaign(
  name: string,
  campaign_type: CampaignType,
  start_date: string,
  end_date: string,
  location: string | null,
  description: string | null
): Omit<Campaign, 'id'> {
  const now = new Date().toISOString();
  return {
    name,
    campaign_type,
    start_date,
    end_date,
    location,
    description,
    created_at: now,
    updated_at: now
  };
}

// Run the import
importCampaigns(); 