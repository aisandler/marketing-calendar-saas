import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found. Using environment variables if available.');
  dotenv.config();
}

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to import campaigns
async function importCampaigns() {
  try {
    console.log('Starting campaign import...');

    // First, check if the campaigns table exists
    const { error: checkError } = await supabase.from('campaigns').select('id').limit(1);
    
    if (checkError) {
      console.log('Campaigns table does not exist. Converting from tradeshows...');
      
      // Check if tradeshows table exists
      const { data: tradeshows, error: tradeshowsError } = await supabase.from('tradeshows').select('*');
      
      if (!tradeshowsError && tradeshows && tradeshows.length > 0) {
        console.log(`Found ${tradeshows.length} tradeshows to convert.`);
        
        // Convert tradeshows to campaigns
        for (const tradeshow of tradeshows) {
          // Create a campaign for each tradeshow
          const campaign = {
            name: tradeshow.name,
            campaign_type: 'tradeshow',
            start_date: tradeshow.start_date,
            end_date: tradeshow.end_date,
            location: null,
            description: tradeshow.description,
            created_at: tradeshow.created_at,
            updated_at: new Date().toISOString()
          };
          
          // We'll add these to our campaigns array to insert later
          console.log(`Converted tradeshow "${tradeshow.name}" to campaign.`);
        }
      } else {
        console.log('No tradeshows found or tradeshows table does not exist.');
      }
    } else {
      console.log('Campaigns table exists. Clearing existing data from March 10th, 2025 onward...');
      
      // Clear any existing data to avoid duplicates
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .gte('start_date', '2025-03-10');
  
      if (deleteError) {
        throw deleteError;
      }
  
      console.log('Deleted existing campaigns from March 10th, 2025 onward');
    }

    // Prepare campaign data
    const campaigns = [
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
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(batch)
          .select();
        
        if (error) {
          console.error('Error inserting batch:', error);
          
          // If the table doesn't exist, we need to create it
          if (error.message && error.message.includes('relation "public.campaigns" does not exist')) {
            console.log('Creating campaigns table...');
            
            // We need to create the campaigns table first
            // Since we can't run SQL directly, we'll need to use the Supabase dashboard to create the table
            console.log('Please create the campaigns table using the Supabase dashboard or SQL editor.');
            console.log('Use the following SQL:');
            console.log(`
              CREATE TABLE IF NOT EXISTS public.campaigns (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                campaign_type TEXT NOT NULL CHECK (campaign_type IN ('tradeshow', 'product_launch', 'seasonal_promotion', 'digital_campaign', 'event', 'other')),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                location TEXT,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `);
            break;
          } else {
            throw error;
          }
        } else {
          console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(campaigns.length / batchSize)}`);
        }
      } catch (error) {
        console.error('Error importing batch:', error);
        break;
      }
    }

    console.log('Campaign import completed!');
    console.log(`Total campaigns to import: ${campaigns.length}`);
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