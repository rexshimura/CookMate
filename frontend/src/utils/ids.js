/**
 * Utility functions for consistent ID generation across frontend and backend
 * Ensures recipe IDs are deterministic and match between client and server
 */

/**
 * Generate a consistent recipe ID from recipe data
 * @param {Object|string} recipe - Recipe object or recipe title string
 * @returns {string} - Normalized recipe ID
 */
export const generateRecipeId = (recipe) => {
  if (!recipe) return '';
  
  let title = '';
  
  if (typeof recipe === 'string') {
    title = recipe;
  } else {
    // Try various title fields in order of preference
    title = recipe.title || recipe.name || recipe.recipeName || recipe.id || '';
  }
  
  if (!title) return '';
  
  // Normalize the title:
  // 1. Convert to lowercase
  // 2. Trim whitespace
  // 3. Replace special characters with underscores
  // 4. Remove multiple consecutive underscores
  // 5. Remove leading/trailing underscores
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '_')  // Replace non-alphanumeric chars with underscore
    .replace(/\s+/g, '_')          // Replace spaces with underscore
    .replace(/_+/g, '_')           // Replace multiple underscores with single
    .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
};

/**
 * Generate a collection ID from collection name
 * @param {string} name - Collection name
 * @returns {string} - Normalized collection ID
 */
export const generateCollectionId = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Check if two recipe objects refer to the same recipe
 * @param {Object|string} recipe1 - First recipe
 * @param {Object|string} recipe2 - Second recipe
 * @returns {boolean} - True if they represent the same recipe
 */
export const isSameRecipe = (recipe1, recipe2) => {
  const id1 = generateRecipeId(recipe1);
  const id2 = generateRecipeId(recipe2);
  return id1 === id2 && id1 !== '';
};

export default {
  generateRecipeId,
  generateCollectionId,
  isSameRecipe,
};