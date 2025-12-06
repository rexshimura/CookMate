// Token Management Utilities for Firebase Authentication
import { auth } from '../firebase';

// Token refresh configuration
const TOKEN_CONFIG = {
  refreshThreshold: 5 * 60 * 1000, // Refresh if token expires within 5 minutes
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Get the current authentication token with automatic refresh
 * @returns {Promise<string|null>} Valid authentication token
 */
export async function getValidAuthToken() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('🔄 [TokenManager] No authenticated user found');
      return null;
    }

    // Get fresh token (Firebase handles refresh automatically)
    const token = await user.getIdToken();
    console.log('✅ [TokenManager] Valid token obtained');
    
    return token;
  } catch (error) {
    console.error('❌ [TokenManager] Error getting auth token:', error);
    
    // No mock data - only use real Firebase authentication
    return null;
  }
}

/**
 * Force refresh the authentication token
 * @returns {Promise<string|null>} Fresh authentication token
 */
export async function refreshAuthToken() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('⚠️ [TokenManager] Cannot refresh token - no authenticated user');
      return null;
    }

    console.log('🔄 [TokenManager] Force refreshing token...');
    const token = await user.getIdToken(true); // Force refresh
    
    // Store the refreshed token
    localStorage.setItem('firebaseAuthToken', token);
    
    console.log('✅ [TokenManager] Token refreshed successfully');
    return token;
  } catch (error) {
    console.error('❌ [TokenManager] Token refresh failed:', error);
    throw new Error('Failed to refresh authentication token: ' + error.message);
  }
}

/**
 * Check if the current token is valid and not expired
 * @returns {Promise<boolean>} True if token is valid
 */
export async function isTokenValid() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }

    // Try to get token - if it fails, token is invalid
    await user.getIdToken();
    return true;
  } catch (error) {
    console.warn('⚠️ [TokenManager] Token validation failed:', error);
    return false;
  }
}

/**
 * Clear authentication tokens from storage
 */
export function clearAuthTokens() {
  try {
    // Only clear if any tokens exist in localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('firebaseAuthToken');
    console.log('🗑️ [TokenManager] Auth tokens cleared from storage');
  } catch (error) {
    console.error('❌ [TokenManager] Error clearing tokens:', error);
  }
}

export default {
  getValidAuthToken,
  refreshAuthToken,
  isTokenValid,
  clearAuthTokens
};