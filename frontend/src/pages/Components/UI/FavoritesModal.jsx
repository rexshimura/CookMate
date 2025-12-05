import React from 'react';
import { X, Heart } from 'lucide-react';
import RecipeCard from '../Recipe/RecipeCard.jsx';

const FavoritesModal = ({
  isOpen,
  onClose,
  favoriteRecipes,
  favoritesLoading,
  collections,
  favoriteCollectionId,
  handleFavoriteRecipeClick,
  handleAddToFavoritesCallback,
  handleRemoveFromFavoritesCallback,
  handleAddToCollectionCallback,
  handleRemoveFromCollectionCallback,
  handleCreateCollectionCallback,
  handleFetchRecipeDetails,
  user,
  requireAuth,
  // New unified architecture props
  favoritesHook,
  collectionsHook
}) => {
  if (!isOpen) return null;

  const derivedFavorites = favoritesHook?.favorites ?? favoriteRecipes ?? [];
  const derivedLoading = favoritesHook?.loading ?? favoritesLoading ?? false;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" />
      <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-500 ease-out">
        {/* Favorites Header */}
        <div className="bg-gradient-to-r from-pink-600 via-red-600 to-pink-700 text-white p-6 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse duration-3000 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 fill-white" />
              <h2 className="text-2xl font-bold tracking-wide">My Favorite Recipes</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Favorites Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {derivedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-stone-600 font-medium">Loading favorites...</span>
            </div>
          ) : derivedFavorites.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-200/60">
                <Heart className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-xl font-semibold text-stone-700 mb-2 tracking-wide">No favorites yet</h3>
              <p className="text-stone-500 leading-relaxed">Start saving recipes you love by clicking the heart icon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-stone-700 mb-4 tracking-wide">
                You have {derivedFavorites.length} favorite recipe{derivedFavorites.length !== 1 ? 's' : ''}
              </h3>
              {derivedFavorites.map((recipe, index) => (
                <RecipeCard
                  key={`favorites_recipe_${index}_${recipe.id || recipe.title || recipe.name}`}
                  recipe={recipe}
                  onClick={(recipeName) => handleFavoriteRecipeClick(recipeName)}
                  isLoading={false}
                  isFavorited={true}
                  collections={collections}
                  // New unified architecture props
                  favoritesHook={favoritesHook}
                  collectionsHook={collectionsHook}
                  toggleFavorite={favoritesHook?.toggleFavorite}
                  isFavorite={favoritesHook?.isFavorite}
                  // Legacy props for backward compatibility
                  onAddToFavorites={handleAddToFavoritesCallback}
                  onRemoveFromFavorites={handleRemoveFromFavoritesCallback}
                  onAddToCollection={handleAddToCollectionCallback}
                  onRemoveFromCollection={handleRemoveFromCollectionCallback}
                  onCreateCollection={handleCreateCollectionCallback}
                  collectionId={favoriteCollectionId}
                  fetchRecipeDetails={handleFetchRecipeDetails}
                  user={user}
                  requireAuth={requireAuth}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;