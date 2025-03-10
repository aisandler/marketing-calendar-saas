import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../contexts/ToastContext';
import '@testing-library/jest-dom';

// Mock console.error to avoid test output noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('allows user to refresh the page', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(mockReload).toHaveBeenCalled();
  });

  test('allows user to try again', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  const TestComponent = () => <div>Test Component</div>;
  const WrappedComponent = withErrorBoundary(TestComponent, 'TestComponent');

  test('renders wrapped component correctly', () => {
    render(
      <ToastProvider>
        <WrappedComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  test('handles errors in wrapped component', () => {
    const ErrorComponent = () => {
      throw new Error('Component error');
      return null;
    };
    const WrappedErrorComponent = withErrorBoundary(ErrorComponent, 'ErrorComponent');

    render(
      <ToastProvider>
        <WrappedErrorComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Component error')).toBeInTheDocument();
  });
}); 