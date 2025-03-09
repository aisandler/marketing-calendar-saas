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

// Function to import campaigns
async function importCampaigns() {
  try {
    console.log('Starting campaign import with service role key (bypassing RLS)...');

    // First, check if the campaigns table exists
    const { error: checkError } = await supabase.from('campaigns').select('id').limit(1);
    
    if (checkError) {
      console.error('Error: Campaigns table does not exist or cannot be accessed.');
      console.error('Please make sure the campaigns table exists in your Supabase database.');
      process.exit(1);
    }

    console.log('Campaigns table exists. Clearing existing data from March 10th, 2025 onward...');
    
    // Clear any existing data to avoid duplicates
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .gte('start_date', '2025-03-10');

    if (deleteError) {
      console.error('Error deleting existing campaigns:', deleteError);
      process.exit(1);
    }

    console.log('Deleted existing campaigns from March 10th, 2025 onward');

    // Prepare campaign data
    const campaigns = [
      // Q1 (March 10th and forward)
      createCampaign('NECANN BOSTON', 'tradeshow', '2025-03-17', '2025-03-17', 'Boston', 'NECANN BOSTON tradeshow'),
      createCampaign('SHOP TALK', 'tradeshow', '2025-03-24', '2025-03-27', 'Irvin', 'SHOP TALK, IRVIN tradeshow'),
      createCampaign('RETAIL SPACES', 'event', '2025-03-25', '2025-03-27', 'LA', 'RETAIL SPACES - LA event'),
      createCampaign('ALT EXPO MIAMI', 'tradeshow', '2025-04-03', '2025-04-05', 'Miami', 'ALT EXPO MIAMI tradeshow'),
      
      // Q2 (April-June)
      createCampaign('SHOP METAPLACE', 'tradeshow', '2025-04-08', '2025-04-10', null, 'SHOP METAPLACE tradeshow'),
      createCampaign('MJ UNPACKED', 'tradeshow', '2025-04-29', '2025-05-01', 'NJ', 'MJ UNPACKED-NJ tradeshow'),
      createCampaign('STOREFRONT/CSTOREFRONT', 'event', '2025-05-01', '2025-05-01', null, 'STOREFRONT/CSTOREFRONT event'),
      createCampaign('NECANN MARYLAND', 'tradeshow', '2025-05-12', '2025-05-12', 'Maryland', 'NECANN MARYLAND tradeshow'),
      createCampaign('STUDIO X RETAIL EVENT', 'event', '2025-05-12', '2025-05-12', null, 'STUDIO X RETAIL EVENT INVITE FROM STUDENTS event'),
      createCampaign('STUDIO X Collab', 'event', '2025-05-19', '2025-05-19', null, 'STUDIO X Collab, speaking panel event'),
      createCampaign('KY, OHIO & ILLINOIS ADJACENCY', 'tradeshow', '2025-05-30', '2025-05-31', 'Kentucky/Ohio/Illinois', 'KY, OHIO & ILLINOIS ADJACENCY tradeshow'),
      createCampaign('NCIA EXPO NYC', 'tradeshow', '2025-06-04', '2025-06-05', 'NYC', 'NCIA EXPO NYC SPONSOR tradeshow'),
      createCampaign('NEOCON', 'tradeshow', '2025-06-09', '2025-06-11', null, 'NEOCON tradeshow'),
      createCampaign('CANNACON LAS VEGAS', 'tradeshow', '2025-06-12', '2025-06-13', 'Las Vegas', 'CANNACON LAS VEGAS tradeshow'),
      createCampaign('ALT EXPO NASHVILLE', 'tradeshow', '2025-06-19', '2025-06-21', 'Nashville', 'ALT EXPO NASHVILLE tradeshow'),
      createCampaign('ION ROOFTOP PARTY', 'event', '2025-06-02', '2025-06-02', null, 'ION ROOFTOP PARTY event we host'),
      
      // Q3 (July-September)
      createCampaign('BIZ Sip Into Summer', 'event', '2025-07-28', '2025-07-28', null, 'BIZ Sip Into Summer event we host'),
      createCampaign('CANNACON MINNESOTA', 'tradeshow', '2025-08-12', '2025-08-13', 'Minnesota', 'CANNACON MINNESOTA tradeshow'),
      createCampaign('HAMPTONS CANNABIS EXPO', 'tradeshow', '2025-08-18', '2025-08-18', 'Hamptons', 'HAMPTONS CANNABIS EXPO (DATE TBD)'),
      createCampaign('ASD MARKET SHOW', 'event', '2025-08-25', '2025-08-25', null, 'ASD MARKET SHOW'),
      createCampaign('WOMEN IN CANNABIS', 'event', '2025-09-01', '2025-09-01', null, 'Women in Cannabis Dinner Sponsorship $800'),
      createCampaign('NECANN NJ', 'tradeshow', '2025-09-05', '2025-09-06', 'NJ', 'NECANN NJ tradeshow'),
      createCampaign('HALL OF FLOWERS', 'tradeshow', '2025-09-29', '2025-09-29', null, 'HALL OF FLOWERS tradeshow'),
      
      // Q4 (October-December)
      createCampaign('NECANN CT', 'tradeshow', '2025-10-06', '2025-10-06', 'Connecticut', 'NECANN CT (DATE TBD)'),
      createCampaign('STUDIO X CENTENNIAL INDUSTRY PARTY', 'event', '2025-10-06', '2025-10-06', null, 'STUDIO X - CENTENNIAL INDUSTRY PARTY! event we host'),
      createCampaign('COLUMBUS OHIO', 'tradeshow', '2025-10-14', '2025-10-17', 'Ohio', 'MJ COLUMBUS OHIO (DATE TBD)'),
      createCampaign('BIZ INTERNATIONAL DESIGN AWARD', 'event', '2025-10-20', '2025-10-20', null, 'BIZ International Design Award event sponsor'),
      createCampaign('STUDIO X STUDENT TOUR', 'event', '2025-10-27', '2025-10-27', null, 'STUDIO X STUDENT TOUR'),
      createCampaign('MJ UNPACKED', 'tradeshow', '2025-11-03', '2025-11-03', 'St. Louis', 'MJ UNPACKED ST LOUIS'),
      createCampaign('CANNABIS CUP', 'tradeshow', '2025-11-17', '2025-11-17', null, 'CANNABIS CUP - LI CANNABIS COALITION'),
      createCampaign('STUDIO X PAVE', 'event', '2025-12-08', '2025-12-08', null, 'STUDIO X - PAVE PIN/ PANEL DISCUSSION/ CENTENNIAL CELEBRATION FOR ALL BRANDS'),
      createCampaign('PAVE GALA', 'event', '2025-12-08', '2025-12-08', null, 'PAVE GALA'),
      createCampaign('MJ BIZ', 'tradeshow', '2025-12-08', '2025-12-08', null, 'MJ BIZ'),
      createCampaign('WWD RETAIL SUMMIT', 'event', '2025-12-15', '2025-12-15', null, 'WWD Retail Summit'),
      
      // Print Media Campaigns (Monthly)
      createCampaign('MG Retail - March', 'digital_campaign', '2025-03-01', '2025-03-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - April', 'digital_campaign', '2025-04-01', '2025-04-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - May', 'digital_campaign', '2025-05-01', '2025-05-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - June', 'digital_campaign', '2025-06-01', '2025-06-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - July', 'digital_campaign', '2025-07-01', '2025-07-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - August', 'digital_campaign', '2025-08-01', '2025-08-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - September', 'digital_campaign', '2025-09-01', '2025-09-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - October', 'digital_campaign', '2025-10-01', '2025-10-31', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - November', 'digital_campaign', '2025-11-01', '2025-11-30', null, 'Double Truck, 2PG + Design Showcase'),
      createCampaign('MG Retail - December', 'digital_campaign', '2025-12-01', '2025-12-31', null, 'Double Truck, 2PG + Design Showcase'),
      
      // Digital Media Campaigns (Monthly)
      createCampaign('Digital Media - March', 'digital_campaign', '2025-03-01', '2025-03-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - April', 'digital_campaign', '2025-04-01', '2025-04-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - May', 'digital_campaign', '2025-05-01', '2025-05-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - June', 'digital_campaign', '2025-06-01', '2025-06-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - July', 'digital_campaign', '2025-07-01', '2025-07-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - August', 'digital_campaign', '2025-08-01', '2025-08-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - September', 'digital_campaign', '2025-09-01', '2025-09-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - October', 'digital_campaign', '2025-10-01', '2025-10-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - November', 'digital_campaign', '2025-11-01', '2025-11-30', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      createCampaign('Digital Media - December', 'digital_campaign', '2025-12-01', '2025-12-31', null, 'Video Banner/ Right Square/ E-Newsletter Ad'),
      
      // MONDO Tag/SELLUTIONS Tag Campaigns
      createCampaign('MONDO - March/April', 'digital_campaign', '2025-03-01', '2025-04-30', null, 'MONDO - March/April'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - March', 'digital_campaign', '2025-03-01', '2025-03-31', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO - May/June', 'digital_campaign', '2025-05-01', '2025-06-30', null, 'MONDO - May/June'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - May', 'digital_campaign', '2025-05-01', '2025-05-31', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO - July/August', 'digital_campaign', '2025-07-01', '2025-08-31', null, 'MONDO - July/August'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - July', 'digital_campaign', '2025-07-01', '2025-07-31', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO - Sept/Oct', 'digital_campaign', '2025-09-01', '2025-10-31', null, 'MONDO - Sept/Oct'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - September', 'digital_campaign', '2025-09-01', '2025-09-30', null, 'MONDO Tag/SELLUTIONS Tag'),
      createCampaign('MONDO - Nov/Dec', 'digital_campaign', '2025-11-01', '2025-12-31', null, 'MONDO - Nov/Dec'),
      createCampaign('MONDO Tag/SELLUTIONS Tag - November', 'digital_campaign', '2025-11-01', '2025-11-30', null, 'MONDO Tag/SELLUTIONS Tag'),
      
      // Seasonal campaigns (Showroom Refresh)
      createCampaign('SHOWROOM REFRESH - Q1', 'seasonal_promotion', '2025-01-01', '2025-03-31', null, 'SHOWROOM REFRESH - DISPLAY DISPENSARY OR CENTENNIAL'),
      createCampaign('SHOWROOM REFRESH - Q2', 'seasonal_promotion', '2025-04-01', '2025-06-30', null, 'SHOWROOM REFRESH - REFLECT THE SHOP MARKETPLACE BOOTH'),
      createCampaign('SHOWROOM REFRESH - Q3', 'seasonal_promotion', '2025-07-01', '2025-09-30', null, 'SHOWROOM REFRESH - DISPLAY DISPENSARY OR CENTENNIAL'),
      createCampaign('SHOWROOM REFRESH - Q4', 'seasonal_promotion', '2025-10-01', '2025-12-31', null, 'SHOWROOM REFRESH - DISPLAY DISPENSARY FOR MJ BIZ & CENTENNIAL'),
    ];

    // Insert campaigns in batches to avoid hitting API limits
    const batchSize = 10;
    let successCount = 0;

    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(batch)
          .select();
        
        if (error) {
          console.error('Error inserting batch:', error);
        } else {
          console.log(`Imported batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(campaigns.length / batchSize)}`);
          successCount += data.length;
        }
      } catch (error) {
        console.error('Error importing batch:', error);
      }
    }

    console.log('Campaign import completed!');
    console.log(`Successfully imported ${successCount} of ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('Error importing campaigns:', error);
  }
}

// Helper function to create a campaign object
function createCampaign(
  name,
  campaign_type,
  start_date,
  end_date,
  location,
  description
) {
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