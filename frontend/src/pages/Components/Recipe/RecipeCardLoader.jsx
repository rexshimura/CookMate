import React, { useState, useEffect, useRef } from 'react';
import RecipeCard from './RecipeCard';
import { getRecipeDetails } from '../../../utils/api';

const RecipeCardLoader = ({ recipeName, ...props }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchRecipe = async (retryAttempt = 0) => {
    if (!mountedRef.current || !recipeName) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecipeDetails(recipeName);
      
      if (!mountedRef.current) return; // Prevent state update if unmounted
      
      if (result.success) {
        setRecipe(result.recipe);
        setError(null);
      } else {
        console.error('Recipe fetch failed:', result.error);
        if (retryAttempt < 2) { // Max 2 retries
          timeoutRef.current = setTimeout(() => {
            fetchRecipe(retryAttempt + 1);
          }, 1000 * (retryAttempt + 1)); // Exponential backoff
        } else {
          setError(result.error || 'Failed to load recipe');
          // Create a fallback recipe object to prevent null return
          setRecipe({
            title: recipeName,
            description: 'Recipe details temporarily unavailable',
            error: true
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
      if (!mountedRef.current) return;
      
      if (retryAttempt < 2) {
        timeoutRef.current = setTimeout(() => {
          fetchRecipe(retryAttempt + 1);
        }, 1000 * (retryAttempt + 1));
      } else {
        setError(error.message || 'Network error');
        setRecipe({
          title: recipeName,
          description: 'Unable to load recipe details',
          error: true
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [recipeName]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    fetchRecipe(0);
  };

  if (loading) {
    return <RecipeCard isLoading={true} />;
  }

  // Handle error state with fallback recipe
  if (error && recipe) {
    return (
      <RecipeCard
        recipe={recipe}
        isError={true}
        errorMessage={error}
        onRetry={handleRetry}
        retryCount={retryCount}
        {...props}
      />
    );
  }

  return <RecipeCard recipe={recipe} {...props} />;
};

export default RecipeCardLoader;
