import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Clock, Users, Heart, Folder, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { 
  addToFavorites, 
  removeFromFavorites,
  checkIsFavorite,
  addRecipeToCollection,
  removeRecipeFromCollection
} from '../../../utils/api.js';
import { useModal } from '../../../App.jsx';

const RecipeCard = ({ 
  recipe, 
  onClick, 
  isLoading, 
  isFavorited = false,
  onAddToFavorites,
  onRemoveFromFavorites,
  onAddToCollection,
  onRemoveFromCollection,
  collections = [],
  fetchRecipeDetails,
  user = null,
  requireAuth = null,
  onCreateCollection = null
  ,
  // Optional: when viewing a specific collection (or favorites), pass its id so
  // the card can show a direct "remove" button for that collection.
  collectionId = null
}) => {
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const collectionsButtonRef = useRef(null);
  const { showCollectionsModal } = useModal();

  // Get recipe ID for consistency
  const getRecipeId = (recipeObj = recipe) => {
    if (!recipeObj) return '';
    if (typeof recipeObj === 'string') {
      return recipeObj.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    // Check for various ID field possibilities
    return recipeObj.id || recipeObj.savedId || recipeObj.title?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
  };

  // Check if the recipe is already in a specific collection
  const isRecipeInCollection = (collectionId) => {
    if (!recipe || typeof recipe === 'string') return false;
    const recipeId = getRecipeId(recipe);
    const collection = collections.find(col => col.id === collectionId);
    return collection?.recipes?.some(r => r.id === recipeId);
  };

  // Add/remove from favorites (toggle functionality)
  const handleAddToFavorites = async (e) => {
    e?.stopPropagation();
    if (!recipe || favoritesLoading) return;
    
    // Check authentication
    if (!user) {
      if (requireAuth) {
        requireAuth('add recipes to favorites');
      }
      return;
    }
    
    setFavoritesLoading(true);
    try {
      let recipeData = recipe;
      let recipeId;
      
      // Get recipe ID and data - handle both string and object recipes
      if (typeof recipe === 'string') {
        // If recipe is just a string, we need to fetch full details
        if (fetchRecipeDetails) {
          const result = await fetchRecipeDetails(recipe);
          if (result.success) {
            recipeData = result.recipe;
          }
        }
        recipeId = getRecipeId(recipe);
      } else {
        // For object recipes, use the improved ID generation
        recipeId = getRecipeId(recipe);
        recipeData = recipe;
      }
      

      
      // Toggle favorite status
      const isCurrentlyFavorited = localIsFavorited || isFavorited;
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        
        // Validate recipe ID before making API call
        if (!recipeId) {
          console.error('🗑️ [RecipeCard] ERROR: No valid recipeId found');
          alert('Unable to remove recipe: Invalid recipe identifier');
          return;
        }
        
        try {
          const result = await removeFromFavorites(recipeId);
          if (result.success !== false) {
            setLocalIsFavorited(false);
            if (onRemoveFromFavorites) {
              onRemoveFromFavorites(recipeData || recipe);
            }
            
            // Force a brief delay to allow backend to update before potential reload
            setTimeout(() => {
              // Reload favorites data if needed
            }, 100);
          } else {
            console.error('🗑️ [RecipeCard] Remove from favorites failed:', result.error);
          }
        } catch (error) {
          console.error('Failed to remove from favorites:', error);
          // Show user-friendly error feedback
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            alert('Please sign in again to manage your favorites.');
          } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            alert('This recipe is no longer available in your favorites.');
          } else {
            alert(`Failed to remove from favorites: ${error.message}`);
          }
          // Revert UI state on error
          setLocalIsFavorited(true);
        }
      } else {
        // Add to favorites
        try {
          const result = await addToFavorites(recipeId, recipeData);
          if (result.success !== false) {
            setLocalIsFavorited(true);
            if (onAddToFavorites) onAddToFavorites(recipeData || recipe);
          }
        } catch (error) {
          console.error('Failed to add to favorites:', error);
          // Show user-friendly error feedback
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            alert('Please sign in again to manage your favorites.');
          } else {
            alert(`Failed to add to favorites: ${error.message}`);
          }
          // Revert UI state on error
          setLocalIsFavorited(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Add to collection
  const handleAddToCollection = async (collectionId, e) => {
    e?.stopPropagation();

    if (!recipe || !collectionId) return;

    // Check authentication
    if (!user) {
      if (requireAuth) {
        requireAuth('add recipes to collections');
      }
      return;
    }

    try {
      let recipeData = recipe;
      let recipeId;

      // If recipe is just a string, we need to fetch full details
      if (typeof recipe === 'string') {
        if (fetchRecipeDetails) {
          const result = await fetchRecipeDetails(recipe);
          if (result.success) {
            recipeData = result.recipe;
          }
        }
        recipeId = getRecipeId(recipe);
      } else {
        recipeId = getRecipeId(recipe);
        recipeData = recipe;
      }

      const result = await addRecipeToCollection(collectionId, recipeId, recipeData);

      if (result.success) {
        if (onAddToCollection) onAddToCollection(collectionId, recipeData || recipe);
      }
    } catch (error) {
      console.error('Failed to add to collection:', error);
    }
  };

  // Remove from collection
  const handleRemoveFromCollection = async (collectionId) => {
    if (!recipe) {
      return;
    }
    
    if (!collectionId) {
      return;
    }
    
    // Check authentication
    if (!user) {
      if (requireAuth) {
        requireAuth('remove recipes from collections');
      }
      return;
    }
    
    try {
      let recipeId = getRecipeId(recipe);
      
      const result = await removeRecipeFromCollection(collectionId, recipeId);
      
      if (result.success !== false) {
        if (onRemoveFromCollection) onRemoveFromCollection(collectionId, recipe);
      } else {
        console.error('Failed to remove from collection:', result.error);
      }
    } catch (error) {
      console.error('Failed to remove from collection:', error);
      // Show user-friendly error feedback
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        alert('Please sign in again to manage your collections.');
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        alert('This collection is no longer available.');
      } else {
        alert(`Failed to remove from collection: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    setLocalIsFavorited(isFavorited);
  }, [isFavorited]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl border border-stone-200/60 p-4 shadow-2xl shadow-stone-900/10 backdrop-blur-xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 bg-white/50 rounded-lg"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-stone-200/70 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-stone-200/70 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle both string and object recipe types with better fallbacks
  const getRecipeName = () => {
    if (typeof recipe === 'string') return recipe;
    return recipe?.title || recipe?.name || 'Delicious Recipe';
  };

  const getRecipeDescription = () => {
    if (typeof recipe === 'string') return 'Click for ingredients and instructions';
    return recipe?.description || 'A delicious recipe to try';
  };

  const getCookingTime = () => {
    if (typeof recipe === 'string') return 'Varies';
    return recipe?.cookingTime || recipe?.prepTime || '30 mins';
  };

  const getServings = () => {
    if (typeof recipe === 'string') return '4';
    return recipe?.servings || '4';
  };

  const getDifficulty = () => {
    if (typeof recipe === 'string') return 'Medium';
    return recipe?.difficulty || 'Medium';
  };

  return (
    <>
      <div
        onClick={() => !isLoading && onClick(getRecipeName())}
        className={`relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl border border-stone-200/60 p-3 sm:p-4 shadow-2xl shadow-stone-900/10 backdrop-blur-xl transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-[1.02] hover:border-orange-300 hover:from-orange-50/30 hover:to-red-50/30 overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center overflow-hidden group">
            <ChefHat className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-800 group-hover:text-orange-700 transition-colors truncate text-sm sm:text-base leading-tight">
                {getRecipeName()}
              </h4>
              {(localIsFavorited || isFavorited) && (
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 fill-pink-500 flex-shrink-0" />
              )}
            </div>

            {/* Recipe description */}
            {typeof recipe !== 'string' && recipe?.description && (
              <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {getRecipeDescription()}
              </p>
            )}

            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-600 mt-1.5 font-medium flex-wrap">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
                <span className="tracking-wide">{getCookingTime()}</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                <span className="tracking-wide">{getServings()} servings</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <ChefHat className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                <span className="tracking-wide">{getDifficulty()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Adjusted opacity and spacing for mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity duration-300">
            {/* Favorites Button */}
            <button
              onClick={handleAddToFavorites}
              disabled={favoritesLoading}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                localIsFavorited || isFavorited
                  ? 'text-pink-600 bg-pink-50 hover:bg-pink-100' 
                  : 'text-stone-400 hover:text-pink-600 hover:bg-pink-50'
              } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-4 h-4 ${(localIsFavorited || isFavorited) ? 'fill-current' : ''}`} />
            </button>

            {/* Collections Dropdown Button */}
            <div className="relative">
              <button
                ref={collectionsButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  showCollectionsModal({
                    collections,
                    recipe,
                    user,
                    requireAuth,
                    onAddToCollection: handleAddToCollection,
                    onRemoveFromCollection: handleRemoveFromCollection,
                    onCreateCollection,
                    triggerRef: collectionsButtonRef
                  });
                }}
                className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all hover:scale-110"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
            {/* Direct Remove From Collection Button (visible when card is shown inside a specific collection) */}
            {collectionId && isRecipeInCollection(collectionId) && (
              <button
                onClick={(e) => { e?.stopPropagation(); handleRemoveFromCollection(collectionId); }}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all hover:scale-110"
                title="Remove from this collection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Arrow Button - HIDDEN ON MOBILE to fix clutter */}
          <div className="flex-shrink-0 hidden sm:flex">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center group-hover:from-emerald-500 group-hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-200/50 group-hover:shadow-emerald-300/50">
              <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecipeCard;