import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandManagement } from '../../components/brand/BrandManagement';
import { BrandProvider } from '../../contexts/BrandContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { performanceThresholds, testEnvironment, getAdjustedThreshold } from './perf.config';
import '@testing-library/jest-dom';

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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      <BrandProvider>
        {ui}
      </BrandProvider>
    </ToastProvider>
  );
};

describe('Brand Management Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    performance.mark('test-start');
  });

  afterEach(() => {
    jest.useRealTimers();
    performance.clearMarks();
    performance.clearMeasures();
  });

  test('initial render time is under threshold', () => {
    performance.mark('render-start');
    
    renderWithProviders(<BrandManagement />);
    
    performance.mark('render-end');
    performance.measure('render-time', 'render-start', 'render-end');
    
    const measure = performance.getEntriesByName('render-time')[0];
    expect(measure.duration).toBeLessThan(
      getAdjustedThreshold(performanceThresholds.initialRender)
    );
  });

  test('form validation responds within one frame', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Open form
    await userEvent.click(screen.getByText('Add Brand'));
    
    // Measure validation time
    performance.mark('validation-start');
    
    // Type invalid input to trigger validation
    await userEvent.type(screen.getByLabelText('Name'), 'a');
    await userEvent.tab();
    
    performance.mark('validation-end');
    performance.measure('validation-time', 'validation-start', 'validation-end');
    
    const measure = performance.getEntriesByName('validation-time')[0];
    expect(measure.duration).toBeLessThan(
      getAdjustedThreshold(performanceThresholds.formValidation)
    );
  });

  test('toast notifications stack efficiently', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Mock multiple rapid operations
    const operations = Array(5).fill(null).map((_, i) => ({
      data: [{ id: `brand-${i}`, name: `Brand ${i}`, code: `B${i}`, color: '#FF0000' }],
      error: null
    }));
    
    operations.forEach(op => {
      (supabase.insert as jest.Mock).mockResolvedValueOnce(op);
    });
    
    performance.mark('toasts-start');
    
    // Trigger multiple toasts rapidly
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await userEvent.click(screen.getByText('Add Brand'));
        await userEvent.type(screen.getByLabelText('Name'), `Brand ${i}`);
        await userEvent.type(screen.getByLabelText('Code'), `B${i}`);
        await userEvent.click(screen.getByText('Create'));
      });
    }
    
    performance.mark('toasts-end');
    performance.measure('toasts-time', 'toasts-start', 'toasts-end');
    
    const measure = performance.getEntriesByName('toasts-time')[0];
    const toastThreshold = getAdjustedThreshold(performanceThresholds.toastDisplay * 5);
    expect(measure.duration).toBeLessThan(toastThreshold);
    
    // Check that all toasts are visible and properly stacked
    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(5);
    
    // Check toast positioning
    const toastPositions = toasts.map(toast => {
      const rect = toast.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    });
    
    // Verify no overlapping toasts
    for (let i = 1; i < toastPositions.length; i++) {
      expect(toastPositions[i].top).toBeGreaterThan(toastPositions[i-1].bottom);
    }
  });

  test('color picker opens within threshold', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Open form
    await userEvent.click(screen.getByText('Add Brand'));
    
    performance.mark('picker-start');
    
    // Open color picker
    await userEvent.click(screen.getByLabelText('Color'));
    
    performance.mark('picker-end');
    performance.measure('picker-time', 'picker-start', 'picker-end');
    
    const measure = performance.getEntriesByName('picker-time')[0];
    expect(measure.duration).toBeLessThan(
      getAdjustedThreshold(performanceThresholds.colorPickerOpen)
    );
  });

  test('form submission debounces properly', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Mock successful submission
    (supabase.insert as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'new-brand', name: 'Test Brand', code: 'TB', color: '#FF0000' }],
      error: null
    });
    
    // Open form
    await userEvent.click(screen.getByText('Add Brand'));
    
    // Fill form rapidly
    performance.mark('submit-start');
    
    await act(async () => {
      await userEvent.type(screen.getByLabelText('Name'), 'Test Brand', { delay: 0 });
      await userEvent.type(screen.getByLabelText('Code'), 'TB', { delay: 0 });
      await userEvent.click(screen.getByText('Create'));
    });
    
    performance.mark('submit-end');
    performance.measure('submit-time', 'submit-start', 'submit-end');
    
    const measure = performance.getEntriesByName('submit-time')[0];
    expect(measure.duration).toBeLessThan(
      getAdjustedThreshold(performanceThresholds.formSubmission)
    );
  });

  test('list rerender performance with large dataset', async () => {
    // Mock large dataset
    const manyBrands = Array(testEnvironment.largeDataset).fill(null).map((_, i) => ({
      id: `brand-${i}`,
      name: `Brand ${i}`,
      code: `B${i}`,
      color: '#FF0000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    (supabase.from('brands').select as jest.Mock).mockResolvedValueOnce({
      data: manyBrands,
      error: null
    });
    
    performance.mark('list-start');
    
    renderWithProviders(<BrandManagement />);
    
    await act(async () => {
      await screen.findByText('Brand 0');
    });
    
    performance.mark('list-end');
    performance.measure('list-time', 'list-start', 'list-end');
    
    const measure = performance.getEntriesByName('list-time')[0];
    const listThreshold = getAdjustedThreshold(
      performanceThresholds.listItemRender * testEnvironment.largeDataset
    );
    expect(measure.duration).toBeLessThan(listThreshold);
  });
}); 