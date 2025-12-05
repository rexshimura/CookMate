import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('🚨 [ERROR BOUNDARY] Caught an error:', error);
    console.error('🚨 [ERROR BOUNDARY] Error Info:', errorInfo);
    console.error('🚨 [ERROR BOUNDARY] Stack:', error.stack);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optionally send error to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Here you could send to error reporting service like Sentry
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Increment retry count to prevent infinite retry loops
    const maxRetries = 3;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('🚨 [ERROR BOUNDARY] Max retries reached, reloading page');
      window.location.reload();
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const maxRetries = 3;
      const canRetry = retryCount < maxRetries;

      // Custom error UI based on error type
      const isNetworkError = error && (
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('fetch')
      );

      const isAuthError = error && (
        error.message.includes('Unauthorized') ||
        error.message.includes('auth') ||
        error.message.includes('sign in')
      );

      const getErrorTitle = () => {
        if (isNetworkError) return 'Connection Problem';
        if (isAuthError) return 'Authentication Issue';
        return 'Something Went Wrong';
      };

      const getErrorDescription = () => {
        if (isNetworkError) {
          return 'We couldn\'t connect to our servers. Please check your internet connection and try again.';
        }
        if (isAuthError) {
          return 'There was a problem with your authentication. Please try signing in again.';
        }
        return 'The app encountered an unexpected error. Our team has been notified and is working on a fix.';
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 font-sans relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.red.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-red-200 to-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-yellow-200 to-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>

          <div className="relative z-10 max-w-md w-full mx-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-900/10 border border-red-200/60 p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200/60 shadow-lg shadow-red-200/30">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-wide">
                {getErrorTitle()}
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {getErrorDescription()}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg shadow-orange-200/50 hover:scale-105"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again ({maxRetries - retryCount} left)
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload
                  </button>
                </div>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <Bug className="w-4 h-4" />
                    Technical Details (Dev Mode)
                  </summary>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <p className="text-xs text-gray-400 mt-6">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;