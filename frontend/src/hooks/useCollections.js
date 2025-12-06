import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import { 
  getCollections, 
  createCollection, 
  deleteCollection, 
  addRecipeToCollection, 
  removeRecipeFromCollection 
} from '../utils/api.js';
import { generateRecipeId } from '../utils/ids.js';

export const useCollections = () => {
  const { user, loading: authLoading } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load collections from backend
  const loadCollections = useCallback(async () => {
    // If no user, clear data immediately
    if (!user && !authLoading) {
      setCollections([]);
      setLoading(false);
      return;
    }

    // Don't fetch if auth is still loading
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getCollections();
      if (result && result.collections) {
        setCollections(result.collections);
      } else {
        setCollections([]);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      setError(error.message);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Reload whenever user changes (Login/Logout)
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // WRAPPERS (To ensure reload after mutation)
  const createNewCollection = useCallback(async (data) => {
    const res = await createCollection(data);
    if(res?.collection) await loadCollections();
    return res;
  }, [loadCollections]);

  const deleteCollectionById = useCallback(async (id) => {
    await deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const addRecipeToCollectionById = useCallback(async (colId, recipe) => {
    // FIX: Ensure recipe is always an object before sending to API
    // If it's a string (title), wrap it. If it's already an object, use it.
    const recipeData = typeof recipe === 'string' 
      ? { title: recipe, id: generateRecipeId(recipe) } 
      : { ...recipe, id: generateRecipeId(recipe) };

    const res = await addRecipeToCollection(colId, generateRecipeId(recipe), recipeData);
    await loadCollections(); // Sync UI
    return res;
  }, [loadCollections]);

  const removeRecipeFromCollectionById = useCallback(async (colId, recipe) => {
    const res = await removeRecipeFromCollection(colId, generateRecipeId(recipe));
    await loadCollections(); // Sync
    return res;
  }, [loadCollections]);

  const isRecipeInCollection = useCallback((colId, recipe) => {
    if (!colId || !recipe) return false;
    const rId = generateRecipeId(recipe);
    return collections.find(c => c.id === colId)?.recipes?.some(r => r.id === rId) || false;
  }, [collections]);

  return {
    collections, loading, error,
    createNewCollection,
    deleteCollection: deleteCollectionById,
    addRecipeToCollection: addRecipeToCollectionById,
    removeRecipeFromCollection: removeRecipeFromCollectionById,
    isRecipeInCollection,
    refreshCollections: loadCollections
  };
};