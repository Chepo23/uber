// Servicio para manejar OAuth flow de Uber Eats

const CLIENT_ID = import.meta.env.VITE_UBER_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_UBER_REDIRECT_URI;
const OAUTH_URL = import.meta.env.VITE_UBER_OAUTH_URL;
const TOKEN_URL = import.meta.env.VITE_UBER_TOKEN_URL;
const API_BASE_URL = import.meta.env.VITE_UBER_API_BASE_URL;

class UberOAuthService {
  constructor() {
    this.tokenKey = 'uber_eats_token';
    this.refreshTokenKey = 'uber_eats_refresh_token';
  }

  /**
   * Genera URL de login para Uber OAuth
   * @returns {string} URL para redirigir al usuario
   */
  getAuthorizationURL() {
    // Scope correcto para Uber Eats POS
    const scope = 'eats.pos_provisioning';

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: scope,
      response_type: 'code',
      state: this.generateState() // Protección CSRF
    });

    const authUrl = `${OAUTH_URL}?${params.toString()}`;
    
    // Log para debugging
    console.log('🔐 Uber OAuth URL generada:');
    console.log('Client ID:', CLIENT_ID);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Scope:', scope);
    console.log('URL completa:', authUrl);

    return authUrl;
  }

  /**
   * Genera un state aleatorio para protección CSRF
   */
  generateState() {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  /**
   * Valida el state recibido en callback
   */
  validateState(receivedState) {
    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    return receivedState === storedState;
  }

  /**
   * Intercambia authorization code por access token
   * NOTA: Esto debería hacerse en el backend para proteger el client_secret
   */
  async exchangeCodeForToken(authCode, clientSecret) {
    try {
      // 🚨 IMPORTANTE: Esta llamada debe hacerse desde tu backend
      // No exponer client_secret en el cliente
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: CLIENT_ID,
          client_secret: clientSecret, // ⚠️ NUNCA enviar esto desde frontend!
          redirect_uri: REDIRECT_URI
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Intercambia authorization code por access token (desde backend)
   * Este es el enfoque recomendado y seguro
   */
  async exchangeCodeForTokenViaBackend(authCode) {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const callbackUrl = `${backendUrl}/auth/uber/callback`;

      console.log('🔄 Intercambiando código en backend...');
      console.log('   Backend URL:', callbackUrl);
      console.log('   Auth Code:', authCode.substring(0, 20) + '...');

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          redirect_uri: import.meta.env.VITE_UBER_REDIRECT_URI
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Backend token exchange failed:');
        console.error('   Status:', response.status);
        console.error('   Error:', data.error);
        console.error('   Description:', data.error_description);
        throw new Error(`Backend error: ${data.error_description || data.error}`);
      }

      console.log('✅ Token obtenido del backend:');
      console.log('   Access Token:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'N/A');
      console.log('   Token Type:', data.token_type);
      console.log('   Expires In:', data.expires_in);

      this.storeTokens(data);
      return data;
    } catch (error) {
      console.error('❌ Error intercambiando código via backend:', error);
      throw error;
    }
  }

  /**
   * Almacena tokens en localStorage
   */
  storeTokens(tokens) {
    if (tokens.access_token) {
      localStorage.setItem(this.tokenKey, tokens.access_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem(this.refreshTokenKey, tokens.refresh_token);
    }
  }

  /**
   * Obtiene el access token almacenado
   */
  getAccessToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtiene el refresh token almacenado
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
          // client_secret también se necesitaría aquí - hacer desde backend!
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Limpia los tokens almacenados
   */
  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Verifica si hay un token válido
   */
  hasValidToken() {
    return !!this.getAccessToken();
  }

  /**
   * Headers para requests autenticados
   */
  getAuthHeaders() {
    const token = this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}

export default new UberOAuthService();
