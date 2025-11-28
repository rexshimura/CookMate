import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, MoreVertical, User, Mail, Lock, ArrowRight, LogOut } from 'lucide-react';

export default function CookMateChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [user, setUser] = useState({ name: 'Guest', email: '' });

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm CookMate, your personal AI kitchen assistant. What ingredients do you have available? I'll help you create something delicious!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessions, setSessions] = useState([
    { id: 1, title: "Chicken and Veggies Dinner", lastMessage: "Great! Let's make a stir fry...", timestamp: new Date(Date.now() - 3600000) },
    { id: 2, title: "Pasta Ideas", lastMessage: "Here are 3 pasta recipes...", timestamp: new Date(Date.now() - 86400000) }
  ]);

  const messagesEndRef = useRef(null);

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
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "That sounds like a great start! With those ingredients, we can make a spicy orange glazed chicken. Would you like the full recipe?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const createNewSession = () => {
    const newSession = {
      id: sessions.length + 1,
      title: "New Cooking Session",
      lastMessage: "Start by telling me what ingredients you have...",
      timestamp: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setMessages([{
      id: 1,
      text: "Hello! I'm CookMate. Ready to cook? What's in your fridge?",
      isUser: false,
      timestamp: new Date()
    }]);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setUser({ name: 'Jane Smith', email: 'jane@cookmate.com' });
    setShowAuthModal(false);
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    setIsLoggedIn(false);
    setUser({ name: 'Guest', email: '' });
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Reusable User Footer Component
  const UserAccountFooter = ({ collapsed }) => (
    <div className="p-4 border-t border-stone-100 mt-auto bg-stone-50/50">
      <button
        onClick={() => !isLoggedIn && setShowAuthModal(true)}
        className={`
          flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
          w-full p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-stone-100
        `}
      >
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm flex-shrink-0
          ${isLoggedIn ? 'bg-gradient-to-tr from-orange-400 to-red-500 text-white' : 'bg-stone-200 text-stone-500'}
        `}>
          {isLoggedIn ? 'JS' : <User className="w-4 h-4" />}
        </div>

        {!collapsed && (
          <div className="text-left flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-stone-700 truncate">
              {isLoggedIn ? user.name : 'Sign In / Sign Up'}
            </p>
            <p className="text-xs text-stone-400 truncate">
              {isLoggedIn ? 'Pro Plan' : 'Sync your recipes'}
            </p>
          </div>
        )}

        {!collapsed && isLoggedIn && (
          <div onClick={handleLogout} className="p-1 hover:bg-stone-200 rounded-full transition-colors" title="Log out">
            <LogOut className="w-4 h-4 text-stone-400 hover:text-red-500" />
          </div>
        )}

        {!collapsed && !isLoggedIn && (
          <ArrowRight className="w-4 h-4 text-stone-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">

      {/* --- Auth Modal --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-scaleIn">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-stone-800">
                  {authMode === 'signin' ? 'Welcome Back' : 'Join CookMate'}
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  {authMode === 'signin' ? 'Enter your details to sign in.' : 'Start your cooking journey today.'}
                </p>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                      <input type="text" placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <input type="email" placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md shadow-orange-200 transition-all active:scale-[0.98] mt-4">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-stone-500">
                {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-orange-600 font-semibold hover:underline">
                  {authMode === 'signin' ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Mobile Sidebar (Improved Smooth Animation) --- */}
      {isMobile && (
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Backdrop - Fades in/out */}
          <div
            className={`
              absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out
              ${sidebarOpen ? 'opacity-100' : 'opacity-0'}
            `}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer - Slides in/out */}
          <div
            className={`
              absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
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
              <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all font-medium">
                <Plus className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <p className="px-4 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-2">Recent</p>
              {sessions.map((session) => (
                <div key={session.id} className="group p-3 rounded-xl hover:bg-orange-50 cursor-pointer transition-colors mb-1">
                  <h4 className="font-medium text-stone-800 group-hover:text-orange-700 truncate text-sm">{session.title}</h4>
                  <p className="text-xs text-stone-500 truncate mt-0.5">{session.lastMessage}</p>
                </div>
              ))}
            </div>

            <UserAccountFooter collapsed={false} />
          </div>
        </div>
      )}

      {/* --- Desktop Sidebar --- */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-stone-200 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] relative z-20`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-stone-100">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 text-orange-600 animate-fadeIn">
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-xl tracking-tight">CookMate</span>
              </div>
            )}
            {sidebarCollapsed && <div className="w-full flex justify-center text-orange-600"><ChefHat className="w-6 h-6" /></div>}

            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={createNewSession}
              className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm
                ${sidebarCollapsed 
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                  : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'}
              `}
            >
              <Plus className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">New Chat</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
            {!sidebarCollapsed && <p className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Your Kitchen</p>}

            {sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  hover:bg-stone-50 hover:shadow-sm border border-transparent hover:border-stone-100
                `}
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                {!sidebarCollapsed && (
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-medium text-stone-700 group-hover:text-orange-700 truncate">{session.title}</h4>
                    <p className="text-xs text-stone-400 truncate">{formatTime(session.timestamp)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <UserAccountFooter collapsed={sidebarCollapsed} />
        </div>
      )}

      {/* --- Main Chat Area --- */}
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
          <button onClick={createNewSession} className="p-2 text-orange-600 bg-orange-50 rounded-full">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm
                  ${message.isUser 
                    ? 'bg-stone-800 text-white' 
                    : 'bg-white border border-stone-200 text-orange-600'}
                `}>
                  {message.isUser ? 'Y' : <Flame className="w-5 h-5 fill-orange-500" />}
                </div>
                <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    px-5 py-4 text-[15px] leading-relaxed shadow-sm
                    ${message.isUser 
                      ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}
                  `}>
                    {message.text}
                  </div>
                  <span className="text-[11px] text-stone-400 mt-1.5 px-1 font-medium">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
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
                // Added outline-none and focus:outline-none here
                className="flex-1 py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-stone-400 text-stone-700 outline-none"
              />
              <div className="absolute right-2 p-1">
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className={`
                    p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                    ${inputMessage.trim() 
                      ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-md' 
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'}
                  `}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
            <p className="text-xs text-stone-400 text-center mt-3">
              CookMate helps you cook, but check temperatures yourself.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}