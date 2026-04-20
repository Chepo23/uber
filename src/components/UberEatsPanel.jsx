import { useContext, useEffect } from 'react';
import { OrderContext } from '../context/OrderContext';
import uberEatsApi from '../services/uberEatsApi';
import { RefreshCw, Check, X } from 'lucide-react';
import './UberEatsPanel.css';
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function UberEatsPanel() {
  const { uberOrders, setUberOrders, addUberOrder, updateUberOrder, setLoading, setError } = useContext(OrderContext);

  useEffect(() => {
    loadUberOrders();
  }, []);

  const loadUberOrders = async () => {
    setLoading(true);
    try {
      const data = await uberEatsApi.getUberOrders();
      setUberOrders(data.orders || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar órdenes de Uber Eats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await uberEatsApi.confirmOrder(orderId);
      updateUberOrder(orderId, { status: 'confirmed' });
      alert('Orden confirmada');
    } catch (err) {
      alert('Error al confirmar la orden');
      console.error(err);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('¿Por qué rechazas esta orden?');
    if (!reason) return;

    try {
      await uberEatsApi.rejectOrder(orderId, reason);
      updateUberOrder(orderId, { status: 'cancelled' });
      alert('Orden rechazada');
    } catch (err) {
      alert('Error al rechazar la orden');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await uberEatsApi.updateUberOrderStatus(orderId, status);
      updateUberOrder(orderId, { status });
    } catch (err) {
      alert('Error al actualizar estado');
      console.error(err);
    }
  };

  return (
    <div className="uber-panel-container">
      <div className="uber-header">
        <h2>Órdenes de Uber Eats</h2>
        <button className="refresh-btn" onClick={loadUberOrders}>
          <RefreshCw size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
          Actualizar
        </button>
      </div>

      {uberOrders.length === 0 ? (
        <div className="empty-uber-state">
          <p>No hay órdenes de Uber Eats</p>
        </div>
      ) : (
        <div className="uber-orders-list">
          {uberOrders.map(order => (
            <div key={order.id} className="uber-order-card">
              <div className="uber-order-header">
                <div className="uber-order-id">{order.id}</div>
                <div 
                  className="uber-order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="uber-order-content">
                <div className="customer-section">
                  <h4>{order.customer}</h4>
                  <p><strong>Teléfono:</strong> {order.phone}</p>
                  <p><strong>Dirección:</strong> {order.address}</p>
                </div>

                <div className="items-section">
                  <h4>Productos:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} <strong>x{item.quantity}</strong> - {formatPrice(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-meta">
                  <p><strong>Total:</strong> {formatPrice(order.total)}</p>
                  <p><strong>Tiempo de entrega:</strong> {order.deliveryTime}</p>
                  <p><strong>Hora:</strong> {formatDate(order.timestamp)}</p>
                </div>
              </div>

              <div className="uber-order-actions">
                {order.status === 'pending' && (
                  <>
                    <button 
                      className="confirm-btn"
                      onClick={() => handleConfirmOrder(order.id)}
                    >
                      <Check size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      Confirmar
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleRejectOrder(order.id)}
                    >
                      <X size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      Rechazar
                    </button>
                  </>
                )}
                
                {order.status === 'confirmed' && (
                  <>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    >
                      Iniciando Preparación
                    </button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                    >
                      Marcar como Listo
                    </button>
                  </>
                )}

                {order.status === 'ready' && (
                  <>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    >
                      Entregado
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
