import { useContext, useEffect } from 'react';
import { OrderContext } from '../context/OrderContext';
import restaurantApi from '../services/restaurantApi';
import './OrderList.css';
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function OrderList({ platform = 'all' }) {
  const { orders, uberOrders, setActiveOrder, deleteOrder, updateOrder, activeOrder } = useContext(OrderContext);

  const getFilteredOrders = () => {
    let filtered = orders || [];
    if (platform === 'ubereats') {
      return (uberOrders || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (platform === 'local') {
      filtered = (orders || []).filter(o => o.platform === 'local');
    }
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const handleStatusChange = (orderId, newStatus) => {
    if (platform === 'ubereats') {
      // Actualizar en Uber Eats
      updateOrder(orderId, { status: newStatus });
    } else {
      updateOrder(orderId, { status: newStatus });
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="order-list-container">
      <h2>{platform === 'ubereats' ? 'Órdenes Uber Eats' : 'Todas las Órdenes'}</h2>
      
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>No hay órdenes</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className={`order-card ${activeOrder?.id === order.id ? 'active' : ''}`}
              onClick={() => setActiveOrder(order)}
            >
              <div className="order-header">
                <div className="order-id">#{order.id.substring(0, 8)}</div>
                <div 
                  className="order-status" 
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="order-info">
                <p><strong>Cliente:</strong> {order.customer || 'N/A'}</p>
                <p><strong>Total:</strong> {formatPrice(order.total)}</p>
                <p><strong>Items:</strong> {order.items?.length || 0}</p>
                <p><strong>Hora:</strong> {formatDate(order.timestamp)}</p>
              </div>

              <div className="order-actions">
                <select 
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="status-select"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">Preparando</option>
                  <option value="ready">Listo</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>

                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOrder(order.id);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
