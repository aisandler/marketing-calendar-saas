import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrandManagement } from '../../components/brand/BrandManagement';
import { BrandProvider } from '../../contexts/BrandContext';
import { ToastProvider } from '../../contexts/ToastContext';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

interface Violation {
  id: string;
  impact: string;
  description: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      <BrandProvider>
        {ui}
      </BrandProvider>
    </ToastProvider>
  );
};

describe('Brand Management Accessibility', () => {
  test('should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<BrandManagement />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('form controls have associated labels', () => {
    renderWithProviders(<BrandManagement />);
    
    // Open form
    screen.getByText('Add Brand').click();
    
    // Check form controls
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Code')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Color')).toHaveAttribute('aria-required', 'true');
  });

  test('error messages are announced to screen readers', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Open form
    screen.getByText('Add Brand').click();
    
    // Submit empty form to trigger validation
    screen.getByText('Create').click();
    
    // Check error messages
    const errors = await screen.findAllByRole('alert');
    errors.forEach(error => {
      expect(error).toHaveAttribute('aria-live', 'polite');
    });
  });

  test('color picker has proper ARIA attributes', () => {
    renderWithProviders(<BrandManagement />);
    
    // Open form
    screen.getByText('Add Brand').click();
    
    // Check color picker
    const colorPicker = screen.getByLabelText('Color');
    expect(colorPicker).toHaveAttribute('role', 'button');
    expect(colorPicker).toHaveAttribute('aria-haspopup', 'dialog');
    
    // Open color picker
    colorPicker.click();
    
    // Check color dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Color picker');
  });

  test('toast notifications are announced appropriately', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Trigger a toast
    screen.getByText('Add Brand').click();
    screen.getByText('Create').click();
    
    // Check toast accessibility
    const toast = await screen.findByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('role', 'alert');
  });

  test('loading states are properly indicated', async () => {
    renderWithProviders(<BrandManagement />);
    
    // Check loading spinner
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading brands');
  });

  test('interactive elements are keyboard accessible', () => {
    renderWithProviders(<BrandManagement />);
    
    // Check buttons
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabindex', '0');
      expect(button).toBeVisible();
    });
  });

  test('modal dialogs trap focus correctly', () => {
    renderWithProviders(<BrandManagement />);
    
    // Open delete confirmation
    const deleteButton = screen.getAllByLabelText('Delete brand')[0];
    deleteButton.click();
    
    // Check modal
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBeInTheDocument();
  });

  test('color contrast meets WCAG standards', async () => {
    const { container } = renderWithProviders(<BrandManagement />);
    const results = await axe(container);
    
    // Check specifically for color contrast violations
    const contrastViolations = results.violations.filter(
      (violation: Violation) => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toHaveLength(0);
  });
}); 