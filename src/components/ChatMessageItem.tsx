import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Pencil,
  AlertCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage, ThemeMode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CreatorCard } from './CreatorCard';

interface ChatMessageItemProps {
  message: ChatMessage;
  isLastAssistantReply: boolean;
  isStreaming: boolean;
  theme: ThemeMode;
  onRegenerate: () => void;
  onEditUserMessage: (messageId: string, newContent: string) => void;
  onRetry: () => void;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLastAssistantReply,
  isStreaming,
  theme,
  onRegenerate,
  onEditUserMessage,
  onRetry,
  onFeedback,
}) => {
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    onFeedback(message.id, type);
    setFeedbackNotification('Feedback recorded.');
    setTimeout(() => {
      setFeedbackNotification(null);
    }, 3000);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editDraft.trim()) return;
    onEditUserMessage(message.id, editDraft.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(message.content);
    setIsEditing(false);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-3 px-3 sm:px-6 transition-colors flex ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex gap-3 max-w-[88%] md:max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar Icon */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-xs ${
                isDark
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                  : 'bg-neutral-200 text-neutral-700 border border-neutral-300'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Bubble & Actions */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          {/* Role / Name Header */}
          <div className="flex items-center gap-2 mb-1 px-1">
            <span
              className={`text-xs font-medium ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {isUser ? 'You' : 'Julie AI'}
            </span>
            <span
              className={`text-[10px] ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* User Message Bubble */}
          {isUser ? (
            isEditing ? (
              <div
                className={`w-full min-w-[280px] sm:min-w-[360px] p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700'
                    : 'bg-white border-neutral-300'
                }`}
              >
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={3}
                  className={`w-full p-2 text-sm rounded-lg resize-none outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isDark
                      ? 'bg-neutral-950 text-neutral-100 border border-neutral-800'
                      : 'bg-neutral-50 text-neutral-900 border border-neutral-200'
                  }`}
                  placeholder="Edit your message..."
                  autoFocus
                />
                <div className="flex justify-end items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      isDark
                        ? 'text-neutral-400 hover:bg-neutral-800'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <span>Save & Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group/bubble space-y-2">
                {/* Render Attachments if present */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`rounded-xl border overflow-hidden p-1.5 flex items-center gap-2 max-w-xs ${
                          isDark
                            ? 'bg-neutral-850 border-neutral-700/80 text-neutral-200'
                            : 'bg-white border-neutral-300 text-neutral-800 shadow-xs'
                        }`}
                      >
                        {att.isImage && att.dataUrl ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 pr-1 text-left">
                          <p className="text-xs font-medium truncate max-w-[130px]">{att.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {att.size < 1024 * 1024
                              ? `${(att.size / 1024).toFixed(0)} KB`
                              : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.content && (
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isDark
                        ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/60 rounded-tr-xs'
                        : 'bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-tr-xs'
                    }`}
                  >
                    {message.content}
                  </div>
                )}

                {/* Edit Button for User Message */}
                {!isStreaming && message.content && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditDraft(message.content);
                      setIsEditing(true);
                    }}
                    title="Edit message"
                    className={`absolute -bottom-6 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded-md text-xs cursor-pointer flex items-center gap-1 ${
                      isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Edit</span>
                  </button>
                )}
              </div>
            )
          ) : message.isCreatorCard ? (
            /* Creator Card View */
            <div className="w-full">
              <CreatorCard theme={theme} />
              <div className="flex items-center gap-2 mt-2 px-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy creator info"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                    isDark
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied info</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy info</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Assistant (Julie AI) Message Bubble */
            <div
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm md:text-base leading-relaxed break-words rounded-tl-xs shadow-xs transition-all ${
                isDark
                  ? 'bg-neutral-900/90 text-neutral-100 border-neutral-800/80'
                  : 'bg-white text-neutral-900 border-neutral-200/80'
              }`}
            >
              {message.error ? (
                /* Inline Friendly Error Message with Retry */
                <div className="space-y-3 py-1">
                  <div className="flex items-start gap-2.5 text-red-500">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Unable to complete request</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {message.errorMessage ||
                          'Julie AI ran into an issue connecting to the Gemini service. Please check your network or API settings.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try again</span>
                  </button>
                </div>
              ) : message.content ? (
                <div>
                  <MarkdownRenderer content={message.content} theme={theme} />
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
                  )}
                </div>
              ) : message.isStreaming ? (
                /* Animated Typing Indicator (Bouncing Dots) */
                <div className="flex items-center gap-1.5 py-2 px-1" aria-label="Julie AI is typing">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                </div>
              ) : null}

              {/* Action Bar Below Julie AI Response */}
              {!message.error && message.content && !message.isStreaming && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-neutral-700/30">
                  {/* Copy Response Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy response"
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <div className="w-px h-3.5 bg-neutral-700/40 mx-0.5" />

                  {/* Thumbs Up Button */}
                  <button
                    id={`feedback-thumbs-up-${message.id}`}
                    type="button"
                    onClick={() => handleFeedbackClick('positive')}
                    title="Good response"
                    aria-label="Good response (Thumbs up)"
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      message.feedback === 'positive'
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                        : isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        message.feedback === 'positive' ? 'fill-current' : ''
                      }`}
                    />
                  </button>

                  {/* Thumbs Down Button */}
                  <button
                    id={`feedback-thumbs-down-${message.id}`}
                    type="button"
                    onClick={() => handleFeedbackClick('negative')}
                    title="Poor response"
                    aria-label="Poor response (Thumbs down)"
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      message.feedback === 'negative'
                        ? isDark
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-rose-50 text-rose-600 border border-rose-300'
                        : isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <ThumbsDown
                      className={`w-3.5 h-3.5 ${
                        message.feedback === 'negative' ? 'fill-current' : ''
                      }`}
                    />
                  </button>

                  {/* Subtle Confirmation Feedback */}
                  {feedbackNotification && (
                    <span className="text-[11px] text-emerald-500 font-medium transition-all animate-in fade-in duration-200">
                      {feedbackNotification}
                    </span>
                  )}

                  {/* Regenerate Button on Last AI reply */}
                  {isLastAssistantReply && !isStreaming && (
                    <>
                      <div className="w-px h-3.5 bg-neutral-700/40 mx-0.5 hidden sm:block" />
                      <button
                        type="button"
                        onClick={onRegenerate}
                        aria-label="Regenerate response"
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer sm:ml-auto ${
                          isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerate response</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
