import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import uberOAuthService from '../services/uberOAuthService';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('procesando');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Obtener parámetros de la URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const callbackError = params.get('error');

      // Validar parámetros
      if (callbackError) {
        throw new Error(`Uber OAuth error: ${callbackError}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Validar state (CSRF protection)
      if (!uberOAuthService.validateState(state)) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      setStatus('intercambiando_codigo');

      // Opción 1: Intercambiar código desde el backend (RECOMENDADO)
      try {
        await uberOAuthService.exchangeCodeForTokenViaBackend(code);
        setStatus('exitoso');
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (backendError) {
        console.warn('Backend exchange failed, attempting client-side (NOT RECOMMENDED):', backendError);
        
        // Opción 2: Intercambiar desde el cliente (menos seguro)
        // Necesitarías obtener el client_secret de alguna forma segura
        throw new Error('Backend exchange failed. Configure backend endpoint for token exchange.');
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        {status === 'procesando' && (
          <>
            <h2>Conectando con Uber Eats...</h2>
            <div style={{ margin: '20px 0' }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #000',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
            <p>Por favor espera mientras validamos tu autenticación...</p>
          </>
        )}

        {status === 'intercambiando_codigo' && (
          <>
            <h2>Validando credentials...</h2>
            <div style={{ margin: '20px 0' }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #000',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
            <p>Intercambiando código por token...</p>
          </>
        )}

        {status === 'exitoso' && (
          <>
            <h2 style={{ color: '#4CAF50' }}>✓ Autenticación Exitosa</h2>
            <p>Tu cuenta de Uber Eats ha sido conectada correctamente.</p>
            <p style={{ color: '#999', fontSize: '14px' }}>Redirigiendo al dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ color: '#f44336' }}>✗ Error en Autenticación</h2>
            <p>{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
