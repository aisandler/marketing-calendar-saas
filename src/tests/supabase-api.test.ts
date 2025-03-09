import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { describe, test, expect, beforeAll } from '@jest/globals';

// Load environment variables
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if environment variables are not set
const skipTests = !supabaseUrl || !supabaseServiceRoleKey;

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

describe('Supabase API Tests', () => {
  // Skip all tests if environment variables are not set
  beforeAll(() => {
    if (skipTests) {
      console.warn('Skipping Supabase API tests: Missing environment variables');
    }
  });

  // Test campaigns table
  describe('Campaigns Table', () => {
    test('should fetch campaigns', async () => {
      if (skipTests) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      if (data) {
        expect(data.length).toBeGreaterThan(0);
      }
    });

    test('should fetch campaigns after March 10th, 2025', async () => {
      if (skipTests) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .gte('start_date', '2025-03-10');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      if (data) {
        expect(data.length).toBeGreaterThan(0);
        
        // Verify all campaigns are after March 10th, 2025
        data.forEach(campaign => {
          expect(new Date(campaign.start_date).getTime()).toBeGreaterThanOrEqual(new Date('2025-03-10').getTime());
        });
      }
    });
  });

  // Test briefs table
  describe('Briefs Table', () => {
    test('should fetch briefs', async () => {
      if (skipTests) return;

      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should fetch briefs with campaign associations', async () => {
      if (skipTests) return;

      const { data, error } = await supabase
        .from('briefs')
        .select('*, campaigns(*)')
        .not('campaign_id', 'is', null)
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      // Verify briefs have campaign associations
      data?.forEach(brief => {
        expect(brief.campaign_id).not.toBeNull();
        expect(brief.campaigns).toBeDefined();
      });
    });
  });

  // Test campaign-brief relationships
  describe('Campaign-Brief Relationships', () => {
    test('should fetch briefs for a specific campaign', async () => {
      if (skipTests) return;

      // First, get a campaign ID
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        console.warn('No campaigns found, skipping test');
        return;
      }

      const campaignId = campaigns[0].id;

      // Then, fetch briefs for that campaign
      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .eq('campaign_id', campaignId);

      expect(error).toBeNull();
      
      // Note: It's possible that a campaign has no briefs, so we don't assert on data length
      expect(Array.isArray(data)).toBe(true);
      
      // If there are briefs, verify they all have the correct campaign_id
      data?.forEach(brief => {
        expect(brief.campaign_id).toBe(campaignId);
      });
    });
  });
}); 