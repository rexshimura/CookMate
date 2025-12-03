import { useState, useCallback } from 'react';

// Hook for managing confirmation dialogs
export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState(null);

  const showConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmation({
        ...options,
        resolve,
        isOpen: true
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const confirm = useCallback((result = true) => {
    if (confirmation?.resolve) {
      confirmation.resolve(result);
    }
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const ConfirmationDialog = () => {
    if (!confirmation) return null;

    const {
      isOpen,
      title,
      message,
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmButtonClass = ''
    } = confirmation;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Enhanced backdrop */}
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl transition-opacity duration-300" />
        
        {/* Dialog container */}
        <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/20 border border-stone-200/60 backdrop-blur-xl max-w-md w-full transform transition-all duration-300 ease-out animate-slideUp">
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl pointer-events-none"></div>
          
          {/* Header */}
          <div className={`${
            type === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-700' :
            type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-700' :
            type === 'info' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
            'bg-gradient-to-r from-yellow-500 to-orange-600'
          } text-white p-6 rounded-t-2xl relative overflow-hidden`}>
            {/* Shimmer effect for header */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse duration-3000 pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  type === 'danger' ? 'bg-red-50 border-red-200' :
                  type === 'success' ? 'bg-green-50 border-green-200' :
                  type === 'info' ? 'bg-blue-50 border-blue-200' :
                  'bg-yellow-50 border-yellow-200'
                } border`}>
                  {type === 'danger' && (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {type === 'success' && (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {type === 'info' && (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {type === 'warning' && (
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold tracking-wide">{title}</h3>
              </div>
              <button
                onClick={() => confirm(false)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-stone-600 leading-relaxed mb-6">{message}</p>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => confirm(false)}
                className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100 transition-all duration-200 hover:scale-105"
              >
                {cancelText}
              </button>
              <button
                onClick={() => confirm(true)}
                className={`px-4 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 overflow-hidden group relative ${
                  type === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' :
                  type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                  type === 'info' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                  'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                }`}
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    showConfirmation,
    ConfirmationDialog,
    isConfirming: !!confirmation
  };
};

// Convenience hooks for specific confirmation types
export const useDeleteConfirmation = () => {
  const { showConfirmation, ConfirmationDialog, isConfirming } = useConfirmation();
  
  const confirmDelete = useCallback((itemName = 'this item') => {
    return showConfirmation({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
  }, [showConfirmation]);

  return {
    confirmDelete,
    ConfirmationDialog,
    isConfirming
  };
};

export const useLogoutConfirmation = () => {
  const { showConfirmation, ConfirmationDialog, isConfirming } = useConfirmation();
  
  const confirmLogout = useCallback(() => {
    return showConfirmation({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to sign out? Your current session will be ended.',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Stay Signed In'
    });
  }, [showConfirmation]);

  return {
    confirmLogout,
    ConfirmationDialog,
    isConfirming
  };
};