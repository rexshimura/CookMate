# 🔍 Favorites Search Feature - Technical Specification

## 🎯 Overview
Add search functionality to the favorites library to allow users to quickly find specific recipes in their favorites collection.

## 📋 Current System Analysis

### 🗂️ Architecture
- **Backend**: Node.js/Express with Firestore database
- **Frontend**: React with custom hooks and components
- **Data Storage**: Favorites stored in Firestore `collections` with `isDefault: true`
- **API**: RESTful endpoints at `/api/collections/favorites`

### 🔗 Key Components
1. **Backend**: `backend/functions/src/routes/collections.js`
2. **Frontend Hook**: `frontend/src/hooks/useFavorites.js`
3. **UI Components**:
   - `FavoritesCollectionsModal.jsx` (main interface)
   - `FavoritesModal.jsx` (legacy)
   - `FavoritesCollectionsPage.jsx` (dedicated page)

### 📊 Current Data Flow
```
User → useFavorites Hook → /api/collections/favorites → Firestore → Response
```

## 🚀 Feature Requirements

### ✅ Functional Requirements
1. **Search by Recipe Name**: Find recipes by full or partial name match
2. **Search by Ingredients**: Find recipes containing specific ingredients
3. **Search by Cuisine/Type**: Filter by recipe categories (Italian, Mexican, etc.)
4. **Real-time Search**: Results update as user types
5. **Case-Insensitive**: Match regardless of capitalization
6. **Debounced Input**: Optimize performance by debouncing search requests

### 🎨 UI/UX Requirements
1. **Search Bar**: Prominent search input in favorites modal/page
2. **Search Results**: Display matching recipes with clear visual feedback
3. **Empty State**: Helpful message when no results found
4. **Loading State**: Visual feedback during search operations
5. **Clear Button**: Easy way to reset search

### 🔒 Technical Requirements
1. **Backend API**: New search endpoint
2. **Frontend Integration**: Search state management
3. **Performance**: Optimized for large favorites collections
4. **Error Handling**: Graceful degradation
5. **Accessibility**: Keyboard navigation and screen reader support

## 🛠️ Technical Implementation Plan

### 📁 Backend Implementation

#### 1. **New Search Endpoint**
**File**: `backend/functions/src/routes/collections.js`
**Endpoint**: `GET /api/collections/favorites/search`

```javascript
// Add to collections.js
router.get('/favorites/search', verifyAuthToken, async (req, res) => {
  try {
    const { query, limit = 20, offset = 0 } = req.query;

    // Validate query parameter
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    // Get user's favorites collection
    const favoritesSnapshot = await db.collection('collections')
      .where('userId', '==', req.userId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (favoritesSnapshot.empty) {
      return res.status(200).json({
        results: [],
        total: 0,
        message: 'No favorites collection found'
      });
    }

    const favoritesDoc = favoritesSnapshot.docs[0];
    const favoritesData = favoritesDoc.data();
    const allRecipes = favoritesData.recipes || [];

    // Perform search
    const searchTerm = query.trim().toLowerCase();

    const filteredRecipes = allRecipes.filter(recipe => {
      const recipeName = recipe.title?.toLowerCase() || recipe.name?.toLowerCase() || '';
      const recipeDescription = recipe.description?.toLowerCase() || '';
      const recipeIngredients = recipe.ingredients?.join(' ')?.toLowerCase() || '';
      const recipeTags = recipe.tags?.join(' ')?.toLowerCase() || '';
      const recipeCuisine = recipe.cuisine?.toLowerCase() || '';

      return recipeName.includes(searchTerm) ||
             recipeDescription.includes(searchTerm) ||
             recipeIngredients.includes(searchTerm) ||
             recipeTags.includes(searchTerm) ||
             recipeCuisine.includes(searchTerm);
    });

    // Apply pagination
    const paginatedResults = filteredRecipes.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      results: paginatedResults.map(normalizeRecipeData),
      total: filteredRecipes.length,
      offset: offset,
      limit: limit,
      query: query
    });

  } catch (error) {
    console.error('Favorites search error:', error);
    res.status(500).json({
      error: 'Failed to search favorites',
      details: error.message
    });
  }
});
```

#### 2. **Enhanced Existing Endpoint**
**File**: `backend/functions/src/routes/collections.js`
**Endpoint**: `GET /api/collections/favorites` (enhanced)

Add optional query parameter support to existing endpoint:

