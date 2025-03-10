import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandManagement } from '../../components/brand/BrandManagement';
import { BrandProvider } from '../../contexts/BrandContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { Brand } from '../../types/brand';

// Extend the jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toHaveValue(value: string): R;
    }
  }
}

// Mock the Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

const mockBrands: Brand[] = [
  {
    id: 'brand-1',
    name: 'Test Brand 1',
    code: 'TB1',
    color: '#FF0000',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'brand-2',
    name: 'Test Brand 2',
    code: 'TB2',
    color: '#00FF00',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      <BrandProvider>
        {ui}
      </BrandProvider>
    </ToastProvider>
  );
};

describe('BrandManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Supabase response for fetching brands
    (supabase.from('brands').select as jest.Mock).mockResolvedValue({
      data: mockBrands,
      error: null,
    });
  });

  test('renders brand management interface', async () => {
    renderWithProviders(<BrandManagement />);

    // Check that the main elements are rendered
    expect(screen.getByText('Brand Management')).toBeInTheDocument();
    expect(screen.getByText('Add Brand')).toBeInTheDocument();

    // Wait for brands to load
    await waitFor(() => {
      expect(screen.getByText('Test Brand 1')).toBeInTheDocument();
      expect(screen.getByText('Test Brand 2')).toBeInTheDocument();
    });
  });

  test('opens brand form when Add Brand is clicked', async () => {
    renderWithProviders(<BrandManagement />);

    // Click the Add Brand button
    fireEvent.click(screen.getByText('Add Brand'));

    // Check that the form is displayed
    expect(screen.getByText('Create Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  test('shows success toast when brand is created', async () => {
    // Mock the insert response
    (supabase.insert as jest.Mock).mockResolvedValueOnce({
      data: [{
        id: 'new-brand',
        name: 'New Brand',
        code: 'NB',
        color: '#0000FF',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      }],
      error: null,
    });

    renderWithProviders(<BrandManagement />);

    // Open the form
    fireEvent.click(screen.getByText('Add Brand'));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Brand' },
    });
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'NB' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create'));

    // Wait for success toast
    await waitFor(() => {
      expect(screen.getByText('Brand created successfully')).toBeInTheDocument();
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  test('shows error toast when brand creation fails', async () => {
    // Mock the insert response with an error
    (supabase.insert as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Brand code already exists' },
    });

    renderWithProviders(<BrandManagement />);

    // Open the form
    fireEvent.click(screen.getByText('Add Brand'));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Brand' },
    });
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'NB' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create'));

    // Wait for error toast
    await waitFor(() => {
      expect(screen.getByText('Failed to create brand: Brand code already exists')).toBeInTheDocument();
      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });
  });

  test('shows success toast when brand is updated', async () => {
    // Mock the update response
    (supabase.update as jest.Mock).mockResolvedValueOnce({
      data: [{
        id: 'brand-1',
        name: 'Updated Brand',
        code: 'TB1',
        color: '#FF0000',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      }],
      error: null,
    });

    renderWithProviders(<BrandManagement />);

    // Wait for brands to load and click edit button
    await waitFor(() => {
      fireEvent.click(screen.getAllByLabelText('Edit brand')[0]);
    });

    // Update the name
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Updated Brand' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    // Wait for success toast
    await waitFor(() => {
      expect(screen.getByText('Brand updated successfully')).toBeInTheDocument();
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  test('shows error toast when brand update fails', async () => {
    // Mock the update response with an error
    (supabase.update as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    renderWithProviders(<BrandManagement />);

    // Wait for brands to load and click edit button
    await waitFor(() => {
      fireEvent.click(screen.getAllByLabelText('Edit brand')[0]);
    });

    // Update the name
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Updated Brand' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    // Wait for error toast
    await waitFor(() => {
      expect(screen.getByText('Failed to update brand: Database error')).toBeInTheDocument();
      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });
  });

  test('shows success toast when brand is deleted', async () => {
    // Mock the delete response
    (supabase.delete as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    renderWithProviders(<BrandManagement />);

    // Wait for brands to load and click delete button
    await waitFor(() => {
      fireEvent.click(screen.getAllByLabelText('Delete brand')[0]);
    });

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    // Wait for success toast
    await waitFor(() => {
      expect(screen.getByText('Brand deleted successfully')).toBeInTheDocument();
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  test('shows error toast when brand deletion fails', async () => {
    // Mock the delete response with an error
    (supabase.delete as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    renderWithProviders(<BrandManagement />);

    // Wait for brands to load and click delete button
    await waitFor(() => {
      fireEvent.click(screen.getAllByLabelText('Delete brand')[0]);
    });

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    // Wait for error toast
    await waitFor(() => {
      expect(screen.getByText('Failed to delete brand: Database error')).toBeInTheDocument();
      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });
  });

  test('shows error toast when loading brands fails', async () => {
    // Mock the select response with an error
    (supabase.select as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    });

    renderWithProviders(<BrandManagement />);

    // Wait for error toast
    await waitFor(() => {
      expect(screen.getByText('Error loading brands: Network error')).toBeInTheDocument();
      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });
  });
}); 