import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, MoreVertical, User, Mail, Lock, ArrowRight, LogOut, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSessions, useSessionChat, useNewChat } from '../../hooks/useSessions';
import { generateRecipe, suggestIngredients } from '../../utils/api';

export default function CookMateChat() {
  // Authentication state
  const { user, userProfile, loading: authLoading, error: authError, signIn, signUp, logout } = useAuth();
  
  // Session management
  const { sessions, loading: sessionsLoading, error: sessionsError, createNewSession, updateExistingSession } = useSessions();
  const { createNewChat, loading: newChatLoading, error: newChatError } = useNewChat();
  
  // Current session state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const { messages, loading: messagesLoading, sending, error: chatError, sendMessage } = useSessionChat(currentSessionId);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  
  // Chat input state
  const [inputMessage, setInputMessage] = useState('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Responsive handling
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Show auth modal if not logged in and user tries to interact
  useEffect(() => {
    if (!user && !authLoading) {
      // Optionally auto-show modal, or let user trigger it
    }
  }, [user, authLoading]);

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) return;

    try {
      setAuthSubmitting(true);
      let result;
      
      if (authMode === 'signin') {
        result = await signIn(authForm.email, authForm.password);
      } else {
        result = await signUp(authForm.email, authForm.password, authForm.displayName);
      }

      if (result.success) {
        setShowAuthModal(false);
        setAuthForm({ email: '', password: '', displayName: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle creating new session
  const handleCreateNewSession = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const newSession = await createNewChat();
      if (newSession) {
        setCurrentSessionId(newSession.id);
        if (isMobile) setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) {
      if (!user) setShowAuthModal(true);
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle recipe generation
  const handleGenerateRecipe = async () => {
    if (!user || !inputMessage.trim()) return;

    try {
      setIsGeneratingRecipe(true);
      
      // Extract ingredients from input (simple heuristic)
      const ingredients = inputMessage
        .toLowerCase()
        .split(/[,.\s]+/)
        .filter(word => word.length > 2)
        .slice(0, 5); // Take first 5 words as ingredients

      const response = await generateRecipe(ingredients);
      
      if (response && response.recipe) {
        const recipe = response.recipe;
        const recipeMessage = `Here's a recipe for **${recipe.title}**!

**Ingredients:**
${recipe.ingredients?.map(ing => `• ${ing}`).join('\n') || 'Not specified'}

**Instructions:**
${recipe.instructions?.map((step, index) => `${index + 1}. ${step}`).join('\n') || 'Not specified'}

**Cooking Time:** ${recipe.cookingTime || 'Not specified'}
**Servings:** ${recipe.servings || 'Not specified'}
**Difficulty:** ${recipe.difficulty || 'Not specified'}`;

        // Send recipe as message
        setInputMessage(`Generate a recipe for: ${ingredients.join(', ')}`);
        setTimeout(() => {
          handleSendMessage({
            preventDefault: () => {},
          });
          // Wait for AI response, then append recipe
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `recipe_${Date.now()}`,
              text: recipeMessage,
              isUser: false,
              timestamp: new Date(),
              isRecipe: true
            }]);
          }, 1000);
        }, 100);
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  // Session selection
  const selectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    if (isMobile) setSidebarOpen(false);
  };

  // User account footer component
  const UserAccountFooter = ({ collapsed }) => (
    <div className="p-4 border-t border-stone-100 mt-auto bg-stone-50/50">
      {user ? (
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`
            w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm flex-shrink-0
            ${userProfile?.photoURL ? '' : 'bg-gradient-to-tr from-orange-400 to-red-500 text-white'}
          `}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              userProfile?.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>

          {!collapsed && (
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-stone-700 truncate">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {userProfile?.plan || 'Free Plan'}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 hover:bg-stone-200 rounded-full transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4 text-stone-400 hover:text-red-500" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAuthModal(true)}
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
            w-full p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-stone-100
          `}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-200 text-stone-500">
            <User className="w-4 h-4" />
          </div>

          {!collapsed && (
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-stone-700">
                Sign In / Sign Up
              </p>
              <p className="text-xs text-stone-400">
                Sync your recipes
              </p>
            </div>
          )}

          {!collapsed && <ArrowRight className="w-4 h-4 text-stone-400" />}
        </button>
      )}
    </div>
  );

  // Loading states
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-stone-600">Loading CookMate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-stone-800">
                  {authMode === 'signin' ? 'Welcome Back' : 'Join CookMate'}
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  {authMode === 'signin' ? 'Enter your details to sign in.' : 'Start your cooking journey today.'}
                </p>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={authForm.displayName}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={authSubmitting || !authForm.email || !authForm.password}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white rounded-xl font-semibold shadow-md shadow-orange-200 transition-all flex items-center justify-center gap-2"
                >
                  {authSubmitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    authMode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-stone-500">
                {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  {authMode === 'signin' ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setSidebarOpen(false)}
          />
          <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-2 text-orange-600">
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-xl tracking-tight">CookMate</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <button
                onClick={handleCreateNewSession}
                disabled={newChatLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 disabled:bg-orange-300 text-white rounded-xl shadow-md shadow-orange-200 hover:bg-orange-700 transition-all font-medium"
              >
                {newChatLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>New Chat</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <p className="px-4 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-2">Recent</p>
              {sessionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="w-5 h-5 animate-spin text-orange-600" />
                </div>
              ) : sessionsError ? (
                <div className="px-4 text-center text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {sessionsError}
                </div>
              ) : sessions.length === 0 ? (
                <p className="px-4 text-stone-400 text-sm">No sessions yet</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`group p-3 rounded-xl cursor-pointer transition-colors mb-1 ${
                      currentSessionId === session.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-orange-50'
                    }`}
                  >
                    <h4 className="font-medium text-stone-800 group-hover:text-orange-700 truncate text-sm">
                      {session.title}
                    </h4>
                    <p className="text-xs text-stone-500 truncate mt-0.5">{session.lastMessage}</p>
                    <p className="text-xs text-stone-400 mt-1">{formatTime(session.updatedAt)}</p>
                  </div>
                ))
              )}
            </div>

            <UserAccountFooter collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-stone-200 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] relative z-20`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-stone-100">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 text-orange-600">
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-xl tracking-tight">CookMate</span>
              </div>
            )}
            {sidebarCollapsed && <div className="w-full flex justify-center text-orange-600"><ChefHat className="w-6 h-6" /></div>}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={handleCreateNewSession}
              disabled={newChatLoading}
              className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm
                ${newChatLoading 
                  ? 'bg-orange-300 cursor-not-allowed' 
                  : sidebarCollapsed 
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                }
              `}
            >
              {newChatLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {!sidebarCollapsed && <span className="font-medium">New Chat</span>}
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {!sidebarCollapsed && <p className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Your Kitchen</p>}
            
            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader className="w-5 h-5 animate-spin text-orange-600" />
              </div>
            ) : sessionsError ? (
              <div className="px-3 text-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {sessionsError}
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-3 text-stone-400 text-sm text-center">No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`
                    group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                    ${currentSessionId === session.id 
                      ? 'bg-orange-50 border border-orange-200' 
                      : 'hover:bg-stone-50 hover:shadow-sm border border-transparent hover:border-stone-100'
                    }
                  `}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-medium text-stone-700 group-hover:text-orange-700 truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-stone-400 truncate">{formatTime(session.updatedAt)}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <UserAccountFooter collapsed={sidebarCollapsed} />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 relative">
        <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-orange-600">
              <ChefHat className="w-5 h-5" />
              <span className="font-bold text-lg">CookMate</span>
            </div>
          </div>
          <button
            onClick={handleCreateNewSession}
            disabled={newChatLoading}
            className="p-2 text-orange-600 bg-orange-50 rounded-full disabled:opacity-50"
          >
            {newChatLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth" ref={messagesContainerRef}>
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {!user ? (
              // Not authenticated state
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-stone-700 mb-2">Welcome to CookMate!</h3>
                <p className="text-stone-500 mb-6">Your personal AI kitchen assistant. Sign in to start cooking with AI!</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md shadow-orange-200 transition-all"
                >
                  Get Started
                </button>
              </div>
            ) : !currentSessionId ? (
              // No session selected
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-stone-700 mb-2">Start Cooking with AI!</h3>
                <p className="text-stone-500 mb-6">Create a new chat session to begin your cooking journey.</p>
                <button
                  onClick={handleCreateNewSession}
                  disabled={newChatLoading}
                  className="px-6 py-3 bg-orange-600 disabled:bg-orange-300 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md shadow-orange-200 transition-all flex items-center gap-2 mx-auto"
                >
                  {newChatLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Start New Chat
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Chat messages
              <>
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                      <p className="text-stone-500">Loading messages...</p>
                    </div>
                  </div>
                ) : chatError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500 mb-4">{chatError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm
                        ${message.isUser 
                          ? 'bg-stone-800 text-white' 
                          : 'bg-white border border-stone-200 text-orange-600'}
                      `}>
                        {message.isUser ? (
                          userProfile?.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                        ) : (
                          <Flame className="w-5 h-5 fill-orange-500" />
                        )}
                      </div>
                      <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`
                          px-5 py-4 text-[15px] leading-relaxed shadow-sm
                          ${message.isUser 
                            ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}
                        `}>
                          {message.isRecipe ? (
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') 
                              }}
                            />
                          ) : (
                            message.text
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400 mt-1.5 px-1 font-medium">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {user && currentSessionId && (
          <div className="p-4 lg:p-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
            <div className="max-w-3xl mx-auto relative">
              <form
                onSubmit={handleSendMessage}
                className="relative flex items-center bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about a recipe or ingredient..."
                  disabled={sending || isGeneratingRecipe}
                  className="flex-1 py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-stone-400 text-stone-700 disabled:opacity-50"
                />
                <div className="absolute right-2 p-1 flex gap-1">
                  {inputMessage.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateRecipe}
                      disabled={isGeneratingRecipe}
                      className="p-2 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Generate Recipe"
                    >
                      {isGeneratingRecipe ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        'Recipe'
                      )}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sending || isGeneratingRecipe}
                    className={`
                      p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                      ${inputMessage.trim() && !sending && !isGeneratingRecipe
                        ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-md' 
                        : 'bg-stone-100 text-stone-300 cursor-not-allowed'}
                    `}
                  >
                    {sending ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>
              </form>
              <p className="text-xs text-stone-400 text-center mt-3">
                CookMate helps you cook, but check temperatures yourself.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}