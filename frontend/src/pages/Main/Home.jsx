import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, User, Mail, Lock, ArrowRight, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function CookMateChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Auth States - using AuthProvider hooks
  const { user, userProfile, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  
  const isLoggedIn = !!user;
  const userDisplayName = userProfile?.displayName || user?.displayName || 'Guest';
  const userEmail = userProfile?.email || user?.email || '';

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm CookMate, your personal AI kitchen assistant. What ingredients do you have available?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Dummy sessions for sidebar (you can replace this with real data later)
  const [sessions, setSessions] = useState([
    { id: 1, title: "Chicken and Veggies", lastMessage: "Great choice! Here is a recipe...", timestamp: new Date() },
  ]);

  const messagesEndRef = useRef(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  // Function to save recipe to favorites
  const saveRecipeToFavorites = async (recipeData) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    try {
      // First save the recipe to the recipes collection
      const recipeResponse = await axios.post('/api/recipes', {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        cookingTime: recipeData.cookingTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        userId: user.uid
      });

      const recipeId = recipeResponse.data.id;

      // Then add to user's favorites
      await axios.post(`/api/users/favorites/${recipeId}`, {}, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      // Update local state
      setSavedRecipes(prev => [...prev, { id: recipeId, ...recipeData }]);

      return recipeId;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return null;
    }
  };

  // Session management functions
  const saveCurrentSession = async () => {
    if (!isLoggedIn || messages.length <= 1) return;

    try {
      const sessionTitle = messages[1]?.text?.slice(0, 30) + '...' || 'Chat Session';
      
      const sessionData = {
        title: sessionTitle,
        messages: messages.map(msg => ({
          text: msg.text,
          isUser: msg.isUser,
          timestamp: msg.timestamp
        }))
      };

      if (currentSessionId) {
        // Update existing session
        await axios.put(`/api/sessions/${currentSessionId}`, sessionData, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
      } else {
        // Create new session
        const response = await axios.post('/api/sessions', sessionData, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        setCurrentSessionId(response.data.sessionId);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const loadUserSessions = async () => {
    if (!isLoggedIn) return;

    try {
      const response = await axios.get('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      setUserSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      const session = response.data.session;
      setMessages(session.messages.map((msg, index) => ({
        id: index + 1,
        text: msg.text,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp)
      })));
      setCurrentSessionId(sessionId);
      
      if (isMobile) setSidebarOpen(false);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  // Function to remove recipe from favorites
  const removeRecipeFromFavorites = async (recipeId) => {
    try {
      await axios.delete(`/api/users/favorites/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  // Recipe Save Button Component
  const RecipeSaveButton = ({ recipeData, messageId }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
      if (isSaving) return;
      
      setIsSaving(true);
      const recipeId = await saveRecipeToFavorites(recipeData);
      setIsSaving(false);
      
      if (recipeId) {
        setIsSaved(true);
      }
    };

    const handleRemove = async () => {
      const recipe = savedRecipes.find(r => r.title === recipeData.title);
      if (recipe) {
        await removeRecipeFromFavorites(recipe.id);
        setIsSaved(false);
      }
    };

    if (isSaved) {
      return (
        <button
          onClick={handleRemove}
          className="mt-3 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
        >
          ✅ Saved to Cookbook
        </button>
      );
    }

    return (
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
          isSaving 
            ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        }`}
      >
        {isSaving ? '⏳ Saving...' : '💾 Save to Cookbook'}
      </button>
    );
  };

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

  // Load user sessions when authenticated
  useEffect(() => {
    if (isLoggedIn) {
      loadUserSessions();
    } else {
      setUserSessions([]);
      setCurrentSessionId(null);
    }
  }, [isLoggedIn]);

  // Auto-save session when messages change (for authenticated users)
  useEffect(() => {
    if (isLoggedIn && messages.length > 1) {
      const timeoutId = setTimeout(() => {
        saveCurrentSession();
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoggedIn]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 1. Add User Message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // 2. Simple intent detection - just check for explicit recipe requests
      const lowerInput = currentInput.toLowerCase();
      
      // Clear recipe request indicators
      const recipeKeywords = [
        'recipe', 'cook', 'make', 'prepare', 'how to make', 'how to cook',
        'recommend', 'suggest', 'give me', 'show me', 'find me'
      ];
      
      // Food/cooking terms that suggest recipe intent
      const cookingIndicators = [
        'ingredient', 'ingredients', 'meal', 'dish', 'food', 'cooking',
        'bake', 'fry', 'roast', 'boil', 'grill', 'stir fry', 'cooking with'
      ];
      
      const hasRecipeKeywords = recipeKeywords.some(keyword => lowerInput.includes(keyword));
      const hasCookingIndicators = cookingIndicators.some(indicator => lowerInput.includes(indicator));
      const isRecipeRequest = hasRecipeKeywords || hasCookingIndicators;

      let response;
      
      if (isRecipeRequest) {
        // Call recipe generation API with user message for smart ingredient extraction
        response = await axios.post('/api/ai/generate-recipe', {
          userMessage: currentInput, // Pass the full message for ingredient extraction
          dietaryPreferences: "None"
        });
        
        const data = response.data;
        
        // Format recipe response with save functionality
        let aiText = "I couldn't generate a recipe. Please try again.";
        if (data.recipe) {
          const r = data.recipe;
          let recipeText = `${r.title}\n\n` +
                   `⏱️ Time: ${r.cookingTime} | 🍽️ Servings: ${r.servings}\n\n` +
                   `Ingredients:\n• ${r.ingredients.join('\n• ')}\n\n` +
                   `Instructions:\n${r.instructions.map((step, i) => `${i+1}. ${step}`).join('\n')}`;
          
          // Add chef tips if available
          if (r.chefTips && r.chefTips.length > 0) {
            recipeText += `\n\n💡 Chef Tips:\n• ${r.chefTips.join('\n• ')}`;
          }
          
          // Add save button and note if available
          if (data.note) {
            recipeText += `\n\n📝 ${data.note}`;
          }
          
          recipeText += `\n\n💾 Want to save this recipe? ${isLoggedIn ? 'Click the save button below!' : 'Sign in to save recipes to your digital cookbook!'}`;
          
          aiText = recipeText;
        }
        
        const aiResponse = {
          id: messages.length + 2,
          text: aiText,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        
      } else {
        // Call chat API for general conversation with history
        const conversationHistory = messages.slice(-6).map(msg => ({
          user: msg.isUser ? msg.text : null,
          assistant: !msg.isUser ? msg.text : null
        })).filter(msg => msg.user || msg.assistant);
        
        response = await axios.post('/api/ai/chat', {
          message: currentInput,
          conversationHistory: conversationHistory
        });
        
        const data = response.data;
        const aiText = data.response?.message || "I'm not sure how to help with that. Try asking me about recipes or ingredients!";
        
        const aiResponse = {
          id: messages.length + 2,
          text: aiText,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }

    } catch (error) {
      console.error("Error communicating with AI:", error);
      const errorResponse = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    setMessages([{
      id: 1,
      text: "Hello! I'm CookMate. Ready to cook? What's in your fridge?",
      isUser: false,
      timestamp: new Date()
    }]);
    setCurrentSessionId(null);
    if (isMobile) setSidebarOpen(false);
  };

  // Format session timestamp for display
  const formatSessionTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Basic format time helper
  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Reusable User Footer Component
  const UserAccountFooter = ({ collapsed }) => (
    <div className="p-4 border-t border-stone-100 mt-auto bg-stone-50/50">
      <button
        onClick={() => {
          if (isLoggedIn) {
            signOut();
          } else {
            setShowAuthModal(true);
          }
        }}
        className={`
          flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
          w-full p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-stone-100
        `}
      >
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm flex-shrink-0
          ${isLoggedIn ? 'bg-gradient-to-tr from-orange-400 to-red-500 text-white' : 'bg-stone-200 text-stone-500'}
        `}>
          {isLoggedIn ? (
            userDisplayName ? userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        {!collapsed && (
          <div className="text-left flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-stone-700 truncate">
              {isLoggedIn ? userDisplayName : 'Sign In / Sign Up'}
            </p>
            <p className="text-xs text-stone-400 truncate">
              {isLoggedIn ? (userProfile?.plan || 'Free Plan') : 'Sync your recipes'}
            </p>
          </div>
        )}
        
        {isLoggedIn && !collapsed && (
          <LogOut className="w-4 h-4 text-stone-400" />
        )}
      </button>
    </div>
  );

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading CookMate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">

      {/* --- Auth Modal (Redirect to auth pages) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="bg-white rounded-2xl p-6 relative z-10 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
            <p className="text-stone-500 mb-4">Please sign in or create an account to save your recipes and chat history.</p>
            <div className="flex gap-3">
              <a href="/signin" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-center">Sign In</a>
              <a href="/signup" className="flex-1 bg-stone-100 text-stone-700 px-4 py-2 rounded-xl font-medium text-center">Sign Up</a>
            </div>
          </div>
        </div>
      )}

      {/* --- Mobile Sidebar --- */}
      {isMobile && (
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
          <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-2 text-orange-600">
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-xl tracking-tight">CookMate</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md font-medium"><Plus className="w-5 h-5" /><span>New Chat</span></button>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
              <p className="px-4 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-2">Recent Chats</p>
              {userSessions.length > 0 ? (
                userSessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => loadSession(session.id)}
                    className={`p-3 rounded-xl cursor-pointer mb-1 transition-colors ${
                      currentSessionId === session.id 
                        ? 'bg-orange-100 border border-orange-200' 
                        : 'hover:bg-orange-50'
                    }`}
                  >
                    <h4 className="font-medium text-stone-800 text-sm truncate">{session.title}</h4>
                    <p className="text-xs text-stone-400 mt-1">
                      {formatSessionTime(session.updatedAt)} • {session.messageCount} messages
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-4 text-stone-400 text-sm">No saved chats yet</p>
              )}
            </div>
            <UserAccountFooter collapsed={false} />
          </div>
        </div>
      )}

      {/* --- Desktop Sidebar --- */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-stone-200 flex flex-col transition-all duration-300 relative z-20`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-stone-100">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 text-orange-600 animate-fadeIn">
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-xl tracking-tight">CookMate</span>
              </div>
            )}
            {sidebarCollapsed && <div className="w-full flex justify-center text-orange-600"><ChefHat className="w-6 h-6" /></div>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><Menu className="w-5 h-5" /></button>
          </div>
          <div className="p-4">
            <button onClick={createNewSession} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm ${sidebarCollapsed ? 'bg-orange-50 text-orange-600' : 'bg-orange-600 text-white'}`}>
              <Plus className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">New Chat</span>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <p className="px-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-2">Recent Chats</p>
            {userSessions.length > 0 ? (
              userSessions.map((session) => (
                <div 
                  key={session.id} 
                  onClick={() => loadSession(session.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id 
                      ? 'bg-orange-100 border border-orange-200' 
                      : 'hover:bg-orange-50'
                  }`}
                >
                  <h4 className="font-medium text-stone-800 text-sm truncate">{session.title}</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    {formatSessionTime(session.updatedAt)} • {session.messageCount}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-2 text-stone-400 text-sm">No saved chats</p>
            )}
          </div>
          <UserAccountFooter collapsed={sidebarCollapsed} />
        </div>
      )}

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 relative">
        <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-5 h-5" /><span className="font-bold text-lg">CookMate</span></div>
          </div>
          <button onClick={createNewSession} className="p-2 text-orange-600 bg-orange-50 rounded-full"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${message.isUser ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-orange-600'}`}>
                  {message.isUser ? 'Y' : <Flame className="w-5 h-5 fill-orange-500" />}
                </div>
                <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${message.isUser ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}`}>
                    {message.text}
                  </div>
                  
                  {/* Add save button for recipe responses */}
                  {!message.isUser && message.text.includes('Time:') && message.text.includes('Ingredients:') && (
                    <RecipeSaveButton 
                      recipeData={{
                        title: message.text.split('\n')[0],
                        ingredients: message.text.match(/Ingredients:\n• (.+?)\n\n/s)?.[1]?.split('\n• ') || [],
                        instructions: message.text.match(/Instructions:\n(.+?)(?:\n\n|$)/s)?.[1]?.split('\n').filter(line => line.match(/^\d+\./)) || [],
                        cookingTime: message.text.match(/⏱️ Time: (.+?) \|/)?.[1] || '',
                        servings: message.text.match(/🍽️ Servings: (.+?)\n\n/)?.[1] || '',
                        difficulty: 'Medium'
                      }}
                      messageId={message.id}
                    />
                  )}
                  
                  <span className="text-[11px] text-stone-400 mt-1.5 px-1 font-medium">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex gap-4 animate-slideUp">
                 <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-500" /></div>
                 <div className="px-5 py-4 bg-white border border-stone-200 rounded-2xl rounded-tl-sm text-stone-500 text-sm italic">Cooking up a recipe...</div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center bg-white rounded-full shadow-lg border border-stone-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about a recipe or ingredient..."
                className="flex-1 py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-stone-400 text-stone-700 outline-none"
              />
              <div className="absolute right-2 p-1">
                <button type="submit" disabled={!inputMessage.trim() || isTyping} className={`p-2.5 rounded-full transition-all flex items-center justify-center ${inputMessage.trim() ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-md' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}>
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
            <p className="text-xs text-stone-400 text-center mt-3">CookMate helps you cook, but check temperatures yourself.</p>
          </div>
        </div>
      </div>
    </div>
  );
}