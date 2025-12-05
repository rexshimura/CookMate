import React, { useState, useEffect } from 'react';
import { X, Clock, Users, DollarSign, ChefHat, Play, Info, CheckCircle, Heart, Folder, Plus, ChevronDown, Timer, Scale, AlertCircle, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { 
  addToFavorites, 
  removeFromFavorites,
  checkIsFavorite,
  getCollections, 
  addRecipeToCollection,
  removeRecipeFromCollection
} from '../../../utils/api.js';
import { useModal } from '../../../App.jsx';

const RecipeDetailModal = ({ recipeName, isOpen, onClose, fetchRecipeDetails, onAddToFavorites = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAuthPrompt } = useModal();
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  const handleFetchDetails = async () => {
    if (!recipeName || !fetchRecipeDetails) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRecipeDetails(recipeName);

      if (result.success && result.recipe) {
        // Validate and sanitize recipe data before setting
        const sanitizedRecipe = {
          ...result.recipe,
          title: typeof result.recipe.title === 'string' ? result.recipe.title : recipeName,
          description: typeof result.recipe.description === 'string' ? result.recipe.description : `A delicious ${recipeName} recipe`,
          ingredients: Array.isArray(result.recipe.ingredients) ? result.recipe.ingredients.filter(ing => typeof ing === 'string') : [],
          instructions: Array.isArray(result.recipe.instructions) ? result.recipe.instructions.filter(inst => typeof inst === 'string') : [],
          cookingTime: typeof result.recipe.cookingTime === 'string' ? result.recipe.cookingTime : 'Varies',
          servings: typeof result.recipe.servings === 'string' ? result.recipe.servings : '4',
          difficulty: typeof result.recipe.difficulty === 'string' ? result.recipe.difficulty : 'Medium',
          estimatedCost: typeof result.recipe.estimatedCost === 'string' ? result.recipe.estimatedCost : 'Moderate',
          nutritionInfo: typeof result.recipe.nutritionInfo === 'object' && result.recipe.nutritionInfo ? result.recipe.nutritionInfo : {},
          tips: Array.isArray(result.recipe.tips) ? result.recipe.tips : [],
          youtubeUrl: typeof result.recipe.youtubeUrl === 'string' ? result.recipe.youtubeUrl : null,
          youtubeSearchQuery: typeof result.recipe.youtubeSearchQuery === 'string' ? result.recipe.youtubeSearchQuery : `${recipeName} recipe tutorial`
        };

        setRecipeData(sanitizedRecipe);
      } else {
        console.error('❌ [RECIPE-DETAIL-MODAL] Failed to fetch recipe:', result.error);
        setError(result.error || 'Failed to fetch recipe details');
      }
    } catch (err) {
      console.error('❌ [RECIPE-DETAIL-MODAL] Exception during fetch:', err);
      setError(err.message || 'Failed to fetch recipe details');
    } finally {
      setLoading(false);
    }
  };

  // Load user's collections (only if authenticated)
  const loadCollections = async () => {
    if (!user) {
      setCollections([]);
      return;
    }
    try {
      const result = await getCollections();
      if (result.success) {
        setCollections(result.collections || []);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  // Check if current recipe is favorited
  const checkIfFavorited = () => {
    if (recipeData && collections.length > 0) {
      try {
        const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // Find the favorites collection (should be the first one with isFavorites = true)
        const favoritesCollection = collections.find(col => col.isFavorites === true);
        if (favoritesCollection && favoritesCollection.recipes) {
          const isFav = favoritesCollection.recipes.some(recipe => recipe.id === recipeId);
          setIsFavorited(isFav);
        } else {
          setIsFavorited(false);
        }
      } catch (error) {
        setIsFavorited(false);
      }
    } else if (recipeData) {
      setIsFavorited(false);
    }
  };

  // Toggle favorite status (add/remove from favorites)
  const handleToggleFavorites = async () => {
    if (!recipeData) return;

    // Check if user is authenticated
    if (!user) {
      showAuthPrompt();
      return;
    }

    setFavoritesLoading(true);
    try {
      const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (isFavorited) {
        // Remove from favorites
        try {
          await removeFromFavorites(recipeId);
          setIsFavorited(false);
          // Refresh collections to update counts
          loadCollections();
        } catch (error) {
          console.error('Failed to remove from favorites:', error);
        }
      } else {
        // Add to favorites
        try {
          await addToFavorites(recipeId, recipeData);
          setIsFavorited(true);
          // Refresh collections to update counts
          loadCollections();

          if (onAddToFavorites) {
            onAddToFavorites({ ...recipeData, id: recipeId, savedId: recipeId });
          }
        } catch (error) {
          console.error('Failed to add to favorites:', error);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Add recipe to collection (with auth check)
  const handleAddToCollection = async (collectionId) => {
    if (!recipeData || !collectionId) return;

    // Check if user is authenticated
    if (!user) {
      showAuthPrompt();
      return;
    }

    try {
      const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const result = await addRecipeToCollection(collectionId, recipeId, recipeData);

      if (result.success) {
        // Collections modal will be closed by the centralized system
      }
    } catch (error) {
      console.error('Failed to add recipe to collection:', error);
    }
  };

  // Check if recipe is in a specific collection
  const isRecipeInCollection = (collectionId) => {
    const collection = collections.find(col => col.id === collectionId);
    if (!collection || !recipeData) return false;

    const recipeId = recipeData.savedId || recipeData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return collection.recipes?.some(recipe => recipe.id === recipeId);
  };

  useEffect(() => {
    if (isOpen && recipeName) {
      // Complete reset of all state to prevent stale data
      setRecipeData(null);
      setError(null);
      setLoading(true);
      setCheckedIngredients({});
      setCompletedSteps({});
      setIsFavorited(false);

      // Small delay to ensure state is reset before fetching
      setTimeout(() => {
        handleFetchDetails();
      }, 50);
    }
  }, [isOpen, recipeName]);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  useEffect(() => {
    checkIfFavorited();
  }, [recipeData, collections]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl"
        onClick={() => {
          onClose();
        }}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 sm:rounded-2xl shadow-2xl shadow-stone-900/10 border-t sm:border border-stone-200/60 backdrop-blur-xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden transition-all duration-500 ease-out flex flex-col sm:block">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 md:p-6 relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-wide truncate">Loading...</h2>
                </div>
              ) : recipeData ? (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 leading-tight tracking-wide line-clamp-2">{recipeData.title}</h2>
                  <p className="text-orange-100 font-medium tracking-wide leading-relaxed text-sm md:text-base line-clamp-2">{recipeData.description}</p>
                </div>
              ) : (
                <h2 className="text-xl md:text-2xl font-bold tracking-wide truncate">{recipeName}</h2>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto sm:max-h-[calc(90vh-140px)]">
          {error ? (
            <div className="p-4 md:p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200/60 shadow-lg shadow-red-200/30">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2 tracking-wide">Error Loading Recipe</h3>
              <p className="text-stone-600 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={handleFetchDetails}
                className="relative px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-semibold overflow-hidden group hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="p-4 md:p-6 space-y-4">
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
            <div className="p-4 md:p-6">
              {/* Recipe Meta Info - Adjusted grid for mobile */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                <div className="relative bg-gradient-to-br from-orange-50 via-orange-100 to-red-50 rounded-2xl p-3 md:p-4 text-center border border-orange-200/60 shadow-lg shadow-orange-200/30 hover:scale-105 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="relative z-10">
                    <Timer className="w-5 h-5 md:w-7 md:h-7 text-orange-600 mx-auto mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm text-stone-600 font-semibold tracking-wide">Prep Time</p>
                    <p className="font-bold text-stone-800 text-sm md:text-lg leading-tight">{recipeData.prepTime || recipeData.cookingTime}</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-red-50 via-pink-100 to-red-50 rounded-2xl p-3 md:p-4 text-center border border-red-200/60 shadow-lg shadow-red-200/30 hover:scale-105 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="relative z-10">
                    <Clock className="w-5 h-5 md:w-7 md:h-7 text-red-600 mx-auto mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm text-stone-600 font-semibold tracking-wide">Cook Time</p>
                    <p className="font-bold text-stone-800 text-sm md:text-lg leading-tight">{recipeData.cookingTime}</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 rounded-2xl p-3 md:p-4 text-center border border-green-200/60 shadow-lg shadow-green-200/30 hover:scale-105 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="relative z-10">
                    <Users className="w-5 h-5 md:w-7 md:h-7 text-green-600 mx-auto mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm text-stone-600 font-semibold tracking-wide">Servings</p>
                    <p className="font-bold text-stone-800 text-sm md:text-lg leading-tight">{recipeData.servings}</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-2xl p-3 md:p-4 text-center border border-blue-200/60 shadow-lg shadow-blue-200/30 hover:scale-105 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="relative z-10">
                    <ChefHat className="w-5 h-5 md:w-7 md:h-7 text-blue-600 mx-auto mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm text-stone-600 font-semibold tracking-wide">Difficulty</p>
                    <p className="font-bold text-stone-800 text-sm md:text-lg leading-tight">{recipeData.difficulty}</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-2xl p-3 md:p-4 text-center border border-purple-200/60 shadow-lg shadow-purple-200/30 hover:scale-105 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="relative z-10">
                    <DollarSign className="w-5 h-5 md:w-7 md:h-7 text-purple-600 mx-auto mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm text-stone-600 font-semibold tracking-wide">Est. Cost</p>
                    <p className="font-bold text-stone-800 text-sm md:text-lg leading-tight">{recipeData.estimatedCost}</p>
                  </div>
                </div>
              </div>

              {/* YouTube Video Section */}
              {recipeData.youtubeUrl && (
                <div className="relative bg-gradient-to-r from-red-50 via-pink-50 to-red-100 rounded-2xl p-3 md:p-4 mb-6 border border-red-200/60 shadow-lg shadow-red-200/30 overflow-hidden group">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200/50 flex-shrink-0">
                        <Play className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-800 text-sm md:text-base leading-tight tracking-wide">Watch Tutorial</h4>
                        <p className="text-xs md:text-sm text-stone-600 font-medium">Find video instructions</p>
                      </div>
                    </div>
                    <a
                      href={recipeData.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full sm:w-auto text-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 hover:scale-105 shadow-lg shadow-red-200/50 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <Play className="w-3 h-3 md:w-4 md:h-4 relative z-10" />
                      <span className="relative z-10">Watch on YouTube</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-stone-800 flex items-center gap-2 tracking-wide">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                      Ingredients
                    </h3>
                    <button
                      onClick={() => setCheckedIngredients({})}
                      className="text-xs md:text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {Array.isArray(recipeData.ingredients) ? (
                      recipeData.ingredients.map((ingredient, index) => {
                        // Validate ingredient is a safe string
                        const safeIngredient = typeof ingredient === 'string' ? ingredient : String(ingredient);
                        const isChecked = checkedIngredients[index] || false;

                        return (
                          <div key={index} className="group">
                            <div className={`relative flex items-start gap-3 p-3 md:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                              isChecked 
                                ? 'bg-gradient-to-r from-green-100 via-emerald-50 to-green-150 border-green-300 shadow-lg shadow-green-200/30' 
                                : 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-green-200/60 hover:border-green-300'
                            } overflow-hidden`}>
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                              {/* Checkbox */}
                              <button
                                onClick={() => setCheckedIngredients(prev => ({
                                  ...prev,
                                  [index]: !prev[index]
                                }))}
                                className={`relative flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${
                                  isChecked 
                                    ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30' 
                                    : 'bg-white border-green-300 hover:border-green-500'
                                }`}
                              >
                                {isChecked && (
                                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                                )}
                              </button>

                              {/* Ingredient text - with safety check */}
                              <span className={`text-stone-700 text-sm md:text-base font-medium leading-relaxed relative z-10 ${
                                isChecked ? 'line-through text-stone-500' : ''
                              }`}>
                                {safeIngredient}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-stone-500 text-center py-4 text-sm">
                        No ingredients available.
                      </div>
                    )}
                  </div>

                  {/* Ingredient Summary */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200/60">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-stone-600 font-medium">Total Ingredients:</span>
                      <span className="font-semibold text-stone-800">
                        {Array.isArray(recipeData.ingredients) ? recipeData.ingredients.length : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-stone-800 flex items-center gap-2 tracking-wide">
                      <Timer className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                      Instructions
                    </h3>
                    <button
                      onClick={() => setCompletedSteps({})}
                      className="text-xs md:text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {Array.isArray(recipeData.instructions) ? (
                      recipeData.instructions.map((instruction, index) => {
                        // Validate instruction is a safe string and not malformed JSON
                        const safeInstruction = typeof instruction === 'string' ? instruction : String(instruction);
                        const isCompleted = completedSteps[index] || false;

                        // Skip if instruction looks like JSON or malformed data
                        if (safeInstruction.includes('{') && safeInstruction.includes('}')) {
                          console.warn('⚠️ [RECIPE-DETAIL-MODAL] Skipping malformed instruction:', safeInstruction);
                          return null;
                        }

                        return (
                          <div key={index} className="group">
                            <div className={`relative flex gap-3 md:gap-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.01] ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-150 border-blue-300 shadow-lg shadow-blue-200/30' 
                                : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-blue-200/60 hover:border-blue-300'
                            } overflow-hidden`}>
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                              {/* Step number and checkbox */}
                              <div className="flex items-start gap-3 relative z-10">
                                <button
                                  onClick={() => setCompletedSteps(prev => ({
                                    ...prev,
                                    [index]: !prev[index]
                                  }))}
                                  className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-xl border-2 flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                      : 'bg-white border-blue-300 hover:border-blue-500 text-blue-600'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                  ) : (
                                    index + 1
                                  )}
                                </button>
                              </div>

                              {/* Instruction text */}
                              <div className="flex-1 relative z-10">
                                <p className={`text-stone-700 leading-relaxed font-medium text-sm md:text-base ${
                                  isCompleted ? 'line-through text-stone-500' : ''
                                }`}>
                                  {safeInstruction}
                                </p>

                                {/* Step duration indicator */}
                                {recipeData.stepDurations && recipeData.stepDurations[index] && (
                                  <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                                    <Timer className="w-3 h-3" />
                                    <span>Time: {recipeData.stepDurations[index]}</span>
                                  </div>
                                )}

                                {/* Temperature indicator if mentioned in instruction */}
                                {safeInstruction.toLowerCase().includes('°c') || safeInstruction.toLowerCase().includes('°f') || safeInstruction.toLowerCase().includes('degrees') && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-red-600 font-medium">Temp Critical</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }).filter(Boolean) // Remove null entries
                    ) : (
                      <div className="text-stone-500 text-center py-4 text-sm">
                        No instructions available.
                      </div>
                    )}
                  </div>

                  {/* Instruction Summary */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200/60">
                    <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600 font-medium">Total Steps:</span>
                        <span className="font-semibold text-stone-800">
                          {Array.isArray(recipeData.instructions) ? recipeData.instructions.length : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600 font-medium">Completed:</span>
                        <span className="font-semibold text-stone-800">
                          {Object.values(completedSteps).filter(Boolean).length}/{Array.isArray(recipeData.instructions) ? recipeData.instructions.length : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutrition Information */}
              {recipeData.nutritionInfo && (
                <div className="mt-6 relative bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-2xl p-4 md:p-6 border border-emerald-200/60 shadow-lg shadow-emerald-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <h4 className="font-semibold text-stone-800 mb-3 md:mb-4 text-sm md:text-base tracking-wide flex items-center gap-2 relative z-10">
                    <Scale className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                    Nutrition
                    <span className="text-xs font-normal text-stone-500">(per serving)</span>
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
                    <div className="text-center p-3 md:p-4 bg-white/70 rounded-xl hover:scale-105 transition-all duration-300 border border-emerald-200/40">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs md:text-sm">Cal</span>
                      </div>
                      <p className="text-stone-600 font-medium text-xs md:text-sm mb-1">Calories</p>
                      <p className="font-bold text-stone-800 text-base md:text-lg">{recipeData.nutritionInfo.calories}</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-white/70 rounded-xl hover:scale-105 transition-all duration-300 border border-emerald-200/40">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-[10px] md:text-xs">Prot</span>
                      </div>
                      <p className="text-stone-600 font-medium text-xs md:text-sm mb-1">Protein</p>
                      <p className="font-bold text-stone-800 text-base md:text-lg">{recipeData.nutritionInfo.protein}</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-white/70 rounded-xl hover:scale-105 transition-all duration-300 border border-emerald-200/40">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-[10px] md:text-xs">Carb</span>
                      </div>
                      <p className="text-stone-600 font-medium text-xs md:text-sm mb-1">Carbs</p>
                      <p className="font-bold text-stone-800 text-base md:text-lg">{recipeData.nutritionInfo.carbs}</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-white/70 rounded-xl hover:scale-105 transition-all duration-300 border border-emerald-200/40">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-[10px] md:text-xs">Fat</span>
                      </div>
                      <p className="text-stone-600 font-medium text-xs md:text-sm mb-1">Fat</p>
                      <p className="font-bold text-stone-800 text-base md:text-lg">{recipeData.nutritionInfo.fat}</p>
                    </div>
                  </div>

                  {/* Additional nutrition details */}
                  {recipeData.nutritionInfo.fiber && (
                    <div className="mt-4 grid grid-cols-2 gap-4 relative z-10">
                      <div className="text-center p-2 bg-white/50 rounded-xl">
                        <p className="text-stone-600 font-medium text-xs">Fiber</p>
                        <p className="font-semibold text-stone-800 text-sm">{recipeData.nutritionInfo.fiber}</p>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded-xl">
                        <p className="text-stone-600 font-medium text-xs">Sodium</p>
                        <p className="font-semibold text-stone-800 text-sm">{recipeData.nutritionInfo.sodium}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Needed */}
              {recipeData.equipment && recipeData.equipment.length > 0 && (
                <div className="mt-6 relative bg-gradient-to-br from-stone-50 via-gray-50 to-stone-100 rounded-2xl p-4 md:p-6 border border-stone-200/60 shadow-lg shadow-stone-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <h4 className="font-semibold text-stone-800 mb-4 text-sm md:text-base tracking-wide flex items-center gap-2 relative z-10">
                    <ChefHat className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
                    Equipment Required
                  </h4>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {recipeData.equipment.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-all duration-300">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gradient-to-br from-stone-400 to-gray-500 rounded-full"></div>
                        <span className="text-stone-700 text-xs md:text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Cooking Tips */}
              {recipeData.tips && recipeData.tips.length > 0 && (
                <div className="mt-6 relative bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 rounded-2xl p-4 md:p-6 border border-yellow-200/60 shadow-lg shadow-yellow-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <h4 className="font-semibold text-stone-800 mb-4 text-sm md:text-base tracking-wide flex items-center gap-2 relative z-10">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                    Professional Chef Tips
                  </h4>
                  <div className="space-y-3 relative z-10">
                    {recipeData.tips.map((tip, index) => (
                      <div key={index} className="relative flex items-start gap-3 p-3 md:p-4 bg-white/60 rounded-xl hover:bg-white/80 transition-all duration-300 group">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] md:text-xs font-bold">!</span>
                        </div>
                        <p className="text-stone-700 text-xs md:text-sm font-medium leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serving & Plating */}
              {recipeData.servingNotes && (
                <div className="mt-6 relative bg-gradient-to-br from-rose-50 via-pink-50 to-red-100 rounded-2xl p-4 md:p-6 border border-rose-200/60 shadow-lg shadow-rose-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <h4 className="font-semibold text-stone-800 mb-4 text-sm md:text-base tracking-wide flex items-center gap-2 relative z-10">
                    <Award className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                    Serving & Plating
                  </h4>
                  <div className="relative z-10">
                    <p className="text-stone-700 text-xs md:text-sm font-medium leading-relaxed">{recipeData.servingNotes}</p>
                  </div>
                </div>
              )}

              {/* Ingredient Substitutions */}
              {recipeData.substitutions && recipeData.substitutions.length > 0 && (
                <div className="mt-6 relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 rounded-2xl p-4 md:p-6 border border-indigo-200/60 shadow-lg shadow-indigo-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <h4 className="font-semibold text-stone-800 mb-4 text-sm md:text-base tracking-wide flex items-center gap-2 relative z-10">
                    <Scale className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                    Ingredient Substitutions
                  </h4>
                  <div className="grid lg:grid-cols-2 gap-4 relative z-10">
                    {recipeData.substitutions.map((sub, index) => (
                      <div key={index} className="p-3 md:p-4 bg-white/60 rounded-xl border border-indigo-200/40 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-stone-700 text-xs md:text-sm font-medium leading-relaxed">
                              <span className="font-semibold text-indigo-700">{sub.original}:</span> {sub.substitute}
                            </p>
                            {sub.note && (
                              <p className="text-stone-500 text-[10px] md:text-xs mt-1 italic">{sub.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Chef Notes */}
              {recipeData.professionalNotes && (
                <div className="mt-6 relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 rounded-2xl p-4 md:p-6 border border-amber-200/60 shadow-lg shadow-amber-200/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <div className="flex items-start gap-3 relative z-10">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2 text-sm md:text-base tracking-wide">Chef's Professional Notes</h4>
                      <p className="text-stone-700 text-xs md:text-sm leading-relaxed font-medium">{recipeData.professionalNotes}</p>
                    </div>
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