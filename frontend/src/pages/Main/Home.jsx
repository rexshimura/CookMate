import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, ChefHat, X, MessageSquare, Flame, User, ArrowRight, LogOut } from 'lucide-react';
import { chatWithAI } from '../../utils/api';

export default function CookMateChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Auth States (Placeholder)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState({ name: 'Guest', email: '' });

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm CookMate. What ingredients do you have in your kitchen right now?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]); // Placeholder for sessions

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
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 1. Add User Message to UI
    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      // 2. Format History correctly for the backend
      // We take the last 10 messages to keep the context window manageable
      const history = updatedMessages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // 3. Send to Unified Chat Endpoint
      const response = await chatWithAI(newMessage.text, null, history);

      // 4. Add AI Response to UI
      const aiResponse = {
        id: Date.now() + 1,
        text: response.response.message,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having a little trouble connecting to my cookbook. Please try again!",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    setMessages([{
      id: Date.now(),
      text: "Fresh start! What are we cooking today?",
      isUser: false,
      timestamp: new Date()
    }]);
    if (isMobile) setSidebarOpen(false);
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- UI COMPONENTS ---
  const UserAccountFooter = ({ collapsed }) => (
    <div className="p-4 border-t border-stone-100 mt-auto bg-stone-50/50">
      <button onClick={() => !isLoggedIn && setShowAuthModal(true)} className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm flex-shrink-0 ${isLoggedIn ? 'bg-gradient-to-tr from-orange-400 to-red-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
          {isLoggedIn ? 'JS' : <User className="w-4 h-4" />}
        </div>
        {!collapsed && <div className="text-left flex-1 overflow-hidden"><p className="text-sm font-semibold text-stone-700 truncate">{isLoggedIn ? user.name : 'Sign In'}</p></div>}
      </button>
    </div>
  );

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
          <div className="p-4"><button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md font-medium"><Plus className="w-5 h-5" /><span>New Chat</span></button></div>
          <div className="flex-1" />
          <UserAccountFooter collapsed={false} />
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
            <button onClick={createNewSession} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all shadow-sm ${sidebarCollapsed ? 'bg-orange-50 text-orange-600' : 'bg-orange-600 text-white'}`}>
              <Plus className="w-5 h-5" />{!sidebarCollapsed && <span className="font-medium">New Chat</span>}
            </button>
          </div>
          <div className="flex-1" />
          <UserAccountFooter collapsed={sidebarCollapsed} />
        </div>
      )}

      {/* Main Chat Area */}
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
                  <span className="text-[11px] text-stone-400 mt-1.5 px-1 font-medium">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex gap-4 animate-slideUp">
                 <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-500" /></div>
                 <div className="px-5 py-4 bg-white border border-stone-200 rounded-2xl rounded-tl-sm text-stone-500 text-sm italic">Thinking...</div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="relative flex items-center bg-white rounded-full shadow-lg border border-stone-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type a message..." className="flex-1 py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-stone-400 text-stone-700" />
              <div className="absolute right-2 p-1">
                <button type="submit" disabled={!inputMessage.trim() || isTyping} className={`p-2.5 rounded-full transition-all flex items-center justify-center ${inputMessage.trim() ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-stone-100 text-stone-300'}`}><Send className="w-4 h-4 ml-0.5" /></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}