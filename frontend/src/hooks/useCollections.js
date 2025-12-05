import { useState, useEffect, useCallback } from 'react';
import { 
  getCollections, 
  createCollection, 
  deleteCollection, 
  addRecipeToCollection, 
  removeRecipeFromCollection 
} from '../utils/api.js';
import { generateRecipeId } from '../utils/ids.js';

/**
 * Unified Collections Architecture - Collections Hook
 * 
 * This hook manages collections using real data from Firestore database
 * Features:
 * - Fetches initial state from backend on mount
 * - Optimistic updates with rollback on failure
 * - Consistent ID generation matching backend
 * - Error handling with user-friendly messages
 */
export const useCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load collections from backend on mount
  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getCollections();
      
      if (result && result.collections) {
        setCollections(result.collections);
      } else {
        console.warn('Invalid collections response format:', result);
        setCollections([]);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      setError(error.message || 'Failed to load collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Create new collection with optimistic updates
  const createNewCollection = useCallback(async (collectionData) => {
    if (!collectionData || !collectionData.name) {
      throw new Error('Collection name is required');
    }

    const newCollection = {
      ...collectionData,
      name: collectionData.name.trim(),
      description: collectionData.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      setLoading(true);
      
      const result = await createCollection(newCollection);
      
      if (result && result.collection) {
        // Refresh collections to get the latest data from backend
        await loadCollections();
        return { 
          success: true, 
          collection: result.collection,
          message: 'Collection created successfully'
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      
      let userMessage = 'Failed to create collection';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Please sign in again to create collections';
      } else if (error.message?.includes('400') && error.message?.includes('name')) {
        userMessage = 'Collection name is required';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    } finally {
      setLoading(false);
    }
  }, [loadCollections]);

  // Delete collection with optimistic updates
  const deleteCollectionById = useCallback(async (collectionId) => {
    if (!collectionId) {
      throw new Error('Collection ID is required');
    }

    // Find the collection to delete for optimistic rollback
    const collectionToDelete = collections.find(col => col.id === collectionId);
    if (!collectionToDelete) {
      throw new Error('Collection not found');
    }

    // Prevent deletion of default collections (like Favorites)
    if (collectionToDelete.isDefault || collectionToDelete.isFavorites) {
      throw new Error('Default collections cannot be deleted');
    }

    // Optimistic update - remove from local state immediately
    const previousCollections = [...collections];
    setCollections(prev => prev.filter(col => col.id !== collectionId));

    try {
      const result = await deleteCollection(collectionId);
      
      if (result && result.message) {
        // Success - collection deleted successfully
        return { 
          success: true, 
          message: 'Collection deleted successfully'
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      
      // Rollback optimistic update on failure
      setCollections(previousCollections);
      
      let userMessage = 'Failed to delete collection';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Please sign in again to manage collections';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        userMessage = 'You don\'t have permission to delete this collection';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        userMessage = 'Collection not found';
      } else if (error.message?.includes('default')) {
        userMessage = 'Default collections cannot be deleted';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
  }, [collections]);

  // Add recipe to collection with optimistic updates
  const addRecipeToCollectionById = useCallback(async (collectionId, recipe) => {
    if (!collectionId || !recipe) {
      throw new Error('Collection ID and recipe are required');
    }

    const recipeId = generateRecipeId(recipe);
    if (!recipeId) {
      throw new Error('Unable to generate recipe ID');
    }

    const recipeData = typeof recipe === 'object' ? recipe : { id: recipeId, title: recipe };

    // Find the collection
    const targetCollection = collections.find(col => col.id === collectionId);
    if (!targetCollection) {
      throw new Error('Collection not found');
    }

    // Check if recipe already exists in collection
    const recipeExists = targetCollection.recipes?.some(r => r.id === recipeId);
    if (recipeExists) {
      return { 
        success: true, 
        action: 'already_exists', 
        message: 'Recipe already in collection' 
      };
    }

    // Optimistic update - add to local state immediately
    const previousCollections = [...collections];
    setCollections(prev => 
      prev.map(collection =>
        collection.id === collectionId
          ? {
              ...collection,
              recipes: [...(collection.recipes || []), {
                id: recipeId,
                ...recipeData,
                addedAt: new Date().toISOString()
              }],
              recipeCount: (collection.recipeCount || 0) + 1,
              updatedAt: new Date().toISOString()
            }
          : collection
      )
    );

    try {
      const result = await addRecipeToCollection(collectionId, recipeId, recipeData);
      
      if (result && result.message) {
        // Success - recipe added successfully
        return { 
          success: true, 
          action: 'added',
          message: 'Recipe added to collection'
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to add recipe to collection:', error);
      
      // Rollback optimistic update on failure
      setCollections(previousCollections);
      
      let userMessage = 'Failed to add recipe to collection';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Please sign in again to manage collections';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        userMessage = 'You don\'t have permission to modify this collection';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        userMessage = 'Collection not found';
      } else if (error.message?.includes('already exists')) {
        userMessage = 'Recipe already exists in this collection';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
  }, [collections]);

  // Remove recipe from collection with optimistic updates
  const removeRecipeFromCollectionById = useCallback(async (collectionId, recipe) => {
    if (!collectionId || !recipe) {
      throw new Error('Collection ID and recipe are required');
    }

    const recipeId = generateRecipeId(recipe);
    if (!recipeId) {
      throw new Error('Unable to generate recipe ID');
    }

    // Find the collection
    const targetCollection = collections.find(col => col.id === collectionId);
    if (!targetCollection) {
      throw new Error('Collection not found');
    }

    // Check if recipe exists in collection
    const recipeExists = targetCollection.recipes?.some(r => r.id === recipeId);
    if (!recipeExists) {
      return { 
        success: true, 
        action: 'already_removed', 
        message: 'Recipe not in collection' 
      };
    }

    // Optimistic update - remove from local state immediately
    const previousCollections = [...collections];
    setCollections(prev => 
      prev.map(collection =>
        collection.id === collectionId
          ? {
              ...collection,
              recipes: collection.recipes.filter(recipe => recipe.id !== recipeId),
              recipeCount: Math.max(0, (collection.recipeCount || 1) - 1),
              updatedAt: new Date().toISOString()
            }
          : collection
      )
    );

    try {
      const result = await removeRecipeFromCollection(collectionId, recipeId);
      
      if (result && result.message) {
        // Success - recipe removed successfully
        return { 
          success: true, 
          action: 'removed',
          message: 'Recipe removed from collection'
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to remove recipe from collection:', error);
      
      // Rollback optimistic update on failure
      setCollections(previousCollections);
      
      let userMessage = 'Failed to remove recipe from collection';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Please sign in again to manage collections';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        userMessage = 'You don\'t have permission to modify this collection';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        userMessage = 'Collection not found or recipe not in collection';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
  }, [collections]);

  // Check if recipe is in a specific collection
  const isRecipeInCollection = useCallback((collectionId, recipe) => {
    if (!collectionId || !recipe) return false;
    
    const recipeId = generateRecipeId(recipe);
    const collection = collections.find(col => col.id === collectionId);
    
    return collection?.recipes?.some(r => r.id === recipeId) || false;
  }, [collections]);

  // Get collection by ID
  const getCollectionById = useCallback((collectionId) => {
    return collections.find(col => col.id === collectionId);
  }, [collections]);

  // Get recipes for a specific collection
  const getCollectionRecipes = useCallback((collectionId) => {
    const collection = getCollectionById(collectionId);
    return collection?.recipes || [];
  }, [getCollectionById]);

  // Refresh collections from backend
  const refreshCollections = useCallback(() => {
    return loadCollections();
  }, [loadCollections]);

  return {
    // Data
    collections,
    
    // State
    loading,
    error,
    
    // Operations
    createNewCollection,
    deleteCollection: deleteCollectionById,
    addRecipeToCollection: addRecipeToCollectionById,
    removeRecipeFromCollection: removeRecipeFromCollectionById,
    
    // Helpers
    isRecipeInCollection,
    getCollectionById,
    getCollectionRecipes,
    refreshCollections,
    loadCollections,
  };
};