// Token storage with localStorage persistence
// Access token in memory for security, but backed by localStorage for session persistence
// Refresh token also persisted for session recovery after page reload

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'axion_access_token',
  REFRESH_TOKEN: 'axion_refresh_token',
  USER: 'axion_user',
} as const;

function getFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setInStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage not available
  }
}

export const tokenStorage = {
  getAccessToken: (): string | null => getFromStorage(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string | null): void => {
    setInStorage(STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  getRefreshToken: (): string | null => getFromStorage(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string | null): void => {
    setInStorage(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  getUser: (): any | null => {
    const raw = getFromStorage(STORAGE_KEYS.USER);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setUser: (user: any | null): void => {
    setInStorage(STORAGE_KEYS.USER, user ? JSON.stringify(user) : null);
  },
  clear: (): void => {
    setInStorage(STORAGE_KEYS.ACCESS_TOKEN, null);
    setInStorage(STORAGE_KEYS.REFRESH_TOKEN, null);
    setInStorage(STORAGE_KEYS.USER, null);
  },
};