```javascript
// Enhance existing /favorites endpoint
router.get('/favorites', verifyAuthToken, async (req, res) => {
  try {
    const { query } = req.query;

    // ... existing code to get favorites collection ...

    const normalizedRecipes = (favoritesData.recipes || []).map(normalizeRecipeData);

    // Apply search filter if query provided
    let filteredRecipes = normalizedRecipes;
    if (query && typeof query === 'string' && query.trim().length >= 2) {
      const searchTerm = query.trim().toLowerCase();
      filteredRecipes = normalizedRecipes.filter(recipe => {
        return recipe.title?.toLowerCase().includes(searchTerm) ||
               recipe.description?.toLowerCase().includes(searchTerm) ||
               (recipe.ingredients?.join(' ')?.toLowerCase().includes(searchTerm));
      });
    }

    res.status(200).json({
      collection: {
        // ... existing collection data ...
      },
      recipes: filteredRecipes,
      total: filteredRecipes.length,
      filtered: query ? true : false
    });

  } catch (error) {
    // ... existing error handling ...
  }
});
```

### 🖥️ Frontend Implementation

#### 1. **Enhanced useFavorites Hook**
**File**: `frontend/src/hooks/useFavorites.js`

```javascript
// Add search functionality to useFavorites hook
const useFavorites = () => {
  // ... existing state ...

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        setSearchError(null);

        // Use enhanced favorites endpoint with query parameter
        const response = await apiCall(`/api/collections/favorites?query=${encodeURIComponent(query)}`);

        if (response.recipes) {
          setSearchResults(response.recipes);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error.message || 'Failed to search favorites');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms debounce
    [user]
  );

  // Handle search input changes
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.length >= 2 || query.length === 0) {
      debouncedSearch(query);
    }
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  // Enhanced favorites list that respects search
  const displayFavorites = searchQuery.length >= 2 ? searchResults : favorites;

  return {
    // ... existing returns ...
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    handleSearch,
    clearSearch,
    displayFavorites
  };
};
```

#### 2. **Search UI Component**
**File**: `frontend/src/components/FavoritesCollections/FavoritesSearch.jsx`

```jsx
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
```

#### 3. **Integrate Search into FavoritesCollectionsModal**
**File**: `frontend/src/components/FavoritesCollections/FavoritesCollectionsModal.jsx`

```jsx
// Add import
import FavoritesSearch from './FavoritesSearch';

// Add to modal component
const FavoritesCollectionsModal = ({
  isOpen,
  onClose,
  recipe,
  onAction,
  favoritesHook,
  collectionsHook
}) => {
  // ... existing code ...

  // Add search state and handlers
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    handleSearch,
    clearSearch,
    displayFavorites
  } = favoritesHook || {};

  // ... existing code ...

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl">
      {/* ... existing header ... */}

      <div className="flex border-b border-stone-200">
        {/* ... existing tabs ... */}

        {/* Add search to favorites tab */}
        {activeTab === 'favorites' && (
          <div className="flex-1 p-4">
            <FavoritesSearch
              searchQuery={searchQuery || ''}
              setSearchQuery={handleSearch}
              isSearching={isSearching || false}
              onClear={clearSearch}
              placeholder="Search your favorite recipes..."
            />
          </div>
        )}
      </div>

      {/* ... existing content ... */}

      {/* Update favorites display to use search results */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoritesLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-stone-500">Loading favorites...</p>
            </div>
          ) : displayFavorites.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-1">
                {searchQuery ? 'No recipes found' : 'No favorites yet'}
              </h3>
              <p className="text-sm text-stone-500">
                {searchQuery
                  ? `No recipes match "${searchQuery}". Try a different search term.`
                  : 'Start saving recipes you love by clicking the heart icon!'}
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {displayFavorites.map((fav) => (
                <SimpleRecipeCard
                  key={`favorites_${fav.id || fav.title}`}
                  recipe={fav}
                  favoritesHook={favoritesHook}
                  collectionsHook={collectionsHook}
                  showCollectionActions={false}
                  onClick={() => handleRecipeClick(fav)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
```

#### 4. **Update FavoritesCollectionsPage**
**File**: `frontend/src/pages/FavoritesCollectionsPage.jsx`

```jsx
import React from 'react';
import FavoritesCollectionsModal from '../components/FavoritesCollections/FavoritesCollectionsModal';
import { useFavorites } from '../hooks/useFavorites';
import { useCollections } from '../hooks/useCollections';
import FavoritesSearch from '../components/FavoritesCollections/FavoritesSearch';

const FavoritesCollectionsPage = () => {
  const favoritesHook = useFavorites();
  const collectionsHook = useCollections();

  // Extract search functionality
  const {
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch,
    displayFavorites
  } = favoritesHook;

  return (
    <div className="favorites-collections-page max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">Favorites & Collections</h1>

      <div className="content">
        {/* Favorites Section with Search */}
        <div className="favorites-section mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-stone-700">Your Favorites</h2>
          </div>

          {/* Search Bar */}
          <FavoritesSearch
            searchQuery={searchQuery || ''}
            setSearchQuery={handleSearch}
            isSearching={isSearching || false}
            onClear={clearSearch}
            placeholder="Search your favorite recipes..."
          />

          {/* Favorites Grid */}
          {favoritesHook.loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-stone-500">Loading your favorites...</p>
            </div>
          ) : displayFavorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-1">
                {searchQuery ? 'No recipes found' : 'No favorites yet'}
              </h3>
              <p className="text-sm text-stone-500">
                {searchQuery
                  ? `No recipes match "${searchQuery}". Try a different search term.`
                  : 'Start saving recipes you love by clicking the heart icon!'}
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayFavorites.map((recipe) => (
                <div key={recipe.id} className="recipe-item">
                  {/* Recipe card content */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collections Section */}
        <div className="collections-section">
          <h2 className="text-2xl font-semibold text-stone-700 mb-6">Your Collections</h2>
          {/* Collections content */}
        </div>
      </div>

      {/* Modal for demonstration */}
      <FavoritesCollectionsModal
        isOpen={false}
        onClose={() => {}}
        favoritesHook={favoritesHook}
        collectionsHook={collectionsHook}
      />
    </div>
  );
};

export default FavoritesCollectionsPage;
```

### 🧪 Testing Plan

#### 1. **Unit Tests**
```javascript
// Test search functionality
describe('Favorites Search', () => {
  it('should filter recipes by name', () => {
    const recipes = [
      { title: 'Chicken Adobo', ingredients: ['chicken'] },
      { title: 'Pork Sinigang', ingredients: ['pork'] }
    ];
    const result = searchRecipes(recipes, 'chicken');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Chicken Adobo');
  });

  it('should filter recipes by ingredients', () => {
    const recipes = [
      { title: 'Chicken Adobo', ingredients: ['chicken', 'soy sauce'] },
      { title: 'Pork Sinigang', ingredients: ['pork', 'tamarind'] }
    ];
    const result = searchRecipes(recipes, 'soy');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Chicken Adobo');
  });

  it('should be case insensitive', () => {
    const recipes = [{ title: 'Chicken Adobo' }];
    const result = searchRecipes(recipes, 'CHICKEN');
    expect(result.length).toBe(1);
  });

  it('should return empty array for no matches', () => {
    const recipes = [{ title: 'Chicken Adobo' }];
    const result = searchRecipes(recipes, 'beef');
    expect(result.length).toBe(0);
  });
});
```

#### 2. **Integration Tests**
- Test API endpoint with various query parameters
- Test frontend-backend communication
- Test error handling scenarios

#### 3. **UI Tests**
- Test search input functionality
- Test loading states
- Test empty states
- Test responsive design

### 📅 Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Backend API Implementation | 2-3 hours |
| 2 | Frontend Hook Enhancement | 2 hours |
| 3 | Search UI Component | 1-2 hours |
| 4 | Modal Integration | 1-2 hours |
| 5 | Page Integration | 1 hour |
| 6 | Testing & Bug Fixes | 2-3 hours |
| 7 | Documentation | 1 hour |

### 🎯 Success Metrics
1. ✅ Users can search favorites by recipe name
2. ✅ Users can search favorites by ingredients
3. ✅ Search results update in real-time (debounced)
4. ✅ Search works on both modal and dedicated page
5. ✅ Performance remains excellent with large collections
6. ✅ Error handling is graceful and user-friendly

### 🔧 Technical Considerations
1. **Performance**: Debounce search input to prevent excessive API calls
2. **Error Handling**: Provide meaningful error messages
3. **Accessibility**: Ensure keyboard navigation and screen reader support
4. **Responsive Design**: Works on mobile and desktop
5. **Backward Compatibility**: Doesn't break existing functionality

## ✨ User Experience Flow

```
User opens favorites → Sees search bar → Types query → Sees filtered results → Clicks recipe → Views details
```

## 📋 Dependencies
- Existing favorites system (already implemented)
- Firestore database (already configured)
- React hooks and components (already available)

## 🚀 Next Steps
1. Implement backend search endpoint
2. Enhance frontend hook with search functionality
3. Create search UI component
4. Integrate search into existing components
5. Test thoroughly and fix any issues
6. Deploy and monitor usage

This specification provides a complete blueprint for implementing search functionality in the favorites library while maintaining the existing architecture and user experience.