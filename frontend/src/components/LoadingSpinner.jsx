import React from 'react';
import { ChefHat } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Chef Hat Logo */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 animate-pulse">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          
          {/* Loading Spinner */}
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-200 border-t-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-stone-800 mb-2">CookMate</h2>
        <p className="text-stone-600">Loading...</p>
        
        {/* Loading Dots */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;