// Firebase Auth hooks for authentication management
import { useState, useEffect, useContext, createContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  onIdTokenChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { transferAnonymousSessions, hasAnonymousSessions } from '../utils/sessionManager';

// Auth Context
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up authentication state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Get fresh token immediately upon login
          try {
            const token = await firebaseUser.getIdToken();
            console.log('✅ [Auth] Fresh token obtained for user:', firebaseUser.uid);
          } catch (tokenError) {
            console.warn('⚠️ [Auth] Initial token retrieval failed:', tokenError);
          }
          
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create user profile if it doesn't exist
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              favorites: [],
              dietaryPreferences: '',
              plan: 'free',
              // Initialize personalization fields to avoid conflicts
              nationality: '',
              age: null,
              gender: '',
              allergies: [],
              dislikedIngredients: [],
              isVegan: false,
              isDiabetic: false,
              isDiet: false,
              isMuslim: false,
              isLactoseFree: false,
              isHighCalorie: false,
              prefersSalty: false,
              prefersSpicy: false,
              prefersSweet: false,
              prefersSour: false
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          console.log('🔄 [Auth] User signed out, clearing auth state');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    // Set up token refresh listener for seamless session management
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // This fires when tokens are refreshed automatically by Firebase
          const token = await firebaseUser.getIdToken();
          console.log('🔄 [Auth] Token automatically refreshed');
          
          // Store the refreshed token for API calls
          localStorage.setItem('firebaseAuthToken', token);
          
        } catch (tokenError) {
          console.error('❌ [Auth] Automatic token refresh failed:', tokenError);
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);
      
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Check if user has anonymous sessions that need to be transferred
      if (hasAnonymousSessions()) {
        console.log('🔄 [Auth] Transferring anonymous sessions to new user account...');
        
        try {
          const transferResult = await transferAnonymousSessions(firebaseUser.uid);
          
          if (transferResult.success && transferResult.transferredCount > 0) {
            console.log(`✅ [Auth] Successfully transferred ${transferResult.transferredCount} sessions`);
            
            // Dispatch custom event to notify other components about the transfer
            window.dispatchEvent(new CustomEvent('sessionsTransferred', {
              detail: { 
                transferredCount: transferResult.transferredCount,
                totalSessions: transferResult.totalSessions || 0,
                successRate: transferResult.successRate || 0,
                errors: transferResult.errors || [],
                userId: firebaseUser.uid 
              }
            }));
          } else if (transferResult.errors && transferResult.errors.length > 0) {
            console.warn('⚠️ [Auth] Some sessions failed to transfer:', transferResult.errors);
          }
        } catch (transferError) {
          console.error('❌ [Auth] Error transferring sessions:', transferError);
          // Don't fail the sign-up if session transfer fails
        }
      }

      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'Account creation failed';
      
      // Provide user-friendly error messages based on Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please try signing in instead';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Account creation is currently disabled. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has anonymous sessions that need to be transferred
      if (hasAnonymousSessions()) {
        console.log('🔄 [Auth] Transferring anonymous sessions to authenticated user...');
        
        try {
          const transferResult = await transferAnonymousSessions(firebaseUser.uid);
          
          if (transferResult.success && transferResult.transferredCount > 0) {
            console.log(`✅ [Auth] Successfully transferred ${transferResult.transferredCount} sessions`);
            
            // Dispatch custom event to notify other components about the transfer
            window.dispatchEvent(new CustomEvent('sessionsTransferred', {
              detail: { 
                transferredCount: transferResult.transferredCount,
                totalSessions: transferResult.totalSessions || 0,
                successRate: transferResult.successRate || 0,
                errors: transferResult.errors || [],
                userId: firebaseUser.uid 
              }
            }));
          } else if (transferResult.errors && transferResult.errors.length > 0) {
            console.warn('⚠️ [Auth] Some sessions failed to transfer:', transferResult.errors);
          }
        } catch (transferError) {
          console.error('❌ [Auth] Error transferring sessions:', transferError);
          // Don't fail the sign-in if session transfer fails
        }
      }
      
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Sign in failed';
      
      // Provide user-friendly error messages based on Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please wait a moment before trying again';
      } else if (error.code === 'auth/invalid-login-credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      setError(null);
      console.log('🔄 [Auth] Starting logout process...');
      
      // Clear local storage and session data first
      localStorage.removeItem('firebase:authUser');
      localStorage.removeItem('cookmate_session_data');
      
      // Dispatch event to notify other components about logout before signing out
      window.dispatchEvent(new CustomEvent('userLoggingOut', {
        detail: { timestamp: new Date().toISOString() }
      }));
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ [Auth] Firebase signOut completed successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ [Auth] Logout failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sign out failed. Please try again.';
      
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updates, { merge: true });
        
        // Update local state
        setUserProfile(prev => ({ ...prev, ...updates }));
        
        // Also update the Firebase Auth user object if displayName is being updated
        if (updates.displayName && updates.displayName !== user.displayName) {
          await updateProfile(user, { displayName: updates.displayName });
          // Update the user state directly to trigger re-renders
          setUser(prev => ({ ...prev, displayName: updates.displayName }));
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'No user logged in' };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hooks for specific auth operations
export const useSignIn = () => {
  const { signIn } = useAuth();
  return signIn;
};

export const useSignUp = () => {
  const { signUp } = useAuth();
  return signUp;
};

export const useLogout = () => {
  const { logout } = useAuth();
  return logout;
};

export const useAuthState = () => {
  const { user, userProfile, loading, error } = useAuth();
  return { user, userProfile, loading, error };
};

export default {
  AuthProvider,
  useAuth,
  useSignIn,
  useSignUp,
  useLogout,
  useAuthState,
};