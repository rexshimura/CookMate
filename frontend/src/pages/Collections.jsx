import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Clock, Users, X, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCollections } from '../hooks/useCollections.js';
import CollectionManager from './Components/Collections/CollectionManager.jsx';
import RecipeCard from './Components/Recipe/RecipeCard.jsx';
import { getRecipeDetails } from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useModal } from '../App.jsx';
import { useLogoutConfirmation } from './Components/UI/useConfirmation.jsx';
import SimpleLogoutDialog, { LogoutButton, UserMenu } from '../components/SimpleLogoutDialog.jsx';

const Collections = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { showAuthPrompt, showRecipeDetail, showCollectionFormModal } = useModal();
  const { confirmLogout, ConfirmationDialog: LogoutDialog, isConfirming: isLogoutConfirming } = useLogoutConfirmation();

  const {
    collections,
    loading: collectionsLoading,
    error: collectionsError,
    createNewCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection,
    refreshCollections
  } = useCollections();

  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [collectionRecipes, setCollectionRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchRecipes = () => {
      if (collectionsLoading) return;

      if (selectedCollectionId === null) {
        setLoadingRecipes(true);
        const allRecipes = collections.flatMap(c =>
          (c.recipes || []).map(r => ({
            ...r,
            collectionName: c.name,
            collectionColor: c.color
          }))
        );
        setCollectionRecipes(allRecipes);
        setCurrentCollection({
          id: null,
          name: 'All Recipes',
          description: `${allRecipes.length} recipes from ${collections.length} collections`,
          color: '#FF6B6B',
          icon: 'folder'
        });
        setLoadingRecipes(false);
      } else {
        setLoadingRecipes(true);
        const collection = collections.find(c => c.id === selectedCollectionId);
        if (collection) {
          setCollectionRecipes(collection.recipes || []);
          setCurrentCollection(collection);
        } else {
          setCollectionRecipes([]);
          setCurrentCollection(null);
        }
        setLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [selectedCollectionId, collections, collectionsLoading]);

  useEffect(() => {
    if (user) {
      refreshCollections();
    }
  }, [user, refreshCollections]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-stone-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>
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

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  const iconOptions = [
    'folder', 'heart', 'star', 'bookmark', 'tag', 'chef-hat', 'clock'
  ];

  const handleCreateCollection = async (formData) => {
    if (!formData.name.trim()) return;
    try {
      await createNewCollection(formData);
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert(`Failed to create collection: ${error.message}`);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    try {
      await deleteCollection(collectionId);
      if (selectedCollectionId === collectionId) {
        setSelectedCollectionId(null);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert(`Failed to delete collection: ${error.message}`);
    }
  };

  const startEditing = (collection) => {
    alert('Editing collections is temporarily disabled.');
  };

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollectionId(collectionId);
  };

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

  const requireAuth = (featureName) => {
    if (!user) {
      showAuthPrompt(`Please sign in to use ${featureName}.`);
      return false;
    }
    return true;
  };

  const handleAddToFavoritesCallback = (recipeData) => {
    console.log('Added to favorites:', recipeData);
  };

  const handleRemoveFromFavoritesCallback = (recipeData) => {
    console.log('Removed from favorites:', recipeData);
  };

  const handleAddToCollectionCallback = async (collectionId, recipeData) => {
    try {
      await addRecipeToCollection(collectionId, recipeData);
    } catch (error) {
      console.error('Failed to add recipe to collection:', error);
      alert(`Failed to add recipe: ${error.message}`);
    }
  };

  const handleRemoveFromCollectionCallback = async (collectionId, recipeData) => {
    try {
      await removeRecipeFromCollection(collectionId, recipeData);
    } catch (error) {
      console.error('Failed to remove recipe from collection:', error);
      alert(`Failed to remove recipe: ${error.message}`);
    }
  };

  const handleCreateCollectionCallback = () => {
    showCollectionFormModal({
      mode: 'create',
      onSubmit: handleCreateCollection,
      colors: colorOptions,
      icons: iconOptions
    });
  };

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      setIsLoggingOut(true);
      try {
        const result = await logout();
        if (result.success) {
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          alert(result.error || 'Failed to sign out. Please try again.');
        }
      } catch (error) {
        alert('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-stone-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>
      <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
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
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <ChefHat className="w-6 h-6 text-white relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-stone-900 tracking-wide">Recipe Collections</h1>
                  <p className="text-stone-600">Organize your favorite recipes into custom collections</p>
                </div>
              </div>
            </div>
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
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-6 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
              <CollectionManager
                collections={collections}
                loading={collectionsLoading}
                selectedCollectionId={selectedCollectionId}
                onCollectionSelect={handleCollectionSelect}
                onCreateCollection={handleCreateCollectionCallback}
                onEditCollection={startEditing}
                onDeleteCollection={handleDeleteCollection}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedCollectionId ? (
              <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-6 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group"
                        style={{ backgroundColor: currentCollection?.color || '#FF6B6B' }}
                      >
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
                  {loadingRecipes || collectionsLoading ? (
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
              <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 p-8 text-center relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/50">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-3 tracking-wide">
                    Welcome to Collections
                  </h3>
                  <p className="text-stone-600 mb-8 max-w-lg mx-auto leading-relaxed">
                    Select a collection from the sidebar to view its recipes, or create a new one to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <LogoutDialog />
    </div>
  );
};

export default Collections;
