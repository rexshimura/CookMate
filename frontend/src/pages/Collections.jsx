import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Clock, Users, X, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import CollectionManager from './Components/Collections/CollectionManager.jsx';
import RecipeCard from './Components/Recipe/RecipeCard.jsx';
import { getCollections, getCollectionRecipes, createCollection, updateCollection, getRecipeDetails } from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useModal } from '../App.jsx';
import { useLogoutConfirmation } from './Components/UI/useConfirmation.jsx';
import SimpleLogoutDialog, { LogoutButton, UserMenu } from '../components/SimpleLogoutDialog.jsx';

const Collections = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { showAuthPrompt, showRecipeDetail, showCollectionFormModal } = useModal();
  const { confirmLogout, ConfirmationDialog: LogoutDialog, isConfirming: isLogoutConfirming } = useLogoutConfirmation();
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [collectionRecipes, setCollectionRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Show auth prompt if not authenticated instead of redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-stone-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-white/80 via-stone-50/80 to-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-xl shadow-stone-900/5 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/home')}
                  className="p-2 hover:bg-stone-100 rounded-xl transition-all duration-200 hover:scale-110 group"
                >
                  <ArrowLeft className="w-5 h-5 text-stone-600 group-hover:-translate-x-1 transition-transform duration-200" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 overflow-hidden group relative">
                    <ChefHat className="w-6 h-6 text-white relative z-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-stone-900 tracking-wide">Recipe Collections</h1>
                    <p className="text-stone-600">Organize your favorite recipes into custom collections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Sign In Prompt */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-12 text-center relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200/50">
                <ChefHat className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-stone-900 mb-4 tracking-wide">
                Welcome to Recipe Collections
              </h2>
              <p className="text-stone-600 mb-8 max-w-lg mx-auto leading-relaxed text-lg">
                Sign in to create and manage your personalized recipe collections. 
                Organize your favorite recipes into categories like "Quick Dinners", 
                "Healthy Meals", or "My Fried Recipes".
              </p>
              <button
                onClick={() => showAuthPrompt("To access and manage your recipe collections, please sign in to your account or create a new one.")}
                className="relative px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg shadow-orange-200/50 hover:scale-105 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">Sign In to Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const [collectionsRefreshKey, setCollectionsRefreshKey] = useState(0);
  
  // Predefined colors and icons for collections
  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  const iconOptions = [
    'folder', 'heart', 'star', 'bookmark', 'tag', 'chef-hat', 'clock'
  ];

  // Create collection
  const handleCreateCollection = async (formData) => {
    if (!formData.name.trim()) return;

    try {
      const result = await createCollection(formData);
      
      // Backend returns { message, collection } - check for collection field instead of success
      if (result && result.collection) {
        // Trigger refresh of CollectionManager
        setCollectionsRefreshKey(prev => prev + 1);
        // Reload collections to reflect the new collection
        loadCollections();
        if (selectedCollectionId) {
          loadCollectionRecipes(selectedCollectionId);
        }
      } else {
        // Show user-friendly error without crashing
        alert('Failed to create collection: Unexpected response from server');
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      
      // Show user-friendly error without crashing the page
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to create collection: ${errorMessage}`);
    }
  };

  // Update collection
  const handleUpdateCollection = async (formData, collection) => {
    if (!collection || !formData.name.trim()) return;

    try {
      const result = await updateCollection(collection.id, formData);
      
      // Backend returns { message, collection } - check for collection field
      if (result && result.collection) {
        // Trigger refresh of CollectionManager
        setCollectionsRefreshKey(prev => prev + 1);
        // Reload collections to reflect the update
        loadCollections();
        if (selectedCollectionId) {
          loadCollectionRecipes(selectedCollectionId);
        }
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  };

  // Start editing
  const startEditing = (collection) => {
    showCollectionFormModal({
      mode: 'edit',
      collection,
      onSubmit: (formData) => handleUpdateCollection(formData, collection),
      colors: colorOptions,
      icons: iconOptions
    });
  };

  // Handle collection refresh from CollectionManager
  const handleCollectionRefresh = () => {
    loadCollections();
    if (selectedCollectionId) {
      loadCollectionRecipes(selectedCollectionId);
    }
  };

  // Load all recipes from all collections (for "All Recipes" view)
  const loadAllCollectionRecipes = async () => {
    setLoadingRecipes(true);
    try {
      // First get all collections
      const collectionsResult = await getCollections();
      if (!collectionsResult || !collectionsResult.collections) {
        console.error('Failed to load collections for All Recipes view');
        setCollectionRecipes([]);
        setCurrentCollection({
          id: null,
          name: 'All Recipes',
          description: 'All recipes from your collections',
          color: '#FF6B6B',
          icon: 'folder'
        });
        return;
      }

      const allRecipes = [];
      const collections = collectionsResult.collections;

      // Load recipes from each collection
      for (const collection of collections) {
        try {
          const collectionResult = await getCollectionRecipes(collection.id);
          if (collectionResult && collectionResult.recipes) {
            // Add collection name to each recipe for reference
            const recipesWithCollection = collectionResult.recipes.map(recipe => ({
              ...recipe,
              collectionName: collection.name,
              collectionColor: collection.color
            }));
            allRecipes.push(...recipesWithCollection);
          }
        } catch (error) {
          console.error(`Failed to load recipes from collection ${collection.name}:`, error);
        }
      }

      setCollectionRecipes(allRecipes);
      setCurrentCollection({
        id: null,
        name: 'All Recipes',
        description: `${allRecipes.length} recipes from ${collections.length} collection${collections.length !== 1 ? 's' : ''}`,
        color: '#FF6B6B',
        icon: 'folder'
      });

    } catch (error) {
      console.error('Failed to load all collection recipes:', error);
      setCollectionRecipes([]);
      setCurrentCollection({
        id: null,
        name: 'All Recipes',
        description: 'Failed to load recipes',
        color: '#FF6B6B',
        icon: 'folder'
      });
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Load recipes for selected collection
  const loadCollectionRecipes = async (collectionId) => {
    if (!collectionId) {
      // Load all recipes from all collections when "All Recipes" is selected
      await loadAllCollectionRecipes();
      return;
    }

    setLoadingRecipes(true);
    try {
      const result = await getCollectionRecipes(collectionId);
      // Backend returns { collection: {...}, recipes: [...] } directly
      if (result && result.recipes !== undefined && result.collection !== undefined) {
        setCollectionRecipes(result.recipes || []);
        setCurrentCollection(result.collection);
      } else {
        console.error('Unexpected response format:', result);
        setCollectionRecipes([]);
        setCurrentCollection(null);
      }
    } catch (error) {
      console.error('Failed to load collection recipes:', error);
      setCollectionRecipes([]);
      setCurrentCollection(null);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Handle collection selection
  const handleCollectionSelect = (collectionId) => {
    setSelectedCollectionId(collectionId);
    loadCollectionRecipes(collectionId);
  };

  useEffect(() => {
    // Load recipes for the initially selected collection (if any)
    if (selectedCollectionId) {
      loadCollectionRecipes(selectedCollectionId);
    } else {
      // Load "All Recipes" view when no specific collection is selected
      loadCollectionRecipes(null);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    // Load collections when user is authenticated
    if (user) {
      loadCollections();
    }
  }, [user]);

  const handleRecipeClick = (recipeName) => {
    showRecipeDetail({
      recipeName,
      fetchRecipeDetails: handleFetchRecipeDetails,
      onAddToFavorites: handleAddToFavoritesCallback
    });
  };

  const handleFetchRecipeDetails = async (recipeName) => {
    try {
      const result = await getRecipeDetails(recipeName);
      return result;
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
      return { success: false, error: error.message };
    }
  };

  const loadCollections = async () => {
    console.log('📚 [Collections] Loading collections...');
    setCollectionsLoading(true);
    try {
      const result = await getCollections();
      console.log('📚 [Collections] Collections API result:', result);
      
      // Handle both response structures: {success: true, collections: [...]} and {collections: [...]}
      let collections = [];
      if (result && result.collections) {
        collections = result.collections;
      } else if (Array.isArray(result)) {
        collections = result;
      } else {
        console.warn('⚠️ [Collections] Unexpected collections response format:', result);
      }
      
      console.log('📚 [Collections] Loaded collections:', collections);
      setCollections(collections);
      
    } catch (error) {
      console.error('❌ [Collections] Exception loading collections:', error);
      console.error('❌ [Collections] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setCollectionsLoading(false);
    }
  };

  // Login prompt handlers
  const requireAuth = (featureName) => {
    if (!user) {
      showAuthPrompt(`Please sign in to use ${featureName}.`);
      return false;
    }
    return true;
  };

  // Handle add to favorites callback
  const handleAddToFavoritesCallback = (recipeData) => {
    console.log('Added to favorites:', recipeData);
  };

  // Handle remove from favorites callback
  const handleRemoveFromFavoritesCallback = (recipeData) => {
    console.log('Removed from favorites:', recipeData);
  };

  // Handle add to collection callback  
  const handleAddToCollectionCallback = (collectionId, recipeData) => {
    console.log('Added to collection:', collectionId, recipeData);
  };

  // Handle remove from collection callback
  const handleRemoveFromCollectionCallback = (collectionId, recipeData) => {
    console.log('Removed from collection:', collectionId, recipeData);
    // Refresh the current collection to show updated recipes
    if (selectedCollectionId) {
      loadCollectionRecipes(selectedCollectionId);
    }
    // Also refresh collections to update recipe counts
    loadCollections();
  };

  // Handle create collection callback
  const handleCreateCollectionCallback = () => {
    showCollectionFormModal({
      mode: 'create',
      onSubmit: handleCreateCollection,
      colors: colorOptions,
      icons: iconOptions
    });
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    
    if (confirmed) {
      console.log('🔄 [Collections] User confirmed logout, starting process...');
      
      // Set loading state
      setIsLoggingOut(true);
      
      try {
        const result = await logout();
        
        if (result.success) {
          console.log('✅ [Collections] Logout successful, redirecting...');
          
          // Redirect to landing page after successful logout
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
          
        } else {
          console.error('❌ [Collections] Logout failed:', result.error);
          alert(result.error || 'Failed to sign out. Please try again.');
        }
        
      } catch (error) {
        console.error('❌ [Collections] Unexpected logout error:', error);
        alert('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-stone-800 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200/60">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Signing Out</h3>
            <p className="text-stone-600">Please wait while we sign you out...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-white/80 via-stone-50/80 to-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-xl shadow-stone-900/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-stone-100 rounded-xl transition-all duration-200 hover:scale-110 group"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600 group-hover:-translate-x-1 transition-transform duration-200" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 overflow-hidden group relative">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <ChefHat className="w-6 h-6 text-white relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-stone-900 tracking-wide">Recipe Collections</h1>
                  <p className="text-stone-600">Organize your favorite recipes into custom collections</p>
                </div>
              </div>
            </div>
            {/* Authentication status indicator and logout - Only show when user is logged in */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Lock className="w-4 h-4" />
                  <span>Signed in as {user?.displayName || user?.email}</span>
                </div>
                <LogoutButton 
                  onLogout={handleLogout}
                  variant="icon-text"
                  size="md"
                  className="text-stone-600 hover:text-red-600 hover:bg-red-50"
                  disabled={isLoggingOut}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-6 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
              
              <CollectionManager 
                key={collectionsRefreshKey}
                selectedCollectionId={selectedCollectionId}
                onCollectionSelect={handleCollectionSelect}
                onCreateCollection={handleCreateCollectionCallback}
                onEditCollection={startEditing}
                onCollectionRefresh={handleCollectionRefresh}
              />
            </div>
          </div>

          {/* Recipe Display Area */}
          <div className="lg:col-span-2">
            {selectedCollectionId ? (
              // Show collection recipes
              <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-6 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group"
                        style={{ backgroundColor: currentCollection?.color || '#FF6B6B' }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <ChefHat className="w-6 h-6 text-white relative z-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-stone-900 tracking-wide">
                          {currentCollection?.name || 'Collection'}
                        </h2>
                        <p className="text-stone-600">
                          {currentCollection?.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1" />
                      {currentCollection?.id === null 
                        ? `${collectionRecipes.length} recipe${collectionRecipes.length !== 1 ? 's' : ''} across all collections`
                        : `${collectionRecipes.length} recipe${collectionRecipes.length !== 1 ? 's' : ''} in this collection`
                      }
                    </div>
                  </div>

                  {loadingRecipes ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <RecipeCard 
                          key={i} 
                          recipe={`Loading recipe ${i}`} 
                          isLoading={true}
                        />
                      ))}
                    </div>
                  ) : collectionRecipes.length > 0 ? (
                    <div className="space-y-4">
                      {collectionRecipes.map((recipe, index) => (
                        <RecipeCard
                          key={recipe.id || index}
                          recipe={recipe}
                          onClick={handleRecipeClick}
                          isFavorited={true}
                          user={user}
                          collections={collections}
                          requireAuth={requireAuth}
                          collectionId={currentCollection?.id}
                          onAddToFavorites={handleAddToFavoritesCallback}
                          onRemoveFromFavorites={handleRemoveFromFavoritesCallback}
                          onAddToCollection={handleAddToCollectionCallback}
                          onRemoveFromCollection={handleRemoveFromCollectionCallback}
                          onCreateCollection={handleCreateCollectionCallback}
                          fetchRecipeDetails={handleFetchRecipeDetails}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-stone-300">
                        <ChefHat className="w-10 h-10 text-stone-400" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-800 mb-2 tracking-wide">No recipes yet</h3>
                      <p className="text-stone-600 max-w-md mx-auto">
                        This collection is empty. Start adding recipes to organize them!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Show overview/help message
              <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-8 text-center relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/50">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-3 tracking-wide">
                    Welcome to Collections
                  </h3>
                  <p className="text-stone-600 mb-8 max-w-lg mx-auto leading-relaxed">
                    Organize your favorite recipes into custom collections like "Quick Dinners", 
                    "Healthy Meals", or "My Fried Recipes".
                  </p>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-left max-w-lg mx-auto border border-blue-200/60 shadow-lg shadow-blue-200/30">
                    <h4 className="font-bold text-stone-800 mb-3 tracking-wide">How to get started:</h4>
                    <ol className="text-sm text-stone-700 space-y-2 list-decimal list-inside">
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Create a new collection using the sidebar
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        Give it a name and choose a color
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        Add recipes to your collection from recipe details
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        Click on any collection to view its recipes
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog />

    </div>
  );
};

export default Collections;