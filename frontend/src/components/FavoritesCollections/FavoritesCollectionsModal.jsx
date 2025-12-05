import React, { useState, useEffect } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { useCollections } from '../../hooks/useCollections';

const FavoritesCollectionsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('favorites');
  const { favorites, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const { collections, addRecipeToCollection, loadCollections } = useCollections();

  // Refresh collections data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('📋 [FavoritesCollectionsModal] Modal opened, refreshing collections...');
      loadCollections();
    }
  }, [isOpen, loadCollections]);

  // Also refresh when switching to collections tab
  useEffect(() => {
    if (activeTab === 'collections' && isOpen) {
      console.log('📋 [FavoritesCollectionsModal] Collections tab selected, refreshing...');
      loadCollections();
    }
  }, [activeTab, isOpen, loadCollections]);

  if (!isOpen) return null;

  return (
    <div className="favorites-collections-modal">
      <div className="modal-header">
        <button onClick={() => setActiveTab('favorites')}>Favorites</button>
        <button onClick={() => setActiveTab('collections')}>Collections</button>
        {activeTab === 'collections' && (
          <button onClick={loadCollections} style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 6px' }}>
            🔄 Refresh
          </button>
        )}
        <button onClick={onClose}>Close</button>
      </div>

      <div className="modal-content">
        {activeTab === 'favorites' && (
          <div className="favorites-tab">
            {favorites.map((recipe) => {
              // Extract the actual recipe title - could be in recipe.data.title or recipe.title
              const recipeTitle = recipe.data?.title || recipe.title || recipe.name || 'Unknown Recipe';
              console.log('🔍 [Modal] Recipe data:', { recipe, recipeTitle });
              
              return (
                <div key={recipe.id} className="recipe-item">
                  <span>{recipeTitle}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="collections-tab">
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
              Debug: {collections.length} collections loaded
            </div>
            {collections.length === 0 ? (
              <div className="no-collections" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No collections found. Create a collection first!
              </div>
            ) : (
              collections.map((collection) => (
                <div key={collection.id} className="collection-item">
                  <span>{collection.name}</span>
                  <button
                    onClick={async () => {
                      console.log(`🔄 [Modal] Adding sample recipe to collection ${collection.id}`);
                      const sampleRecipe = { 
                        id: `sample-${Date.now()}`, 
                        title: 'Sample Recipe Added',
                        description: 'This is a test recipe added from the modal'
                      };
                      try {
                        await addRecipeToCollection(collection.id, sampleRecipe);
                        console.log(`✅ [Modal] Successfully added recipe to collection ${collection.id}`);
                        // Refresh collections data to show updated recipe counts
                        loadCollections();
                      } catch (error) {
                        console.error(`❌ [Modal] Failed to add recipe to collection ${collection.id}:`, error);
                      }
                    }}
                  >
                    Add Test Recipe
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesCollectionsModal;