import React from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLogoutConfirmation } from '../pages/Components/UI/useConfirmation.jsx';

/**
 * SimpleLogoutDialog - A standalone logout confirmation component
 * that integrates with the existing confirmation system
 */
const SimpleLogoutDialog = ({ 
  isOpen = false, 
  onClose,
  onLogout,
  user,
  showUserInfo = true,
  customMessage = null,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const { logout } = useAuth();
  const { confirmLogout, ConfirmationDialog, isConfirming } = useLogoutConfirmation();

  // If not using the confirmation dialog, render a simple logout button
  if (!isOpen && variant === 'compact') {
    return (
      <button
        onClick={handleLogout}
        disabled={isConfirming}
        className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    );
  }

  // Default logout handler
  const handleLogout = async () => {
    try {
      if (onLogout) {
        // Custom logout handler provided
        await onLogout();
      } else {
        // Use default logout from auth context
        await logout();
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // If using confirmation dialog, render it with custom props
  const CustomLogoutDialog = () => {
    if (!isOpen) return null;

    const defaultMessage = customMessage || 'Are you sure you want to sign out? Your current session will be ended and you will need to sign in again to access your personalized features.';

    return (
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={async () => {
          await handleLogout();
        }}
        title="Sign Out Confirmation"
        message={defaultMessage}
        type="warning"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
      />
    );
  };

  return <CustomLogoutDialog />;
};

/**
 * LogoutButton - A simple logout button component
 */
export const LogoutButton = ({ 
  onLogout, 
  variant = 'icon-text', // 'icon', 'text', 'icon-text', 'full'
  size = 'md', // 'sm', 'md', 'lg'
  showConfirmation = true,
  user,
  className = '',
  ...props 
}) => {
  const { logout } = useAuth();
  const { confirmLogout } = useLogoutConfirmation();

  const handleLogout = async () => {
    if (showConfirmation) {
      const confirmed = await confirmLogout();
      if (confirmed) {
        if (onLogout) {
          await onLogout();
        } else {
          await logout();
        }
      }
    } else {
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
      }
    }
  };

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-2.5 text-sm',
    lg: 'p-3 text-base'
  };

  const variantClasses = {
    icon: 'w-10 h-10 rounded-full',
    text: 'px-4 py-2 rounded-lg',
    'icon-text': 'px-4 py-2 rounded-lg gap-2',
    full: 'w-full px-6 py-3 rounded-xl gap-3'
  };

  return (
    <button
      onClick={handleLogout}
      className={`
        flex items-center justify-center font-medium
        text-stone-600 hover:text-red-600 hover:bg-red-50
        transition-all duration-200 hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <LogOut className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      {(variant === 'text' || variant === 'icon-text' || variant === 'full') && (
        <span>Sign Out</span>
      )}
    </button>
  );
};

/**
 * UserMenu - A user menu component with logout option
 */
export const UserMenu = ({ 
  user, 
  onLogout, 
  showProfile = true,
  showEmail = true,
  position = 'bottom' // 'bottom', 'top', 'center'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleLogout = async () => {
    setIsOpen(false);
    if (onLogout) {
      await onLogout();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-stone-100"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 text-white text-sm font-bold flex items-center justify-center">
          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        {((showProfile && user?.displayName) || (showEmail && user?.email)) && (
          <div className="text-left">
            {showProfile && user?.displayName && (
              <p className="text-sm font-semibold text-stone-700">{user.displayName}</p>
            )}
            {showEmail && user?.email && (
              <p className="text-xs text-stone-500 truncate max-w-32">{user.email}</p>
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`
            absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200/60 
            backdrop-blur-xl z-20 overflow-hidden
            ${position === 'top' ? '-translate-y-full' : ''}
            ${position === 'center' ? 'top-1/2 -translate-y-1/2' : ''}
          `}>
            <div className="p-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 text-white text-lg font-bold flex items-center justify-center">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{user?.displayName || 'User'}</p>
                  <p className="text-sm text-stone-500">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <LogoutButton 
                onLogout={handleLogout}
                variant="full"
                size="md"
                className="w-full justify-start text-red-600 hover:bg-red-50"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleLogoutDialog;