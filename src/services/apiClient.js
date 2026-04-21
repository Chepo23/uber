import { refreshAccessToken } from './authApi';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSession,
  setSession,
} from './authSession';

let refreshPromise = null;
let onAuthFailure = () => {};

export const setAuthFailureHandler = (handler) => {
  onAuthFailure = typeof handler === 'function' ? handler : () => {};
};

const buildHeaders = ({ headers = {}, apiKey, includeJson = false, accessToken }) => {
  const merged = new Headers(headers);

  if (includeJson && !merged.has('Content-Type')) {
    merged.set('Content-Type', 'application/json');
  }

  if (apiKey && !merged.has('X-Api-Key')) {
    merged.set('X-Api-Key', apiKey);
  }

  if (accessToken) {
    merged.set('Authorization', `Bearer ${accessToken}`);
  }

  return merged;
};

const runRefreshTokenFlow = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = refreshAccessToken(refreshToken)
    .then((nextSession) => {
      const previous = getSession();
      setSession({
        ...previous,
        ...nextSession,
        user: nextSession.user?.id ? nextSession.user : previous?.user,
      });
      return getAccessToken();
    })
    .catch((error) => {
      clearSession();
      onAuthFailure(error);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const authenticatedFetch = async (
  url,
  options = {},
  config = { apiKey: undefined, retryOnAuthFail: true }
) => {
  const token = getAccessToken();
  const hasJsonBody = Boolean(options.body && !(options.body instanceof FormData));

  const firstHeaders = buildHeaders({
    headers: options.headers,
    apiKey: config.apiKey,
    includeJson: hasJsonBody,
    accessToken: token,
  });

  const firstResponse = await fetch(url, {
    ...options,
    headers: firstHeaders,
  });

  if (!config.retryOnAuthFail || firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshedToken = await runRefreshTokenFlow();
  if (!refreshedToken) {
    return firstResponse;
  }

  const retryHeaders = buildHeaders({
    headers: options.headers,
    apiKey: config.apiKey,
    includeJson: hasJsonBody,
    accessToken: refreshedToken,
  });

  return fetch(url, {
    ...options,
    headers: retryHeaders,
  });
};
