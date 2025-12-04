// API utility functions for backend communication
import { auth } from '../firebase';

// Smart API base URL detection
const getApiBaseUrl = () => {
  console.log('🔍 API Debug - Environment variables:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_FORCE_PROXY: import.meta.env.VITE_FORCE_PROXY,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE
  });
  
  // Priority 1: Explicit environment variable (most important)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🍳 Using explicit VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Priority 2: Auto-detect based on development vs production
  if (import.meta.env.DEV) {
    // Development: Use Vite proxy which routes to Firebase Emulator
    console.log('🍳 Using development proxy: /api');
    return '/api';
  } else {
    // Production: Use Firebase Functions
    console.log('🍳 Using production Firebase Functions');
    return 'https://us-central1-cookmate-cc941.cloudfunctions.net/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the detected API URL for debugging
console.log('🍳 CookMate API URL:', API_BASE_URL, 'Environment:', import.meta.env.DEV ? 'Development' : 'Production');

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1 second
  retryableErrors: ['NETWORK_ERROR', 'CONNECTION_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR']
};

// Helper function to check if error is retryable
function isRetryableError(error) {
  return RETRY_CONFIG.retryableErrors.includes(error.code);
}

// Helper function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generic API call function with retry logic
async function apiCall(endpoint, options = {}, retryCount = 0) {
  try {
    console.log('🌐 [API] Making API call to:', `${API_BASE_URL}${endpoint}`);
    console.log('🌐 [API] Options:', options);
    
    // Get Firebase auth token
    const user = auth.currentUser;
    let token = null;
    
    if (user) {
      token = await user.getIdToken();
    } else {
      // Fallback to stored tokens for backward compatibility
      token = localStorage.getItem('authToken') || localStorage.getItem('firebaseAuthToken');
    }

    // In development mode, use mock token if no real token available
    if (!token && import.meta.env.DEV) {
      console.log('🔧 [API] Development mode: Using mock authentication token');
      token = 'mock-token';
    }

    console.log(' [API] Auth token available:', !!token);

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('📡 [API] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Response not OK:', response.status, errorText);
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [API] Response data:', data);
    return data;
  } catch (error) {
    console.error(`❌ [API] Call failed for ${endpoint}:`, error);
    console.error(`❌ [API] Error type:`, error.constructor.name);
    console.error(`❌ [API] Error message:`, error.message);
    
    // Enhanced error classification and user-friendly messages
    let userFriendlyError;
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userFriendlyError = 'Network connection failed. Please check your internet connection.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
      userFriendlyError = 'Unable to connect to the server. Please try again in a moment.';
      errorCode = 'CONNECTION_ERROR';
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      userFriendlyError = 'Your session has expired. Please sign in again.';
      errorCode = 'AUTHENTICATION_ERROR';
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      userFriendlyError = 'You don\'t have permission to perform this action.';
      errorCode = 'PERMISSION_ERROR';
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      userFriendlyError = 'The requested resource was not found.';
      errorCode = 'NOT_FOUND_ERROR';
    } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      userFriendlyError = 'Too many requests. Please wait a moment before trying again.';
      errorCode = 'RATE_LIMIT_ERROR';
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      userFriendlyError = 'Server error occurred. Our team has been notified. Please try again later.';
      errorCode = 'SERVER_ERROR';
    } else if (error.message.includes('timeout')) {
      userFriendlyError = 'Request timed out. Please try again.';
      errorCode = 'TIMEOUT_ERROR';
    } else {
      userFriendlyError = error.message || 'An unexpected error occurred. Please try again.';
      errorCode = 'UNKNOWN_ERROR';
    }
    
    // Create enhanced error object
    const enhancedError = new Error(userFriendlyError);
    enhancedError.code = errorCode;
    enhancedError.originalError = error;
    enhancedError.endpoint = endpoint;
    enhancedError.timestamp = new Date().toISOString();
    
    // Retry logic for transient failures
    if (retryCount < RETRY_CONFIG.maxRetries && isRetryableError(enhancedError)) {
      console.log(`🔄 [API] Retrying ${endpoint} (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      await delay(RETRY_CONFIG.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      return apiCall(endpoint, options, retryCount + 1);
    }
    
    throw enhancedError;
  }
}

// AI Chat API
export const chatWithAI = async (message, sessionId = null, history = null) => {
  const payload = {
    message,
    ...(sessionId && { sessionId }),
    ...(Array.isArray(history) && history.length > 0 ? { history } : {}),
  };
  
  return apiCall('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Generate Recipe API
export const generateRecipe = async (ingredients, dietaryPreferences = '', recipeType = '') => {
  return apiCall('/api/ai/generate-recipe', {
    method: 'POST',
    body: JSON.stringify({
      ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
      dietaryPreferences,
      recipeType,
    }),
  });
};

// Suggest Ingredients API
export const suggestIngredients = async (availableIngredients) => {
  return apiCall('/api/ai/suggest-ingredients', {
    method: 'POST',
    body: JSON.stringify({
      availableIngredients: Array.isArray(availableIngredients) ? availableIngredients : [availableIngredients],
    }),
  });
};

// Recipe Details API
export const getRecipeDetails = async (recipeName) => {
  try {
    console.log('📡 [API] Fetching recipe details for:', recipeName);
    const result = await apiCall('/api/ai/recipe-details', {
      method: 'POST',
      body: JSON.stringify({ recipeName }),
    });
    
    console.log('📡 [API] Recipe details result:', result);
    console.log('📡 [API] Recipe data structure:', {
      hasRecipe: !!result.recipe,
      recipeTitle: result.recipe?.title,
      ingredientsType: typeof result.recipe?.ingredients,
      ingredientsLength: Array.isArray(result.recipe?.ingredients) ? result.recipe.ingredients.length : 'not_array',
      instructionsType: typeof result.recipe?.instructions,
      instructionsLength: Array.isArray(result.recipe?.instructions) ? result.recipe.instructions.length : 'not_array'
    });
    
    return { success: true, recipe: result.recipe, message: result.message };
  } catch (error) {
    console.error('❌ [API] Recipe details API error:', error);
    return { success: false, error: error.message };
  }
};

// User Profile API
export const getUserProfile = async () => {
  return apiCall('/api/users/profile');
};

export const updateUserProfile = async (updates) => {
  return apiCall('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Favorites API (using collections underneath)
export const getFavorites = async () => {
  return apiCall('/api/collections/favorites');
};

export const addToFavorites = async (recipeId, recipeData = null) => {
  try {
    // First get the favorites collection
    console.log('🍳 [API] Attempting to get favorites collection...');
    const favoritesResult = await apiCall('/api/collections/favorites');
    
    if (favoritesResult && favoritesResult.collection) {
      console.log('✅ [API] Found favorites collection, adding recipe...');
      // Add to the favorites collection
      return apiCall(`/api/collections/${favoritesResult.collection.id}/recipes`, {
        method: 'POST',
        body: JSON.stringify({ recipeId, recipeData }),
      });
    }
    
    throw new Error('Favorites collection not found');
  } catch (error) {
    console.log('❌ [API] Failed to get favorites collection:', error.message);
    
    // Check if it's a "not found" error and try to migrate
    if (error.message.includes('Favorites collection not found')) {
      console.log('🔄 [API] Favorites collection not found, attempting migration...');
      try {
        const migrationResult = await migrateFavorites();
        console.log('✅ [API] Migration completed:', migrationResult);
        
        // Now try to add to favorites again
        console.log('🍳 [API] Retrying favorites collection fetch...');
        const retryResult = await apiCall('/api/collections/favorites');
        
        if (retryResult && retryResult.collection) {
          console.log('✅ [API] Found favorites collection after migration, adding recipe...');
          return apiCall(`/api/collections/${retryResult.collection.id}/recipes`, {
            method: 'POST',
            body: JSON.stringify({ recipeId, recipeData }),
          });
        }
        
        throw new Error('Favorites collection still not found after migration');
      } catch (migrationError) {
        console.error('❌ [API] Migration failed:', migrationError);
        throw new Error('Failed to create favorites collection: ' + migrationError.message);
      }
    }
    
    console.error('Failed to add to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (recipeId) => {
  try {
    // First get the favorites collection
    const favoritesResult = await apiCall('/api/collections/favorites');
    if (favoritesResult && favoritesResult.collection) {
      // Remove from the favorites collection
      return apiCall(`/api/collections/${favoritesResult.collection.id}/recipes/${recipeId}`, {
        method: 'DELETE',
      });
    }
    throw new Error('Favorites collection not found');
  } catch (error) {
    // For remove operations, we don't want to trigger migration as there's nothing to remove
    console.error('Failed to remove from favorites:', error);
    throw error;
  }
};

// Helper function to check if recipe is in favorites
export const checkIsFavorite = async (recipeId) => {
  try {
    const favoritesResult = await apiCall('/api/collections/favorites');
    if (favoritesResult && favoritesResult.recipes) {
      return favoritesResult.recipes.some(recipe => recipe.id === recipeId);
    }
    return false;
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return false;
  }
};

// Collections API
export const getCollections = async () => {
  console.log('📚 [API] getCollections called');
  try {
    const result = await apiCall('/api/collections');
    console.log('📚 [API] getCollections result:', result);
    return result;
  } catch (error) {
    console.error('❌ [API] getCollections failed:', error);
    throw error;
  }
};

export const createCollection = async (collectionData) => {
  console.log('📚 [API] createCollection called with data:', collectionData);
  try {
    const result = await apiCall('/api/collections', {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
    console.log('📚 [API] createCollection result:', result);
    return result;
  } catch (error) {
    console.error('❌ [API] createCollection failed:', error);
    throw error;
  }
};

export const updateCollection = async (collectionId, updates) => {
  return apiCall(`/api/collections/${collectionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteCollection = async (collectionId) => {
  return apiCall(`/api/collections/${collectionId}`, {
    method: 'DELETE',
  });
};

export const addRecipeToCollection = async (collectionId, recipeId, recipeData = null) => {
  console.log('🚀 [API] addRecipeToCollection called with:');
  console.log('🚀 [API] Collection ID:', collectionId);
  console.log('🚀 [API] Recipe ID:', recipeId);
  console.log('🚀 [API] Recipe Data:', recipeData);
  
  try {
    const result = await apiCall(`/api/collections/${collectionId}/recipes`, {
      method: 'POST',
      body: JSON.stringify({ recipeId, recipeData }),
    });
    
    console.log('📡 [API] addRecipeToCollection result:', result);
    return result;
  } catch (error) {
    console.error('❌ [API] addRecipeToCollection failed:', error);
    throw error;
  }
};

export const removeRecipeFromCollection = async (collectionId, recipeId) => {
  return apiCall(`/api/collections/${collectionId}/recipes/${recipeId}`, {
    method: 'DELETE',
  });
};

export const getCollectionRecipes = async (collectionId) => {
  return apiCall(`/api/collections/${collectionId}/recipes`);
};

// Migration API
export const migrateFavorites = async () => {
  return apiCall('/api/collections/migrate-favorites', {
    method: 'POST',
  });
};

// Health check
export const healthCheck = async () => {
  return apiCall('/api/health');
};

export default {
  chatWithAI,
  generateRecipe,
  suggestIngredients,
  getRecipeDetails,
  getUserProfile,
  updateUserProfile,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionRecipes,
  migrateFavorites,
  healthCheck,
};