import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Plus,
  Image as ImageIcon,
  FileText,
  X,
  File,
} from 'lucide-react';
import { ThemeMode, FileAttachment } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (attachments?: FileAttachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  theme: ThemeMode;
  attachments: FileAttachment[];
  onAddAttachment: (attachment: FileAttachment) => void;
  onRemoveAttachment: (id: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  theme,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);

  const recognitionRef = useRef<any>(null);
  const isDark = theme === 'dark';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  // Close attach menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  // Auto-resize textarea according to scrollHeight up to max 200px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${Math.max(48, nextHeight)}px`;
    }
  }, [input]);

  // Web Speech API speech-to-text initialization
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    // If currently listening, stop
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let initialInput = input;

      recognition.onstart = () => {
        setIsListening(true);
        initialInput = input;
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript) {
          const space = initialInput && !initialInput.endsWith(' ') ? ' ' : '';
          setInput(initialInput + space + transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not start microphone.');
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        onSend();
      }
    }
  };

  // File & Image processor
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      if (isImage) {
        // Read as Data URL
        const reader = new FileReader();
        reader.onload = () => {
          onAddAttachment({
            id: fileId,
            name: file.name,
            type: file.type || 'image/jpeg',
            size: file.size,
            dataUrl: reader.result as string,
            isImage: true,
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Check if text/code/markdown/json or binary
        const isTextCandidate =
          file.type.startsWith('text/') ||
          file.name.match(/\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|java|c|cpp|go|rs|sql|yaml|yml|xml|log|sh)$/i);

        if (isTextCandidate) {
          const reader = new FileReader();
          reader.onload = () => {
            onAddAttachment({
              id: fileId,
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              textContent: reader.result as string,
              isImage: false,
            });
          };
          reader.readAsText(file);
        } else {
          // Fall back to reading as Data URL
          const reader = new FileReader();
          reader.onload = () => {
            onAddAttachment({
              id: fileId,
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl: reader.result as string,
              isImage: false,
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }

    // Reset input so user can upload the same file again if desired
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasContentToSend = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Attached Files Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl border bg-inherit/40 max-h-36 overflow-y-auto">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border text-xs max-w-xs transition-all ${
                isDark
                  ? 'bg-neutral-850 border-neutral-750 text-neutral-200'
                  : 'bg-white border-neutral-200 text-neutral-800 shadow-xs'
              }`}
            >
              {att.isImage && att.dataUrl ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="w-8 h-8 rounded object-cover border border-neutral-700/30"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate max-w-[140px]">{att.name}</p>
                <p className="text-[10px] text-neutral-400">{formatFileSize(att.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                aria-label={`Remove attachment ${att.name}`}
                className="p-1 rounded hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Speech error indicator */}
      {speechError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center justify-between animate-in fade-in">
          <span>{speechError}</span>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        className={`relative flex items-end gap-1.5 sm:gap-2 p-2 rounded-2xl border shadow-lg transition-all focus-within:ring-2 focus-within:ring-emerald-500/50 ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 focus-within:border-emerald-500/50'
            : 'bg-white border-neutral-200 focus-within:border-emerald-500/50'
        }`}
      >
        {/* Plus (+) Button & Popup Menu */}
        <div className="relative shrink-0 mb-1 ml-0.5" ref={attachMenuRef}>
          <button
            id="chat-attach-btn"
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            title="Attach images or files"
            aria-label="Attach images or files"
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              showAttachMenu
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : isDark
                ? 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
          </button>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e, true)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.java,.sql,.doc,.docx"
            multiple
            onChange={(e) => handleFileChange(e, false)}
            className="hidden"
          />

          {/* Attach Flyout Menu */}
          {showAttachMenu && (
            <div
              className={`absolute bottom-full left-0 mb-2 w-48 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                isDark
                  ? 'bg-neutral-900 border-neutral-750 text-neutral-200 shadow-black/60'
                  : 'bg-white border-neutral-200 text-neutral-800 shadow-neutral-200/80'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  imageInputRef.current?.click();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <File className="w-4 h-4 text-blue-500" />
                <span>Upload Document / File</span>
              </button>
            </div>
          )}
        </div>

        {/* Auto-resizing Textarea */}
        <textarea
          id="chat-input-textarea"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'Julie AI is generating a reply...'
              : isListening
              ? 'Listening... speak clearly into your microphone'
              : 'Ask Julie AI anything... (Enter to send, Shift+Enter for new line)'
          }
          rows={1}
          className={`w-full py-2 px-2 sm:px-3 text-sm md:text-base resize-none bg-transparent outline-hidden leading-relaxed max-h-[200px] overflow-y-auto scrollbar-thin ${
            isDark
              ? 'text-neutral-100 placeholder:text-neutral-500'
              : 'text-neutral-900 placeholder:text-neutral-400'
          }`}
        />

        {/* Microphone Button */}
        <div className="flex items-center shrink-0 mb-1">
          <button
            id="chat-mic-btn"
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'Stop recording voice' : 'Speak via microphone (Speech to Text)'}
            aria-label={isListening ? 'Stop recording voice' : 'Speak via microphone'}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : isDark
                ? 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: Send or Stop */}
        <div className="flex items-center shrink-0 mb-1 mr-1">
          {isStreaming ? (
            <button
              id="chat-stop-btn"
              type="button"
              onClick={onStop}
              title="Stop generating"
              aria-label="Stop generating"
              className="p-2.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white transition-all cursor-pointer shadow-xs"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              id="chat-send-btn"
              type="button"
              disabled={!hasContentToSend}
              onClick={() => {
                if (hasContentToSend) onSend();
              }}
              title="Send message (Enter)"
              aria-label="Send message"
              className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-xs ${
                hasContentToSend
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                  : isDark
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end mt-2 px-1 text-[11px] text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                isDark
                  ? 'bg-neutral-850 border-neutral-750 text-neutral-300'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-600'
              }`}
            >
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
            to focus
          </span>
          <span className="hidden sm:inline text-neutral-600">•</span>
          <span className="hidden sm:inline">Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};
