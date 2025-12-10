import React from 'react';
import { Search, X } from 'lucide-react';

const FavoritesSearch = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  onClear,
  placeholder = "Search your favorites..."
}) => {
  const handleChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClear();
    }
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-stone-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-stone-700 placeholder-stone-400"
          aria-label="Search favorites"
        />
        {(searchQuery || isSearching) && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <button
                onClick={onClear}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesSearch;