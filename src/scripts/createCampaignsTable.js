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

async function createCampaignsTable() {
  try {
    console.log('Creating campaigns table...');

    // First, check if the table already exists
    const { error: checkError } = await supabase.from('campaigns').select('id').limit(1);
    
    if (!checkError) {
      console.log('Campaigns table already exists.');
      return;
    }

    // Create the campaigns table
    const { error } = await supabase.rpc('create_campaigns_table_sql', {
      sql: `
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
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON public.campaigns(start_date);
        CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON public.campaigns(end_date);
        CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON public.campaigns(campaign_type);
        
        -- Create trigger to update updated_at
        CREATE TRIGGER update_campaigns_updated_at
        BEFORE UPDATE ON public.campaigns
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        -- Create RLS policies
        ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view all campaigns" ON public.campaigns
          FOR SELECT USING (true);
        
        CREATE POLICY "Only admins and managers can insert campaigns" ON public.campaigns
          FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));
        
        CREATE POLICY "Only admins and managers can update campaigns" ON public.campaigns
          FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));
        
        CREATE POLICY "Only admins and managers can delete campaigns" ON public.campaigns
          FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));
      `
    });

    if (error) {
      // If the RPC function doesn't exist, try a direct SQL query
      console.log('RPC function not found, trying direct SQL query...');
      
      // First, create the campaigns table
      const { error: createError } = await supabase.from('tradeshows').insert({
        name: 'TEMP_FOR_CONVERSION',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        description: 'Temporary record for table conversion'
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Created temporary record in tradeshows table');
      
      // Now, rename the tradeshows table to campaigns and add the campaign_type column
      const { error: renameError } = await supabase.rpc('rename_tradeshows_to_campaigns');
      
      if (renameError) {
        throw renameError;
      }
      
      console.log('Renamed tradeshows table to campaigns');
    } else {
      console.log('Campaigns table created successfully!');
    }
  } catch (error) {
    console.error('Error creating campaigns table:', error);
  }
}

// Run the function
createCampaignsTable(); 