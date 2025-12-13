import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  DollarSign,
  ChefHat,
  Play,
  Pause,
  Volume2,
  Minus,
  Plus,
  Smartphone,
  CheckCircle,
  Heart,
  Timer,
  Scale,
  AlertCircle,
  Award,
  Youtube
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateRecipeId } from '../utils/ids.js';
import {
  getRecipeDetails
} from '../utils/api.js';
import {
  generateRecipeProgressId,
  saveRecipeProgress,
  loadRecipeProgress,
  clearRecipeProgress,
  hasSavedProgress,
  autoSaveProgress
} from '../utils/recipeProgress.js';

const RecipeDetailsPage = ({ favoritesHook, collectionsHook }) => {
  const { name: recipeName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use shared hooks instead of local state
  const { isFavorite, toggleFavorite } = favoritesHook || {};
  const { isRecipeInCollection, addRecipeToCollection, removeRecipeFromCollection, collections } = collectionsHook || {};
  
  // Core state
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  
  // Recipe progress tracking
  const [recipeProgressId, setRecipeProgressId] = useState('');
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [autoSaveCancel, setAutoSaveCancel] = useState(null);
  const [lastSavedProgress, setLastSavedProgress] = useState(null);
  
  // Smart Cooking features
  const [multiplier, setMultiplier] = useState(1);
  const [isCookMode, setIsCookMode] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [currentSpeakingStep, setCurrentSpeakingStep] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  
  // Timer functionality
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);
  
  // Speech synthesis availability
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Helper function to extract time from instruction text
  const extractTime = (text) => {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    const toMinutes = (value, unit) => {
      const minutesPerUnit = /hour|hr|hrs|h/.test(unit) ? 60 : 1;
      return Math.round(parseFloat(value) * minutesPerUnit);
    };

    // Handle ranges like "10-15 minutes" or "1-2 hours"
    const rangeMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/);
    if (rangeMatch) {
      const [, start, end, unit] = rangeMatch;
      const startMinutes = toMinutes(start, unit);
      const endMinutes = toMinutes(end, unit);
      return Math.max(startMinutes, endMinutes);
    }

    // Handle combined expressions like "1 hour 20 minutes"
    const hourMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h)\b/);
    const minuteMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m)\b/);
    if (hourMatch || minuteMatch) {
      const hours = hourMatch ? toMinutes(hourMatch[1], hourMatch[2]) : 0;
      const minutes = minuteMatch ? toMinutes(minuteMatch[1], minuteMatch[2]) : 0;
      const total = hours + minutes;
      if (total > 0) {
        return total;
      }
    }

    // Fallback to single minute value
    return minuteMatch ? toMinutes(minuteMatch[1], minuteMatch[2]) : null;
  };

  // Handle text-to-speech
  const handleSpeak = useCallback((text, stepIndex) => {
    if (!speechSynthesis || !text) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Highlight the current step
    setCurrentSpeakingStep(stepIndex);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      setCurrentSpeakingStep(null);
    };
    
    utterance.onerror = () => {
      setCurrentSpeakingStep(null);
    };
    
    speechSynthesis.speak(utterance);
  }, [speechSynthesis]);

  // Handle wake lock for cook mode
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLockObj = await navigator.wakeLock.request('screen');
        setWakeLock(wakeLockObj);
        
        wakeLockObj.addEventListener('release', () => {
          setWakeLock(null);
          setIsCookMode(false);
        });
        
        setIsCookMode(true);
        console.log('✅ Wake lock acquired');
      } catch (err) {
        console.error('❌ Wake lock failed:', err);
        setIsCookMode(false);
      }
    } else {
      console.warn('⚠️ Wake lock not supported');
      setIsCookMode(false);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        setIsCookMode(false);
        console.log('✅ Wake lock released');
      } catch (err) {
        console.error('❌ Wake lock release failed:', err);
      }
    }
  }, [wakeLock]);

  // Cleanup wake lock on component unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveCancel) {
        autoSaveCancel();
      }
    };
  }, [wakeLock, speechSynthesis, autoSaveCancel]);

  // Timer functionality
  const startTimer = useCallback((minutes) => {
    if (isTimerRunning) {
      stopTimer();
    }
    
    const duration = minutes * 60; // Convert to seconds
    setTimerDuration(duration);
    setTimerRemaining(duration);
    setIsTimerRunning(true);
    
    timerRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          // Play notification sound or show alert
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
              body: 'Your cooking timer has finished.',
              icon: '/favicon.ico'
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isTimerRunning]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRemaining > 0) {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            stopTimer();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Complete!', {
                body: 'Your cooking timer has finished.',
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timerRemaining]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    setTimerRemaining(0);
    setTimerDuration(0);
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress management functions
  const handleLoadProgress = useCallback(() => {
    if (!recipeProgressId) return;

    const savedProgress = loadRecipeProgress(recipeProgressId);
    if (savedProgress) {
      console.log('✅ [RECIPE-DETAIL-PAGE] Loading saved progress:', savedProgress);
      
      setCheckedIngredients(savedProgress.checkedIngredients || {});
      setCompletedSteps(savedProgress.completedSteps || {});
      setMultiplier(savedProgress.multiplier || 1);
      setLastSavedProgress(savedProgress);
      setHasLoadedProgress(true);
    } else {
      console.log('📝 [RECIPE-DETAIL-PAGE] No saved progress found');
      setHasLoadedProgress(false);
    }
  }, [recipeProgressId]);

  const handleSaveProgress = useCallback(() => {
    if (!recipeProgressId) return;

    const progressData = {
      checkedIngredients,
      completedSteps,
      multiplier
    };

    saveRecipeProgress(recipeProgressId, progressData);
    setLastSavedProgress({
      ...progressData,
      lastUpdated: new Date().toISOString()
    });
  }, [recipeProgressId, checkedIngredients, completedSteps, multiplier]);

  const handleClearProgress = useCallback(() => {
    if (!recipeProgressId) return;

    clearRecipeProgress(recipeProgressId);
    setCheckedIngredients({});
    setCompletedSteps({});
    setMultiplier(1);
    setHasLoadedProgress(false);
    setLastSavedProgress(null);
    
    console.log('🗑️ [RECIPE-DETAIL-PAGE] Progress cleared');
  }, [recipeProgressId]);

  // Auto-save progress when data changes
  useEffect(() => {
    if (!recipeProgressId || !hasLoadedProgress) return;

    // Cancel any existing auto-save
    if (autoSaveCancel) {
      autoSaveCancel();
    }

    // Set up new auto-save
    const cancelAutoSave = autoSaveProgress(recipeProgressId, {
      checkedIngredients,
      completedSteps,
      multiplier
    }, 1000); // Auto-save after 1 second of inactivity

    setAutoSaveCancel(() => cancelAutoSave);

    return () => {
      if (cancelAutoSave) {
        cancelAutoSave();
      }
    };
  }, [recipeProgressId, checkedIngredients, completedSteps, multiplier, hasLoadedProgress, autoSaveCancel]);

  // Load progress when recipe changes
  useEffect(() => {
    if (recipeName) {
      const progressId = generateRecipeProgressId(recipeName);
      setRecipeProgressId(progressId);
      
      // Check if there's saved progress
      if (hasSavedProgress(progressId)) {
        console.log('📋 [RECIPE-DETAIL-PAGE] Found saved progress for:', recipeName);
      }
    }
  }, [recipeName]);

  // Scale ingredients based on multiplier
  const scaleIngredient = (ingredient) => {
    if (!ingredient || typeof ingredient !== 'string' || multiplier === 1) {
      return ingredient;
    }
    
    // Enhanced scaling logic - look for numbers and multiply them
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      if (!isNaN(num)) {
        const scaled = num * multiplier;
        
        // Don't round very small amounts to zero - keep at least 2 decimal places for amounts < 1
        if (scaled > 0 && scaled < 1) {
          const result = scaled.toFixed(2).replace(/\.?0+$/, '');
          return result === '' ? '0' : result;
        }
        
        // For amounts >= 1, determine precision based on the scaled value
        const decimals = scaled % 1 === 0 ? 0 : 1;
        return scaled.toFixed(decimals).replace(/\.?0+$/, '');
      }
      return match;
    });
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Original recipe fetching logic
  const handleFetchDetails = async () => {
    if (!recipeName) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getRecipeDetails(recipeName);

      if (result.success && result.recipe) {
        const rawServings = parseFloat(result.recipe.servings);
        const safeServings = (rawServings && rawServings > 0) ? rawServings.toString() : '4';

        const sanitizedRecipe = {
          ...result.recipe,
          title: typeof result.recipe.title === 'string' ? result.recipe.title : recipeName,
          description: typeof result.recipe.description === 'string' ? result.recipe.description : `A delicious ${recipeName} recipe`,
          ingredients: Array.isArray(result.recipe.ingredients) ? result.recipe.ingredients.filter(ing => typeof ing === 'string') : [],
          instructions: Array.isArray(result.recipe.instructions) ? result.recipe.instructions.filter(inst => typeof inst === 'string') : [],
          cookingTime: typeof result.recipe.cookingTime === 'string' ? result.recipe.cookingTime : 'Varies',
          servings: safeServings,
          difficulty: typeof result.recipe.difficulty === 'string' ? result.recipe.difficulty : 'Medium',
          estimatedCost: typeof result.recipe.estimatedCost === 'string' ? result.recipe.estimatedCost : 'Moderate',
          nutritionInfo: typeof result.recipe.nutritionInfo === 'object' && result.recipe.nutritionInfo ? result.recipe.nutritionInfo : {},
          tips: Array.isArray(result.recipe.tips) ? result.recipe.tips : [],
          youtubeUrl: (typeof result.recipe.youtubeUrl === 'string' && result.recipe.youtubeUrl) 
            ? result.recipe.youtubeUrl 
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeName + ' recipe tutorial')}`,
          youtubeSearchQuery: typeof result.recipe.youtubeSearchQuery === 'string' ? result.recipe.youtubeSearchQuery : `${recipeName} recipe tutorial`
        };

        setRecipeData(sanitizedRecipe);
      } else {
        console.error('❌ [RECIPE-DETAIL-PAGE] Failed to fetch recipe:', result.error);
        setError(result.error || 'Failed to fetch recipe details');
      }
    } catch (err) {
      console.error('❌ [RECIPE-DETAIL-PAGE] Exception during fetch:', err);
      setError(err.message || 'Failed to fetch recipe details');
    } finally {
      setLoading(false);
    }
  };

  // Add recipe to collection (with auth check)
  const handleAddToCollection = async (collectionId) => {
    if (!recipeData || !collectionId) return;

    try {
      const recipeId = recipeData.savedId || generateRecipeId(recipeData.title);
      const result = await addRecipeToCollection(collectionId, recipeId, recipeData);

      if (result.success) {
        // Collections modal will be closed by the centralized system
      }
    } catch (error) {
      console.error('Failed to add recipe to collection:', error);
    }
  };

  // Reset state when recipe changes
  useEffect(() => {
    setRecipeData(null);
    setError(null);
    setLoading(true);
    setCheckedIngredients({});
    setCompletedSteps({});
    setCurrentSpeakingStep(null);
    setHasLoadedProgress(false);
    setLastSavedProgress(null);
    stopTimer();

    handleFetchDetails();
  }, [recipeName]);

  // Load progress after recipe data is loaded
  useEffect(() => {
    if (recipeData && recipeProgressId && !hasLoadedProgress) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleLoadProgress();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [recipeData, recipeProgressId, hasLoadedProgress, handleLoadProgress]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 min-w-0 pr-4">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <h2 className="text-lg md:text-xl font-bold tracking-wide truncate">Loading...</h2>
                  </div>
                ) : recipeData ? (
                  <div>
                    <h2 className="text-lg md:text-xl font-bold mb-1 leading-tight tracking-wide line-clamp-1">{recipeData.title}</h2>
                    <p className="text-orange-100 font-medium text-sm line-clamp-1">{recipeData.description}</p>
                  </div>
                ) : (
                  <h2 className="text-lg md:text-xl font-bold tracking-wide truncate">{recipeName}</h2>
                )}
              </div>
            </div>
            
            {/* Cook Mode Toggle */}
            <button
              onClick={isCookMode ? releaseWakeLock : requestWakeLock}
              className={`p-2 rounded-full transition-all ${
                isCookMode 
                  ? 'bg-green-500 hover:bg-green-600 shadow-lg' 
                  : 'hover:bg-white hover:bg-opacity-20'
              }`}
              title={isCookMode ? 'Disable Cook Mode' : 'Enable Cook Mode (Keep Screen Awake)'}
            >
              <Smartphone className={`w-5 h-5 ${isCookMode ? 'text-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        {recipeData && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              {/* Portion Scaler */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Scale:</span>
                <button
                  onClick={() => setMultiplier(Math.max(0.25, multiplier - 0.25))}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={multiplier <= 0.25}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold min-w-[3rem] text-center">
                  {Math.round(multiplier * parseFloat(recipeData.servings))} Servings
                </span>
                <button
                  onClick={() => setMultiplier(multiplier + 0.25)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={multiplier >= 4}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Share and Favorite */}
              <div className="flex items-center gap-2">
                {/* YouTube Button */}
                <a
                  href={recipeData.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white shadow-sm flex items-center justify-center"
                  title="Watch on YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <button
                  onClick={() => toggleFavorite && toggleFavorite(recipeData)}
                  disabled={favoritesHook?.loading}
                  className={`p-2 rounded-lg transition-all ${
                    isFavorite && isFavorite(recipeData)
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'hover:bg-white/20'
                  }`}
                  title={isFavorite && isFavorite(recipeData) ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${isFavorite && isFavorite(recipeData) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {error ? (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200/60 shadow-lg shadow-red-200/30">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2 tracking-wide">Error Loading Recipe</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={handleFetchDetails}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="p-4 space-y-4">
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
          <div className="p-4 space-y-6">
            {/* Progress indicator */}
            {hasLoadedProgress && lastSavedProgress && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Progress restored from previous session
                  </span>
                </div>
              </div>
            )}

            {/* Recipe Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-3 text-center border border-orange-200/60">
                <Timer className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-semibold">Prep Time</p>
                <p className="font-bold text-stone-800 text-sm">{recipeData.prepTime || recipeData.cookingTime}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-3 text-center border border-red-200/60">
                <Clock className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-semibold">Cook Time</p>
                <p className="font-bold text-stone-800 text-sm">{recipeData.cookingTime}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-200/60">
                <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-semibold">Servings</p>
                <p className="font-bold text-stone-800 text-sm">{recipeData.servings}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-200/60">
                <ChefHat className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-semibold">Difficulty</p>
                <p className="font-bold text-stone-800 text-sm">{recipeData.difficulty}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Ingredients
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearProgress}
                      className="text-xs text-stone-500 hover:text-red-600 font-medium transition-colors"
                      title="Clear all progress"
                    >
                      Clear Progress
                    </button>
                    <button
                      onClick={() => setCheckedIngredients({})}
                      className="text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {Array.isArray(recipeData.ingredients) ? (
                    recipeData.ingredients.map((ingredient, index) => {
                      const safeIngredient = typeof ingredient === 'string' ? ingredient : String(ingredient);
                      const isChecked = checkedIngredients[index] || false;
                      const scaledIngredient = scaleIngredient(safeIngredient);

                      return (
                        <div key={index} className="group">
                          <div 
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-green-100 border-green-300' 
                                : 'bg-white border-green-200 hover:border-green-300'
                            }`}
                            onClick={() => setCheckedIngredients(prev => ({
                              ...prev,
                              [index]: !prev[index]
                            }))}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                              isChecked 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-green-300'
                            }`}>
                              {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-medium leading-relaxed ${
                              isChecked ? 'line-through text-stone-500' : 'text-stone-700'
                            }`}>
                              {scaledIngredient}
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
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-600" />
                    Instructions
                  </h3>
                  <button
                    onClick={() => setCompletedSteps({})}
                    className="text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  {Array.isArray(recipeData.instructions) ? (
                    recipeData.instructions.map((instruction, index) => {
                      const safeInstruction = typeof instruction === 'string' ? instruction : String(instruction);
                      const isCompleted = completedSteps[index] || false;
                      const extractedTime = extractTime(safeInstruction);
                      const isCurrentlySpeaking = currentSpeakingStep === index;

                      // Skip malformed instructions
                      if (safeInstruction.includes('{') && safeInstruction.includes('}')) {
                        return null;
                      }

                      return (
                        <div key={index} className="group">
                          <div className={`relative p-4 rounded-xl border-2 transition-all ${
                            isCompleted 
                              ? 'bg-blue-100 border-blue-300' 
                              : 'bg-white border-blue-200'
                          } ${isCurrentlySpeaking ? 'ring-2 ring-orange-400 ring-opacity-50' : ''}`}>
                            
                            {/* Step header with controls */}
                            <div className="flex items-start gap-3 mb-2">
                              <button
                                onClick={() => setCompletedSteps(prev => ({
                                  ...prev,
                                  [index]: !prev[index]
                                }))}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                                  isCompleted 
                                    ? 'bg-blue-500 border-blue-500 text-white' 
                                    : 'border-blue-300 text-blue-600'
                                }`}
                              >
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                              </button>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-2 ml-auto">
                                {/* Play/Pause for TTS */}
                                {speechSynthesis && (
                                  <button
                                    onClick={() => handleSpeak(safeInstruction, index)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isCurrentlySpeaking 
                                        ? 'bg-orange-500 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                    title="Read step aloud"
                                  >
                                    {isCurrentlySpeaking ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                  </button>
                                )}
                                
                                {/* Timer button if time is detected */}
                                {extractedTime && (
                                  <button
                                    onClick={() => startTimer(extractedTime)}
                                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                    title={`Start ${extractedTime} minute timer`}
                                  >
                                    <Timer className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Instruction text */}
                            <p className={`text-sm font-medium leading-relaxed ${
                              isCompleted ? 'line-through text-stone-500' : 'text-stone-700'
                            }`}>
                              {safeInstruction}
                            </p>

                            {/* Time indicator if detected */}
                            {extractedTime && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                                <Timer className="w-3 h-3" />
                                <span>{extractedTime} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="text-stone-500 text-center py-4 text-sm">
                      No instructions available.
                    </div>
                  )}
                </div>

                {/* Instruction Summary */}
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-2 gap-4 text-xs">
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

            {/* Additional sections (Nutrition, Tips, etc.) */}
            {recipeData.nutritionInfo && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h4 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Nutrition (per serving)
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {recipeData.nutritionInfo.calories && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-stone-600 text-xs font-medium">Calories</p>
                      <p className="font-bold text-stone-800">{recipeData.nutritionInfo.calories}</p>
                    </div>
                  )}
                  {recipeData.nutritionInfo.protein && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-stone-600 text-xs font-medium">Protein</p>
                      <p className="font-bold text-stone-800">{recipeData.nutritionInfo.protein}</p>
                    </div>
                  )}
                  {recipeData.nutritionInfo.carbs && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-stone-600 text-xs font-medium">Carbs</p>
                      <p className="font-bold text-stone-800">{recipeData.nutritionInfo.carbs}</p>
                    </div>
                  )}
                  {recipeData.nutritionInfo.fat && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-stone-600 text-xs font-medium">Fat</p>
                      <p className="font-bold text-stone-800">{recipeData.nutritionInfo.fat}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Professional Tips */}
            {recipeData.tips && recipeData.tips.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Chef Tips
                </h4>
                <div className="space-y-2">
                  {recipeData.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-stone-700 text-xs font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Floating Timer Widget */}
      {isTimerRunning || timerRemaining > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-red-500 text-white rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-bold text-lg">{formatTime(timerRemaining)}</span>
                <span className="text-sm opacity-90">
                  {isTimerRunning ? 'Cooking in progress' : 'Timer paused'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isTimerRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Pause Timer"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Resume Timer"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={stopTimer}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Stop Timer"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cook Mode Indicator */}
      {isCookMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
            <Smartphone className="w-4 h-4" />
            Cook Mode Active
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetailsPage;