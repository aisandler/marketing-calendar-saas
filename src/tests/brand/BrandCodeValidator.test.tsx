/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandCodeValidator } from '../../components/brand/BrandCodeValidator';
import { supabase } from '../../lib/supabase';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Define types for Supabase responses
interface SupabaseResponse {
  data: any[] | null;
  error: { message: string } | null;
}

// Define type for mocked Supabase client
type SupabaseMock = {
  from: jest.Mock;
};

// Mock the Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      eq: jest.fn(),
    })),
  },
}));

describe('BrandCodeValidator Component', () => {
  const mockOnValidation = jest.fn();
  const mockedSupabase = supabase as unknown as SupabaseMock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows loading state while validating', async () => {
    // Mock a delayed response
    const mockSelect = jest.fn().mockImplementation(() => 
      new Promise<SupabaseResponse>(resolve => 
        setTimeout(() => resolve({ data: [], error: null }), 1000)
      )
    );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    render(
      <BrandCodeValidator
        code="TEST"
        onValidation={mockOnValidation}
      />
    );

    // Type in the code
    fireEvent.change(screen.getByLabelText('Brand code'), {
      target: { value: 'TEST' },
    });

    // Check for loading state
    const loadingText = screen.getByText('Checking availability...');
    expect(loadingText).toBeTruthy();

    // Fast-forward timers
    jest.advanceTimersByTime(1000);

    // Wait for validation to complete
    await waitFor(() => {
      const loadingText = screen.queryByText('Checking availability...');
      expect(loadingText).toBeNull();
    });
  });

  test('shows success when code is available', async () => {
    // Mock response for available code
    const mockSelect = jest.fn().mockImplementation(() => 
      Promise.resolve<SupabaseResponse>({ data: [], error: null })
    );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    render(
      <BrandCodeValidator
        code="TEST"
        onValidation={mockOnValidation}
      />
    );

    // Wait for validation
    await waitFor(() => {
      const successText = screen.getByText('Brand code is available');
      expect(successText).toBeTruthy();
    });

    // Verify onValidation was called with true
    expect(mockOnValidation).toHaveBeenCalledWith(true);
  });

  test('shows error when code is taken', async () => {
    // Mock response for taken code
    const mockSelect = jest.fn().mockImplementation(() => 
      Promise.resolve<SupabaseResponse>({
        data: [{ id: 'existing-brand', code: 'TEST' }],
        error: null,
      })
    );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    render(
      <BrandCodeValidator
        code="TEST"
        onValidation={mockOnValidation}
      />
    );

    // Wait for validation
    await waitFor(() => {
      const errorText = screen.getByText('Brand code is already taken');
      expect(errorText).toBeTruthy();
    });

    // Verify onValidation was called with false
    expect(mockOnValidation).toHaveBeenCalledWith(false);
  });

  test('handles validation errors', async () => {
    // Mock error response
    const mockSelect = jest.fn().mockImplementation(() => 
      Promise.resolve<SupabaseResponse>({
        data: null,
        error: { message: 'Database error' },
      })
    );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    render(
      <BrandCodeValidator
        code="TEST"
        onValidation={mockOnValidation}
      />
    );

    // Wait for validation
    await waitFor(() => {
      const errorText = screen.getByText('Error checking brand code');
      expect(errorText).toBeTruthy();
    });

    // Verify onValidation was called with false
    expect(mockOnValidation).toHaveBeenCalledWith(false);
  });

  test('debounces validation requests', async () => {
    const mockSelect = jest.fn().mockImplementation(() => 
      Promise.resolve<SupabaseResponse>({ data: [], error: null })
    );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    render(
      <BrandCodeValidator
        code="TEST"
        onValidation={mockOnValidation}
      />
    );

    // Type multiple times rapidly
    fireEvent.change(screen.getByLabelText('Brand code'), {
      target: { value: 'T' },
    });
    fireEvent.change(screen.getByLabelText('Brand code'), {
      target: { value: 'TE' },
    });
    fireEvent.change(screen.getByLabelText('Brand code'), {
      target: { value: 'TES' },
    });
    fireEvent.change(screen.getByLabelText('Brand code'), {
      target: { value: 'TEST' },
    });

    // Fast-forward past debounce time
    jest.advanceTimersByTime(500);

    // Wait for validation
    await waitFor(() => {
      // Should only make one request with the final value
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });
  });

  test('validates new code when it changes', async () => {
    // Mock responses for different codes
    const mockSelect = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve<SupabaseResponse>({ data: [], error: null })
      )
      .mockImplementationOnce(() => 
        Promise.resolve<SupabaseResponse>({
          data: [{ id: 'existing-brand', code: 'TEST2' }],
          error: null,
        })
      );
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockedSupabase.from.mockImplementation(mockFrom);

    const { rerender } = render(
      <BrandCodeValidator
        code="TEST1"
        onValidation={mockOnValidation}
      />
    );

    // Wait for first validation
    await waitFor(() => {
      const successText = screen.getByText('Brand code is available');
      expect(successText).toBeTruthy();
    });

    // Update with new code
    rerender(
      <BrandCodeValidator
        code="TEST2"
        onValidation={mockOnValidation}
      />
    );

    // Wait for second validation
    await waitFor(() => {
      const errorText = screen.getByText('Brand code is already taken');
      expect(errorText).toBeTruthy();
    });
  });
}); 