import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollectionManager from './Components/Collections/CollectionManager.jsx';
import RecipeCard from './Components/Recipe/RecipeCard.jsx';
import { getCollections, getCollectionRecipes } from '../utils/api.js';

const Collections = () => {
  const navigate = useNavigate();
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [collectionRecipes, setCollectionRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);

  // Load recipes for selected collection
  const loadCollectionRecipes = async (collectionId) => {
    if (!collectionId) {
      // If no collection selected, show all favorites or recent recipes
      setCollectionRecipes([]);
      setCurrentCollection(null);
      return;
    }

    setLoadingRecipes(true);
    try {
      const result = await getCollectionRecipes(collectionId);
      if (result.success) {
        setCollectionRecipes(result.recipes || []);
        setCurrentCollection(result.collection);
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
    }
  }, [selectedCollectionId]);

  const handleRecipeClick = (recipe) => {
    // Handle recipe click - could open detail modal or navigate to recipe page
    console.log('Recipe clicked:', recipe);
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
                selectedCollectionId={selectedCollectionId}
                onCollectionSelect={handleCollectionSelect}
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
                      {collectionRecipes.length} recipe{collectionRecipes.length !== 1 ? 's' : ''} in this collection
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
                          recipe={recipe.title || recipe.name || `Recipe ${index + 1}`}
                          onClick={handleRecipeClick}
                          isFavorited={true}
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
    </div>
  );
};

export default Collections;