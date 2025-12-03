import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = '',
  loading = false 
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <XCircle className="w-6 h-6 text-red-500" />,
          headerBg: 'bg-gradient-to-r from-red-600 to-red-700',
          buttonBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
          iconBg: 'bg-red-50 border-red-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          headerBg: 'bg-gradient-to-r from-green-600 to-green-700',
          buttonBg: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
          iconBg: 'bg-green-50 border-green-200'
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          buttonBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
          iconBg: 'bg-blue-50 border-blue-200'
        };
      default: // warning
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          headerBg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          buttonBg: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
          iconBg: 'bg-yellow-50 border-yellow-200'
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      {/* Enhanced backdrop */}
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl transition-opacity duration-300" />
      
      {/* Dialog container */}
      <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/20 border border-stone-200/60 backdrop-blur-xl max-w-md w-full transform transition-all duration-300 ease-out animate-slideUp">
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl pointer-events-none"></div>
        
        {/* Header */}
        <div className={`${styles.headerBg} text-white p-6 rounded-t-2xl relative overflow-hidden`}>
          {/* Shimmer effect for header */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse duration-3000 pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${styles.iconBg}`}>
                {styles.icon}
              </div>
              <h3 className="text-lg font-bold tracking-wide">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-stone-600 leading-relaxed mb-6">{message}</p>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100 transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 overflow-hidden group relative ${styles.buttonBg} ${confirmButtonClass}`}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;