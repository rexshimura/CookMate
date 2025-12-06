import React, { useState, useEffect } from 'react';
import RecipeCard from './RecipeCard';
import { getRecipeDetails } from '../../../utils/api';

const RecipeCardLoader = ({ recipeName, ...props }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const result = await getRecipeDetails(recipeName);
        if (result.success) {
          setRecipe(result.recipe);
        } else {
          // Handle error case, maybe show a message
          console.error(result.error);
          setRecipe(null);
        }
      } catch (error) {
        console.error('Failed to fetch recipe details:', error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    if (recipeName) {
      fetchRecipe();
    }
  }, [recipeName]);

  if (loading) {
    return <RecipeCard isLoading={true} />;
  }

  if (!recipe) {
    // Optionally render something different if recipe fails to load
    return null; 
  }

  return <RecipeCard recipe={recipe} {...props} />;
};

export default RecipeCardLoader;
