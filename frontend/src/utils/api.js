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

// Generic API call function
async function apiCall(endpoint, options = {}) {
  try {
    // Get Firebase auth token
    const user = auth.currentUser;
    let token = null;
    
    if (user) {
      token = await user.getIdToken();
    } else {
      // Fallback to stored tokens for backward compatibility
      token = localStorage.getItem('authToken') || localStorage.getItem('firebaseAuthToken');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
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
    const result = await apiCall('/api/ai/recipe-details', {
      method: 'POST',
      body: JSON.stringify({ recipeName }),
    });
    return { success: true, recipe: result.recipe, message: result.message };
  } catch (error) {
    console.error('Recipe details API error:', error);
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

// Favorites API
export const getFavorites = async () => {
  return apiCall('/api/users/favorites');
};

export const addToFavorites = async (recipeId, recipeData = null) => {
  return apiCall(`/api/users/favorites/${recipeId}`, {
    method: 'POST',
    body: JSON.stringify({ recipeData }),
  });
};

export const removeFromFavorites = async (recipeId) => {
  return apiCall(`/api/users/favorites/${recipeId}`, {
    method: 'DELETE',
  });
};

// Collections API
export const getCollections = async () => {
  return apiCall('/api/collections');
};

export const createCollection = async (collectionData) => {
  return apiCall('/api/collections', {
    method: 'POST',
    body: JSON.stringify(collectionData),
  });
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
  return apiCall(`/api/collections/${collectionId}/recipes`, {
    method: 'POST',
    body: JSON.stringify({ recipeId, recipeData }),
  });
};

export const removeRecipeFromCollection = async (collectionId, recipeId) => {
  return apiCall(`/api/collections/${collectionId}/recipes/${recipeId}`, {
    method: 'DELETE',
  });
};

export const getCollectionRecipes = async (collectionId) => {
  return apiCall(`/api/collections/${collectionId}/recipes`);
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
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionRecipes,
  healthCheck,
};