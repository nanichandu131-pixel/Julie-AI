import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  Moon,
  Sun,
  X,
  Search,
  Home,
} from 'lucide-react';
import { ChatSession, ThemeMode } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  theme: ThemeMode;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onRequestDeleteSession: (id: string) => void;
  onRequestClearAll: () => void;
  onToggleTheme: () => void;
  onGoHome?: () => void;
  isHomeView?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  theme,
  isOpenMobile,
  onCloseMobile,
  onNewChat,
  onSelectSession,
  onRequestDeleteSession,
  onRequestClearAll,
  onToggleTheme,
  onGoHome,
  isHomeView = false,
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  // Real-time case-insensitive filter by chat title
  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      (session.title || '').toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 flex flex-col border-r transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-neutral-200'
            : 'bg-neutral-50/95 border-neutral-200 text-neutral-800'
        }`}
      >
        {/* Top Header: Logo + Close on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-inherit">
          <button
            type="button"
            onClick={() => {
              if (onGoHome) onGoHome();
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer transition-opacity hover:opacity-90"
            title="Go to Home Page"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-bold tracking-tight text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Julie AI
              </h2>
              <span className="text-[10px] text-emerald-500 font-medium tracking-wide">
                Gemini Assistant
              </span>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className={`p-1.5 rounded-lg lg:hidden transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Actions: Home Button, New Chat Button & Search Input */}
        <div className="p-3 space-y-2">
          {onGoHome && (
            <button
              id="sidebar-home-button"
              type="button"
              onClick={() => {
                onGoHome();
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 py-2 px-3.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer border ${
                isHomeView
                  ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-500 font-semibold'
                  : isDark
                  ? 'border-neutral-800/80 bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300'
                  : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 shadow-xs'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Home / Landing Page</span>
            </button>
          )}

          <button
            id="new-chat-button"
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between gap-2 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-100 font-mono">
              {isMac ? '⌘⇧O' : 'Ctrl+Shift+O'}
            </kbd>
          </button>

          {/* Search Input Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="sidebar-chat-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm border transition-all outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                isDark
                  ? 'bg-neutral-950/70 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500'
                  : 'bg-white border-neutral-300/80 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className={`absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer transition-colors ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {searchQuery ? `Matching (${filteredSessions.length})` : `Recent Chats (${sessions.length})`}
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-emerald-500 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No previous chats yet. Start a new conversation!
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400 space-y-2">
              <p>No chats found matching &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60 shadow-xs'
                        : 'bg-white text-neutral-900 font-medium border border-neutral-300/80 shadow-xs'
                      : isDark
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-neutral-400'}`} />
                  <span className="truncate flex-1 text-xs sm:text-sm">
                    {session.title || 'Untitled Conversation'}
                  </span>

                  {/* Delete individual chat button */}
                  <button
                    type="button"
                    title="Delete chat"
                    aria-label={`Delete chat: ${session.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteSession(session.id);
                    }}
                    className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      isDark
                        ? 'hover:bg-neutral-700 text-neutral-400 hover:text-red-400'
                        : 'hover:bg-neutral-200 text-neutral-500 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions: Clear all history & Dark/Light mode toggle */}
        <div className="p-3 border-t border-inherit space-y-1.5">
          {sessions.length > 0 && (
            <button
              id="clear-all-history-button"
              type="button"
              onClick={onRequestClearAll}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'text-neutral-400 hover:text-red-400 hover:bg-neutral-800/60'
                  : 'text-neutral-600 hover:text-red-600 hover:bg-neutral-200/60'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all chats</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? 'text-neutral-300 hover:bg-neutral-800'
                : 'text-neutral-700 hover:bg-neutral-200/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[11px] text-neutral-400">Toggle</span>
          </button>
        </div>
      </aside>
    </>
  );
};
