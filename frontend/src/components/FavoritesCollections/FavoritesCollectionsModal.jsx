import React, { useState, useEffect } from 'react';
import { Heart, X, Plus, Folder, Clock, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../App.jsx';
import { getRecipeDetails } from '../../utils/api.js';

const FavoritesCollectionsModal = ({ 
  isOpen, 
  onClose, 
  recipe, 
  onAction, 
  favoritesHook, 
  collectionsHook 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  
  // Local state for creating collections
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  // State for collection drill-down
  const [viewingCollection, setViewingCollection] = useState(null);
  
  // Use passed hooks to ensure state sync with the rest of the app
  const { favorites, toggleFavorite, loading: favoritesLoading, isFavorite } = favoritesHook || { favorites: [] };
  const { 
    collections, 
    addRecipeToCollection, 
    removeRecipeFromCollection,
    createNewCollection, 
    deleteCollection,
    loading: collectionsLoading 
  } = collectionsHook || { collections: [] };
  
  const { showRecipeDetail } = useModal();

  // Reset state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewCollectionName('');
      setViewingCollection(null);
    }
  }, [isOpen]);

  // Reset viewing collection when tabs change
  useEffect(() => {
    setViewingCollection(null);
  }, [activeTab]);

  const handleRecipeClick = (recipeData) => {
    const recipeName = recipeData.title || recipeData.name || 'Recipe';
    onClose(); // Close the library modal
    navigate(`/recipe/${encodeURIComponent(recipeName)}`); // Go to details page
  };

  const handleFavoriteToggle = async (recipeData) => {
    try {
      await toggleFavorite(recipeData);
      if (onAction) onAction('favorite', recipeData);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await createNewCollection({ name: newCollectionName });
      setIsCreating(false);
      setNewCollectionName('');
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await deleteCollection(id);
      } catch (error) {
        console.error('Failed to delete collection:', error);
      }
    }
  };

  const SimpleRecipeCard = ({ recipe: recipeData, onRemove, onRecipeClick }) => {
    const recipeTitle = recipeData.data?.title || recipeData.title || recipeData.name || 'Unknown Recipe';
    const isRecipeFavorite = isFavorite ? isFavorite(recipeData) : false;

    const handleCardClick = () => {
      if (onRecipeClick) {
        onRecipeClick(recipeData);
      } else {
        handleRecipeClick(recipeData);
      }
    };

    return (
      <div 
        className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-3">
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
          
          <div className="flex items-center gap-2 shrink-0">
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

  const CollectionCard = ({ collection, onClick }) => {
    const isCurrentRecipeInCollection = recipe && collection.recipes?.some(r => r.id === (recipe.id || recipe.title)); // Simplified check

    return (
      <div 
        className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-orange-600 fill-orange-100" />
              <h4 className="font-medium text-stone-800 truncate">{collection.name}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
              <span>{collection.recipes?.length || 0} recipes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* If a recipe is actively selected in the modal, show Add/Remove buttons */}
            {recipe ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  
                  if (isCurrentRecipeInCollection) {
                    await collectionsHook.removeRecipeFromCollection(collection.id, recipe);
                  } else {
                    await collectionsHook.addRecipeToCollection(collection.id, recipe);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isCurrentRecipeInCollection
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isCurrentRecipeInCollection ? 'Added' : 'Add'}
              </button>
            ) : (
              // If just viewing library, show delete option (but not for default collections like "My Favorites")
              !collection.isDefault && (
                <button
                  onClick={(e) => handleDeleteCollection(collection.id, e)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete collection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // Collection Detail View Component
  const CollectionDetailView = ({ collection, onBack }) => {
    const recipes = collection.recipes || [];

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Collections</span>
        </button>

        {/* Collection Header */}
        <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Folder className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-800">{collection.name}</h3>
              <p className="text-sm text-stone-500">{recipes.length} recipes</p>
            </div>
          </div>
        </div>

        {/* Recipes List */}
        {recipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-1">No recipes in this collection</h3>
            <p className="text-sm text-stone-500">
              Add some recipes to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recipes.map((recipeData) => (
              <SimpleRecipeCard
                key={recipeData.id}
                recipe={recipeData}
                onRemove={async (recipe) => {
                  // Remove recipe from collection using the hook
                  await collectionsHook.removeRecipeFromCollection(collection.id, recipe);
                }}
                onRecipeClick={handleRecipeClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50">
          <h2 className="text-xl font-bold text-stone-800">My Library</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white text-stone-500 hover:bg-stone-200 transition-colors shadow-sm border border-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-white">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'favorites'
                ? 'text-orange-600'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
              Favorites ({favorites.length})
            </div>
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'collections'
                ? 'text-orange-600'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Folder className={`w-4 h-4 ${activeTab === 'collections' ? 'fill-current' : ''}`} />
              Collections ({collections.length})
            </div>
            {activeTab === 'collections' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-stone-50/50">
          
          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favoritesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm text-stone-500">Loading favorites...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-stone-300" />
                  </div>
                  <h3 className="text-lg font-medium text-stone-800 mb-1">No favorites yet</h3>
                  <p className="text-sm text-stone-500">
                    Click the heart icon on any recipe to save it here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {favorites.map((fav) => (
                    <SimpleRecipeCard
                      key={fav.id}
                      recipe={fav}
                      onRemove={() => toggleFavorite(fav)}
                      onRecipeClick={handleRecipeClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeTab === 'collections' && (
            <div className="space-y-4">
              {/* Conditional rendering: Detail view or List view */}
              {viewingCollection ? (
                // DETAIL VIEW: Show individual collection contents
                <CollectionDetailView 
                  collection={viewingCollection} 
                  onBack={() => setViewingCollection(null)} 
                />
              ) : (
                // LIST VIEW: Show all collections and create button
                <>
                  {/* Create New Collection Input */}
                  {isCreating ? (
                    <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm animate-slideDown">
                      <h4 className="text-sm font-semibold text-stone-800 mb-2">New Collection</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="e.g., Weekend Dinner Ideas"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                        />
                        <button
                          onClick={handleCreateCollection}
                          disabled={!newCollectionName.trim() || collectionsLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 font-medium hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Collection
                    </button>
                  )}

                  {/* Collections List */}
                  {collectionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-stone-500 text-sm">Create your first collection to organize recipes!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {collections.map((col) => (
                        <CollectionCard 
                          key={col.id} 
                          collection={col} 
                          onClick={() => setViewingCollection(col)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer info */}
        {recipe && (
          <div className="p-3 bg-orange-50 border-t border-orange-100 text-center">
            <p className="text-xs text-orange-800">
              Saving: <span className="font-semibold">{recipe.title || 'Current Recipe'}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesCollectionsModal;