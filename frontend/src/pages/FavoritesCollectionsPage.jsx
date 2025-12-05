import React from 'react';
import FavoritesCollectionsModal from '../components/FavoritesCollections/FavoritesCollectionsModal';
import { useFavorites } from '../hooks/useFavorites';
import { useCollections } from '../hooks/useCollections';

const FavoritesCollectionsPage = () => {
  const { favorites } = useFavorites();
  const { collections } = useCollections();

  return (
    <div className="favorites-collections-page">
      <h1>Favorites & Collections</h1>

      <div className="content">
        <div className="favorites-section">
          <h2>Favorites</h2>
          {favorites.map((recipe) => (
            <div key={recipe.id} className="recipe-item">
              <span>{recipe.title}</span>
            </div>
          ))}
        </div>

        <div className="collections-section">
          <h2>Collections</h2>
          {collections.map((collection) => (
            <div key={collection.id} className="collection-item">
              <span>{collection.name}</span>
            </div>
          ))}
        </div>
      </div>

      <FavoritesCollectionsModal isOpen={false} onClose={() => {}} />
    </div>
  );
};

export default FavoritesCollectionsPage;