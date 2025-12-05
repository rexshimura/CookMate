# Logout Components Documentation

This document explains how to use the logout confirmation dialog components across the CookMate application.

## Overview

The application provides a consistent logout experience with confirmation dialogs across all major components. The logout system includes:

- **Confirmation dialogs** - Prevent accidental logouts
- **Loading states** - Show progress during logout process
- **Multiple component variants** - Flexible UI options
- **Consistent error handling** - User-friendly error messages

## Components Available

### 1. SimpleLogoutDialog

A comprehensive logout component with multiple variants.

```jsx
import SimpleLogoutDialog from '../components/SimpleLogoutDialog.jsx';

// Basic usage
<SimpleLogoutDialog 
  isOpen={showLogoutDialog}
  onClose={() => setShowLogoutDialog(false)}
  onLogout={handleCustomLogout}
  user={user}
  showUserInfo={true}
  customMessage="Are you sure you want to sign out?"
  variant="default"
/>
```

**Props:**
- `isOpen` - Controls dialog visibility
- `onClose` - Handler when dialog is closed/cancelled
- `onLogout` - Custom logout handler (optional)
- `user` - User object for display information
- `showUserInfo` - Show user details in dialog
- `customMessage` - Custom confirmation message
- `variant` - Dialog style variant ('default', 'compact', 'detailed')

### 2. LogoutButton

A standalone logout button with built-in confirmation.

```jsx
import { LogoutButton } from '../components/SimpleLogoutDialog.jsx';

// Basic logout button
<LogoutButton 
  onLogout={handleCustomLogout}
  variant="icon-text" // 'icon', 'text', 'icon-text', 'full'
  size="md" // 'sm', 'md', 'lg'
  showConfirmation={true}
  user={user}
  className="custom-styles"
/>
```

**Props:**
- `onLogout` - Custom logout handler (optional)
- `variant` - Button style ('icon', 'text', 'icon-text', 'full')
- `size` - Button size ('sm', 'md', 'lg')
- `showConfirmation` - Show confirmation dialog
- `user` - User object for display
- `className` - Additional CSS classes

**Variants:**
- `'icon'` - Just the logout icon (w-10 h-10)
- `'text'` - Just "Sign Out" text
- `'icon-text'` - Icon + "Sign Out" text (default)
- `'full'` - Full-width button for menus

**Sizes:**
- `'sm'` - Small button (p-2, text-sm)
- `'md'` - Medium button (p-2.5, text-sm) (default)
- `'lg'` - Large button (p-3, text-base)

### 3. UserMenu

A dropdown user menu with logout option.

```jsx
import { UserMenu } from '../components/SimpleLogoutDialog.jsx';

<UserMenu 
  user={user}
  onLogout={handleCustomLogout}
  showProfile={true}
  showEmail={true}
  position="bottom" // 'bottom', 'top', 'center'
/>
```

**Props:**
- `user` - User object (required)
- `onLogout` - Custom logout handler
- `showProfile` - Show user's display name
- `showEmail` - Show user's email
- `position` - Menu position relative to trigger

## Implementation Examples

### In Major Page Components

#### Home.jsx (Already Implemented)
```jsx
import { useLogoutConfirmation } from './Components/UI/useConfirmation.jsx';
import { LogoutButton } from '../components/SimpleLogoutDialog.jsx';

export default function Home() {
  const { user, logout } = useAuth();
  const { confirmLogout, ConfirmationDialog: LogoutDialog } = useLogoutConfirmation();

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      await logout();
      // Redirect or cleanup
    }
  };

  return (
    <div>
      {/* Your component content */}
      
      {/* Logout button in header/sidebar */}
      <LogoutButton 
        onLogout={handleLogout}
        variant="icon-text"
        size="md"
      />
      
      {/* Confirmation dialog */}
      <LogoutDialog />
    </div>
  );
}
```

