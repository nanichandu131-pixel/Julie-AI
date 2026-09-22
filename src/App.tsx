import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Plus, Sparkles, MessageSquare } from 'lucide-react';
import {
  ChatMessage,
  ChatSession,
  ThemeMode,
  FileAttachment,
} from './types';
import {
  loadSavedSessions,
  saveSessionsToStorage,
  loadSavedCurrentSessionId,
  saveCurrentSessionId,
  loadSavedTheme,
  saveThemeToStorage,
  generateId,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { LandingPage } from './components/LandingPage';
import { ConfirmationModal } from './components/ConfirmationModal';
import { isCreatorQuery } from './utils/creator';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSavedSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => loadSavedCurrentSessionId());
  const [theme, setTheme] = useState<ThemeMode>(() => loadSavedTheme());
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    // If user already has a current active session with messages, show chat; otherwise show Landing Page
    const savedId = loadSavedCurrentSessionId();
    if (!savedId) return true;
    const existingSessions = loadSavedSessions();
    const session = existingSessions.find((s) => s.id === savedId);
    return !(session && session.messages && session.messages.length > 0);
  });
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Confirmation modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'single' | 'all';
    targetId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'single',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync theme changes to html/body and storage
  useEffect(() => {
    saveThemeToStorage(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className = 'bg-neutral-950 text-neutral-100 font-sans antialiased';
    } else {
      root.classList.remove('dark');
      document.body.className = 'bg-neutral-100 text-neutral-900 font-sans antialiased';
    }
  }, [theme]);

  // Persist sessions
  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Persist current session ID
  useEffect(() => {
    saveCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  // Current session getter
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;
  const currentMessages = currentSession ? currentSession.messages : [];

  // Smooth scroll to bottom on new messages or stream chunks
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [currentMessages.length]);

  // When streaming, auto-scroll gently
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom('auto');
    }
  }, [isStreaming, currentMessages]);

  // Toggle dark/light theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Start a new chat session
  const handleNewChat = useCallback(() => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setCurrentSessionId(null);
    setInput('');
    setAttachments([]);
    setShowLandingPage(false);
    setTimeout(() => {
      const textarea = document.getElementById('chat-input-textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    }, 50);
  }, [isStreaming]);

  // Navigate to Landing Page
  const handleGoHome = useCallback(() => {
    setShowLandingPage(true);
  }, []);

  // Get Started from Landing Page
  const handleGetStarted = useCallback(() => {
    setShowLandingPage(false);
    setTimeout(() => {
      const textarea = document.getElementById('chat-input-textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    }, 50);
  }, []);

  // Global keyboard shortcuts:
  // - Cmd+K / Ctrl+K: Focus chat input bar
  // - Cmd+Shift+O / Ctrl+Shift+O: Trigger a new chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+Shift+O or Ctrl+Shift+O -> New Chat
      if (isModifier && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleNewChat();
        return;
      }

      // Cmd+K or Ctrl+K -> Focus input bar
      if (isModifier && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const textarea = document.getElementById('chat-input-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNewChat]);

  // Stream generator core function
  const streamAIResponse = useCallback(
    async (
      sessionId: string,
      historyForApi: { role: 'user' | 'assistant'; content: string; attachments?: FileAttachment[] }[],
      assistantMsgId: string
    ) => {
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      let accumulated = '';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyForApi }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Readable stream not supported by browser.');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataContent = trimmed.slice(6).trim();
              if (dataContent === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulated += parsed.text;
                  setSessions((prev) =>
                    prev.map((session) => {
                      if (session.id !== sessionId) return session;
                      return {
                        ...session,
                        updatedAt: Date.now(),
                        messages: session.messages.map((msg) =>
                          msg.id === assistantMsgId
                            ? { ...msg, content: accumulated, isStreaming: true }
                            : msg
                        ),
                      };
                    })
                  );
                }
              } catch (e: any) {
                if (e.message && e.message !== 'Unexpected end of JSON input') {
                  throw e;
                }
              }
            }
          }
        }

        // Complete streaming
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id !== sessionId) return session;
            return {
              ...session,
              updatedAt: Date.now(),
              messages: session.messages.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, isStreaming: false, error: false }
                  : msg
              ),
            };
          })
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Stopped by user, finalize
          setSessions((prev) =>
            prev.map((session) => {
              if (session.id !== sessionId) return session;
              return {
                ...session,
                messages: session.messages.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
                ),
              };
            })
          );
        } else {
          console.error('Error generating AI response:', err);
          let rawError = err.message || '';
          let errorMsg = 'Could not complete request. Please try again.';

          try {
            // If rawError is nested JSON string, parse it cleanly
            const jsonMatch = rawError.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              let parsed = JSON.parse(jsonMatch[0]);
              if (typeof parsed?.error?.message === 'string' && parsed.error.message.includes('{')) {
                try {
                  parsed = JSON.parse(parsed.error.message);
                } catch {
                  // ignore
                }
              }
              const extracted = parsed?.error?.message || parsed?.message || parsed?.error?.status;
              if (extracted) rawError = extracted;
            }
          } catch {
            // not JSON
          }

          const lower = rawError.toLowerCase();
          if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
            errorMsg = 'The AI service is temporarily experiencing high demand. Please wait a moment and click "Try again".';
          } else if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
            errorMsg = 'Rate limit reached. Please wait a moment before sending another message.';
          } else if (lower.includes('api_key') || lower.includes('apikey') || lower.includes('401') || lower.includes('403')) {
            errorMsg = 'Invalid or missing Gemini API key. Please check your configuration in Settings > Secrets.';
          } else if (rawError && !rawError.startsWith('{')) {
            errorMsg = rawError;
          }

          setSessions((prev) =>
            prev.map((session) => {
              if (session.id !== sessionId) return session;
              return {
                ...session,
                messages: session.messages.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        isStreaming: false,
                        error: true,
                        errorMessage: errorMsg,
                      }
                    : msg
                ),
              };
            })
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  // Attachment management helpers
  const handleAddAttachment = (attachment: FileAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Send message
  const handleSendMessage = (messageText?: string, explicitAttachments?: FileAttachment[]) => {
    const textToSend = (messageText ?? input).trim();
    const currentAttachments = explicitAttachments ?? attachments;

    if ((!textToSend && currentAttachments.length === 0) || isStreaming) return;

    // Switch to active chat screen immediately
    setShowLandingPage(false);
    setInput('');
    setAttachments([]);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: textToSend,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: Date.now(),
    };

    const isCreator = isCreatorQuery(textToSend);
    const assistantMsgId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: isCreator
        ? 'Sidda Venkata Sai Tejashree is the creator and lead developer of Julie AI.'
        : '',
      timestamp: Date.now() + 1,
      isStreaming: !isCreator,
      isCreatorCard: isCreator,
    };

    let targetSessionId = currentSessionId;

    if (!targetSessionId) {
      // Create new session auto-titled from user's first message or attachment name
      const newSessionId = generateId();
      let title = textToSend;
      if (!title && currentAttachments.length > 0) {
        title = `Analyzed ${currentAttachments[0].name}`;
      }
      if (title.length > 36) {
        title = title.slice(0, 36).trim() + '...';
      }

      const newSession: ChatSession = {
        id: newSessionId,
        title: title || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage, assistantMessage],
      };

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      targetSessionId = newSessionId;

      if (!isCreator) {
        streamAIResponse(
          newSessionId,
          [{
            role: 'user',
            content: textToSend,
            attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
          }],
          assistantMsgId
        );
      }
    } else {
      // Append to existing session
      const existingSession = sessions.find((s) => s.id === targetSessionId);
      const priorHistory = existingSession
        ? existingSession.messages.filter((m) => !m.error && (m.content || (m.attachments && m.attachments.length > 0)))
        : [];

      const updatedHistoryForApi = [
        ...priorHistory.map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        })),
        {
          role: 'user' as const,
          content: textToSend,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        },
      ];

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSessionId) return s;
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage, assistantMessage],
          };
        })
      );

      if (!isCreator) {
        streamAIResponse(targetSessionId, updatedHistoryForApi, assistantMsgId);
      }
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Regenerate last AI response
  const handleRegenerate = () => {
    if (!currentSession || isStreaming) return;

    const messages = currentSession.messages;
    const lastMsgIndex = messages.length - 1;
    if (lastMsgIndex < 0) return;

    // Find messages up to the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[lastUserIndex];
    const isCreator = isCreatorQuery(lastUserMessage.content);

    const newAssistantMsgId = generateId();
    const newAssistantMessage: ChatMessage = {
      id: newAssistantMsgId,
      role: 'assistant',
      content: isCreator
        ? 'Sidda Venkata Sai Tejashree is the creator and lead developer of Julie AI.'
        : '',
      timestamp: Date.now(),
      isStreaming: !isCreator,
      isCreatorCard: isCreator,
    };

    // Keep all messages up to last user message, and attach fresh assistant message
    const trimmedMessages = [
      ...messages.slice(0, lastUserIndex + 1),
      newAssistantMessage,
    ];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          messages: trimmedMessages,
        };
      })
    );

    if (!isCreator) {
      const historyForApi = trimmedMessages
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content, attachments: m.attachments }));
      streamAIResponse(currentSession.id, historyForApi, newAssistantMsgId);
    }
  };

  // Retry after error
  const handleRetry = () => {
    handleRegenerate();
  };

  // Edit user message and resend
  const handleEditUserMessage = (messageId: string, newContent: string) => {
    if (!currentSession || isStreaming) return;

    const messageIndex = currentSession.messages.findIndex(
      (m) => m.id === messageId
    );
    if (messageIndex === -1) return;

    const isCreator = isCreatorQuery(newContent);
    const newAssistantMsgId = generateId();
    const newAssistantMsg: ChatMessage = {
      id: newAssistantMsgId,
      role: 'assistant',
      content: isCreator
        ? 'Sidda Venkata Sai Tejashree is the creator and lead developer of Julie AI.'
        : '',
      timestamp: Date.now(),
      isStreaming: !isCreator,
      isCreatorCard: isCreator,
    };

    // Update edited user message and discard subsequent messages
    const updatedUserMsg: ChatMessage = {
      ...currentSession.messages[messageIndex],
      content: newContent,
      timestamp: Date.now(),
    };

    const newMessagesList = [
      ...currentSession.messages.slice(0, messageIndex),
      updatedUserMsg,
      newAssistantMsg,
    ];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          messages: newMessagesList,
        };
      })
    );

    if (!isCreator) {
      const historyForApi = newMessagesList
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content, attachments: m.attachments }));
      streamAIResponse(currentSession.id, historyForApi, newAssistantMsgId);
    }
  };

  // Handle feedback (thumbs up / thumbs down) for AI message
  const handleMessageFeedback = (
    messageId: string,
    feedback: 'positive' | 'negative'
  ) => {
    setSessions((prev) =>
      prev.map((session) => {
        const hasMessage = session.messages.some((m) => m.id === messageId);
        if (!hasMessage) return session;

        return {
          ...session,
          messages: session.messages.map((m) => {
            if (m.id === messageId) {
              // Set feedback or toggle if clicked again
              const updatedFeedback = m.feedback === feedback ? undefined : feedback;
              return { ...m, feedback: updatedFeedback };
            }
            return m;
          }),
        };
      })
    );
  };

  // Delete chat request
  const handleRequestDeleteSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    setModalState({
      isOpen: true,
      title: 'Delete Chat',
      message: `Are you sure you want to delete "${session?.title || 'this chat'}"? This action cannot be undone.`,
      type: 'single',
      targetId: id,
    });
  };

  // Clear all chats request
  const handleRequestClearAll = () => {
    setModalState({
      isOpen: true,
      title: 'Clear All History',
      message:
        'Are you sure you want to clear all chat conversations? All saved history in your browser will be removed.',
      type: 'all',
    });
  };

  // Execute confirmed modal action
  const handleConfirmModal = () => {
    if (modalState.type === 'single' && modalState.targetId) {
      setSessions((prev) => prev.filter((s) => s.id !== modalState.targetId));
      if (currentSessionId === modalState.targetId) {
        setCurrentSessionId(null);
      }
    } else if (modalState.type === 'all') {
      if (isStreaming && abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsStreaming(false);
      }
      setSessions([]);
      setCurrentSessionId(null);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        theme={theme}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onNewChat={handleNewChat}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setShowLandingPage(false);
        }}
        onRequestDeleteSession={handleRequestDeleteSession}
        onRequestClearAll={handleRequestClearAll}
        onToggleTheme={toggleTheme}
        onGoHome={handleGoHome}
        isHomeView={showLandingPage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navigation Bar */}
        <header
          className={`flex items-center justify-between px-3 sm:px-6 py-3 border-b shrink-0 z-10 transition-colors ${
            isDark
              ? 'bg-neutral-950/90 border-neutral-800/80 backdrop-blur-xs'
              : 'bg-white/90 border-neutral-200/80 backdrop-blur-xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-sidebar-toggle"
              type="button"
              onClick={() => setIsOpenMobile(true)}
              aria-label="Open sidebar menu"
              className={`p-2 rounded-xl lg:hidden transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-neutral-800 text-neutral-300'
                  : 'hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Session Title or Home Badge */}
            <div className="flex items-center gap-2 truncate">
              <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-sm sm:text-base font-semibold truncate tracking-tight">
                {showLandingPage
                  ? 'Welcome to Julie AI'
                  : currentSession
                  ? currentSession.title
                  : 'Julie AI'}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {showLandingPage ? (
              <button
                id="top-start-chat-btn"
                type="button"
                onClick={handleGetStarted}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
            ) : (
              <button
                id="top-new-chat-btn"
                type="button"
                onClick={handleNewChat}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200'
                    : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
                <kbd className="hidden md:inline-block text-[10px] px-1 py-0.5 rounded font-mono opacity-60">
                  {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? '⌘⇧O' : 'Ctrl+Shift+O'}
                </kbd>
              </button>
            )}
          </div>
        </header>

        {/* View Switching: Landing Page OR Active Chat History */}
        {showLandingPage ? (
          <LandingPage
            theme={theme}
            onGetStarted={handleGetStarted}
            onExplorePrompt={(prompt) => {
              handleGetStarted();
              handleSendMessage(prompt);
            }}
          />
        ) : (
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 scrollbar-thin flex flex-col"
          >
            {currentMessages.length === 0 ? (
              <EmptyState
                theme={theme}
                onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              />
            ) : (
              <div className="max-w-4xl w-full mx-auto space-y-1">
                {currentMessages.map((msg, index) => {
                  const isLastAssistantReply =
                    msg.role === 'assistant' &&
                    index === currentMessages.length - 1;

                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isLastAssistantReply={isLastAssistantReply}
                      isStreaming={Boolean(msg.isStreaming)}
                      theme={theme}
                      onRegenerate={handleRegenerate}
                      onEditUserMessage={handleEditUserMessage}
                      onRetry={handleRetry}
                      onFeedback={handleMessageFeedback}
                    />
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>
        )}

        {/* Fixed Bottom Input Bar */}
        <div
          className={`shrink-0 border-t ${
            isDark
              ? 'bg-neutral-950 border-neutral-800/60'
              : 'bg-neutral-50 border-neutral-200/60'
          }`}
        >
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={(explicitAttachments) => handleSendMessage(undefined, explicitAttachments)}
            onStop={handleStopGeneration}
            isStreaming={isStreaming}
            theme={theme}
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
          />
        </div>
      </div>

      {/* Delete / Clear Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        theme={theme}
        onConfirm={handleConfirmModal}
        onCancel={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
