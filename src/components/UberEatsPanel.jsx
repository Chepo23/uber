import { useContext, useEffect } from 'react';
import { OrderContext } from '../context/OrderContext';
import uberEatsService from '../services/uberEatsService';
import { RefreshCw, Check, X, Clock } from 'lucide-react';
import './UberEatsPanel.css';
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function UberEatsPanel() {
  const { uberOrders, setUberOrders, setLoading, setError } = useContext(OrderContext);

  useEffect(() => {
    loadUberOrders();
  }, []);

  const loadUberOrders = async () => {
    setLoading(true);
    try {
      console.log('📨 Cargando órdenes de Uber Eats...');
      const orders = await uberEatsService.getOrders();
      
      // Transformar datos de Uber al formato de la app
      const transformedOrders = (orders || []).map(order => ({
        id: order.id || order.order_id,
        customer: order.consumer?.name || 'Cliente Desconocido',
        phone: order.consumer?.phone || 'N/A',
        address: order.delivery_address?.address || 'N/A',
        items: order.items || [],
        total: order.pricing?.total || 0,
        status: order.status || 'pending',
        timestamp: new Date(order.created_at || Date.now()),
        deliveryTime: order.eta || 'Sin ETA'
      }));

      setUberOrders(transformedOrders);
      setError(null);
      console.log('✅ Órdenes cargadas:', transformedOrders.length);
    } catch (err) {
      console.error('❌ Error cargando órdenes:', err);
      setError('Error al cargar órdenes de Uber Eats: ' + err.message);
      // Cargar datos demo si falla la API
      setUberOrders(getDemoOrders());
    } finally {
      setLoading(false);
    }
  };

  const getDemoOrders = () => {
    return [
      {
        id: 'UBER-001',
        customer: 'Juan Pérez',
        phone: '+1234567890',
        address: 'Calle Principal 123',
        items: [
          { name: 'Hamburguesa Doble', quantity: 2, price: 8.99 },
          { name: 'Refresco', quantity: 2, price: 2.99 }
        ],
        total: 23.96,
        status: 'pending',
        timestamp: new Date(Date.now() - 5 * 60000),
        deliveryTime: '30-45 min'
      },
      {
        id: 'UBER-002',
        customer: 'María González',
        phone: '+1234567891',
        address: 'Av. Secundaria 456',
        items: [
          { name: 'Pizza Pepperoni', quantity: 1, price: 12.99 },
          { name: 'Ensalada', quantity: 1, price: 6.99 }
        ],
        total: 19.98,
        status: 'confirmed',
        timestamp: new Date(Date.now() - 15 * 60000),
        deliveryTime: '25-35 min'
      }
    ];
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await uberEatsService.acceptOrder(orderId);
      await loadUberOrders();
      alert('Orden confirmada');
    } catch (err) {
      alert('Error al confirmar la orden: ' + err.message);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('¿Por qué rechazas esta orden?') || 'OUT_OF_STOCK';
    if (!reason) return;

    try {
      await uberEatsService.rejectOrder(orderId, reason);
      await loadUberOrders();
      alert('Orden rechazada');
    } catch (err) {
      alert('Error al rechazar la orden: ' + err.message);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await uberEatsService.updateOrderStatus(orderId, status);
      await loadUberOrders();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  return (
    <div className="uber-panel-container">
      <div className="uber-header">
        <h2>🚗 Órdenes de Uber Eats</h2>
        <button className="refresh-btn" onClick={loadUberOrders}>
          <RefreshCw size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
          Actualizar
        </button>
      </div>

      {uberOrders.length === 0 ? (
        <div className="empty-uber-state">
          <p>📭 No hay órdenes de Uber Eats</p>
          <small>Las órdenes aparecerán aquí cuando se creen en Uber</small>
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
                  <p><strong>📱 Teléfono:</strong> {order.phone}</p>
                  <p><strong>📍 Dirección:</strong> {order.address}</p>
                </div>

                <div className="items-section">
                  <h4>📦 Productos:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name || item.description} <strong>x{item.quantity}</strong>
                        {item.price && ` - ${formatPrice(item.price * item.quantity)}`}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-meta">
                  <p><strong>💰 Total:</strong> {formatPrice(order.total)}</p>
                  <p><strong>⏱️ ETA:</strong> {order.deliveryTime}</p>
                  <p><strong>🕐 Hora:</strong> {formatDate(order.timestamp)}</p>
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
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    >
                      <Clock size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      Iniciando Preparación
                    </button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                    >
                      <Check size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      Marcar como Listo
                    </button>
                  </>
                )}

                {order.status === 'ready' && (
                  <>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                    >
                      <Check size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
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

