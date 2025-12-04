import React from 'react';
import { AlertTriangle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';

/**
 * Reusable error message component with retry functionality
 * @param {Object} props
 * @param {string} props.error - The error message to display
 * @param {string} props.type - Error type: 'network', 'auth', 'server', 'validation', 'general'
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 * @param {Function} props.onDismiss - Function to call when dismiss button is clicked
 * @param {boolean} props.showRetry - Whether to show the retry button
 * @param {boolean} props.showDismiss - Whether to show the dismiss button
 * @param {boolean} props.isRetrying - Whether a retry operation is in progress
 * @param {string} props.className - Additional CSS classes
 */
const ErrorMessage = ({ 
  error, 
  type = 'general',
  onRetry, 
  onDismiss, 
  showRetry = false,
  showDismiss = true,
  isRetrying = false,
  className = ''
}) => {
  if (!error) return null;

  // Get error styling and icon based on type
  const getErrorConfig = (errorType) => {
    switch (errorType) {
      case 'network':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-500',
          icon: <WifiOff className="w-5 h-5" />,
          title: 'Connection Error'
        };
      case 'auth':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200', 
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Authentication Error'
        };
      case 'server':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800', 
          iconColor: 'text-purple-500',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Server Error'
        };
      case 'validation':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Validation Error'
        };
      default:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500', 
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Error'
        };
    }
  };

  const config = getErrorConfig(type);

  return (
    <div className={`
      ${config.bgColor} 
      ${config.borderColor} 
      border 
      rounded-2xl 
      p-4 
      mb-4 
      animate-slideUp
      ${className}
    `}>
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className={`flex-shrink-0 ${config.iconColor} mt-0.5`}>
          {config.icon}
        </div>
        
        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h4>
          <p className={`text-sm ${config.textColor} leading-relaxed`}>
            {error}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {/* Retry Button */}
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 hover:scale-105
                ${isRetrying 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : `${config.textColor} hover:bg-white hover:bg-opacity-60`
                }
              `}
              title="Try again"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}

          {/* Dismiss Button */}
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                p-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 hover:scale-110
                ${config.textColor} hover:bg-white hover:bg-opacity-60
              `}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;