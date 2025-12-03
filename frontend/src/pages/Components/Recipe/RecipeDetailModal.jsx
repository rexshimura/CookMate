import React, { useState, useEffect } from 'react';
import { X, Clock, Users, DollarSign, ChefHat, Play, Info, CheckCircle, Heart } from 'lucide-react';
import { addToFavorites, removeFromFavorites, getFavorites } from '../../../utils/api.js';

const RecipeDetailModal = ({ recipeName, isOpen, onClose, fetchRecipeDetails }) => {
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);

  const handleFetchDetails = async () => {
    if (!recipeName || !fetchRecipeDetails) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRecipeDetails(recipeName);
      if (result.success) {
        setRecipeData(result.recipe);
      } else {
        setError(result.error || 'Failed to fetch recipe details');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recipe details');
    } finally {
      setLoading(false);
    }
  };

  // Load user's favorite recipes
  const loadFavoriteRecipes = async () => {
    try {
      const result = await getFavorites();
      if (result.success) {
        setFavoriteRecipes(result.favorites || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // Check if current recipe is favorited
  const checkIfFavorited = () => {
    if (recipeData && favoriteRecipes.length > 0) {
      const isFav = favoriteRecipes.some(fav => 
        fav.title === recipeData.title || 
        fav.id === recipeData.title ||
        fav.id === recipeData.savedId ||
        fav.savedId === recipeData.savedId
      );
      setIsFavorited(isFav);
    }
  };

  // Add to favorites
  const handleAddToFavorites = async () => {
    if (!recipeData) return;
    
    setFavoritesLoading(true);
    try {
      // Use savedRecipeId if available, otherwise generate from title
      const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const result = await addToFavorites(recipeId);
      
      if (result.success) {
        setIsFavorited(true);
        // Update local favorites list
        setFavoriteRecipes(prev => [...prev, recipeData]);
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Remove from favorites
  const handleRemoveFromFavorites = async () => {
    if (!recipeData) return;
    
    setFavoritesLoading(true);
    try {
      // Use savedRecipeId if available, otherwise generate from title
      const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const result = await removeFromFavorites(recipeId);
      
      if (result.success) {
        setIsFavorited(false);
        // Update local favorites list
        setFavoriteRecipes(prev => prev.filter(fav => fav.title !== recipeData.title));
      }
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recipeName) {
      // Reset recipe data when recipeName changes to prevent stale content
      setRecipeData(null);
      setError(null);
      setLoading(true);
      handleFetchDetails();
    }
  }, [isOpen, recipeName]);

  useEffect(() => {
    if (isOpen) {
      loadFavoriteRecipes();
    }
  }, [isOpen]);

  useEffect(() => {
    checkIfFavorited();
  }, [recipeData, favoriteRecipes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <h2 className="text-2xl font-bold tracking-wide">Loading {recipeName}...</h2>
                </div>
              ) : recipeData ? (
                <div>
                  <h2 className="text-2xl font-bold mb-2 leading-tight tracking-wide">{recipeData.title}</h2>
                  <p className="text-orange-100 font-medium tracking-wide leading-relaxed">{recipeData.description}</p>
                </div>
              ) : (
                <h2 className="text-2xl font-bold tracking-wide">{recipeName}</h2>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Favorite Button */}
              {recipeData && (
                <button
                  onClick={isFavorited ? handleRemoveFromFavorites : handleAddToFavorites}
                  disabled={favoritesLoading}
                  className={`p-3 rounded-full transition-all ${
                    isFavorited 
                      ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                      : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                  } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart 
                    className={`w-6 h-6 ${isFavorited ? 'fill-white text-white' : 'text-white'}`} 
                  />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {error ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Error Loading Recipe</h3>
              <p className="text-stone-600 mb-4">{error}</p>
              <button
                onClick={handleFetchDetails}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              {/* Loading skeleton */}
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-stone-200 rounded"></div>
                  <div className="h-3 bg-stone-200 rounded w-5/6"></div>
                  <div className="h-3 bg-stone-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ) : recipeData ? (
            <div className="p-6">
              {/* Recipe Meta Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium tracking-wide">Cook Time</p>
                  <p className="font-semibold text-stone-800 text-base leading-tight">{recipeData.cookingTime}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium tracking-wide">Servings</p>
                  <p className="font-semibold text-stone-800 text-base leading-tight">{recipeData.servings}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <ChefHat className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium tracking-wide">Difficulty</p>
                  <p className="font-semibold text-stone-800 text-base leading-tight">{recipeData.difficulty}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium tracking-wide">Est. Cost</p>
                  <p className="font-semibold text-stone-800 text-base leading-tight">{recipeData.estimatedCost}</p>
                </div>
              </div>

              {/* YouTube Video Section */}
              {recipeData.youtubeUrl && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mb-6 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-800 text-base leading-tight">Watch Tutorial</h4>
                        <p className="text-sm text-stone-600 font-medium">Find video instructions for this recipe</p>
                      </div>
                    </div>
                    <a
                      href={recipeData.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Watch on YouTube
                    </a>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Ingredients */}
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2 tracking-wide">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Ingredients
                  </h3>
                  <div className="space-y-2">
                    {recipeData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-stone-700 font-medium leading-relaxed">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2 tracking-wide">
                    <Info className="w-6 h-6 text-blue-600" />
                    Instructions
                  </h3>
                  <div className="space-y-3">
                    {recipeData.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-stone-700 text-sm leading-relaxed font-medium">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nutrition Info */}
              {recipeData.nutritionInfo && (
                <div className="mt-6 bg-stone-50 rounded-xl p-4">
                  <h4 className="font-semibold text-stone-800 mb-3 text-base tracking-wide">Nutrition (per serving)</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-stone-600 font-medium">Calories</p>
                      <p className="font-semibold text-stone-800 text-base">{recipeData.nutritionInfo.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-stone-600 font-medium">Protein</p>
                      <p className="font-semibold text-stone-800 text-base">{recipeData.nutritionInfo.protein}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-stone-600 font-medium">Carbs</p>
                      <p className="font-semibold text-stone-800 text-base">{recipeData.nutritionInfo.carbs}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-stone-600 font-medium">Fat</p>
                      <p className="font-semibold text-stone-800 text-base">{recipeData.nutritionInfo.fat}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cooking Tips */}
              {recipeData.tips && recipeData.tips.length > 0 && (
                <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-stone-800 mb-3 text-base tracking-wide">💡 Cooking Tips</h4>
                  <div className="space-y-2">
                    {recipeData.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-stone-700 text-sm font-medium leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;