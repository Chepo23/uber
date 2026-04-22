import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { OrderProvider } from './context/OrderContext'
import { useAuth } from './context/AuthContext'
import { UtensilsCrossed, BarChart3, ClipboardList, Store, Car, LogOut, UserRound } from 'lucide-react'
import './App.css'
import Dashboard from './components/Dashboard'
import Menu from './components/Menu'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import UberEatsPanel from './components/UberEatsPanel'
import Login from './components/Login'
import OAuthCallback from './components/OAuthCallback'
import OAuthDebug from './components/OAuthDebug'
import UberEatsLogin from './components/UberEatsLogin'

// Componente wrapper para las rutas protegidas
function ProtectedLayout({ children }) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <OrderProvider>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-top-row">
            <div className="navbar-brand">
              <UtensilsCrossed size={28} style={{ display: 'inline-block', marginRight: '10px' }} />
              <h1>POS System - Uber Eats Integration</h1>
            </div>

            <div className="session-box">
              <div className="session-user">
                <UserRound size={16} />
                <span>{user?.username || 'Usuario'}</span>
              </div>
              <button className="logout-btn" onClick={logout}>
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </div>

          <ul className="navbar-menu">
            <li>
              <button 
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                <ClipboardList size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                Crear Orden
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <Store size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                Órdenes Locales
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'uber' ? 'active' : ''}`}
                onClick={() => setActiveTab('uber')}
              >
                <Car size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                Uber Eats
              </button>
            </li>
          </ul>
        </nav>

        <div className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'menu' && <Menu />}
          {activeTab === 'orders' && (
            <div className="two-column-layout">
              <OrderList platform="local" />
              <OrderDetail />
            </div>
          )}
          {activeTab === 'uber' && <UberEatsPanel />}
        </div>
      </div>
    </OrderProvider>
  )
}

function AppContent() {
  const { isAuthenticated, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">Validando sesion...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/uber-login" element={<UberEatsLogin />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/oauth-debug" element={<OAuthDebug />} />
      
      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <ProtectedLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/orders" element={
                  <div className="two-column-layout">
                    <OrderList platform="local" />
                    <OrderDetail />
                  </div>
                } />
                <Route path="/uber" element={<UberEatsPanel />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ProtectedLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
