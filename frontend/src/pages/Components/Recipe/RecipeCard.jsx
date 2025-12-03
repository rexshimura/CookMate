import React from 'react';
import { ChefHat, Clock, Users, Heart } from 'lucide-react';

const RecipeCard = ({ recipe, onClick, isLoading, isFavorited = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-stone-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => !isLoading && onClick(recipe)}
      className={`bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-stone-800 group-hover:text-orange-700 transition-colors truncate text-base leading-tight">
              {recipe}
            </h4>
            {isFavorited && (
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-600 mt-1.5 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="tracking-wide">Click for details</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;