// API utility functions for backend communication
import { auth } from '../firebase';
import { getValidAuthToken, refreshAuthToken } from './tokenManager';

// Smart API base URL detection with input validation
const getApiBaseUrl = () => {
  try {
    // Priority 1: Explicit environment variable (most important)
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      const trimmedUrl = envUrl.trim();
      // Basic URL validation
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }
      console.warn('Invalid VITE_API_BASE_URL format:', envUrl);
    }
    
    // Priority 2: Auto-detect based on development vs production
    if (import.meta.env.DEV) {
      // Development: Use Vite proxy which routes to Firebase Emulator
      return '/api';
    } else {
      // Production: Use Vercel serverless functions (relative path)
      return '';
    }
  } catch (error) {
    console.error('Error determining API base URL:', error);
    // Fallback to development URL
    return '/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

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

// Get valid token using the centralized token manager
async function getValidToken() {
  return await getValidAuthToken();
}

// Generic API call function with enhanced token management and retry logic
async function apiCall(endpoint, options = {}, retryCount = 0) {
  try {
    // Get a valid token (with automatic refresh if needed)
    const token = await getValidToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      // Handle authentication errors with token refresh retry
      if (response.status === 401 && retryCount < 1) {
        console.log('🔄 [API] 401 Unauthorized - attempting token refresh and retry');
        
        // Force refresh the token using the token manager
        try {
          await refreshAuthToken();
          console.log('✅ [API] Token refreshed, retrying request');
        } catch (refreshError) {
          console.error('❌ [API] Token refresh failed during retry:', refreshError);
        }
        
        // Retry the request with a fresh token
        return apiCall(endpoint, options, retryCount + 1);
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
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
      await delay(RETRY_CONFIG.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      return apiCall(endpoint, options, retryCount + 1);
    }
    
    throw enhancedError;
  }
}

// AI Chat API
export const chatWithAI = async (message, sessionId = null, history = null) => {
  try {
    // Input validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message is required and must be a non-empty string');
    }
    
    if (sessionId && typeof sessionId !== 'string') {
      throw new Error('Session ID must be a string if provided');
    }
    
    if (history && !Array.isArray(history)) {
      throw new Error('History must be an array if provided');
    }

    const payload = {
      message: message.trim(),
      ...(sessionId && { sessionId }),
      ...(Array.isArray(history) && history.length > 0 ? { history } : {}),
    };
    
    return await apiCall('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Ensure we always return a proper error response
    throw new Error(error.message || 'Failed to send message to AI');
  }
};

// Generate Recipe API
export const generateRecipe = async (ingredients, dietaryPreferences = '', recipeType = '') => {
  try {
    // Input validation
    if (!ingredients) {
      throw new Error('Ingredients are required');
    }
    
    let ingredientsArray;
    if (Array.isArray(ingredients)) {
      ingredientsArray = ingredients.filter(ing => ing && typeof ing === 'string' && ing.trim());
      if (ingredientsArray.length === 0) {
        throw new Error('At least one ingredient is required');
      }
    } else if (typeof ingredients === 'string' && ingredients.trim()) {
      ingredientsArray = [ingredients.trim()];
    } else {
      throw new Error('Ingredients must be a non-empty string or array of strings');
    }
    
    if (dietaryPreferences && typeof dietaryPreferences !== 'string') {
      throw new Error('Dietary preferences must be a string if provided');
    }
    
    if (recipeType && typeof recipeType !== 'string') {
      throw new Error('Recipe type must be a string if provided');
    }

    return await apiCall('/api/ai/generate-recipe', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ingredientsArray,
        dietaryPreferences: dietaryPreferences?.trim() || '',
        recipeType: recipeType?.trim() || '',
      }),
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to generate recipe');
  }
};

// Suggest Ingredients API
export const suggestIngredients = async (availableIngredients) => {
  try {
    // Input validation
    if (!availableIngredients) {
      throw new Error('Available ingredients are required');
    }
    
    let ingredientsArray;
    if (Array.isArray(availableIngredients)) {
      ingredientsArray = availableIngredients.filter(ing => ing && typeof ing === 'string' && ing.trim());
      if (ingredientsArray.length === 0) {
        throw new Error('At least one ingredient is required');
      }
    } else if (typeof availableIngredients === 'string' && availableIngredients.trim()) {
      ingredientsArray = [availableIngredients.trim()];
    } else {
      throw new Error('Available ingredients must be a non-empty string or array of strings');
    }

    return await apiCall('/api/ai/suggest-ingredients', {
      method: 'POST',
      body: JSON.stringify({
        availableIngredients: ingredientsArray,
      }),
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to suggest ingredients');
  }
};

// Recipe Details API
export const getRecipeDetails = async (recipeName) => {
  try {
    // Input validation
    if (!recipeName || typeof recipeName !== 'string' || !recipeName.trim()) {
      return { success: false, error: 'Recipe name is required and must be a non-empty string' };
    }

    const result = await apiCall('/api/ai/recipe-details', {
      method: 'POST',
      body: JSON.stringify({ recipeName: recipeName.trim() }),
    });
    
    return { success: true, recipe: result.recipe, message: result.message };
  } catch (error) {
    // Return safe error response instead of crashing
    return { success: false, error: error.message || 'Failed to fetch recipe details' };
  }
};

// User Profile API
export const getUserProfile = async () => {
  try {
    return await apiCall('/api/users/profile');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user profile');
  }
};

export const updateUserProfile = async (updates) => {
  try {
    // Input validation
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be an object');
    }

    return await apiCall('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to update user profile');
  }
};

// User Personalization API
export const updateUserPersonalization = async (updates) => {
  try {
    // Input validation
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be an object');
    }

    return await apiCall('/api/users/personalization', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to update user personalization');
  }
};

// Favorites API (using collections underneath)
export const getFavorites = async () => {
  try {
    return await apiCall('/api/collections/favorites');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch favorites');
  }
};

export const addToFavorites = async (recipeId, recipeData = null) => {
  try {
    // Input validation
    if (!recipeId || typeof recipeId !== 'string' || !recipeId.trim()) {
      throw new Error('Recipe ID is required and must be a non-empty string');
    }
    
    if (recipeData !== null && typeof recipeData !== 'object') {
      throw new Error('Recipe data must be an object if provided');
    }
    
    // Get the favorites collection (backend auto-creates if missing)
    const favoritesResult = await apiCall('/api/collections/favorites');
    
    if (favoritesResult && favoritesResult.collection) {
      // Add to the favorites collection
      return await apiCall(`/api/collections/${favoritesResult.collection.id}/recipes`, {
        method: 'POST',
        body: JSON.stringify({ recipeId: recipeId.trim(), recipeData }),
      });
    }
    
    throw new Error('Favorites collection not found');
  } catch (error) {
    throw new Error(error.message || 'Failed to add to favorites');
  }
};

export const removeFromFavorites = async (recipeId) => {
  try {
    // Input validation
    if (!recipeId || typeof recipeId !== 'string' || !recipeId.trim()) {
      throw new Error('Recipe ID is required and must be a non-empty string');
    }
    
    // First get the favorites collection
    const favoritesResult = await apiCall('/api/collections/favorites');
    if (favoritesResult && favoritesResult.collection) {
      // Remove from the favorites collection
      return await apiCall(`/api/collections/${favoritesResult.collection.id}/recipes/${recipeId.trim()}`, {
        method: 'DELETE',
      });
    }
    throw new Error('Favorites collection not found');
  } catch (error) {
    // For remove operations, we don't want to trigger migration as there's nothing to remove
    throw new Error(error.message || 'Failed to remove from favorites');
  }
};

// Helper function to check if recipe is in favorites
export const checkIsFavorite = async (recipeId) => {
  try {
    // Input validation
    if (!recipeId || typeof recipeId !== 'string' || !recipeId.trim()) {
      return false;
    }
    
    const favoritesResult = await apiCall('/api/collections/favorites');
    if (favoritesResult && favoritesResult.recipes) {
      return favoritesResult.recipes.some(recipe => recipe.id === recipeId.trim());
    }
    return false;
  } catch (error) {
    // Return false instead of crashing - this is a helper function
    return false;
  }
};

// Collections API
export const getCollections = async () => {
  try {
    const result = await apiCall('/api/collections');
    return result;
  } catch (error) {
    throw error;
  }
};

export const createCollection = async (collectionData) => {
  try {
    // Input validation
    if (!collectionData || typeof collectionData !== 'object') {
      throw new Error('Collection data is required and must be an object');
    }
    
    if (!collectionData.name || typeof collectionData.name !== 'string' || !collectionData.name.trim()) {
      throw new Error('Collection name is required and must be a non-empty string');
    }

    const result = await apiCall('/api/collections', {
      method: 'POST',
      body: JSON.stringify({
        ...collectionData,
        name: collectionData.name.trim(),
        description: collectionData.description?.trim() || ''
      }),
    });
    return result;
  } catch (error) {
    throw new Error(error.message || 'Failed to create collection');
  }
};

export const updateCollection = async (collectionId, updates) => {
  try {
    if (!collectionId || typeof collectionId !== 'string' || !collectionId.trim()) {
      throw new Error('Collection ID is required and must be a non-empty string');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be an object');
    }

    return await apiCall(`/api/collections/${collectionId.trim()}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to update collection');
  }
};

export const deleteCollection = async (collectionId) => {
  try {
    if (!collectionId || typeof collectionId !== 'string' || !collectionId.trim()) {
      throw new Error('Collection ID is required and must be a non-empty string');
    }

    return await apiCall(`/api/collections/${collectionId.trim()}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to delete collection');
  }
};

export const addRecipeToCollection = async (collectionId, recipeId, recipeData = null) => {
  try {
    if (!collectionId || typeof collectionId !== 'string' || !collectionId.trim()) {
      throw new Error('Collection ID is required and must be a non-empty string');
    }
    
    if (!recipeId || typeof recipeId !== 'string' || !recipeId.trim()) {
      throw new Error('Recipe ID is required and must be a non-empty string');
    }
    
    if (recipeData !== null && typeof recipeData !== 'object') {
      throw new Error('Recipe data must be an object if provided');
    }

    const result = await apiCall(`/api/collections/${collectionId.trim()}/recipes`, {
      method: 'POST',
      body: JSON.stringify({ recipeId: recipeId.trim(), recipeData }),
    });
    
    return result;
  } catch (error) {
    throw new Error(error.message || 'Failed to add recipe to collection');
  }
};

export const removeRecipeFromCollection = async (collectionId, recipeId) => {
  try {
    if (!collectionId || typeof collectionId !== 'string' || !collectionId.trim()) {
      throw new Error('Collection ID is required and must be a non-empty string');
    }
    
    if (!recipeId || typeof recipeId !== 'string' || !recipeId.trim()) {
      throw new Error('Recipe ID is required and must be a non-empty string');
    }

    return await apiCall(`/api/collections/${collectionId.trim()}/recipes/${recipeId.trim()}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to remove recipe from collection');
  }
};

export const getCollectionRecipes = async (collectionId) => {
  try {
    if (!collectionId || typeof collectionId !== 'string' || !collectionId.trim()) {
      throw new Error('Collection ID is required and must be a non-empty string');
    }

    return await apiCall(`/api/collections/${collectionId.trim()}/recipes`);
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch collection recipes');
  }
};

// Migration API
export const migrateFavorites = async () => {
  try {
    return await apiCall('/api/collections/migrate-favorites', {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to migrate favorites');
  }
};

// Health check
export const healthCheck = async () => {
  try {
    return await apiCall('/api/health');
  } catch (error) {
    throw new Error(error.message || 'Health check failed');
  }
};

export const searchFavorites = async (query, limit = 20, offset = 0) => {
  try {
    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return await apiCall(`/api/collections/favorites/search?query=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to search favorites');
  }
};

export default {
  chatWithAI,
  generateRecipe,
  suggestIngredients,
  getRecipeDetails,
  getUserProfile,
  updateUserProfile,
  updateUserPersonalization,
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
  searchFavorites,
};