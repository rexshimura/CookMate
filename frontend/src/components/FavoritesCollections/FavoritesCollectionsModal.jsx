import React, { useState, useEffect } from 'react';
import { Heart, X, Plus, Folder, Clock } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { useCollections } from '../../hooks/useCollections';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useModal } from '../../App.jsx';
import { getRecipeDetails } from '../../utils/api.js';

const FavoritesCollectionsModal = ({ isOpen, onClose, recipe, onAction }) => {
  const [activeTab, setActiveTab] = useState('favorites');
  const { user } = useAuth();
  const { favorites, toggleFavorite, loading: favoritesLoading, isFavorite } = useFavorites();
  const { collections, addRecipeToCollection, loading: collectionsLoading, createNewCollection } = useCollections();
  const { showRecipeDetail } = useModal();

  const handleRecipeClick = (recipe) => {
    const recipeName = recipe.title || recipe.name || recipe;
    showRecipeDetail({
      recipeName,
      fetchRecipeDetails: async (name) => {
        // Simple wrapper to fetch details
        const result = await getRecipeDetails(name);
        return result;
      },
      // Optional: pass callbacks if needed, or leave null to handle in modal
    });
  };

  // Refresh collections data when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'collections') {
      loadCollections();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleFavoriteToggle = async (recipeData) => {
    try {
      await toggleFavorite(recipeData);
      if (onAction) {
        onAction('favorite', recipeData);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleAddToCollection = async (collectionId, recipeData) => {
    try {
      await addRecipeToCollection(collectionId, recipeData);
      if (onAction) {
        onAction('collection', { collectionId, recipe: recipeData });
      }
    } catch (error) {
      console.error('Failed to add to collection:', error);
    }
  };

  const SimpleRecipeCard = ({ recipe: recipeData, onRemove, onToggleFavorite }) => {
    const recipeTitle = recipeData.data?.title || recipeData.title || recipeData.name || 'Unknown Recipe';
    const isRecipeFavorite = isFavorite(recipeData);

    return (
      <div 
        className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleRecipeClick(recipeData)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-stone-800 truncate">{recipeTitle}</h4>
            {recipeData.description && (
              <p className="text-sm text-stone-600 mt-1 line-clamp-2">{recipeData.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
              {recipeData.addedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(recipeData.addedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteToggle(recipeData);
              }}
              className={`p-2 rounded-full transition-colors ${
                isRecipeFavorite 
                  ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
                  : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
              }`}
              title={isRecipeFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isRecipeFavorite ? 'fill-current' : ''}`} />
            </button>
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(recipeData);
                }}
                className="p-2 rounded-full bg-stone-100 text-stone-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Remove from current view"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CollectionCard = ({ collection, onAddRecipe }) => {
    return (
      <div className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-stone-600" />
              <h4 className="font-medium text-stone-800">{collection.name}</h4>
            </div>
            {collection.description && (
              <p className="text-sm text-stone-600 mt-1">{collection.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
              <span>{collection.recipeCount || collection.recipes?.length || 0} recipes</span>
              {collection.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(collection.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          {onAddRecipe && recipe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddRecipe(collection.id, recipe);
              }}
              className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors ml-3"
              title="Add current recipe to this collection"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="text-xl font-bold text-stone-800">My Recipes</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" />
              My Favorites ({favorites.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'collections'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Folder className="w-4 h-4" />
              My Collections ({collections.length})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favoritesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600">No favorite recipes yet</p>
                  <p className="text-sm text-stone-500 mt-1">Heart recipes you love to see them here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {favorites.map((recipe) => (
                    <SimpleRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onToggleFavorite={handleFavoriteToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="space-y-4">
              {collectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600">No collections yet</p>
                  <p className="text-sm text-stone-500 mt-1">Create collections to organize your recipes</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {collections.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      onAddRecipe={handleAddToCollection}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesCollectionsModal;