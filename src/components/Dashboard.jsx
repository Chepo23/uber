import { useContext } from 'react';
import { OrderContext } from '../context/OrderContext';
import { CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatPrice, formatDate } from '../utils/helpers';
import './Dashboard.css';

export default function Dashboard() {
  const { orders, uberOrders } = useContext(OrderContext);

  const getOrderStats = () => {
    const localOrders = (orders || []).filter(o => o.platform === 'local');
    const localPending = localOrders.filter(o => o.status === 'pending').length;
    const localCompleted = localOrders.filter(o => o.status === 'delivered').length;
    
    const uberPending = (uberOrders || []).filter(o => o.status === 'pending').length;
    const uberCompleted = (uberOrders || []).filter(o => o.status === 'delivered').length;

    const localRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const uberRevenue = (uberOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const totalRevenue = localRevenue + uberRevenue;

    return {
      localPending,
      localCompleted,
      uberPending,
      uberCompleted,
      totalRevenue,
      totalOrders: (orders?.length || 0) + (uberOrders?.length || 0)
    };
  };

  const stats = getOrderStats();

  // Resumen del día
  const getDaySummary = () => {
    const allOrders = [...(orders || []), ...(uberOrders || [])];
    const completedOrders = allOrders.filter(o => o.status === 'delivered');
    const avgTicket = completedOrders.length > 0 
      ? completedOrders.reduce((sum, o) => sum + (o.total || 0), 0) / completedOrders.length
      : 0;
    
    const now = new Date();
    const sessionStart = new Date(now.getTime() - 8 * 60 * 60 * 1000); // Asumiendo 8 horas de sesión
    
    return {
      sessionStart: sessionStart.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      ordersToday: allOrders.length,
      avgTicket,
      bestHour: 'N/A'
    };
  };

  // Últimas órdenes completadas
  const getLastCompletedOrders = () => {
    const allOrders = [...(orders || []), ...(uberOrders || [])];
    return allOrders
      .filter(o => o.status === 'delivered')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  // Datos para gráfico
  const getChartData = () => {
    const localCount = (orders || []).length;
    const uberCount = (uberOrders || []).length;
    return [
      { name: 'Órdenes Locales', value: localCount, color: '#4CAF50' },
      { name: 'Uber Eats', value: uberCount, color: '#FF6B00' }
    ];
  };

  const daySummary = getDaySummary();
  const lastOrders = getLastCompletedOrders();
  const chartData = getChartData();

  return (
    <div className="dashboard-container">
      <h2>Dashboard - Sistema POS</h2>
      
      <div className="stats-grid">
        <div className="stat-card local">
          <div className="stat-title">Órdenes Locales</div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-detail">
            <span className="pending">{stats.localPending} pendientes</span>
            <span className="completed">{stats.localCompleted} completadas</span>
          </div>
        </div>

        <div className="stat-card uber">
          <div className="stat-title">Órdenes Uber Eats</div>
          <div className="stat-value">{uberOrders.length}</div>
          <div className="stat-detail">
            <span className="pending">{stats.uberPending} pendientes</span>
            <span className="completed">{stats.uberCompleted} completadas</span>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-title">Ingresos Totales</div>
          <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-detail">Todas las plataformas</div>
        </div>

        <div className="stat-card total">
          <div className="stat-title">Total de Órdenes</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-detail">Sesión actual</div>
        </div>
      </div>

      {/* Resumen del Día */}
      <div className="summary-section">
        <div className="summary-card">
          <Clock size={24} />
          <div className="summary-content">
            <p className="summary-label">Inicio de Sesión</p>
            <p className="summary-value">{daySummary.sessionStart}</p>
          </div>
        </div>

        <div className="summary-card">
          <Zap size={24} />
          <div className="summary-content">
            <p className="summary-label">Órdenes Hoy</p>
            <p className="summary-value">{daySummary.ordersToday}</p>
          </div>
        </div>

        <div className="summary-card">
          <TrendingUp size={24} />
          <div className="summary-content">
            <p className="summary-label">Ticket Promedio</p>
            <p className="summary-value">{formatPrice(daySummary.avgTicket)}</p>
          </div>
        </div>

        <div className="summary-card">
          <CheckCircle size={24} />
          <div className="summary-content">
            <p className="summary-label">Mejor Horario</p>
            <p className="summary-value">{daySummary.bestHour}</p>
          </div>
        </div>
      </div>

      {/* Sección de Últimas Órdenes y Gráfico */}
      <div className="content-section">
        <div className="last-orders-container">
          <h3>Últimas Órdenes Completadas</h3>
          {lastOrders.length === 0 ? (
            <p className="no-data">Sin órdenes completadas</p>
          ) : (
            <div className="orders-table">
              <div className="table-header">
                <div className="col-customer">Cliente</div>
                <div className="col-total">Total</div>
                <div className="col-platform">Plataforma</div>
                <div className="col-time">Hora</div>
              </div>
              {lastOrders.map(order => (
                <div key={order.id} className="table-row">
                  <div className="col-customer">{order.customer || 'N/A'}</div>
                  <div className="col-total">{formatPrice(order.total)}</div>
                  <div className="col-platform">
                    <span className={`platform-badge ${order.platform}`}>
                      {order.platform === 'ubereats' ? 'Uber Eats' : 'Local'}
                    </span>
                  </div>
                  <div className="col-time">{formatDate(order.timestamp).split(' ')[1]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>Órdenes por Plataforma</h3>
          {chartData.every(d => d.value === 0) ? (
            <p className="no-data">Sin datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
