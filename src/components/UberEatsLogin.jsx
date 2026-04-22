import { useCallback } from 'react';
import uberOAuthService from '../services/uberOAuthService';
import { LogIn } from 'lucide-react';

export default function UberEatsLogin() {
  const handleLoginClick = useCallback(() => {
    // Generar URL de autorización
    const authUrl = uberOAuthService.getAuthorizationURL();
    
    // Redirigir al usuario a Uber OAuth
    window.location.href = authUrl;
  }, []);

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
        padding: '60px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#000' }}>POS System - Uber Eats</h1>
        <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
          Conecta tu cuenta de Uber Eats para gestionar órdenes desde aquí
        </p>

        <button
          onClick={handleLoginClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 32px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
        >
          <LogIn size={20} />
          Conectar con Uber Eats (Sandbox)
        </button>

        <div style={{
          marginTop: '30px',
          paddingTop: '30px',
          borderTop: '1px solid #eee',
          color: '#999',
          fontSize: '12px'
        }}>
          <p>Se te redirigirá a Uber para autenticar tu cuenta.</p>
          <p>Asegúrate de estar usando una cuenta de sandbox.</p>
        </div>
      </div>
    </div>
  );
}
