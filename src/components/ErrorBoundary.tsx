import React from 'react';
import { Button } from './ui/Button';
import { useToast } from '../contexts/ToastContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to your error tracking service
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <div className="text-gray-600 mb-6">
              <p className="mb-2">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              {this.state.error && (
                <pre className="mt-4 p-4 bg-gray-50 rounded text-left text-sm overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary and toast notifications
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function WithErrorBoundaryComponent(props: P) {
    const { showToast } = useToast();

    return (
      <ErrorBoundary>
        <WrappedComponent
          {...props}
          onError={(error: Error) => {
            showToast(
              'error',
              `Error in ${componentName}`,
              error.message
            );
          }}
        />
      </ErrorBoundary>
    );
  };
} 