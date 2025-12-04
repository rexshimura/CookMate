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
  onShowCollections,
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
    <div className={`
      h-full flex flex-col transition-all duration-500 ease-out relative overflow-hidden
      bg-gradient-to-b from-white via-stone-50 to-stone-100 
      border-r border-stone-200/60 backdrop-blur-xl shadow-2xl
      ${isMobile 
          ? 'w-80' // Standard width for mobile drawer
          : isCollapsed 
            ? 'w-20' 
            : 'w-80 lg:w-96'
      } 
    `}>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>

      {/* Header */}
      <div className={`relative flex-shrink-0 ${isMobile ? 'h-16' : 'h-16'} flex items-center justify-between ${isMobile ? 'px-4' : 'px-5'} border-b border-stone-200/60 bg-white/40 backdrop-blur-sm`}>
        {!isCollapsed && (
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} text-orange-600 group cursor-pointer`}>
            <div className="relative">
              <ChefHat className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`} />
              <Sparkles className={`absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
            <span className={`font-bold ${isMobile ? 'text-xl' : 'text-xl'} tracking-tight`}>
              CookMate
            </span>
          </div>
        )}

        {/* Collapsed Logo (Desktop Only) */}
        {isCollapsed && !isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center text-orange-600 group cursor-pointer"
          >
            <div className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors duration-200">
              <ChefHat className="w-8 h-8 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
          </button>
        )}

        {/* Toggle/Close Button */}
        {!isCollapsed && (
          <button
            onClick={isMobile ? onClose : onToggleCollapse}
            className={`p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all duration-200 group`}
          >
            {isMobile ? (
              <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
            ) : (
              <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className={`
        relative flex-shrink-0 z-10
        ${isMobile ? 'p-4' : 'p-4'} 
        flex gap-2 
        ${isCollapsed && !isMobile ? 'flex-col items-center' : 'flex-row items-center'}
      `}>

        {/* Create New Chat - Expands to fill space */}
        <button
          onClick={onCreateSession}
          disabled={sessionsLoading}
          title="New Chat"
          className={`
            relative overflow-hidden group flex items-center justify-center gap-2
            transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl
            bg-gradient-to-r from-orange-600 to-red-600 text-white
            ${isCollapsed && !isMobile 
              ? 'w-12 h-12 rounded-full p-0' 
              : 'flex-1 h-12 rounded-2xl px-4'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Plus className={`w-5 h-5 ${isCollapsed && !isMobile ? '' : ''}`} />
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold whitespace-nowrap">New Chat</span>
          )}
        </button>

        {/* Favorites - Circle Icon */}
        <button
          onClick={onShowFavorites}
          title="My Favorites"
          className={`
            relative overflow-hidden group flex-shrink-0
            flex items-center justify-center
            w-12 h-12 rounded-full
            bg-gradient-to-br from-pink-500 to-rose-600 text-white 
            shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
            transition-all duration-300
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-75"></div>
          <Heart className="w-5 h-5 fill-current" />
        </button>

        {/* Collections - Circle Icon */}
        <button
          onClick={onShowCollections}
          title="My Collections"
          className={`
            relative overflow-hidden group flex-shrink-0
            flex items-center justify-center
            w-12 h-12 rounded-full
            bg-gradient-to-br from-blue-600 to-indigo-700 text-white 
            shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
            transition-all duration-300
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-150"></div>
          <Folder className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200 to-transparent flex-shrink-0 mb-2"></div>

      {/* Sessions List */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3' : 'px-3'} pb-4 custom-scrollbar`}>
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
            Recent Chats
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="p-4 text-center text-stone-400 text-sm italic">
            {isCollapsed && !isMobile ? 'Empty' : 'No chat sessions yet'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`
                  group relative flex items-center gap-3 
                  p-3 rounded-xl cursor-pointer 
                  transition-all duration-200
                  ${session.id === currentSessionId 
                    ? 'bg-orange-50/80 border border-orange-200/60 shadow-sm' 
                    : 'hover:bg-stone-100/80 border border-transparent'
                  }
                  ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}
                `}
              >
                {/* Active indicator strip */}
                {session.id === currentSessionId && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full"></div>
                )}

                <div className="flex-shrink-0 relative">
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-colors
                    ${session.id === currentSessionId 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200 group-hover:text-stone-600'
                    }
                  `}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>

                {(!isCollapsed || isMobile) && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${session.id === currentSessionId ? 'text-stone-800' : 'text-stone-600'}`}>
                        {session.title}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id, e);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-stone-300" />
                      <p className="text-xs text-stone-400 truncate">
                        {formatLastMessage(session.lastMessage)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && !isMobile && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-stone-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    <div className="font-semibold">{session.title}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Account Footer */}
      <div className={`flex-shrink-0 ${isMobile ? 'p-4' : 'p-4'} border-t border-stone-200/60 bg-white/40 backdrop-blur-sm`}>
        <div className={`
          flex items-center w-full p-2 rounded-xl transition-all duration-200
          ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'}
        `}>
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
            bg-gradient-to-br from-stone-700 to-stone-900 text-white shadow-md
            flex-shrink-0
          `}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>

          {(!isCollapsed || isMobile) && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile Render Strategy
  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-50 transition-all duration-300 pointer-events-none`}>
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
        />

        {/* Sidebar Slide-in */}
        <div className={`
          absolute left-0 top-0 bottom-0 h-full shadow-2xl transition-transform duration-300 ease-out pointer-events-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent />
        </div>
      </div>
    );
  }

  // Desktop Render Strategy
  return <SidebarContent />;
};

export default Sidebar;