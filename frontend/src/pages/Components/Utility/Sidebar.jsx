import React from 'react';
import { 
  Menu, 
  Plus, 
  ChefHat, 
  X, 
  MessageSquare, 
  Heart, 
  Folder, 
  LogOut, 
  Trash2,
  Sparkles,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Sidebar = ({ 
  isOpen, 
  isCollapsed, 
  isMobile, 
  user, 
  sessions, 
  currentSessionId, 
  onClose, 
  onToggleCollapse, 
  onCreateSession, 
  onSelectSession, 
  onDeleteSession, 
  onShowFavorites,
  onLogout,
  sessionsLoading,
  collapsed 
}) => {
  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = date.toDate ? date.toDate() : new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessage = (lastMessage) => {
    if (!lastMessage) return 'New chat session';
    return lastMessage.length > 40 ? lastMessage.substring(0, 40) + '...' : lastMessage;
  };



  const SidebarContent = () => (
    <div className={`sidebar-container ${isMobile ? 'w-80 mobile-sidebar' : isCollapsed ? 'w-20' : 'w-80'} 
      bg-gradient-to-b from-white via-stone-50 to-stone-100 
      border-r border-stone-200/60 backdrop-blur-xl 
      shadow-2xl shadow-stone-900/10 
      flex flex-col transition-all duration-500 ease-out relative overflow-hidden`}>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>

      {/* Header */}
      <div className="relative h-16 flex items-center justify-between px-5 border-b border-stone-200/60 bg-white/40 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-3 text-orange-600 group cursor-pointer">
            <div className="relative">
              <ChefHat className="w-7 h-7 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl gradient-text">
              CookMate
            </span>
          </div>
        )}
        {isCollapsed && (
          <button 
            onClick={onToggleCollapse}
            className="w-full flex justify-center text-orange-600 group cursor-pointer"
          >
            <div className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors duration-200">
              <ChefHat className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <Sparkles className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </button>
        )}
        {!isCollapsed && (
          <button 
            onClick={isMobile ? onClose : onToggleCollapse} 
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200 group"
          >
            {isMobile ? (
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            ) : (
              <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="relative p-4 space-y-3">
        {/* Create New Chat */}
        <button 
          onClick={onCreateSession} 
          disabled={sessionsLoading}
          className={`
            sidebar-button hover-lift flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl 
            font-semibold text-sm transition-all duration-300 transform pulse-glow
            ${isCollapsed ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'}
            disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed
            relative overflow-hidden group
          `}
        >
          {/* Button shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Plus className={`w-5 h-5 ${isCollapsed ? '' : 'relative z-10'} transition-all duration-300 group-hover:rotate-90`} />
          {!isCollapsed && <span className="relative z-10">{sessionsLoading ? 'Creating...' : 'New Chat'}</span>}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              Create New Chat
            </div>
          )}
        </button>

        {/* Favorites */}
        <button 
          onClick={onShowFavorites}
          className={`
            flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl 
            font-semibold text-sm transition-all duration-300 transform
            ${isCollapsed ? 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 border border-pink-200 hover:bg-gradient-to-br hover:from-pink-100 hover:to-rose-100' : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'}
            relative overflow-hidden group
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-75"></div>
          <Heart className={`w-5 h-5 ${isCollapsed ? '' : 'relative z-10'} transition-all duration-300 group-hover:scale-110`} />
          {!isCollapsed && <span className="relative z-10">My Favorites</span>}
          
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              My Favorites
            </div>
          )}
        </button>

        {/* Collections */}
        <Link 
          to="/collections" 
          onClick={isMobile ? onClose : undefined}
          className={`
            flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl 
            font-semibold text-sm transition-all duration-300 transform
            ${isCollapsed ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-200 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100' : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'}
            relative overflow-hidden group
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-150"></div>
          <Folder className={`w-5 h-5 ${isCollapsed ? '' : 'relative z-10'} transition-all duration-300 group-hover:scale-110`} />
          {!isCollapsed && <span className="relative z-10">My Collections</span>}
          
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              My Collections
            </div>
          )}
        </Link>
      </div>

      {/* Sessions List */}
      <div className="relative flex-1 sidebar-scroll sidebar-scroll-no-scrollbar overflow-y-auto px-3 pb-4">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Recent Chats
          </div>
        )}
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-stone-500 text-sm">
            {isCollapsed ? 'No chats' : 'No chat sessions yet'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`
                  session-item group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer 
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  ${session.id === currentSessionId 
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 shadow-md shadow-orange-200/30 pulse-glow' 
                    : 'hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100 hover:shadow-sm'
                  }
                  ${index === 0 && isCollapsed ? 'mt-2' : ''}
                `}
              >
                {/* Active indicator */}
                {session.id === currentSessionId && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-r-full"></div>
                )}
                
                <div className="flex-shrink-0 relative">
                  <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                    ${session.id === currentSessionId 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' 
                      : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                    }
                  `}>
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  
                  {/* Online indicator */}
                  {session.id === currentSessionId && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm font-semibold truncate transition-colors duration-200
                          ${session.id === currentSessionId ? 'text-orange-700' : 'text-stone-700'}
                        `}>
                          {session.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <p className="text-xs text-stone-500 truncate">
                            {formatLastMessage(session.lastMessage)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('Delete button clicked for session:', session.id);
                          onDeleteSession(session.id, e);
                        }}
                        className="opacity-40 group-hover:opacity-100 focus:opacity-100 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 focus:bg-red-50 focus:text-red-500 rounded-lg transition-all duration-200 ml-2 cursor-pointer relative"
                        style={{ zIndex: 9999, pointerEvents: 'auto' }}
                        title="Delete chat"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    <div className="font-semibold">{session.title}</div>
                    <div className="text-xs text-stone-300">{formatLastMessage(session.lastMessage)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Account Footer */}
      <div className="relative p-4 border-t border-stone-200/60 bg-white/40 backdrop-blur-sm">
        <div className={`
          flex items-center w-full p-3 rounded-2xl transition-all duration-300
          ${isCollapsed ? 'justify-center' : 'gap-3'}
          hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100 hover:shadow-sm
        `}>
          <div className={`
            user-avatar w-10 h-10 rounded-2xl flex items-center justify-center font-medium text-sm
            bg-gradient-to-tr from-orange-400 via-red-500 to-pink-500 text-white 
            shadow-lg transition-all duration-300 hover:scale-105 float-animation
            flex-shrink-0 relative overflow-hidden
          `}>
            {/* Avatar shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          
          {!isCollapsed && (
            <>
              <div className="text-left flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {user?.displayName || 'Anonymous User'}
                </p>
                <p className="text-xs text-stone-500 truncate">{user?.email || 'Guest'}</p>
              </div>
              
              {user && (
                <button 
                  onClick={onLogout}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                </button>
              )}
            </>
          )}
          
          {isCollapsed && user && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              <div className="font-semibold">{user.displayName || 'User'}</div>
              <div className="text-xs text-stone-300">{user.email}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
          <div className={`
            absolute left-0 top-0 bottom-0 transition-transform duration-500 ease-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <SidebarContent />
          </div>
        </div>
      </>
    );
  }

  return <SidebarContent />;
};

export default Sidebar;