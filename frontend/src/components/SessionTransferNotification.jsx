import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const SessionTransferNotification = () => {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [transferData, setTransferData] = useState(null);

  const handleSessionsTransferred = (event) => {
    const { transferredCount, totalSessions, successRate, errors } = event.detail;
    
    setTransferData({
      transferredCount,
      totalSessions,
      successRate,
      hasErrors: errors && errors.length > 0,
      errorCount: errors ? errors.length : 0
    });
    
    setShowNotification(true);
    
    // Auto-hide after 7 seconds for more complex messages
    setTimeout(() => {
      setShowNotification(false);
    }, 7000);
  };

  const handleClose = () => {
    setShowNotification(false);
  };

  useEffect(() => {
    if (user) {
      window.addEventListener('sessionsTransferred', handleSessionsTransferred);
      
      return () => {
        window.removeEventListener('sessionsTransferred', handleSessionsTransferred);
      };
    }
  }, [user]);

  if (!showNotification || !user || !transferData || transferData.transferredCount === 0) {
    return null;
  }

  const { transferredCount, totalSessions, successRate, hasErrors, errorCount } = transferData;
  const isPartialSuccess = hasErrors || successRate < 1;
  
  const getNotificationStyle = () => {
    if (hasErrors) {
      return 'bg-yellow-50 border-yellow-200';
    } else if (isPartialSuccess) {
      return 'bg-blue-50 border-blue-200';
    } else {
      return 'bg-green-50 border-green-200';
    }
  };

  const getIcon = () => {
    if (hasErrors) {
      return (
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (isPartialSuccess) {
      return (
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const getTitle = () => {
    if (hasErrors) {
      return 'Partial Transfer Complete';
    } else if (isPartialSuccess) {
      return 'Sessions Mostly Transferred';
    } else {
      return 'Sessions Transferred!';
    }
  };

  const getMessage = () => {
    if (hasErrors) {
      return `${transferredCount} of ${totalSessions} sessions transferred successfully. ${errorCount} ${errorCount === 1 ? 'session' : 'sessions'} failed to transfer.`;
    } else if (isPartialSuccess) {
      return `${transferredCount} of ${totalSessions} sessions transferred to your account. You can now access them on any device.`;
    } else {
      return `${transferredCount} ${transferredCount === 1 ? 'chat session' : 'chat sessions'} transferred to your account. You can now access them on any device.`;
    }
  };

  const getTextColor = () => {
    if (hasErrors) {
      return 'text-yellow-800';
    } else if (isPartialSuccess) {
      return 'text-blue-800';
    } else {
      return 'text-green-800';
    }
  };

  const getSubTextColor = () => {
    if (hasErrors) {
      return 'text-yellow-700';
    } else if (isPartialSuccess) {
      return 'text-blue-700';
    } else {
      return 'text-green-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`border rounded-lg p-4 shadow-lg ${getNotificationStyle()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {getTitle()}
            </p>
            <p className={`mt-1 text-sm ${getSubTextColor()}`}>
              {getMessage()}
            </p>
            {hasErrors && (
              <p className="mt-1 text-xs text-yellow-600">
                Check your internet connection and try logging out and back in to transfer the remaining sessions.
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`rounded-md inline-flex ${getTextColor().replace('text-', 'hover:text-')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current`}
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTransferNotification;