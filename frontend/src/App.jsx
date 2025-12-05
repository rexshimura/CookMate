import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useFavorites } from './hooks/useFavorites.js';
import { useCollections } from './hooks/useCollections.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Import all modal components
import AuthPromptModal from './components/AuthPromptModal.jsx';
import SessionTransferNotification from './components/SessionTransferNotification.jsx';
import CollectionsModal from './pages/Components/UI/CollectionsModal.jsx';
import ConfirmationDialog from './pages/Components/UI/ConfirmationDialog.jsx';
import RecipeDetailModal from './pages/Components/Recipe/RecipeDetailModal.jsx';
import FavoritesModal from './pages/Components/UI/FavoritesModal.jsx';
import CollectionFormModal from './pages/Components/UI/CollectionFormModal.jsx';
import { useDeleteConfirmation, useLogoutConfirmation } from './pages/Components/UI/useConfirmation.jsx';

// Import pages
import Landing from "./pages/Landing.jsx";
import Home from "./pages/Main/Home.jsx"
import Collections from "./pages/Collections.jsx";
import SigninPage from "./pages/Auth/Sign-In.jsx";
import SignupPage from "./pages/Auth/Sign-Up.jsx";
import './App.css';

// Create Modal Context
const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Centralized Modal Manager Component
const ModalManager = ({ modalStates, modalActions, favoritesHook, collectionsHook, children }) => {
  const {
    authPromptState,
    collectionsModalState,
    confirmationState,
    recipeDetailModalState,
    favoritesModalState,
    collectionFormModalState
  } = modalStates;

  const {
    showAuthPrompt,
    hideAuthPrompt,
    showCollectionsModal,
    hideCollectionsModal,
    showConfirmation,
    hideConfirmation,
    showRecipeDetail,
    hideRecipeDetail,
    showFavoritesModal,
    hideFavoritesModal,
    showCollectionFormModal,
    hideCollectionFormModal
  } = modalActions;

  return (
    <ModalContext.Provider value={{
      // Auth Prompt
      showAuthPrompt,
      hideAuthPrompt,
      
      // Collections Modal
      showCollectionsModal,
      hideCollectionsModal,
      
      // Confirmation Dialog
      showConfirmation,
      hideConfirmation,
      
      // Recipe Detail Modal
      showRecipeDetail,
      hideRecipeDetail,
      
      // Favorites Modal
      showFavoritesModal,
      hideFavoritesModal,
      
      // Collection Form Modal
      showCollectionFormModal,
      hideCollectionFormModal
    }}>
      {children}
      
      {/* Centralized Modals - All rendered at top level with proper z-index layering */}
      
      {/* Auth Prompt Modal - Highest Priority */}
      <AuthPromptModal
        isOpen={authPromptState.isOpen}
        onClose={hideAuthPrompt}
        message={authPromptState.message}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipeName={recipeDetailModalState.recipeName}
        isOpen={recipeDetailModalState.isOpen}
        onClose={hideRecipeDetail}
        fetchRecipeDetails={recipeDetailModalState.fetchRecipeDetails}
        onAddToFavorites={recipeDetailModalState.onAddToFavorites}
      />

      {/* Collections Modal */}
      <CollectionsModal
        isOpen={collectionsModalState.isOpen}
        onClose={hideCollectionsModal}
        collections={collectionsModalState.collections}
        recipe={collectionsModalState.recipe}
        user={collectionsModalState.user}
        requireAuth={collectionsModalState.requireAuth}
        onAddToCollection={collectionsModalState.onAddToCollection}
        onRemoveFromCollection={collectionsModalState.onRemoveFromCollection}
        onCreateCollection={collectionsModalState.onCreateCollection}
        triggerRef={collectionsModalState.triggerRef}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        type={confirmationState.type}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        confirmButtonClass={confirmationState.confirmButtonClass}
        loading={confirmationState.loading}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={favoritesModalState.isOpen}
        onClose={hideFavoritesModal}
        favoriteRecipes={favoritesModalState.favoriteRecipes || []}
        favoritesLoading={favoritesModalState.favoritesLoading || false}
        collections={favoritesModalState.collections || []}
        favoriteCollectionId={favoritesModalState.favoriteCollectionId || null}
        handleFavoriteRecipeClick={favoritesModalState.handleFavoriteRecipeClick}
        handleAddToFavoritesCallback={favoritesModalState.handleAddToFavoritesCallback}
        handleRemoveFromFavoritesCallback={favoritesModalState.handleRemoveFromFavoritesCallback}
        handleAddToCollectionCallback={favoritesModalState.handleAddToCollectionCallback}
        handleRemoveFromCollectionCallback={favoritesModalState.handleRemoveFromCollectionCallback}
        handleCreateCollectionCallback={favoritesModalState.handleCreateCollectionCallback}
        handleFetchRecipeDetails={favoritesModalState.handleFetchRecipeDetails}
        user={favoritesModalState.user}
        requireAuth={favoritesModalState.requireAuth}
        // New unified architecture props
        favoritesHook={favoritesHook}
        collectionsHook={collectionsHook}
      />

      {/* Collection Form Modal */}
      <CollectionFormModal
        isOpen={collectionFormModalState.isOpen}
        onClose={hideCollectionFormModal}
        mode={collectionFormModalState.mode || 'create'}
        collection={collectionFormModalState.collection}
        onSubmit={collectionFormModalState.onSubmit}
        colors={collectionFormModalState.colors || []}
        icons={collectionFormModalState.icons || []}
      />

      {/* Session Transfer Notification */}
      <SessionTransferNotification />
    </ModalContext.Provider>
  );
};

