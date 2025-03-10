import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandForm } from '../../components/brand/BrandForm';
import '@testing-library/jest-dom';
import { Brand } from '../../types/brand';

describe('BrandForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create form correctly', () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check form elements
    expect(screen.getByText('Create Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('renders edit form correctly', () => {
    const mockBrand: Brand = {
      id: 'test-id',
      name: 'Test Brand',
      code: 'TB',
      color: '#FF0000',
      created_at: '2024-03-15T00:00:00Z',
      updated_at: '2024-03-15T00:00:00Z',
    };

    render(
      <BrandForm
        brand={mockBrand}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check form elements and pre-filled values
    expect(screen.getByText('Edit Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Test Brand');
    expect(screen.getByLabelText('Code')).toHaveValue('TB');
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit empty form
    fireEvent.click(screen.getByText('Create'));

    // Check validation messages
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Code is required')).toBeInTheDocument();
    });

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('validates brand code format', async () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Enter invalid code
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'invalid-code' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Check validation message
    await waitFor(() => {
      expect(screen.getByText('Code must contain only uppercase letters and numbers')).toBeInTheDocument();
    });

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Brand' },
    });
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'NB' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Brand',
        code: 'NB',
        color: expect.any(String), // Color picker will provide a default color
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('handles color selection', async () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Select a color (implementation depends on your ColorPicker component)
    const colorInput = screen.getByLabelText('Color');
    fireEvent.change(colorInput, {
      target: { value: '#00FF00' },
    });

    // Fill other required fields
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Brand' },
    });
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'NB' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify onSubmit was called with selected color
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#00FF00',
        })
      );
    });
  });
}); 