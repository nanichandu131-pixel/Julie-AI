import { ChatSession, ThemeMode } from '../types';

const STORAGE_SESSIONS_KEY = 'julie_ai_sessions_v1';
const STORAGE_CURRENT_SESSION_KEY = 'julie_ai_current_session_id';
const STORAGE_THEME_KEY = 'julie_ai_theme';

export function loadSavedSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load chat sessions from localStorage:', err);
    return [];
  }
}

export function saveSessionsToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save chat sessions to localStorage:', err);
  }
}

export function loadSavedCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_CURRENT_SESSION_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_CURRENT_SESSION_KEY);
    }
  } catch {}
}

export function loadSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default is dark as requested
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveThemeToStorage(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  } catch {}
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
