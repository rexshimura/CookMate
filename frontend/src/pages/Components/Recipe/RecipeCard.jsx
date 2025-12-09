import React, { useRef } from 'react';
import { ChefHat, Heart, Folder, Plus, CheckCircle } from 'lucide-react';
import { generateRecipeId } from '../../../utils/ids.js';
import { useModal } from '../../../App.jsx';

const RecipeCard = ({
  recipe,
  onClick,
  isLoading,
  isFavorited = false,
  onAddToFavorites,
  onRemoveFromFavorites,
  collections = [],
  fetchRecipeDetails,
  user = null,
  requireAuth = null,
  // Optional: when viewing a specific collection (or favorites), pass its id so
  // the card can show a direct "remove" button for that collection.
  collectionId = null,
  // New props for unified collections architecture
  favoritesHook = null,
  collectionsHook = null,
  toggleFavorite = null,
  isFavorite = null
}) => {
  const { showFavoritesCollectionsModal } = useModal();

  // Get recipe ID for consistency using the new utility
  const getRecipeId = (recipeObj = recipe) => {
    return generateRecipeId(recipeObj);
  };

  // Check if the recipe is already in a specific collection
  const isRecipeInCollection = (collectionId) => {
    if (!recipe || typeof recipe === 'string') return false;
    const recipeId = getRecipeId(recipe);
    const collection = collections.find(col => col.id === collectionId);
    return collection?.recipes?.some(r => r.id === recipeId);
  };

  // Check if recipe is saved in ANY collection (for the folder icon glow)
  const isSavedInCollection = collectionsHook?.collections?.some(col =>
    col.recipes?.some(r => r.id === generateRecipeId(recipe))
  );

  // Handle favorites using the new unified architecture with debouncing
  const handleAddToFavorites = async (e) => {
    e?.stopPropagation();
    if (!recipe) return;
    
    // Check authentication
    if (!user) {
      if (requireAuth) {
        requireAuth('add recipes to favorites');
      }
      return;
    }

    // Check if we have the new hooks available
    if (toggleFavorite && favoritesHook) {
      // Prevent multiple rapid clicks
      if (favoritesHook.loading) {
        console.log('⏳ [RecipeCard] Favorites operation in progress, ignoring rapid click');
        return;
      }
      
      try {
        console.log('💖 [RecipeCard] Toggling favorite for:', recipe.title || recipe);
        await toggleFavorite(recipe);
        // The hook will handle optimistic updates and error handling
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
      return;
    }

    // Fallback to legacy callback approach
    if (typeof recipe === 'string') {
      if (fetchRecipeDetails) {
        const result = await fetchRecipeDetails(recipe);
        if (result.success) {
          if (isFavorited && onRemoveFromFavorites) {
            onRemoveFromFavorites(result.recipe);
          } else if (!isFavorited && onAddToFavorites) {
            onAddToFavorites(result.recipe);
          }
        }
      }
    } else {
      if (isFavorited && onRemoveFromFavorites) {
        onRemoveFromFavorites(recipe);
      } else if (!isFavorited && onAddToFavorites) {
        onAddToFavorites(recipe);
      }
    }
  };



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
              {((isFavorite && isFavorite(recipe)) || isFavorited) && (
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 fill-pink-500 flex-shrink-0" />
              )}
            </div>

            {/* Recipe description */}
            {typeof recipe !== 'string' && recipe?.description && (
              <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {getRecipeDescription()}
              </p>
            )}
          </div>

          {/* Action Buttons - Adjusted opacity and spacing for mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity duration-300">
            {/* Favorites Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent bubbling to parent card click
                handleAddToFavorites(e);
              }}
              disabled={favoritesHook?.loading}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                ((isFavorite && isFavorite(recipe)) || isFavorited)
                  ? 'text-pink-600 bg-pink-50 hover:bg-pink-100'
                  : 'text-stone-400 hover:text-pink-600 hover:bg-pink-50'
              } ${favoritesHook?.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={((isFavorite && isFavorite(recipe)) || isFavorited) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${((isFavorite && isFavorite(recipe)) || isFavorited) ? 'fill-current' : ''}`} />
            </button>

            {/* Collections Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Open the new Unified Modal, defaulting to the 'collections' tab
                showFavoritesCollectionsModal({
                  recipe,
                  initialTab: 'collections'
                });
              }}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isSavedInCollection
                  ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                  : 'text-stone-400 hover:text-orange-600 hover:bg-orange-50'
              }`}
              title="Save to Collection"
            >
              <Folder className={`w-4 h-4 ${isSavedInCollection ? 'fill-current' : ''}`} />
            </button>
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