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
      
      // Transformar datos de Uber (puede venir del webhook o de la API)
      const transformedOrders = (orders || []).map(order => {
        // Si viene del webhook, usar estructura diferente
        const rawData = order.rawData || order;
        
        return {
          id: order.id || order.orderId || order.order_id || 'unknown',
          customer: order.customer || rawData.customer_name || order.consumer?.name || 'Cliente Desconocido',
          phone: rawData.customer_phone || order.consumer?.phone || 'N/A',
          address: rawData.delivery_address || order.delivery_address?.address || 'N/A',
          items: order.items || rawData.items || [],
          total: order.total || rawData.total || 0,
          status: order.status || rawData.status || 'pending',
          paymentStatus: order.paymentStatus || rawData.payment_status || 'complete',
          timestamp: new Date(order.timestamp || rawData.created_at || Date.now()),
          deliveryTime: rawData.estimated_pickup_time ? `${rawData.estimated_pickup_time} min` : 'Sin ETA'
        };
      });

      setUberOrders(transformedOrders);
      setError(null);
      console.log('✅ Órdenes cargadas:', transformedOrders.length);
    } catch (err) {
      console.error('❌ Error cargando órdenes:', err);
      setError('Error al cargar órdenes de Uber Eats: ' + err.message);
      // Si no hay órdenes, mostrar vacío
      setUberOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      // Aceptar la orden y cambiar estado a "preparing"
      await uberEatsService.acceptOrder(orderId);
      await uberEatsService.updateOrderStatus(orderId, 'preparing');
      await loadUberOrders();
      alert('✅ Orden aceptada - Preparando');
    } catch (err) {
      alert('❌ Error al confirmar: ' + err.message);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await uberEatsService.updateOrderStatus(orderId, 'ready');
      await loadUberOrders();
      alert('✅ Orden lista para entrega');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt('¿Por qué cancelas esta orden?');
    if (!reason) return;
    
    try {
      await uberEatsService.updateOrderStatus(orderId, 'cancelled');
      await loadUberOrders();
      alert('❌ Orden cancelada');
    } catch (err) {
      alert('❌ Error al cancelar: ' + err.message);
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
                
                {(order.status === 'preparing' || order.status === 'accepted') && (
                  <>
                    <button 
                      className="status-btn ready-btn"
                      onClick={() => handleMarkReady(order.id)}
                    >
                      <Check size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      ✅ Listo para Entrega
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <X size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                      Cancelar
                    </button>
                  </>
                )}

                {order.status === 'ready' && (
                  <div className="order-status-final">
                    <p style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Orden lista para entrega</p>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="order-status-final">
                    <p style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Orden cancelada</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

