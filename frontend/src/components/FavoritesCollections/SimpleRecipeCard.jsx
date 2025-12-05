import React from 'react';

const SimpleRecipeCard = ({ recipe, onFavorite, onRemove, isFavorite }) => {
  return (
    <div className="recipe-card">
      <img src={recipe.image} alt={recipe.title} />
      <h3>{recipe.title}</h3>

      {/* Simple action buttons */}
      <div className="actions">
        <button onClick={() => onFavorite(recipe)}>
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
        <button onClick={() => onRemove(recipe)}>Remove</button>
      </div>
    </div>
  );
};

export default SimpleRecipeCard;