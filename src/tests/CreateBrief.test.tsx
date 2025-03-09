import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import CreateBrief from '../pages/CreateBrief';
import { supabase } from '../lib/supabase';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
  },
}));

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      id: 'test-user-id',
      role: 'admin',
      name: 'Test User',
      email: 'test@example.com',
    },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateBrief Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads and displays the create brief form', async () => {
    render(
      <MemoryRouter initialEntries={['/briefs/create']}>
        <Routes>
          <Route path="/briefs/create" element={<CreateBrief />} />
        </Routes>
      </MemoryRouter>
    );

    // Check that the form is rendered with the correct title
    expect(screen.getByText('Create New Brief')).toBeInTheDocument();
    
    // Check that form fields are present
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/channel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  test('handles editing an existing brief', async () => {
    // Mock the Supabase response for fetching a brief
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'test-brief-id',
        title: 'Test Brief',
        channel: 'Digital',
        start_date: '2025-03-15',
        due_date: '2025-03-30',
        priority: 'medium',
        status: 'draft',
        description: 'Test description',
        campaign_id: 'test-campaign-id',
        created_by: 'test-user-id',
        created_at: '2025-03-10T00:00:00Z',
        updated_at: '2025-03-10T00:00:00Z',
      },
      error: null,
    });

    // Mock resources and approvers responses
    (supabase.select as jest.Mock).mockImplementation(() => ({
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValueOnce({
        data: [], // Resources
        error: null,
      }).mockResolvedValueOnce({
        data: [], // Approvers
        error: null,
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/briefs/test-brief-id/edit']}>
        <Routes>
          <Route path="/briefs/:id/edit" element={<CreateBrief />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Edit Brief')).toBeInTheDocument();
    });

    // Check that form is pre-filled with brief data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Brief')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Digital')).toBeInTheDocument();
    });
  });

  test('handles non-existent brief gracefully', async () => {
    // Mock the Supabase response for a non-existent brief
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Brief not found' },
    });

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(
      <MemoryRouter initialEntries={['/briefs/non-existent-id/edit']}>
        <Routes>
          <Route path="/briefs/:id/edit" element={<CreateBrief />} />
        </Routes>
      </MemoryRouter>
    );

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/brief not found or you do not have permission/i)).toBeInTheDocument();
    });

    // We can't easily test the navigation since we're mocking it, but we can check that the error message includes the redirect info
    expect(screen.getByText(/you will be redirected/i)).toBeInTheDocument();
  });
}); 