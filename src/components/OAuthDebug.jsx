import { useState } from 'react';
import uberOAuthService from '../services/uberOAuthService';

export default function OAuthDebug() {
  const [authUrl, setAuthUrl] = useState('');

  const handleGenerateUrl = () => {
    const url = uberOAuthService.getAuthorizationURL();
    setAuthUrl(url);
    console.log('URL generada:', url);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        width: '100%'
      }}>
        <h1>🔍 Debugging OAuth URL</h1>
        
        <button
          onClick={handleGenerateUrl}
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Generar URL de OAuth
        </button>

        {authUrl && (
          <div style={{ marginTop: '30px' }}>
            <h2>URL Generada:</h2>
            <div style={{
              backgroundColor: '#f0f0f0',
              padding: '20px',
              borderRadius: '6px',
              marginBottom: '20px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {authUrl}
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>⚠️ Instrucciones:</strong>
              <ol>
                <li>Abre DevTools (F12) → Console</li>
                <li>Haz scroll arriba para ver el log "🔐 Uber OAuth URL generada:"</li>
                <li>Copia la URL completa que se muestra</li>
                <li>Compárala con lo que registraste en Uber Developers</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.href = authUrl}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✓ Si se ve bien, haz click aquí para ir a Uber OAuth
            </button>
          </div>
        )}

        <div style={{
          marginTop: '40px',
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#666'
        }}>
          <h3>📋 Checklist de Verificación:</h3>
          <ul>
            <li>✓ Client ID: <code>bk1eINyRuX6kZUxVpVduze0MyVfjx91f</code></li>
            <li>✓ Redirect URI: <code>http://localhost:5173/auth/callback</code></li>
            <li>✓ Redirect URI registrada en Uber Developers: ¿Coincide exactamente?</li>
            <li>✓ Scopes: <code>eats.order eats.store eats.menu</code></li>
            <li>✓ OAuth URL: <code>https://sandbox-login.uber.com/oauth/v2/authorize</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
