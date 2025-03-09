import { supabase } from '../lib/supabase';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock the Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('API Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Campaign Operations', () => {
    test('fetches campaigns successfully', async () => {
      // Mock successful response
      const mockSelect = jest.fn().mockResolvedValueOnce({
        data: [
          {
            id: 'campaign-1',
            name: 'Test Campaign',
            campaign_type: 'tradeshow',
            start_date: '2025-03-10',
            end_date: '2025-03-12',
          },
        ],
        error: null,
      });

      // Setup the mock chain
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect,
      });

      // Call the API
      const { data, error } = await supabase
        .from('campaigns')
        .select('*');

      // Verify the response
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBe(1);
      expect(data?.[0].name).toBe('Test Campaign');
      expect(data?.[0].campaign_type).toBe('tradeshow');
    });

    test('handles campaign fetch errors', async () => {
      // Mock error response
      (supabase.select as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // Call the API
      const { data, error } = await supabase
        .from('campaigns')
        .select('*');

      // Verify the response
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('Brief Operations', () => {
    test('fetches a brief by ID successfully', async () => {
      // Mock successful response
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 'brief-1',
          title: 'Test Brief',
          campaign_id: 'campaign-1',
        },
        error: null,
      });

      // Call the API
      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .eq('id', 'brief-1')
        .single();

      // Verify the response
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe('Test Brief');
      expect(data.campaign_id).toBe('campaign-1');
    });

    test('handles non-existent brief gracefully', async () => {
      // Mock error response for non-existent brief
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Brief not found', code: 'PGRST116' },
      });

      // Call the API
      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .eq('id', 'non-existent-id')
        .single();

      // Verify the response
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe('Brief not found');
      expect(error.code).toBe('PGRST116');
    });

    test('updates a brief successfully', async () => {
      // Mock successful update response
      (supabase.eq as jest.Mock).mockResolvedValueOnce({
        data: { id: 'brief-1' },
        error: null,
      });

      // Call the API
      const { data, error } = await supabase
        .from('briefs')
        .update({
          title: 'Updated Brief Title',
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'brief-1');

      // Verify the response
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe('brief-1');
    });
  });

  describe('Campaign-Brief Relationship', () => {
    test('fetches briefs by campaign ID', async () => {
      // Mock successful response
      (supabase.select as jest.Mock).mockResolvedValueOnce({
        data: [
          {
            id: 'brief-1',
            title: 'Campaign Brief 1',
            campaign_id: 'campaign-1',
          },
          {
            id: 'brief-2',
            title: 'Campaign Brief 2',
            campaign_id: 'campaign-1',
          },
        ],
        error: null,
      });

      // Call the API
      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .eq('campaign_id', 'campaign-1');

      // Verify the response
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data[0].campaign_id).toBe('campaign-1');
      expect(data[1].campaign_id).toBe('campaign-1');
    });
  });
}); 