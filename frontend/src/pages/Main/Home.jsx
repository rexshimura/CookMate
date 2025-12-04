import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, User, ArrowRight, LogOut, Trash2, Clock, ArrowDown, Heart, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSessions, useSessionChat } from '../../hooks/useSessions.js';
import { getRecipeDetails, getFavorites, getCollections } from '../../utils/api.js';
import RecipeCard from '../Components/Recipe/RecipeCard.jsx';
import RecipeDetailModal from '../Components/Recipe/RecipeDetailModal.jsx';
import Sidebar from '../Components/Utility/Sidebar.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useModal } from '../../App.jsx';
import { useDeleteConfirmation, useLogoutConfirmation } from '../Components/UI/useConfirmation.jsx';

// Simple markdown parser for bold text
const parseMarkdownText = (text) => {
  if (!text) return '';
  
  // Split text by ** patterns and wrap bold parts in JSX
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  
  return parts.map((part, index) => {
    // Check if this part is bold markdown
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2); // Remove ** from both ends
      return <strong key={index} className="font-semibold">{boldText}</strong>;
    }
    // Return regular text as-is
    return part;
  });
};

export default function Home() {
  const { user, logout } = useAuth();
  const { sessions, loading: sessionsLoading, createNewSession, deleteExistingSession } = useSessions();
  const { confirmDelete, ConfirmationDialog: DeleteDialog, isConfirming: isDeleteConfirming } = useDeleteConfirmation();
  const { confirmLogout, ConfirmationDialog: LogoutDialog, isConfirming: isLogoutConfirming } = useLogoutConfirmation();
  const { showAuthPrompt, showRecipeDetail, showCollectionsModal } = useModal();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Current session state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Call ALL hooks at the top level - this fixes the React hook error
  const { 
    messages, 
    loading: messagesLoading, 
    sending: isTyping, 
    error: chatError, 
    sendMessage, 
    clearMessages 
  } = useSessionChat(currentSessionId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Recipe modal state
  const [recipeDetailsLoading, setRecipeDetailsLoading] = useState(false);
  
  // Favorites state
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoriteCollectionId, setFavoriteCollectionId] = useState(null);

  // Collections state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Error state management
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Logout state management
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    let lastScrollY = 0;
    
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Show button when user is scrolled up more than 100px from bottom (less jittery)
        const shouldShow = distanceFromBottom > 100;

        setShowScrollButton(shouldShow);
        lastScrollY = scrollTop;
      }
    };

    // Try multiple times to get the container
    const setupScrollListener = () => {
      const container = messagesContainerRef.current;
      if (container) {
        console.log('✅ [SCROLL] Adding scroll listener to container');
        container.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial position
        return true;
      }
      return false;
    };

    // Try immediately
    if (!setupScrollListener()) {
      // Try after component mount
      setTimeout(setupScrollListener, 100);
      // Try again after more time
      setTimeout(setupScrollListener, 500);
      // Try one more time
      setTimeout(setupScrollListener, 1000);
    }

    return () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // CRITICAL: This useEffect MUST be called before any conditional returns
  // Initialize with existing session if available
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0 && !sessionsLoading) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId, sessionsLoading]);

  // Load collections when user is authenticated
  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  // Load favorites when showing favorites modal
  useEffect(() => {
    console.log('🔄 [Home] Favorites modal state changed, showFavorites:', showFavorites);
    if (showFavorites) {
      console.log('🔄 [Home] Loading fresh favorites data because modal opened');
      loadFavoriteRecipes();
    }
  }, [showFavorites]);

  const focusInput = () => {
    // Small delay to ensure the DOM is ready after re-render
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    setShowError(false);

    // Input validation
    if (!inputMessage.trim()) {
      setError('Please type a message before sending.');
      setShowError(true);
      return;
    }

    if (inputMessage.length < 2) {
      setError('Message is too short. Please enter at least 2 characters.');
      setShowError(true);
      return;
    }

    if (!currentSessionId) {
      setError('No active chat session. Please create a new chat.');
      setShowError(true);
      return;
    }

    const messageText = inputMessage;
    setInputMessage('');
    
    try {
      await sendMessage(messageText);
      focusInput();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      setShowError(true);
    }
  };

  const handleCreateNewChat = async () => {
    if (sessionsLoading) return;
    
    try {
      const newSession = await createNewSession('New Cooking Session');
      if (newSession) {
        setCurrentSessionId(newSession.id);
        if (isMobile) setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    const session = sessions.find(s => s.id === sessionId);
    const confirmed = await confirmDelete(session ? `"${session.title}"` : 'this chat');
    
    if (confirmed) {
      try {
        await deleteExistingSession(sessionId);
        
        // If deleted the current session, switch to another or create new one
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(s => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id);
          } else {
            setCurrentSessionId(null);
            clearMessages();
          }
        }
        

      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    
    if (confirmed) {
      console.log('🔄 [Home] User confirmed logout, starting process...');
      
      // Set loading state
      setIsLoggingOut(true);
      setError(null);
      setShowError(false);
      setShowSuccessMessage(false);
      
      try {
        const result = await logout();
        
        if (result.success) {
          console.log('✅ [Home] Logout successful, clearing local state...');
          
          // Clear local state
          setCurrentSessionId(null);
          clearMessages();
          setCurrentSessionId(null);
          
          // Clear any modal states
          setShowFavorites(false);
          
          // Show success feedback
          setShowSuccessMessage(true);
          console.log('🎉 [Home] Logout completed successfully');
          
          // Redirect to landing page after successful logout
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          
        } else {
          console.error('❌ [Home] Logout failed:', result.error);
          setError(result.error || 'Failed to sign out. Please try again.');
          setShowError(true);
        }
        
      } catch (error) {
        console.error('❌ [Home] Unexpected logout error:', error);
        setError('An unexpected error occurred. Please try again.');
        setShowError(true);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  // Recipe handlers
  const handleRecipeClick = (recipeName) => {
    showRecipeDetail({
      recipeName,
      fetchRecipeDetails: handleFetchRecipeDetails,
      onAddToFavorites: handleAddToFavoritesCallback
    });
  };

  const handleFetchRecipeDetails = async (recipeName) => {
    setRecipeDetailsLoading(true);
    try {
      const result = await getRecipeDetails(recipeName);
      return result;
    } finally {
      setRecipeDetailsLoading(false);
    }
  };

  // Favorites handlers
  const handleShowFavorites = () => {
    if (!user) {
      showAuthPrompt('Please sign in to view your favorite recipes.');
      return;
    }
    setShowFavorites(true);
    loadFavoriteRecipes();
  };

  const handleHideFavorites = () => {
    setShowFavorites(false);
  };

  // Collections handlers
  const handleShowCollections = () => {
    if (!user) {
      showAuthPrompt('Please sign in to view and manage your recipe collections.');
      return;
    }
    // Navigate to collections page
    window.location.href = '/collections';
  };

  const requireAuth = (featureName) => {
    if (!user) {
      showAuthPrompt(`Please sign in to use ${featureName}.`);
      return false;
    }
    return true;
  };

  const loadFavoriteRecipes = async () => {
    console.log('🔄 [Home] Loading fresh favorites data...');
    setFavoritesLoading(true);
    try {
      const result = await getFavorites();
      console.log('🔄 [Home] Fresh favorites data received:', result);
      // The new collections-based API returns { collection: {...}, recipes: [...] }
      if (result && result.recipes) {
        console.log('🔄 [Home] Setting favorites recipes:', result.recipes.length, 'recipes');
        setFavoriteRecipes(result.recipes || []);
        setFavoriteCollectionId(result.collection?.id || null);
      } else {
        console.log('🔄 [Home] No favorites found, setting empty array');
        setFavoriteRecipes([]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavoriteRecipes([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadCollections = async () => {
    console.log('📚 [Home] Loading collections...');
    setCollectionsLoading(true);
    try {
      const result = await getCollections();
      console.log('📚 [Home] Collections API result:', result);
      
      // Handle both response structures: {success: true, collections: [...]} and {collections: [...]}
      let collections = [];
      if (result && result.collections) {
        collections = result.collections;
      } else if (Array.isArray(result)) {
        collections = result;
      } else {
        console.warn('⚠️ [Home] Unexpected collections response format:', result);
      }
      
      console.log('📚 [Home] Loaded collections:', collections);
      setCollections(collections);
      
    } catch (error) {
      console.error('❌ [Home] Exception loading collections:', error);
      console.error('❌ [Home] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleFavoriteRecipeClick = (recipeName) => {
    // Close favorites modal first, then open recipe details using the modal system
    setShowFavorites(false);
    handleRecipeClick(recipeName);
  };

  const handleAddToFavoritesCallback = (recipeData) => {
    setFavoriteRecipes(prev => [...prev, recipeData]);
  };

  const handleRemoveFromFavoritesCallback = (recipeData) => {
    setFavoriteRecipes(prev => prev.filter(fav => 
      fav.id !== recipeData.id && 
      fav.title !== recipeData.title && 
      fav.name !== recipeData.name
    ));
  };

  const handleAddToCollectionCallback = (collectionId, recipeData) => {
    setCollections(prev => prev.map(collection =>
      collection.id === collectionId
        ? { ...collection, recipeCount: (collection.recipeCount || 0) + 1 }
        : collection
    ));
  };

  // Handle remove from collection callback
  const handleRemoveFromCollectionCallback = (collectionId, recipeData) => {
    // Update the specific collection's recipe count locally
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId 
        ? { ...collection, recipeCount: Math.max((collection.recipeCount || 0) - 1, 0) }
        : collection
    ));
  };

  // Handle create collection callback
  const handleCreateCollectionCallback = () => {
    // Navigate to collections page where user can create a new collection
    window.location.href = '/collections';
  };

  // Helper function to check if a recipe is favorited
  const isRecipeFavorited = (recipeName) => {
    return favoriteRecipes.some(fav => 
      fav.title === recipeName || 
      fav.name === recipeName ||
      fav.id === recipeName
    );
  };

  // Error handling functions
  const handleDismissError = () => {
    setShowError(false);
    setError(null);
  };

  const handleRetrySendMessage = async () => {
    if (!error || !inputMessage.trim()) {
      handleDismissError();
      return;
    }

    setIsRetrying(true);
    setShowError(false);
    
    try {
      await sendMessage(inputMessage);
      setInputMessage('');
      setError(null);
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      setError(retryError.message || 'Failed to send message. Please try again.');
      setShowError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine error type for styling
  const getErrorType = (errorMessage) => {
    if (errorMessage.includes('Network') || errorMessage.includes('connection') || errorMessage.includes('fetch')) {
      return 'network';
    } else if (errorMessage.includes('auth') || errorMessage.includes('sign in') || errorMessage.includes('unauthorized')) {
      return 'auth';
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return 'server';
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('too short')) {
      return 'validation';
    }
    return 'general';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = date.toDate ? date.toDate() : new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessage = (lastMessage) => {
    if (!lastMessage) return 'New chat session';
    return lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
  };

  // Allow anonymous users to use chat functionality
  // Authentication is only required for favorites and collections

  // Show loading while setting up session
  if (sessionsLoading && sessions.length === 0 && !currentSessionId) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-slate-800 items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>
        
        <div className="relative text-center">
          <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200/60 shadow-lg shadow-orange-200/30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/50 to-transparent animate-pulse duration-1000 rounded-2xl"></div>
            <ChefHat className="w-10 h-10 text-orange-600 relative z-10 animate-pulse" />
          </div>
          <p className="text-stone-600 font-medium tracking-wide">Loading your cooking sessions...</p>
        </div>
      </div>
    );
  }

  // If no current session and not creating one, show empty state
  if (!currentSessionId && !sessionsLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-slate-800 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>
        
        {/* Enhanced Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          user={user}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateSession={handleCreateNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onShowFavorites={handleShowFavorites}
          onShowCollections={handleShowCollections}
          onLogout={handleLogout}
          sessionsLoading={sessionsLoading}
          isLoggingOut={isLoggingOut}
          collapsed={sidebarCollapsed}
        />

        {/* Main Content Area - Empty State */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <div className="lg:hidden h-16 bg-gradient-to-r from-white/80 via-stone-50/80 to-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-xl shadow-stone-900/5 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors duration-200"><Menu className="w-6 h-6" /></button>
              <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-5 h-5" /><span className="font-bold text-lg">CookMate</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShowFavorites}
                className="p-2 text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full transition-all duration-200 hover:scale-105"
                title="My Favorites"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button onClick={handleCreateNewChat} disabled={sessionsLoading} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-105"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative text-center max-w-md">
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-200/60 shadow-lg shadow-orange-200/30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/50 to-transparent animate-pulse duration-2000 rounded-2xl"></div>
                <MessageSquare className="w-10 h-10 text-orange-600 relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2 tracking-wide">Start a New Cooking Conversation</h2>
              <p className="text-stone-600 mb-6 leading-relaxed">Create your first chat session and let CookMate help you with your culinary adventures!</p>
              <button 
                onClick={handleCreateNewChat} 
                disabled={sessionsLoading} 
                className="relative px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange-200/50 hover:scale-105 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {sessionsLoading ? 'Creating Chat...' : 'Start New Chat'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the full chat interface
  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-slate-800 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>
      
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200/60">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Signing Out</h3>
            <p className="text-stone-600">Please wait while we sign you out...</p>
          </div>
        </div>
      )}
      
      {/* Enhanced Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        user={user}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCreateSession={handleCreateNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onShowFavorites={handleShowFavorites}
        onShowCollections={handleShowCollections}
        onLogout={handleLogout}
        sessionsLoading={sessionsLoading}
        isLoggingOut={isLoggingOut}
        collapsed={sidebarCollapsed}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <div className="lg:hidden h-16 bg-gradient-to-r from-white/80 via-stone-50/80 to-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-xl shadow-stone-900/5 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors duration-200"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-5 h-5" /><span className="font-bold text-lg">CookMate</span></div>
          </div>
          <button onClick={handleCreateNewChat} disabled={sessionsLoading} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-105"><Plus className="w-5 h-5" /></button>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {/* Error Message Display */}
            {showError && error && (
              <ErrorMessage
                error={error}
                type={getErrorType(error)}
                onRetry={inputMessage.trim() ? handleRetrySendMessage : undefined}
                onDismiss={handleDismissError}
                showRetry={!!inputMessage.trim()}
                showDismiss={true}
                isRetrying={isRetrying}
              />
            )}

            {/* Success Message Display */}
            {showSuccessMessage && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl animate-slideUp">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-green-800 font-semibold">Successfully signed out!</h4>
                  <p className="text-green-700 text-sm">Redirecting to home page...</p>
                </div>
              </div>
            )}

            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <ChefHat className="w-8 h-8 text-orange-600 animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <p className="text-stone-600">Start your cooking conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${message.isUser ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-orange-600'}`}>
                    {message.isUser ? user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A' : <Flame className="w-5 h-5 fill-orange-500" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${message.isUser ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}`}>
                      {message.isUser ? message.text : parseMarkdownText(message.text)}
                    </div>
                    
                    {/* Render Recipe Cards if detectedRecipes exist */}
                    {!message.isUser && message.detectedRecipes && message.detectedRecipes.length > 0 && (
                      <div className="mt-4 space-y-3 w-full">
                        <h4 className="text-sm font-semibold text-stone-700 mb-3">Click on a recipe for full details:</h4>
                        {/* Console log removed to clean up spam */}
                        {message.detectedRecipes.map((recipe, index) => (
                          <RecipeCard
                            key={`${message.id}_recipe_${index}_${typeof recipe === 'string' ? recipe : recipe.title}`}
                            recipe={recipe}
                            onClick={handleRecipeClick}
                            isLoading={recipeDetailsLoading}
                            isFavorited={isRecipeFavorited(recipe)}
                            collections={collections}
                            onAddToFavorites={handleAddToFavoritesCallback}
                            onRemoveFromFavorites={handleRemoveFromFavoritesCallback}
                            onAddToCollection={handleAddToCollectionCallback}
                            onRemoveFromCollection={handleRemoveFromCollectionCallback}
                            onCreateCollection={handleCreateCollectionCallback}
                            fetchRecipeDetails={handleFetchRecipeDetails}
                            user={user}
                            requireAuth={requireAuth}
                          />
                        ))}
                      </div>
                    )}
                   
                    
                    <span className="text-[11px] text-stone-400 mt-1.5 px-1 font-medium">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
               <div className="flex gap-4 animate-slideUp">
                 <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-500" /></div>
                 <div className="px-5 py-4 bg-white border border-stone-200 rounded-2xl rounded-tl-sm text-stone-500 text-sm italic">Thinking...</div>
               </div>
            )}
            {chatError && (
              <div className="flex gap-4 animate-slideUp">
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="px-5 py-4 bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm text-red-700 text-sm">
                  Error: {chatError}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Scroll Down Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={`
              fixed bottom-24 right-4 lg:right-8 z-40
              w-10 h-10 bg-white border border-stone-200 text-stone-600
              rounded-full shadow-lg shadow-stone-200/50
              flex items-center justify-center
              hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200
              hover:scale-110 active:scale-95
              transition-all duration-300 ease-out transform
              ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}

        <div className="p-4 lg:p-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center bg-white rounded-full shadow-lg border border-stone-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-stone-400 text-stone-700"
                disabled={!currentSessionId || isTyping}
              />
              <div className="absolute right-2 p-1">
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping || !currentSessionId}
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center ${inputMessage.trim() && currentSessionId && !isTyping ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-stone-100 text-stone-300'}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
        


        {/* Favorites Modal/View */}
        {showFavorites && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl"
              onClick={handleHideFavorites}
            />
            <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 backdrop-blur-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-500 ease-out">
              {/* Favorites Header */}
              <div className="bg-gradient-to-r from-pink-600 via-red-600 to-pink-700 text-white p-6 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse duration-3000 pointer-events-none"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <Heart className="w-8 h-8 fill-white" />
                    <h2 className="text-2xl font-bold tracking-wide">My Favorite Recipes</h2>
                  </div>
                  <button
                    onClick={handleHideFavorites}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Favorites Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                {favoritesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-stone-600 font-medium">Loading favorites...</span>
                  </div>
                ) : favoriteRecipes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-200/60">
                      <Heart className="w-10 h-10 text-stone-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-stone-700 mb-2 tracking-wide">No favorites yet</h3>
                    <p className="text-stone-500 leading-relaxed">Start saving recipes you love by clicking the heart icon!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-stone-700 mb-4 tracking-wide">
                      You have {favoriteRecipes.length} favorite recipe{favoriteRecipes.length !== 1 ? 's' : ''}
                    </h3>
                    {favoriteRecipes.map((recipe, index) => (
                      <RecipeCard
                        key={`favorites_recipe_${index}_${recipe.id || recipe.title || recipe.name}`}
                        recipe={recipe}
                        onClick={(recipeName) => handleFavoriteRecipeClick(recipeName)}
                        isLoading={false}
                        isFavorited={true}
                        collections={collections}
                        onAddToFavorites={handleAddToFavoritesCallback}
                        onRemoveFromFavorites={handleRemoveFromFavoritesCallback}
                        onAddToCollection={handleAddToCollectionCallback}
                        onRemoveFromCollection={handleRemoveFromCollectionCallback}
                        onCreateCollection={handleCreateCollectionCallback}
                        collectionId={favoriteCollectionId}
                        fetchRecipeDetails={handleFetchRecipeDetails}
                        user={user}
                        requireAuth={requireAuth}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirmation Dialogs */}
      <DeleteDialog />
      <LogoutDialog />
    </div>
  );
}