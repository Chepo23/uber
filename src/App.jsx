import { useState } from 'react'
import { OrderProvider } from './context/OrderContext'
import { UtensilsCrossed, BarChart3, ClipboardList, Store, Car } from 'lucide-react'
import './App.css'
import Dashboard from './components/Dashboard'
import Menu from './components/Menu'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import UberEatsPanel from './components/UberEatsPanel'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <OrderProvider>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-brand">
            <UtensilsCrossed size={28} style={{ display: 'inline-block', marginRight: '10px' }} />
            <h1>POS System - Uber Eats Integration</h1>
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

export default App
