import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, User, ArrowRight, LogOut, Trash2, Clock, ArrowDown, Heart, Folder, LogIn, Bookmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

// NEW: Improved client-side recipe detection
const detectRecipesFromText = (text) => {
  if (!text || typeof text !== 'string') return [];

  // 1) Extract bolded phrases (common pattern used by AI responses)
  const boldRegex = /\*\*([^*]{2,120}?)\*\*/g;
  const candidates = [];
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw) candidates.push(raw);
  }

  // 2) fallback: sometimes responses use lines/headers like "1. Italian" or "- Italian"
  if (candidates.length === 0) {
    const lineRegex = /^(?:[-\d.]+\s*)?([A-Z][A-Za-z &/+-]{2,80})$/gm;
    while ((match = lineRegex.exec(text)) !== null) {
      const raw = match[1].trim();
      if (raw) candidates.push(raw);
    }
  }

  if (candidates.length === 0) return [];

  // 3) validation heuristics: presence of food/cuisine keywords or typical dish words
  const foodKeywords = [
    'chicken','beef','pork','pasta','pizza','taco','rice','curry','dessert','cake','pie','salad',
    'soup','bolognese','spaghetti','pancake','grill','bbq','vegan','vegetarian','seafood','fish',
    'shrimp','noodle','ramen','sushi','biryani','burger','sandwich','omelette','stew','chili',
    'risotto','paella','lasagna','italian','mexican','indian','thai','japanese','chinese','korean',
    'mediterranean','bbq','grilling','desserts','dessert','breakfast','dinner','brunch'
  ];

  const isLikelyRecipe = (candidate) => {
    if (!candidate) return false;
    const c = candidate.toLowerCase();

    // Reject overly long headings
    if (candidate.length > 80) return false;

    // Accept if contains any strong food/cuisine keyword
    for (const kw of foodKeywords) {
      if (c.includes(kw)) return true;
    }

    // Accept if it's reasonably short and looks like a dish/cuisine (2-4 words, not generic UI text)
    const words = c.split(/\s+/).filter(Boolean);
    if (words.length <= 4 && words.length >= 1 && /[a-z]/.test(c)) {
      // heuristics to avoid generic labels
      const genericReject = ['choose','options','ingredients','step','instructions','please','choose a','here are'];
      if (!genericReject.some(g => c.includes(g))) return true;
    }

    return false;
  };

  // 4) filter & dedupe while preserving order
  const seen = new Set();
  const results = [];
  for (const raw of candidates) {
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    if (isLikelyRecipe(normalized)) {
      seen.add(key);
      results.push(normalized);
    }
  }

  return results;
};

