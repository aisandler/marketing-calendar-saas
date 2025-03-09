import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function convertTradeshowsToCampaigns() {
  try {
    console.log('Converting tradeshows to campaigns...');

    // First, check if the campaigns table already exists
    const { error: checkCampaignsError } = await supabase.from('campaigns').select('id').limit(1);
    
    if (!checkCampaignsError) {
      console.log('Campaigns table already exists.');
      return;
    }

    // Check if the tradeshows table exists
    const { data: tradeshows, error: checkTradeshowsError } = await supabase.from('tradeshows').select('*');
    
    if (checkTradeshowsError) {
      console.log('Tradeshows table does not exist.');
      return;
    }

    console.log(`Found ${tradeshows.length} tradeshows to convert.`);

    // Create the campaigns table
    const createTableQuery = `
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
    `;

    // We can't execute raw SQL directly with Supabase client, so we'll insert the tradeshows as campaigns

    // First, create the campaigns table with a direct insert
    for (const tradeshow of tradeshows) {
      const campaign = {
        name: tradeshow.name,
        campaign_type: 'tradeshow',
        start_date: tradeshow.start_date,
        end_date: tradeshow.end_date,
        description: tradeshow.description,
        location: null, // tradeshows table doesn't have location
        created_at: tradeshow.created_at,
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('campaigns').insert(campaign);
      
      if (insertError) {
        // If the table doesn't exist, we'll get an error
        console.log('Error inserting campaign:', insertError.message);
        
        if (insertError.message && insertError.message.includes('relation "public.campaigns" does not exist')) {
          console.log('Campaigns table does not exist. Creating it...');
          
          // We need to create the table first, but we can't execute raw SQL directly
          // Let's try to use the tradeshows table as a template
          
          // Get all tradeshows
          const { data: allTradeshows, error: fetchError } = await supabase.from('tradeshows').select('*');
          
          if (fetchError) {
            throw fetchError;
          }
          
          console.log(`Converting ${allTradeshows.length} tradeshows to campaigns...`);
          
          // Convert tradeshows to campaigns format
          const campaigns = allTradeshows.map(tradeshow => ({
            name: tradeshow.name,
            campaign_type: 'tradeshow',
            start_date: tradeshow.start_date,
            end_date: tradeshow.end_date,
            description: tradeshow.description,
            location: null,
            created_at: tradeshow.created_at,
            updated_at: new Date().toISOString()
          }));
          
          // Save the campaigns data to a temporary file
          console.log('Saving campaigns data for later import...');
          
          // Since we can't create the table directly, we'll need to use the importCampaigns.js script
          // to create the table and import the data
          
          console.log('Please run the importCampaigns.js script to create the campaigns table and import the data.');
          break;
        } else {
          throw insertError;
        }
      } else {
        console.log(`Converted tradeshow "${tradeshow.name}" to campaign.`);
      }
    }

    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error('Error converting tradeshows to campaigns:', error);
  }
}

// Run the function
convertTradeshowsToCampaigns(); 