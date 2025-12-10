import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { getFavorites, addToFavorites, removeFromFavorites, checkIsFavorite, searchFavorites } from '../utils/api.js';
import { generateRecipeId } from '../utils/ids.js';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Unified Collections Architecture - Favorites Hook
 * 
 * This hook manages favorites using real data from Firestore database
 * Features:
 * - Fetches initial state from backend on mount
 * - Optimistic updates with rollback on failure
 * - Consistent ID generation matching backend
 * - Error handling with user-friendly messages
 */
export const useFavorites = () => {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load favorites from backend on mount
  const loadFavorites = useCallback(async () => {
    if (!user && !authLoading) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    if (authLoading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await getFavorites();
      
      if (result && result.recipes) {
        const favoriteRecipes = result.recipes;
        const favoriteIdSet = new Set(favoriteRecipes.map(recipe => recipe.id));
        
        setFavorites(favoriteRecipes);
        setFavoriteIds(favoriteIdSet);
      } else {
        console.warn('Invalid favorites response format:', result);
        setFavorites([]);
        setFavoriteIds(new Set());
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setError(error.message || 'Failed to load favorites');
      setFavorites([]);
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initialize favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Toggle favorite status with optimistic updates
  const toggleFavorite = useCallback(async (recipe) => {
    if (!recipe) {
      throw new Error('Recipe is required');
    }

    const recipeId = generateRecipeId(recipe);
    if (!recipeId) {
      throw new Error('Unable to generate recipe ID');
    }

    const recipeData = typeof recipe === 'object' ? recipe : { id: recipeId, title: recipe };

    // Capture current state for optimistic update and rollback
    const currentFavorites = [...favorites];
    const currentFavoriteIds = new Set(favoriteIds);
    const isCurrentlyFavorite = currentFavoriteIds.has(recipeId);

    // Optimistic update - update UI immediately
    if (isCurrentlyFavorite) {
      // Remove from favorites optimistically
      const updatedFavorites = currentFavorites.filter(fav => fav.id !== recipeId);
      const updatedFavoriteIds = new Set(currentFavoriteIds);
      updatedFavoriteIds.delete(recipeId);
      
      setFavorites(updatedFavorites);
      setFavoriteIds(updatedFavoriteIds);
    } else {
      // Add to favorites optimistically
      const newFavorite = { 
        id: recipeId, 
        ...recipeData,
        addedAt: new Date().toISOString()
      };
      const updatedFavorites = [...currentFavorites, newFavorite];
      const updatedFavoriteIds = new Set(currentFavoriteIds);
      updatedFavoriteIds.add(recipeId);
      
      setFavorites(updatedFavorites);
      setFavoriteIds(updatedFavoriteIds);
    }

    try {
      let result;
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        result = await removeFromFavorites(recipeId);
      } else {
        // Add to favorites
        result = await addToFavorites(recipeId, recipeData);
      }

      // Check if the operation was successful
      // Note: Backend returns 200 OK for both add and remove, even when recipe already exists (idempotent)
      if (result && (result.success !== false)) {
        // Success - no need to revert optimistic update
        return { success: true, action: isCurrentlyFavorite ? 'removed' : 'added' };
      } else {
        throw new Error(result?.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      
      // Rollback optimistic update on failure
      setFavorites(currentFavorites);
      setFavoriteIds(currentFavoriteIds);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to update favorites';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Please sign in again to manage your favorites';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        userMessage = 'Recipe not found or no longer available';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
  }, [favorites, favoriteIds]);

  // Check if a recipe is favorited
  const isFavorite = useCallback((recipe) => {
    if (!recipe) return false;
    
    const recipeId = generateRecipeId(recipe);
    return favorites.some(fav => fav.id === recipeId);
  }, [favorites]);

  // Add recipe to favorites (alias for toggleFavorite)
  const addToFavoritesHook = useCallback(async (recipe) => {
    if (isFavorite(recipe)) {
      return { success: true, action: 'already_exists', message: 'Recipe already in favorites' };
    }
    return await toggleFavorite(recipe);
  }, [toggleFavorite, isFavorite]);

  // Remove recipe from favorites (alias for toggleFavorite)
  const removeFromFavoritesHook = useCallback(async (recipe) => {
    if (!isFavorite(recipe)) {
      return { success: true, action: 'already_removed', message: 'Recipe not in favorites' };
    }
    return await toggleFavorite(recipe);
  }, [toggleFavorite, isFavorite]);

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    const currentFavorites = [...favorites];
    
    // Optimistic update
    setFavorites([]);
    setFavoriteIds(new Set());
    
    try {
      // Remove each favorite individually
      const removePromises = currentFavorites.map(fav => 
        removeFromFavoritesHook(fav.id).catch(console.error)
      );
      
      await Promise.all(removePromises);
      
      return { success: true, message: 'All favorites cleared' };
    } catch (error) {
      // Rollback on failure
      setFavorites(currentFavorites);
      setFavoriteIds(new Set(currentFavorites.map(fav => fav.id)));
      
      throw new Error('Failed to clear favorites: ' + error.message);
    }
  }, [favorites, removeFromFavoritesHook]);

  // Refresh favorites from backend
  const refreshFavorites = useCallback(() => {
    return loadFavorites();
  }, [loadFavorites]);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        setSearchError(null);

        // Call the new search endpoint using the proper API function
        const data = await searchFavorites(query);

        if (data.success && data.results) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error.message || 'Failed to search favorites');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms debounce
    [user]
  );

  // Handle search input changes
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.length >= 2 || query.length === 0) {
      debouncedSearch(query);
    }
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  // Display favorites (respects search if active)
  const displayFavorites = searchQuery.length >= 2 ? searchResults : favorites;

  return {
    // Data
    favorites,
    favoriteIds,

    // Search State
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    displayFavorites,

    // State
    loading,
    error,

    // Operations
    toggleFavorite,
    addToFavorites: addToFavoritesHook,
    removeFromFavorites: removeFromFavoritesHook,
    isFavorite,
    clearFavorites,
    refreshFavorites,
    loadFavorites,

    // Search Operations
    handleSearch,
    clearSearch,
  };
};