#### Collections.jsx (Already Implemented)
```jsx
import { useLogoutConfirmation } from './Components/UI/useConfirmation.jsx';
import { LogoutButton } from '../components/SimpleLogoutDialog.jsx';

export default function Collections() {
  const { user, logout } = useAuth();
  const { confirmLogout, ConfirmationDialog: LogoutDialog } = useLogoutConfirmation();

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      const result = await logout();
      if (result.success) {
        window.location.href = '/';
      }
    }
  };

  return (
    <div>
      {/* Your component content */}
      
      {/* Logout button in header */}
      <div className="flex items-center gap-4">
        <span>Signed in as {user?.displayName}</span>
        <LogoutButton 
          onLogout={handleLogout}
          variant="icon-text"
        />
      </div>
      
      {/* Confirmation dialog */}
      <LogoutDialog />
    </div>
  );
}
```

### In Sidebar Components

#### Sidebar.jsx (Integration Example)
```jsx
import { LogoutButton } from '../components/SimpleLogoutDialog.jsx';

export default function Sidebar({ user, onLogout }) {
  return (
    <div className="sidebar">
      {/* Sidebar content */}
      
      {/* User section with logout */}
      <div className="user-section">
        <div className="user-avatar">
          {user?.displayName?.[0]?.toUpperCase()}
        </div>
        <div className="user-info">
          <p>{user?.displayName}</p>
          <p>{user?.email}</p>
        </div>
        <LogoutButton 
          onLogout={onLogout}
          variant="icon"
          size="sm"
        />
      </div>
    </div>
  );
}
```

## Hook Integration

### useLogoutConfirmation Hook

```jsx
import { useLogoutConfirmation } from './Components/UI/useConfirmation.jsx';

export default function MyComponent() {
  const { 
    confirmLogout, 
    ConfirmationDialog, 
    isConfirming 
  } = useLogoutConfirmation();

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      // Perform logout action
    }
  };

  return (
    <div>
      <button onClick={handleLogout}>Sign Out</button>
      <ConfirmationDialog />
      {isConfirming && <span>Processing...</span>}
    </div>
  );
}
```

## Best Practices

### 1. Always Include Confirmation
```jsx
// Good - includes confirmation
const { confirmLogout } = useLogoutConfirmation();
const handleLogout = async () => {
  const confirmed = await confirmLogout();
  if (confirmed) {
    await logout();
  }
};
```

### 2. Handle Loading States
```jsx
const [isLoggingOut, setIsLoggingOut] = useState(false);

const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
    const confirmed = await confirmLogout();
    if (confirmed) {
      await logout();
    }
  } finally {
    setIsLoggingOut(false);
  }
};
```

### 3. Show User Feedback
```jsx
const handleLogout = async () => {
  const confirmed = await confirmLogout();
  if (confirmed) {
    // Show loading overlay
    setIsLoggingOut(true);
    
    const result = await logout();
    if (result.success) {
      // Show success and redirect
      setShowSuccessMessage(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }
};
```

### 4. Choose Appropriate Button Variant
```jsx
// For headers/navigation
<LogoutButton variant="icon-text" size="md" />

// For dropdown menus
<LogoutButton variant="full" />

// For compact interfaces
<LogoutButton variant="icon" size="sm" />
```

### 5. Error Handling
```jsx
const handleLogout = async () => {
  try {
    const confirmed = await confirmLogout();
    if (confirmed) {
      const result = await logout();
      if (!result.success) {
        alert(result.error || 'Logout failed. Please try again.');
      }
    }
  } catch (error) {
    console.error('Unexpected logout error:', error);
    alert('An unexpected error occurred. Please try again.');
  }
};
```

## Integration Checklist

When adding logout functionality to a new component:

- [ ] Import required components
- [ ] Import `useLogoutConfirmation` hook
- [ ] Add logout handler with confirmation
- [ ] Add LogoutButton or UserMenu to UI
- [ ] Add ConfirmationDialog component
- [ ] Handle loading states
- [ ] Handle success/error feedback
- [ ] Test logout flow
- [ ] Test logout cancellation

## Current Implementation Status

✅ **Home.jsx** - Fully implemented with logout confirmation
✅ **Collections.jsx** - Fully implemented with logout confirmation  
✅ **SimpleLogoutDialog.jsx** - Created as reusable component
✅ **useLogoutConfirmation** - Available in useConfirmation.jsx
✅ **Sidebar.jsx** - Has logout functionality via Home.jsx

## Future Enhancements

- Consider adding logout confirmation to sign-in/sign-up pages (though typically not needed)
- Add "Remember me" option to extend session timeout
- Add logout reason tracking for analytics
- Add customizable logout messages per component