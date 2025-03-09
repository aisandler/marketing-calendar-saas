import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalendarView from '../pages/CalendarView';
import { supabase } from '../lib/supabase';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  },
}));

// Mock the gantt chart
jest.mock('dhtmlx-gantt', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    parse: jest.fn(),
    config: {
      scale_unit: 'day',
      date_scale: '%d %M',
    },
    templates: {
      task_class: jest.fn(),
    },
    attachEvent: jest.fn(),
    clearAll: jest.fn(),
  },
}));

describe('CalendarView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Supabase responses
    (supabase.select as jest.Mock).mockImplementation(() => ({
      then: (callback: Function) => callback({
        data: [
          // Mock briefs data
          {
            id: 'brief-1',
            title: 'Test Brief 1',
            start_date: '2025-03-15',
            due_date: '2025-03-30',
            priority: 'high',
            status: 'in_progress',
            campaign_id: 'campaign-1',
          },
          {
            id: 'brief-2',
            title: 'Test Brief 2',
            start_date: '2025-04-01',
            due_date: '2025-04-15',
            priority: 'medium',
            status: 'draft',
            campaign_id: 'campaign-2',
          },
        ],
        error: null,
      }),
    })).mockImplementationOnce(() => ({
      then: (callback: Function) => callback({
        data: [
          // Mock campaigns data
          {
            id: 'campaign-1',
            name: 'Test Tradeshow',
            campaign_type: 'tradeshow',
            start_date: '2025-03-10',
            end_date: '2025-03-12',
            location: 'Test Location',
          },
          {
            id: 'campaign-2',
            name: 'Test Digital Campaign',
            campaign_type: 'digital_campaign',
            start_date: '2025-04-01',
            end_date: '2025-04-30',
            location: null,
          },
        ],
        error: null,
      }),
    })).mockImplementationOnce(() => ({
      then: (callback: Function) => callback({
        data: [
          // Mock resources data
          {
            id: 'resource-1',
            name: 'Test Resource',
            type: 'internal',
          },
        ],
        error: null,
      }),
    }));
  });

  test('renders calendar view with legend', async () => {
    render(
      <MemoryRouter>
        <CalendarView />
      </MemoryRouter>
    );

    // Check that the calendar view is rendered
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    
    // Check that the legend is displayed
    await waitFor(() => {
      expect(screen.getByText('Tradeshow')).toBeInTheDocument();
      expect(screen.getByText('Event')).toBeInTheDocument();
      expect(screen.getByText('Digital Campaign')).toBeInTheDocument();
      expect(screen.getByText('Product Launch')).toBeInTheDocument();
      expect(screen.getByText('Seasonal Promotion')).toBeInTheDocument();
    });
  });

  test('allows changing view modes', async () => {
    render(
      <MemoryRouter>
        <CalendarView />
      </MemoryRouter>
    );

    // Check that view mode buttons are present
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
  });
}); 