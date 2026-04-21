const API_BASE_URL =
  import.meta.env.VITE_SIERRA_API_URL || 'https://demo-services-alternative.sierraerp.com';
const SIERRA_API_KEY =
  (import.meta.env.VITE_SIERRA_API_KEY ||
    'CxzKRteOXeAr5fpa1D2wOm4tlMs64Jsz6wPoYQye8Kdz6sgZ9r0w9JOh3JbJZmlV').trim();

const buildHeaders = (accessToken) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

const parseApiError = async (response) => {
  const fallback = `Error ${response.status}: ${response.statusText}`;

  try {
    const text = await response.text();
    if (!text) return fallback;

    const parsed = JSON.parse(text);
    return parsed?.msg || parsed?.detail || parsed?.title || text || fallback;
  } catch {
    return fallback;
  }
};

const parseAnyApiError = async (error) => {
  if (error instanceof Error) {
    return error.message || 'Operacion fallida en el servidor.';
  }

  return 'Operacion fallida en el servidor.';
};

const normalizeTokenPayload = (payload) => {
  const expiresIn = Number(payload?.expires_in || 0);
  const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 0;
  const expiresAt = safeExpiresIn > 0 ? Date.now() + Math.max(safeExpiresIn - 30, 0) * 1000 : null;

  return {
    accessToken: payload?.access_token || null,
    refreshToken: payload?.refresh_token || null,
    tokenType: payload?.token_type || 'Bearer',
    expiresIn: safeExpiresIn,
    expiresAt,
    user: {
      id: String(payload?.user_id ?? ''),
      username: payload?.user_name || '',
      role: payload?.role || '',
    },
  };
};

export const loginWithCredentials = async ({ username, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = await response.json();
  const sessionData = normalizeTokenPayload(data);

  if (!sessionData.accessToken) {
    throw new Error('El servidor no devolvio un access token valido.');
  }

  return sessionData;
};

export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = await response.json();
  const sessionData = normalizeTokenPayload(data);

  if (!sessionData.accessToken) {
    throw new Error('No se pudo refrescar la sesion.');
  }

  return sessionData;
};

export const getCurrentUserProfile = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/me`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
};

export const revokeCurrentSession = async (accessToken, refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/revoke`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({ refreshToken, all: false, reason: 'logout' }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return true;
};

export const registerNewUser = async ({
  username,
  password,
  role = 'user',
  firstName = '',
  lastName = '',
  email = '',
  phoneNumber = '',
  notes = '',
  observations = '',
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': SIERRA_API_KEY,
      },
      body: JSON.stringify({
        username,
        password,
        role,
        firstName,
        lastName,
        email,
        phoneNumber,
        notes,
        observations,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  } catch (error) {
    throw new Error(await parseAnyApiError(error));
  }
};
