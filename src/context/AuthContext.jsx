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

    // Si hay sesión guardada, usarla directamente (confianza en token guardado)
    if (stored?.accessToken) {
      applySession(stored);
      setIsLoadingAuth(false);
      
      // Validar en background sin bloquear UI
      // (solo si hay acceso a API disponible)
      try {
        if (stored.refreshToken) {
          // Opcional: refresh silencioso en background
          // const refreshed = await refreshAccessToken(stored.refreshToken);
        }
      } catch (err) {
        // Silencioso - mantener sesión guardada
        console.log('Validation check skipped (API unavailable)');
      }
      return;
    }

    setIsLoadingAuth(false);
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

  // ✅ Aplicar una sesión ya completa sin validación (para login local)
  const applyDirectSession = useCallback(
    (session) => {
      if (!session?.accessToken || !session?.user) {
        throw new Error('Sesión inválida');
      }
      applySession(session);
      setAuthError(null);
      return session;
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
        applyDirectSession,
      };
    },
    [authError, isLoadingAuth, login, logout, register, sessionState, applyDirectSession]
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