export default function Home({ favoritesHook, collectionsHook }) {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { sessions, loading: sessionsLoading, createNewSession, deleteExistingSession } = useSessions();
  const { confirmDelete, ConfirmationDialog: DeleteDialog, isConfirming: isDeleteConfirming } = useDeleteConfirmation();
  const { confirmLogout, ConfirmationDialog: LogoutDialog, isConfirming: isLogoutConfirming } = useLogoutConfirmation();
  const { showAuthPrompt, showRecipeDetail, showFavoritesCollectionsModal } = useModal();
  
  // Use unified hooks for favorites and collections
  const { 
    favorites, 
    loading: favoritesLoading, 
    error: favoritesError,
    toggleFavorite,
    isFavorite 
  } = favoritesHook;
  
  const {
    collections,
    loading: collectionsLoading,
    error: collectionsError,
    createNewCollection,
    addRecipeToCollection,
    removeRecipeFromCollection,
    isRecipeInCollection
  } = collectionsHook;
  
  // --- Hooks & state (must run every render) ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentSessionId');
      return saved || null;
    }
    return null;
  });

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
  
  // Legacy state for backward compatibility (will be removed)
  const [favoriteCollectionId, setFavoriteCollectionId] = useState(null);

  // Error state management
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Logout state management
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Session migration notification
  const [showSessionMigrationNotice, setShowSessionMigrationNotice] = useState(false);

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

  // Validate current session exists when sessions load (runs once on mount)
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const sessionExists = sessions.some(s => s.id === currentSessionId);
      if (!sessionExists) {
        setCurrentSessionId(null);
        localStorage.removeItem('currentSessionId');
      }
    }
  }, []); // Empty dependency array - run once on mount

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
  // Initialize with existing session if available and validate it exists
  useEffect(() => {
    if (sessions.length > 0) {
      // Check if current session still exists in the sessions list
      const currentSessionExists = sessions.some(s => s.id === currentSessionId);
      
      if (!currentSessionId || !currentSessionExists) {
        // If no current session or it doesn't exist, use the first available session
        const newSessionId = sessions[0].id;
        setCurrentSessionId(newSessionId);
        localStorage.setItem('currentSessionId', newSessionId);
      }
    } else if (sessions.length === 0 && currentSessionId) {
      // No sessions available, clear current session
      setCurrentSessionId(null);
      localStorage.removeItem('currentSessionId');
    }
  }, [sessions]);

  // Additional effect to ensure current session persists during any updates
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const sessionExists = sessions.some(s => s.id === currentSessionId);
      if (!sessionExists) {
        const firstSession = sessions[0];
        if (firstSession) {
          setCurrentSessionId(firstSession.id);
          localStorage.setItem('currentSessionId', firstSession.id);
        }
      }
    }
  }, [sessions]);

  // Collections are now loaded automatically by the hook when user is authenticated

  // Handle user state changes - migrate sessions when going from anonymous to authenticated
  const [previousUserId, setPreviousUserId] = useState(null);
  
  useEffect(() => {
    const currentUserId = user?.uid || 'anonymous';
    
    if (previousUserId && previousUserId !== currentUserId) {
      if (previousUserId === 'anonymous' && currentUserId !== 'anonymous') {
        // User transitioned from anonymous to authenticated
        
        // Check if we have anonymous sessions to migrate
        const anonymousSessions = localStorage.getItem('anonymous_sessions');
        let hadSessions = false;
        
        if (anonymousSessions) {
          try {
            const sessions = JSON.parse(anonymousSessions);
            if (sessions && sessions.length > 0) {
              hadSessions = true;
              
              // Show migration notice
              setShowSessionMigrationNotice(true);
              
              // Clear current state to force user to create new authenticated sessions
              setCurrentSessionId(null);
              localStorage.removeItem('currentSessionId');
              clearMessages();
            } else {
              // No anonymous sessions, just clear current state
              setCurrentSessionId(null);
              localStorage.removeItem('currentSessionId');
              clearMessages();
            }
          } catch (error) {
            setCurrentSessionId(null);
            localStorage.removeItem('currentSessionId');
            clearMessages();
          }
        } else {
          // No anonymous sessions, just clear current state
          setCurrentSessionId(null);
          localStorage.removeItem('currentSessionId');
          clearMessages();
        }
      } else if (previousUserId !== 'anonymous' && currentUserId === 'anonymous') {
        // User logged out
        setCurrentSessionId(null);
        localStorage.removeItem('currentSessionId');
        clearMessages();
      } else {
        // User switched between different authenticated accounts
        setCurrentSessionId(null);
        localStorage.removeItem('currentSessionId');
        clearMessages();
      }
    }
    
    setPreviousUserId(currentUserId);
  }, [user, clearMessages]);



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
    try {
      const newSession = await createNewSession('New Cooking Session');
      if (newSession) {
        setCurrentSessionId(newSession.id);
        if (isMobile) setSidebarOpen(false);
        // Save to localStorage for persistence
        localStorage.setItem('currentSessionId', newSession.id);
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    if (isMobile) setSidebarOpen(false);
    // Save to localStorage for persistence
    if (session.id) {
      localStorage.setItem('currentSessionId', session.id);
    }
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
            const newCurrentSessionId = remainingSessions[0].id;
            setCurrentSessionId(newCurrentSessionId);
            localStorage.setItem('currentSessionId', newCurrentSessionId);
          } else {
            setCurrentSessionId(null);
            localStorage.removeItem('currentSessionId');
            clearMessages();
          }
        }
        
        // Clean up localStorage if the deleted session was the current one
        if (sessionId === currentSessionId) {
          localStorage.removeItem('currentSessionId');
        }

      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    
    if (confirmed) {
      // Set loading state
      setIsLoggingOut(true);
      setError(null);
      setShowError(false);
      
      try {
        const result = await logout();
        
        if (result.success) {
          // Clear local state
          setCurrentSessionId(null);
          localStorage.removeItem('currentSessionId');
          clearMessages();
          
          // Modal states are cleared automatically when user logs out
          
        } else {
          setError(result.error || 'Failed to sign out. Please try again.');
          setShowError(true);
        }
        
      } catch (error) {
        setError('An unexpected error occurred. Please try again.');
        setShowError(true);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  // Recipe handlers
  const handleRecipeClick = (recipeName) => {
    // Navigate to the new page, encoding the name to handle spaces/special chars
    navigate(`/recipe/${encodeURIComponent(recipeName)}`);
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

  // Unified Library handlers
  const handleShowLibrary = () => {
    if (!user) {
      showAuthPrompt('Please sign in to view your library of recipes.');
      return;
    }
    
    // Use the unified modal
    showFavoritesCollectionsModal({
      recipe: null, // When opening from library view, no specific recipe
      onAction: (action, data) => {
        if (action === 'favorite') {
          // Handle favorite action if needed
          console.log('Favorite action:', data);
        } else if (action === 'collection') {
          // Handle collection action if needed
          console.log('Collection action:', data);
        }
      }
    });
  };

  const requireAuth = (featureName) => {
    if (!user) {
      showAuthPrompt(`Please sign in to use ${featureName}.`);
      return false;
    }
    return true;
  };

  // Load functions removed - hooks handle this automatically

  const handleFavoriteRecipeClick = (recipeName) => {
    // Open recipe details using the modal system
    handleRecipeClick(recipeName);
  };

  // Legacy callback functions for backward compatibility with old modals
  const handleAddToFavoritesCallback = (recipeData) => {
    // Hooks handle this automatically - this is just for legacy modal compatibility
    console.log('Legacy add to favorites callback - using hooks instead');
  };

  const handleRemoveFromFavoritesCallback = (recipeData) => {
    // Hooks handle this automatically - this is just for legacy modal compatibility
    console.log('Legacy remove from favorites callback - using hooks instead');
  };

  const handleAddToCollectionCallback = (collectionId, recipeData) => {
    // Hooks handle this automatically - this is just for legacy modal compatibility
    console.log('Legacy add to collection callback - using hooks instead');
  };

  const handleRemoveFromCollectionCallback = (collectionId, recipeData) => {
    // Hooks handle this automatically - this is just for legacy modal compatibility
    console.log('Legacy remove from collection callback - using hooks instead');
  };

  // Handle create collection callback
  const handleCreateCollectionCallback = () => {
    // Navigate to collections page where user can create a new collection
    window.location.href = '/collections';
  };

  // Helper function removed - using hook's isFavorite instead

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

  // Moved auth-loading UI here (after all hooks are defined) to avoid changing hooks order
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-slate-800 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>
        
        {/* Loading spinner overlay */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200/60">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Loading...</h3>
            <p className="text-stone-600">Checking your authentication status</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If no current session and not creating one, show empty state
  if (!currentSessionId) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-slate-800 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>

        {/* Logout Loading Overlay - Include even in empty state */}
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
          onShowLibrary={handleShowLibrary}
          onLogout={handleLogout}
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
                onClick={handleShowLibrary}
                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-105"
                title="My Library"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              {!user && (
                <button 
                  onClick={handleSignIn}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all duration-200 hover:scale-105"
                  title="Sign In"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}
              <button onClick={handleCreateNewChat} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full transition-all duration-200 hover:scale-105"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative text-center max-w-md w-full">
              {/* Session Migration Notice */}
              {showSessionMigrationNotice && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-slideUp shadow-lg shadow-blue-200/30 max-w-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-blue-800 font-semibold text-sm">Welcome back!</h4>
                    <p className="text-blue-700 text-xs">
                      You're now signed in. Your anonymous sessions have been cleared, but you can start fresh with your authenticated account.
                    </p>
                    <button 
                      onClick={() => setShowSessionMigrationNotice(false)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              )}

              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-200/60 shadow-lg shadow-orange-200/30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/50 to-transparent animate-pulse duration-2000 rounded-2xl"></div>
                <MessageSquare className="w-10 h-10 text-orange-600 relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2 tracking-wide">{user ? 'Welcome back!' : 'Start a New Cooking Conversation'}</h2>
              <p className="text-stone-600 mb-6 leading-relaxed">
                {user 
                  ? 'Create your first chat session and continue your culinary journey with CookMate!' 
                  : 'Create your first chat session and let CookMate help you with your culinary adventures!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleCreateNewChat} 
                  className="relative px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg shadow-orange-200/50 hover:scale-105 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Start New Chat
                </button>
                {!user && (
                  <button 
                    onClick={handleSignIn}
                    className="relative px-6 py-3 bg-white text-stone-700 border border-stone-300 rounded-2xl font-semibold hover:bg-stone-50 transition-all duration-300 hover:scale-105 overflow-hidden group shadow-lg hover:shadow-stone-200/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialogs - Include logout dialog even in empty state */}
        <DeleteDialog />
        <LogoutDialog />

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
        onShowLibrary={handleShowLibrary}
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
          <button onClick={handleCreateNewChat} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full transition-all duration-200 hover:scale-105"><Plus className="w-5 h-5" /></button>
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

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <p className="text-stone-600">Start your cooking conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                // Use server-provided detectedRecipes if available; otherwise run client detection
                const detected = (!message.isUser && Array.isArray(message.detectedRecipes) && message.detectedRecipes.length > 0)
                  ? message.detectedRecipes
                  : (!message.isUser ? detectRecipesFromText(message.text) : []);

                return (
                <div key={message.id} className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${message.isUser ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-orange-600'}`}>
                    {message.isUser ? user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A' : <Flame className="w-5 h-5 fill-orange-500" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${message.isUser ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}`}>
                      {message.isUser ? message.text : parseMarkdownText(message.text)}
                    </div>
                    
                    {/* Render Recipe Cards if detectedRecipes exist */}
                    {!message.isUser && detected && detected.length > 0 && (
                      <div className="mt-4 space-y-3 w-full">
                        <h4 className="text-sm font-semibold text-stone-700 mb-3">Click on a recipe for full details:</h4>
                        {detected.map((recipe, index) => (
                          <RecipeCard
                            key={`${message.id}_recipe_${index}_${typeof recipe === 'string' ? recipe : recipe.title}`}
                            recipe={recipe}
                            onClick={handleRecipeClick}
                            isLoading={recipeDetailsLoading}
                            isFavorited={isFavorite(recipe)}
                            collections={collections}
                            // New unified architecture props
                            favoritesHook={favoritesHook}
                            collectionsHook={collectionsHook}
                            toggleFavorite={toggleFavorite}
                            isFavorite={isFavorite}
                            // Legacy props for backward compatibility
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
                );
              })
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
        



      </div>
      {/* Confirmation Dialogs */}
      <DeleteDialog />
      <LogoutDialog />

    </div>
  );
}