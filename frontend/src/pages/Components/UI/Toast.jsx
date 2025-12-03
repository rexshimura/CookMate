import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

// Toast Context for global state management
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const { id, type, title, message, duration = 5000 } = toast;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          bg: 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-100',
          border: 'border-green-200',
          shadow: 'shadow-green-200/30',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          bg: 'bg-gradient-to-r from-red-50 via-rose-50 to-red-100',
          border: 'border-red-200',
          shadow: 'shadow-red-200/30',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          bg: 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100',
          border: 'border-yellow-200',
          shadow: 'shadow-yellow-200/30',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bg: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100',
          border: 'border-blue-200',
          shadow: 'shadow-blue-200/30',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const styles = getToastStyles();

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <div className={`
      relative p-4 rounded-2xl border ${styles.border} ${styles.bg} 
      shadow-lg ${styles.shadow} backdrop-blur-xl 
      transform transition-all duration-500 ease-out 
      hover:scale-[1.02] animate-slideUp
      max-w-sm w-full
    `}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 p-1 rounded-lg bg-white/50">
          {styles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-bold ${styles.titleColor} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${message ? styles.messageColor : styles.titleColor}`}>
            {message || title}
          </p>
        </div>
        
        <button
          onClick={() => onRemove(id)}
          className="flex-shrink-0 p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-white/50 transition-all duration-200 hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar for timed toasts */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-200/50 rounded-b-2xl overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${type === 'success' ? 'from-green-400 to-emerald-500' : 
              type === 'error' ? 'from-red-400 to-rose-500' : 
              type === 'warning' ? 'from-yellow-400 to-amber-500' : 
              'from-blue-400 to-indigo-500'} transition-all duration-300 ease-linear`}
            style={{ 
              animation: `shrink ${duration}ms linear forwards` 
            }}
          />
        </div>
      )}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Helper methods for different toast types
  const toast = useCallback({
    success: (message, options = {}) => 
      addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => 
      addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => 
      addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => 
      addToast({ type: 'info', message, ...options })
  }, [addToast]);

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    toast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 p-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

// Add the shrink animation to CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `;
  document.head.appendChild(style);
}