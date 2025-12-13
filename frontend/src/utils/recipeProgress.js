/**
 * Recipe Progress Utility
 * Handles saving and loading recipe progress (checked ingredients and completed steps)
 * Uses localStorage for persistence across browser sessions
 */

const STORAGE_PREFIX = 'cookmate_recipe_progress_';

/**
 * Generate a unique recipe ID for progress storage
 * @param {string} recipeName - The recipe name
 * @returns {string} - Unique recipe identifier
 */
export const generateRecipeProgressId = (recipeName) => {
  if (!recipeName) return '';
  return recipeName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

/**
 * Get the storage key for a specific recipe
 * @param {string} recipeId - Recipe identifier
 * @returns {string} - Storage key
 */
const getStorageKey = (recipeId) => {
  return `${STORAGE_PREFIX}${recipeId}`;
};

/**
 * Save recipe progress to localStorage
 * @param {string} recipeId - Unique recipe identifier
 * @param {Object} progress - Progress data object
 * @param {Object} progress.checkedIngredients - Object with ingredient indices as keys and boolean values
 * @param {Object} progress.completedSteps - Object with step indices as keys and boolean values
 * @param {number} progress.multiplier - Recipe serving multiplier
 * @returns {boolean} - Success status
 */
export const saveRecipeProgress = (recipeId, progress) => {
  try {
    if (!recipeId || !progress) {
      console.warn('❌ [RECIPE-PROGRESS] Missing recipeId or progress data');
      return false;
    }

    const storageKey = getStorageKey(recipeId);
    const progressData = {
      checkedIngredients: progress.checkedIngredients || {},
      completedSteps: progress.completedSteps || {},
      multiplier: progress.multiplier || 1,
      lastUpdated: new Date().toISOString(),
      recipeId: recipeId
    };

    localStorage.setItem(storageKey, JSON.stringify(progressData));
    console.log('✅ [RECIPE-PROGRESS] Progress saved for recipe:', recipeId);
    return true;
  } catch (error) {
    console.error('❌ [RECIPE-PROGRESS] Failed to save progress:', error);
    return false;
  }
};

/**
 * Load recipe progress from localStorage
 * @param {string} recipeId - Unique recipe identifier
 * @returns {Object|null} - Progress data object or null if not found
 */
export const loadRecipeProgress = (recipeId) => {
  try {
    if (!recipeId) {
      console.warn('❌ [RECIPE-PROGRESS] Missing recipeId for loading progress');
      return null;
    }

    const storageKey = getStorageKey(recipeId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log('📝 [RECIPE-PROGRESS] No saved progress found for recipe:', recipeId);
      return null;
    }

    const progressData = JSON.parse(storedData);
    console.log('✅ [RECIPE-PROGRESS] Progress loaded for recipe:', recipeId);
    return progressData;
  } catch (error) {
    console.error('❌ [RECIPE-PROGRESS] Failed to load progress:', error);
    return null;
  }
};

/**
 * Clear recipe progress from localStorage
 * @param {string} recipeId - Unique recipe identifier
 * @returns {boolean} - Success status
 */
export const clearRecipeProgress = (recipeId) => {
  try {
    if (!recipeId) {
      console.warn('❌ [RECIPE-PROGRESS] Missing recipeId for clearing progress');
      return false;
    }

    const storageKey = getStorageKey(recipeId);
    localStorage.removeItem(storageKey);
    console.log('✅ [RECIPE-PROGRESS] Progress cleared for recipe:', recipeId);
    return true;
  } catch (error) {
    console.error('❌ [RECIPE-PROGRESS] Failed to clear progress:', error);
    return false;
  }
};

/**
 * Get all saved recipe progress IDs
 * @returns {Array<string>} - Array of recipe IDs that have saved progress
 */
export const getAllSavedRecipeIds = () => {
  try {
    const savedIds = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const recipeId = key.replace(STORAGE_PREFIX, '');
        savedIds.push(recipeId);
      }
    }
    return savedIds;
  } catch (error) {
    console.error('❌ [RECIPE-PROGRESS] Failed to get saved recipe IDs:', error);
    return [];
  }
};

/**
 * Check if a recipe has saved progress
 * @param {string} recipeId - Unique recipe identifier
 * @returns {boolean} - Whether the recipe has saved progress
 */
export const hasSavedProgress = (recipeId) => {
  if (!recipeId) return false;
  
  const storageKey = getStorageKey(recipeId);
  return localStorage.getItem(storageKey) !== null;
};

/**
 * Auto-save progress with debouncing to prevent excessive localStorage writes
 * @param {string} recipeId - Unique recipe identifier
 * @param {Object} progress - Progress data
 * @param {number} delay - Debounce delay in milliseconds (default: 500ms)
 * @returns {Function} - Cancel function
 */
export const autoSaveProgress = (recipeId, progress, delay = 500) => {
  let timeoutId = null;
  
  const saveWithDelay = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveRecipeProgress(recipeId, progress);
    }, delay);
  };
  
  // Return a function to cancel the pending save
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

/**
 * Migrate old progress format if needed (for future compatibility)
 * @param {string} oldKey - Old storage key
 * @param {string} newKey - New storage key
 */
export const migrateProgress = (oldKey, newKey) => {
  try {
    const oldData = localStorage.getItem(oldKey);
    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
      console.log('✅ [RECIPE-PROGRESS] Progress migrated from old key');
    }
  } catch (error) {
    console.error('❌ [RECIPE-PROGRESS] Failed to migrate progress:', error);
  }
};