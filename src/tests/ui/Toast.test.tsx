import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../../components/ui/Toast';
import '@testing-library/jest-dom';

describe('Toast Component', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders success toast correctly', () => {
    render(
      <Toast
        id="1"
        type="success"
        message="Operation successful"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    expect(screen.getByTestId('toast-1')).toHaveClass('bg-green-100');
    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  test('renders error toast correctly', () => {
    render(
      <Toast
        id="2"
        type="error"
        message="Operation failed"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Operation failed')).toBeInTheDocument();
    expect(screen.getByTestId('toast-2')).toHaveClass('bg-red-100');
    expect(screen.getByLabelText('Error')).toBeInTheDocument();
  });

  test('renders info toast correctly', () => {
    render(
      <Toast
        id="3"
        type="info"
        message="Information message"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Information message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-3')).toHaveClass('bg-blue-100');
    expect(screen.getByLabelText('Info')).toBeInTheDocument();
  });

  test('calls onDismiss when close button is clicked', async () => {
    render(
      <Toast
        id="4"
        type="success"
        message="Dismissible toast"
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByLabelText('Dismiss');
    await userEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('4');
  });

  test('animates on mount and unmount', () => {
    const { container } = render(
      <Toast
        id="5"
        type="success"
        message="Animated toast"
        onDismiss={mockOnDismiss}
      />
    );

    const toastElement = container.firstChild;
    expect(toastElement).toHaveStyle('opacity: 0');

    // Fast-forward enter animation
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(toastElement).toHaveStyle('opacity: 1');
  });

  test('handles long messages appropriately', () => {
    const longMessage = 'This is a very long message that should be handled gracefully by the toast component without breaking the layout or becoming unreadable to users.';
    
    render(
      <Toast
        id="6"
        type="info"
        message={longMessage}
        onDismiss={mockOnDismiss}
      />
    );

    const messageElement = screen.getByText(longMessage);
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass('break-words');
  });

  test('is accessible', () => {
    render(
      <Toast
        id="7"
        type="success"
        message="Accessible toast"
        onDismiss={mockOnDismiss}
      />
    );

    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
}); 