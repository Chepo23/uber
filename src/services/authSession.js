const STORAGE_KEY = 'sierra.pos.auth.session.v1';

let sessionCache;

const hasWindow = globalThis.window !== undefined;

const parseSession = (rawValue) => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.accessToken || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getSession = () => {
  if (sessionCache !== undefined) return sessionCache;

  if (!hasWindow) {
    sessionCache = null;
    return sessionCache;
  }

  sessionCache = parseSession(globalThis.window.localStorage.getItem(STORAGE_KEY));
  return sessionCache;
};

export const setSession = (nextSession) => {
  sessionCache = nextSession || null;

  if (!hasWindow) return;

  if (sessionCache) {
    globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionCache));
  } else {
    globalThis.window.localStorage.removeItem(STORAGE_KEY);
  }
};

export const clearSession = () => {
  setSession(null);
};

export const getAccessToken = () => getSession()?.accessToken || null;

export const getRefreshToken = () => getSession()?.refreshToken || null;

export const isSessionExpired = (session = getSession()) => {
  if (!session?.expiresAt) return false;
  return Date.now() >= Number(session.expiresAt);
};
