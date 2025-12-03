import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, User, ArrowRight, LogOut, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSessions, useSessionChat, useNewChat } from '../../hooks/useSessions.js';

export default function CookMateChat() {
  const { user, logout } = useAuth();
  const { sessions, loading: sessionsLoading, createNewSession, deleteExistingSession } = useSessions();
  const { createNewChat, loading: creatingChat } = useNewChat();
  
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
  const [inputMessage, setInputMessage] = useState('');

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

  // CRITICAL: This useEffect MUST be called before any conditional returns
  // Initialize with existing session if available
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0 && !sessionsLoading) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId, sessionsLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentSessionId) return;

    const messageText = inputMessage;
    setInputMessage('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCreateNewChat = async () => {
    if (creatingChat) return;
    
    try {
      const newSession = await createNewChat();
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
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
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
    try {
      await logout();
      // Clear local state
      setCurrentSessionId(null);
      clearMessages();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="flex h-screen bg-stone-50 font-sans text-slate-800 items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-stone-200 max-w-md">
          <ChefHat className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Welcome to CookMate</h2>
          <p className="text-stone-600 mb-6">Please sign in to start chatting and save your cooking conversations.</p>
          <div className="space-y-3">
            <a href="/signin" className="block w-full py-3 px-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors">
              Sign In
            </a>
            <a href="/signup" className="block w-full py-3 px-4 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors">
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while setting up session
  if (sessionsLoading && sessions.length === 0 && !currentSessionId) {
    return (
      <div className="flex h-screen bg-stone-50 font-sans text-slate-800 items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-stone-600">Loading your cooking sessions...</p>
        </div>
      </div>
    );
  }

  // If no current session and not creating one, show empty state
  if (!currentSessionId && !creatingChat) {
    return (
      <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isMobile && <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
          <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-6 h-6" /><span className="font-bold text-xl">CookMate</span></div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-stone-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4"><button onClick={handleCreateNewChat} disabled={creatingChat} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md font-medium disabled:opacity-50"><Plus className="w-5 h-5" /><span>{creatingChat ? 'Creating...' : 'New Chat'}</span></button></div>
            <div className="flex-1" />
            <UserAccountFooter collapsed={false} user={user} onLogout={handleLogout} />
          </div>
        </div>}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-stone-200 flex flex-col transition-all duration-300 relative z-20`}>
            <div className="h-16 flex items-center justify-between px-5 border-b border-stone-100">
              {!sidebarCollapsed && <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-6 h-6" /><span className="font-bold text-xl">CookMate</span></div>}
              {sidebarCollapsed && <div className="w-full flex justify-center text-orange-600"><ChefHat className="w-6 h-6" /></div>}
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><Menu className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <button onClick={handleCreateNewChat} disabled={creatingChat} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 ${sidebarCollapsed ? 'bg-orange-50 text-orange-600' : 'bg-orange-600 text-white'}`}>
                <Plus className="w-5 h-5" />{!sidebarCollapsed && <span className="font-medium">{creatingChat ? 'Creating...' : 'New Chat'}</span>}
              </button>
            </div>
            <div className="flex-1" />
            <UserAccountFooter collapsed={sidebarCollapsed} user={user} onLogout={handleLogout} />
          </div>
        )}

        {/* Main Content Area - Empty State */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 relative">
          <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600"><Menu className="w-6 h-6" /></button>
              <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-5 h-5" /><span className="font-bold text-lg">CookMate</span></div>
            </div>
            <button onClick={handleCreateNewChat} disabled={creatingChat} className="p-2 text-orange-600 bg-orange-50 rounded-full disabled:opacity-50"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-stone-800 mb-2">Start a New Cooking Conversation</h2>
              <p className="text-stone-600 mb-6">Create your first chat session and let CookMate help you with your culinary adventures!</p>
              <button onClick={handleCreateNewChat} disabled={creatingChat} className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50">
                {creatingChat ? 'Creating Chat...' : 'Start New Chat'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the full chat interface
  return (
    <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 flex items-center justify-between border-b border-stone-100">
            <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-6 h-6" /><span className="font-bold text-xl">CookMate</span></div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-stone-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4"><button onClick={handleCreateNewChat} disabled={creatingChat} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md font-medium disabled:opacity-50"><Plus className="w-5 h-5" /><span>{creatingChat ? 'Creating...' : 'New Chat'}</span></button></div>
          <div className="flex-1 overflow-y-auto">
            <SessionList 
              sessions={sessions} 
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              collapsed={false}
            />
          </div>
          <UserAccountFooter collapsed={false} user={user} onLogout={handleLogout} />
        </div>
      </div>}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-stone-200 flex flex-col transition-all duration-300 relative z-20`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-stone-100">
            {!sidebarCollapsed && <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-6 h-6" /><span className="font-bold text-xl">CookMate</span></div>}
            {sidebarCollapsed && <div className="w-full flex justify-center text-orange-600"><ChefHat className="w-6 h-6" /></div>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><Menu className="w-5 h-5" /></button>
          </div>
          <div className="p-4">
            <button onClick={handleCreateNewChat} disabled={creatingChat} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 ${sidebarCollapsed ? 'bg-orange-50 text-orange-600' : 'bg-orange-600 text-white'}`}>
              <Plus className="w-5 h-5" />{!sidebarCollapsed && <span className="font-medium">{creatingChat ? 'Creating...' : 'New Chat'}</span>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SessionList 
              sessions={sessions} 
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              collapsed={sidebarCollapsed}
            />
          </div>
          <UserAccountFooter collapsed={sidebarCollapsed} user={user} onLogout={handleLogout} />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 relative">
        <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-stone-600"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-2 text-orange-600"><ChefHat className="w-5 h-5" /><span className="font-bold text-lg">CookMate</span></div>
          </div>
          <button onClick={handleCreateNewChat} disabled={creatingChat} className="p-2 text-orange-600 bg-orange-50 rounded-full disabled:opacity-50"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
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
                    {message.isUser ? user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase() : <Flame className="w-5 h-5 fill-orange-500" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${message.isUser ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-tl-sm'}`}>
                      {message.text}
                    </div>
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

        <div className="p-4 lg:p-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center bg-white rounded-full shadow-lg border border-stone-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <input 
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
    </div>
  );
}

// Session List Component
const SessionList = ({ sessions, currentSessionId, onSelectSession, onDeleteSession, collapsed }) => {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-stone-500 text-sm">
        {collapsed ? 'No chats' : 'No chat sessions yet'}
      </div>
    );
  }

  return (
    <div className="p-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSelectSession(session)}
          className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
            session.id === currentSessionId 
              ? 'bg-orange-50 border border-orange-200' 
              : 'hover:bg-stone-50'
          }`}
        >
          <div className="flex-shrink-0">
            <MessageSquare className={`w-5 h-5 ${session.id === currentSessionId ? 'text-orange-600' : 'text-stone-400'}`} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                session.id === currentSessionId ? 'text-orange-700' : 'text-stone-700'
              }`}>
                {session.title}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {formatLastMessage(session.lastMessage)}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={(e) => onDeleteSession(session.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// User Account Footer Component
const UserAccountFooter = ({ collapsed, user, onLogout }) => (
  <div className="p-4 border-t border-stone-100 mt-auto bg-stone-50/50">
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm flex-shrink-0 bg-gradient-to-tr from-orange-400 to-red-500 text-white`}>
        {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
      </div>
      {!collapsed && (
        <>
          <div className="text-left flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-stone-700 truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  </div>
);

function formatLastMessage(lastMessage) {
  if (!lastMessage) return 'New chat session';
  return lastMessage.length > 40 ? lastMessage.substring(0, 40) + '...' : lastMessage;
}