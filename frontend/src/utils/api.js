// API utility functions for backend communication
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/cookmate-cc941/us-central1/api';

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
export const chatWithAI = async (message, sessionId = null) => {
  const payload = {
    message,
    ...(sessionId && { sessionId }),
  };
  
  return apiCall('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Generate Recipe API
export const generateRecipe = async (ingredients, dietaryPreferences = '', recipeType = '') => {
  return apiCall('/ai/generate-recipe', {
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
  return apiCall('/ai/suggest-ingredients', {
    method: 'POST',
    body: JSON.stringify({
      availableIngredients: Array.isArray(availableIngredients) ? availableIngredients : [availableIngredients],
    }),
  });
};

// User Profile API
export const getUserProfile = async () => {
  return apiCall('/users/profile');
};

export const updateUserProfile = async (updates) => {
  return apiCall('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Favorites API
export const getFavorites = async () => {
  return apiCall('/users/favorites');
};

export const addToFavorites = async (recipeId) => {
  return apiCall(`/users/favorites/${recipeId}`, {
    method: 'POST',
  });
};

export const removeFromFavorites = async (recipeId) => {
  return apiCall(`/users/favorites/${recipeId}`, {
    method: 'DELETE',
  });
};

// Health check
export const healthCheck = async () => {
  return apiCall('/health');
};

export default {
  chatWithAI,
  generateRecipe,
  suggestIngredients,
  getUserProfile,
  updateUserProfile,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  healthCheck,
};