function App() {
  // Initialize Unified Collections Architecture hooks
  const favoritesHook = useFavorites();
  const collectionsHook = useCollections();

  // Centralized Modal States
  const [authPromptState, setAuthPromptState] = useState({
    isOpen: false,
    message: 'To save recipes to your favorites or collections, please sign in to your account or create a new one.'
  });

  const [collectionsModalState, setCollectionsModalState] = useState({
    isOpen: false,
    collections: [],
    recipe: null,
    user: null,
    requireAuth: false,
    onAddToCollection: null,
    onRemoveFromCollection: null,
    onCreateCollection: null,
    triggerRef: null
  });

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    onConfirm: null,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: '',
    loading: false
  });

  const [recipeDetailModalState, setRecipeDetailModalState] = useState({
    isOpen: false,
    recipeName: '',
    fetchRecipeDetails: null,
    onAddToFavorites: null
  });

  const [favoritesModalState, setFavoritesModalState] = useState({
    isOpen: false,
    favoriteRecipes: [],
    favoritesLoading: false,
    collections: [],
    favoriteCollectionId: null,
    handleFavoriteRecipeClick: null,
    handleAddToFavoritesCallback: null,
    handleRemoveFromFavoritesCallback: null,
    handleAddToCollectionCallback: null,
    handleRemoveFromCollectionCallback: null,
    handleCreateCollectionCallback: null,
    handleFetchRecipeDetails: null,
    user: null,
    requireAuth: null
  });

  const [collectionFormModalState, setCollectionFormModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    collection: null,
    onSubmit: null,
    colors: [],
    icons: []
  });

  // Centralized Modal Actions
  const modalActions = {
    // Auth Prompt Actions
    showAuthPrompt: (message = 'To save recipes to your favorites or collections, please sign in to your account or create a new one.') => {
      setAuthPromptState({ isOpen: true, message });
    },
    hideAuthPrompt: () => {
      setAuthPromptState(prev => ({ ...prev, isOpen: false }));
    },

    // Collections Modal Actions
    showCollectionsModal: (options) => {
      setCollectionsModalState({ 
        isOpen: true, 
        ...options
      });
    },
    hideCollectionsModal: () => {
      setCollectionsModalState(prev => ({ ...prev, isOpen: false }));
    },

    // Confirmation Dialog Actions
    showConfirmation: (options) => {
      setConfirmationState({ 
        isOpen: true, 
        loading: false,
        ...options 
      });
    },
    hideConfirmation: () => {
      setConfirmationState(prev => ({ ...prev, isOpen: false }));
    },
    setConfirmationLoading: (loading) => {
      setConfirmationState(prev => ({ ...prev, loading }));
    },

    // Recipe Detail Modal Actions
    showRecipeDetail: (options) => {
      setRecipeDetailModalState({ 
        isOpen: true, 
        ...options 
      });
    },
    hideRecipeDetail: () => {
      setRecipeDetailModalState(prev => ({ ...prev, isOpen: false }));
    },

    // Favorites Modal Actions
    showFavoritesModal: (options) => {
      setFavoritesModalState({ 
        isOpen: true, 
        ...options
      });
    },
    hideFavoritesModal: () => {
      setFavoritesModalState(prev => ({ ...prev, isOpen: false }));
    },

    // Collection Form Modal Actions
    showCollectionFormModal: (options) => {
      setCollectionFormModalState({ 
        isOpen: true, 
        ...options
      });
    },
    hideCollectionFormModal: () => {
      setCollectionFormModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ModalManager 
            modalStates={{
              authPromptState,
              collectionsModalState,
              confirmationState,
              recipeDetailModalState,
              favoritesModalState,
              collectionFormModalState
            }} 
            modalActions={modalActions}
            favoritesHook={favoritesHook}
            collectionsHook={collectionsHook}
          >
            <div className="App">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={
                  <ProtectedRoute requireAuth={false}>
                    <Home 
                      favoritesHook={favoritesHook}
                      collectionsHook={collectionsHook}
                    />
                  </ProtectedRoute>
                } />
                <Route path="/collections" element={<Collections />} />

                <Route path="/signin" element={
                  <ProtectedRoute requireAuth={false}>
                    <SigninPage />
                  </ProtectedRoute>
                } />
                <Route path="/signup" element={
                  <ProtectedRoute requireAuth={false}>
                    <SignupPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </ModalManager>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;