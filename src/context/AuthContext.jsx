import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getCurrentUserProfile,
  loginWithCredentials,
  registerNewUser,
  refreshAccessToken,
  revokeCurrentSession,
} from '../services/authApi';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSession,
  setSession as persistSession,
} from '../services/authSession';
import { setAuthFailureHandler } from '../services/apiClient';

const AuthContext = createContext(null);

const normalizeProfile = (profile, fallbackUser) => {
  if (!profile || typeof profile !== 'object') {
    return fallbackUser;
  }

  const candidateId =
    profile.userId ?? profile.id ?? profile.user_id ?? profile.usuarioId ?? fallbackUser?.id;
  const candidateName =
    profile.userName ?? profile.username ?? profile.user_name ?? profile.name ?? fallbackUser?.username;
  const candidateRole = profile.role ?? fallbackUser?.role ?? '';

  return {
    id: String(candidateId ?? ''),
    username: candidateName || '',
    role: candidateRole,
  };
};

export const AuthProvider = ({ children }) => {
  const [sessionState, setSessionState] = useState(getSession());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((nextSession) => {
    persistSession(nextSession);
    setSessionState(nextSession);
  }, []);

  const handleAuthFailure = useCallback(() => {
    clearSession();
    setSessionState(null);
    setAuthError('Tu sesion expiro. Inicia sesion de nuevo.');
  }, []);

  useEffect(() => {
    setAuthFailureHandler(handleAuthFailure);

    return () => {
      setAuthFailureHandler(() => {});
    };
  }, [handleAuthFailure]);

  const validateStoredSession = useCallback(async () => {
    const stored = getSession();
    const uberToken = localStorage.getItem('uber_eats_token');

    // Si hay token Uber y no hay sesión, crear una sesión local
    if (uberToken && !stored?.accessToken) {
      const localSession = {
        accessToken: uberToken,
        user: {
          id: 'uber-user',
          username: 'Uber POS',
          role: 'user',
        },
        provider: 'uber',
      };
      applySession(localSession);
      setIsLoadingAuth(false);
      return;
    }

    if (!stored?.accessToken) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      const profile = await getCurrentUserProfile(stored.accessToken);
      const normalizedUser = normalizeProfile(profile, stored.user);
      applySession({ ...stored, user: normalizedUser });
      setAuthError(null);
    } catch {
      try {
        if (!stored.refreshToken) {
          throw new Error('Sin refresh token');
        }

        const refreshed = await refreshAccessToken(stored.refreshToken);
        const profile = await getCurrentUserProfile(refreshed.accessToken);
        const normalizedUser = normalizeProfile(profile, refreshed.user || stored.user);
        applySession({
          ...stored,
          ...refreshed,
          user: normalizedUser,
        });
        setAuthError(null);
      } catch {
        clearSession();
        setSessionState(null);
        setAuthError('No se pudo restaurar la sesion guardada.');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, [applySession]);

  useEffect(() => {
    validateStoredSession();
  }, [validateStoredSession]);

  const login = useCallback(
    async ({ username, password }) => {
      setAuthError(null);
      const authSession = await loginWithCredentials({ username, password });

      let normalizedUser = authSession.user;
      try {
        const profile = await getCurrentUserProfile(authSession.accessToken);
        normalizedUser = normalizeProfile(profile, authSession.user);
      } catch {
        // Si no hay perfil, usar la data del login.
      }

      const nextSession = {
        ...authSession,
        user: normalizedUser,
      };

      applySession(nextSession);
      return nextSession;
    },
    [applySession]
  );

  const register = useCallback(async (payload) => {
    const createdUser = await registerNewUser(payload);
    return createdUser;
  }, []);

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    try {
      if (accessToken) {
        await revokeCurrentSession(accessToken, refreshToken);
      }
    } catch {
      // Si revoke falla igual se limpia sesion local.
    }

    // Limpiar también el token Uber Eats
    localStorage.removeItem('uber_eats_token');

    clearSession();
    setSessionState(null);
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => {
      // Verificar si hay token de Uber Eats en localStorage
      const uberToken = localStorage.getItem('uber_eats_token');
      const isAuthenticated = Boolean(sessionState?.accessToken) || Boolean(uberToken);

      return {
        user: sessionState?.user || null,
        accessToken: sessionState?.accessToken || null,
        isAuthenticated: isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        register,
        logout,
      };
    },
    [authError, isLoadingAuth, login, logout, register, sessionState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
