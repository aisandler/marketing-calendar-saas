import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import '@testing-library/jest-dom';

// Test component that uses the toast context
const TestComponent = () => {
  const { showToast } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast('success', 'Success message')}>Show Success</button>
      <button onClick={() => showToast('error', 'Error message')}>Show Error</button>
      <button onClick={() => showToast('info', 'Info message')}>Show Info</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('provides toast functionality to children', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show success toast
    await userEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByLabelText('Success')).toBeInTheDocument();

    // Show error toast
    await userEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByLabelText('Error')).toBeInTheDocument();

    // Show info toast
    await userEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByLabelText('Info')).toBeInTheDocument();
  });

  test('automatically dismisses toasts after timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast
    await userEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward past the auto-dismiss timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Toast should be removed
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  test('allows manual dismissal of toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast
    await userEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss');
    await userEvent.click(dismissButton);

    // Toast should be removed
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  test('handles multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    await userEvent.click(screen.getByText('Show Success'));
    await userEvent.click(screen.getByText('Show Error'));
    await userEvent.click(screen.getByText('Show Info'));

    // All toasts should be visible
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();

    // Toasts should be stacked in the correct order
    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(3);
    expect(toasts[0]).toHaveTextContent('Success message');
    expect(toasts[1]).toHaveTextContent('Error message');
    expect(toasts[2]).toHaveTextContent('Info message');
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  test('maintains toast order when dismissing', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    await userEvent.click(screen.getByText('Show Success'));
    await userEvent.click(screen.getByText('Show Error'));

    // Get initial toasts
    const initialToasts = screen.getAllByRole('alert');
    expect(initialToasts).toHaveLength(2);

    // Dismiss first toast
    const dismissButtons = screen.getAllByLabelText('Dismiss');
    await userEvent.click(dismissButtons[0]);

    // Check remaining toast
    const remainingToasts = screen.getAllByRole('alert');
    expect(remainingToasts).toHaveLength(1);
    expect(remainingToasts[0]).toHaveTextContent('Error message');
  });
}); 