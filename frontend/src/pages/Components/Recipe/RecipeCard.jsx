import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Users, Heart, Folder, Plus, CheckCircle } from 'lucide-react';
import { 
  addToFavorites, 
  addRecipeToCollection 
} from '../../../utils/api.js';

const RecipeCard = ({ 
  recipe, 
  onClick, 
  isLoading, 
  isFavorited = false,
  onAddToFavorites,
  onAddToCollection,
  collections = [],
  fetchRecipeDetails,
  user = null,
  requireAuth = null
}) => {
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [showCollectionsDropdown, setShowCollectionsDropdown] = useState(false);

  // Check if the recipe is already in a specific collection
  const isRecipeInCollection = (collectionId) => {
    if (!recipe || typeof recipe === 'string') return false;
    const recipeId = recipe.savedId || recipe.title?.toLowerCase().replace(/[^a-z0-9]/g, '_') || recipe.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const collection = collections.find(col => col.id === collectionId);
    return collection?.recipes?.some(r => r.id === recipeId);
  };

  // Add to favorites
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
      
      // If recipe is just a string, we need to fetch full details
      if (typeof recipe === 'string') {
        if (fetchRecipeDetails) {
          const result = await fetchRecipeDetails(recipe);
          if (result.success) {
            recipeData = result.recipe;
          }
        }
        recipeId = recipe.toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        recipeId = recipe.savedId || recipe.title?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      
      const result = await addToFavorites(recipeId, recipeData);
      if (result.success) {
        setLocalIsFavorited(true);
        if (onAddToFavorites) onAddToFavorites(recipeData || recipe);
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
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
        recipeId = recipe.toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        recipeId = recipe.savedId || recipe.title?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      
      const result = await addRecipeToCollection(collectionId, recipeId, recipeData);
      if (result.success) {
        setShowCollectionsDropdown(false);
        if (onAddToCollection) onAddToCollection(collectionId, recipeData || recipe);
      }
    } catch (error) {
      console.error('Failed to add to collection:', error);
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

  // Handle both string and object recipe types
  const getRecipeName = () => {
    if (typeof recipe === 'string') {
      return recipe;
    }
    return recipe?.title || recipe?.name || 'Unknown Recipe';
  };

  return (
    <div 
      onClick={() => !isLoading && onClick(getRecipeName())}
      className={`relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl border border-stone-200/60 p-4 shadow-2xl shadow-stone-900/10 backdrop-blur-xl transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-[1.02] hover:border-orange-300 hover:from-orange-50/30 hover:to-red-50/30 overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <h4 className="font-semibold text-stone-800 group-hover:text-orange-700 transition-colors truncate text-base leading-tight">
              {getRecipeName()}
            </h4>
            {(localIsFavorited || isFavorited) && (
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-600 mt-1.5 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="tracking-wide">Click for details</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Only show if user is authenticated and collections are provided */}
        {(user && collections && collections.length > 0) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Favorites Button */}
            <button
              onClick={handleAddToFavorites}
              disabled={favoritesLoading}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                localIsFavorited || isFavorited
                  ? 'text-pink-600 bg-pink-50 hover:bg-pink-100' 
                  : 'text-stone-400 hover:text-pink-600 hover:bg-pink-50'
              } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={localIsFavorited || isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${(localIsFavorited || isFavorited) ? 'fill-current' : ''}`} />
            </button>

            {/* Collections Dropdown Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCollectionsDropdown(!showCollectionsDropdown);
                }}
                className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all hover:scale-110"
                title="Add to collection"
              >
                <Folder className="w-4 h-4" />
              </button>

              {/* Collections Dropdown */}
              {showCollectionsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl z-[55] transition-all duration-300">
                  <div className="p-3 border-b border-stone-200/60">
                    <h4 className="font-semibold text-stone-800 text-sm tracking-wide">Add to Collection</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {collections.map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => handleAddToCollection(collection.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 text-left hover:scale-[1.02] group"
                      >
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: collection.color }}
                        >
                          <Folder className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 text-sm truncate">
                            {collection.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {collection.recipeCount || 0} recipes
                          </p>
                        </div>
                        {isRecipeInCollection(collection.id) && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl flex items-center justify-center group-hover:from-orange-100 group-hover:to-red-100 transition-all duration-300 border border-orange-200/50 group-hover:border-orange-300/50">
            <svg className="w-3 h-3 text-orange-600 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showCollectionsDropdown && (
        <div 
          className="fixed inset-0 z-[54]" 
          onClick={() => setShowCollectionsDropdown(false)}
        />
      )}
    </div>
  );
};

export default RecipeCard;