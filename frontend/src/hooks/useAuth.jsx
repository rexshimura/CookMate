// Firebase Auth hooks for authentication management
import { useState, useEffect, useContext, createContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
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
              plan: 'free'
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
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