import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import Button from './Button';
import { captureException } from '../utils/errorTracker';
import '../styles/components/ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error with error tracking service
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-boundary-actions">
              <Button onClick={this.handleReset} variant="primary">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="secondary">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
