import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, UserRound, LogIn, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import uberOAuthService from '../services/uberOAuthService';
import './Login.css';

export default function Login() {
  const { login, register, authError } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterInputChange = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const clearAlerts = () => {
    setLocalError('');
    setLocalSuccess('');
  };

  const switchMode = (mode) => {
    setViewMode(mode);
    clearAlerts();
  };

  const handleUberEatsLogin = () => {
    const authUrl = uberOAuthService.getAuthorizationURL();
    window.location.href = authUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setLocalError('Captura usuario y contrasena para continuar.');
      return;
    }

    clearAlerts();
    setSubmitting(true);

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
    } catch (error) {
      setLocalError(error.message || 'No fue posible iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!registerData.username.trim() || !registerData.password.trim()) {
      setLocalError('Usuario y contrasena son obligatorios para crear cuenta.');
      return;
    }

    if (registerData.password.length < 8) {
      setLocalError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setLocalError('Las contrasenas no coinciden.');
      return;
    }

    clearAlerts();
    setSubmitting(true);

    try {
      await register({
        username: registerData.username.trim(),
        password: registerData.password,
        firstName: registerData.firstName.trim(),
        email: registerData.email.trim(),
        role: 'user',
        notes: 'Creado desde POS Web',
      });

      setLocalSuccess('Cuenta creada en Sierra. Ahora puedes iniciar sesion.');
      setRegisterData({
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        email: '',
      });
      setViewMode('login');
    } catch (error) {
      setLocalError(error.message || 'No fue posible crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mode-toggle">
          <button
            type="button"
            className={viewMode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            className={viewMode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Crear cuenta
          </button>
        </div>

        {viewMode === 'login' ? (
          <>
            <h1>Acceso a POS Sierra</h1>
            <p className="login-subtitle">Inicia sesion para administrar ordenes con tu cuenta.</p>

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-label" htmlFor="username">
                <UserRound size={16} />
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
                placeholder="usuario"
              />

              <label className="login-label" htmlFor="password">
                <LockKeyhole size={16} />
                Contrasena
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                placeholder="********"
              />

              {(localError || authError) && <p className="login-error">{localError || authError}</p>}
              {localSuccess && <p className="login-success">{localSuccess}</p>}

              <button type="submit" className="login-btn" disabled={submitting}>
                <LogIn size={16} />
                {submitting ? 'Entrando...' : 'Iniciar sesion'}
              </button>
            </form>

            <div className="login-divider">
              <span>O conecta con Uber Eats</span>
            </div>

            <button 
              type="button" 
              className="uber-login-btn" 
              onClick={handleUberEatsLogin}
            >
              <Car size={16} />
              Conectar con Uber Eats (Sandbox)
            </button>
          </>
        ) : (
          <>
            <h1>Crear Cuenta</h1>
            <p className="login-subtitle">Este registro se envia directo a servicios de Sierra.</p>

            <form onSubmit={handleRegisterSubmit} className="login-form">
              <label className="login-label" htmlFor="reg-firstName">
                <UserRound size={16} />
                Nombre
              </label>
              <input
                id="reg-firstName"
                name="firstName"
                type="text"
                value={registerData.firstName}
                onChange={handleRegisterInputChange}
                placeholder="Nombre"
              />

              <label className="login-label" htmlFor="reg-username">
                <UserRound size={16} />
                Usuario
              </label>
              <input
                id="reg-username"
                name="username"
                type="text"
                value={registerData.username}
                onChange={handleRegisterInputChange}
                autoComplete="username"
                placeholder="nuevo_usuario"
              />

              <label className="login-label" htmlFor="reg-email">
                <UserRound size={16} />
                Email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                placeholder="correo@dominio.com"
              />

              <label className="login-label" htmlFor="reg-password">
                <LockKeyhole size={16} />
                Contrasena
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                autoComplete="new-password"
                placeholder="Minimo 8 caracteres"
              />

              <label className="login-label" htmlFor="reg-confirmPassword">
                <LockKeyhole size={16} />
                Confirmar contrasena
              </label>
              <input
                id="reg-confirmPassword"
                name="confirmPassword"
                type="password"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                autoComplete="new-password"
                placeholder="Repite la contrasena"
              />

              {(localError || authError) && <p className="login-error">{localError || authError}</p>}
              {localSuccess && <p className="login-success">{localSuccess}</p>}

              <button type="submit" className="login-btn" disabled={submitting}>
                <LogIn size={16} />
                {submitting ? 'Creando...' : 'Crear cuenta'}
              </button>
            </form>

            <div className="login-divider">
              <span>O conecta con Uber Eats</span>
            </div>

            <button 
              type="button" 
              className="uber-login-btn" 
              onClick={handleUberEatsLogin}
            >
              <Car size={16} />
              Conectar con Uber Eats (Sandbox)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
