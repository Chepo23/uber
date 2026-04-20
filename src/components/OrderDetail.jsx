import { useContext, useState } from 'react';
import { OrderContext } from '../context/OrderContext';
import './OrderDetail.css';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function OrderDetail() {
  const { activeOrder, updateOrder, addOrder } = useContext(OrderContext);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState(activeOrder?.customer || '');

  if (!activeOrder) {
    return (
      <div className="order-detail-empty">
        <p>Selecciona una orden para ver los detalles</p>
      </div>
    );
  }

  const handleSaveCustomer = () => {
    updateOrder(activeOrder.id, { customer: customerName });
    setEditingCustomer(false);
  };

  return (
    <div className="order-detail-container">
      <div className="detail-header">
        <h2>Orden #{activeOrder.id.substring(0, 8)}</h2>
        <span 
          className="detail-status"
          style={{ backgroundColor: getStatusColor(activeOrder.status) }}
        >
          {getStatusLabel(activeOrder.status)}
        </span>
      </div>

      <div className="detail-section">
        <h3>Información del Cliente</h3>
        {editingCustomer ? (
          <div className="edit-customer">
            <input 
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
            />
            <button onClick={handleSaveCustomer}>Guardar</button>
            <button onClick={() => setEditingCustomer(false)}>Cancelar</button>
          </div>
        ) : (
          <div>
            <p><strong>Nombre:</strong> {activeOrder.customer || 'No especificado'}</p>
            <button 
              className="edit-btn"
              onClick={() => setEditingCustomer(true)}
            >
              Editar
            </button>
          </div>
        )}
        {activeOrder.phone && <p><strong>Teléfono:</strong> {activeOrder.phone}</p>}
        {activeOrder.address && <p><strong>Dirección:</strong> {activeOrder.address}</p>}
      </div>

      <div className="detail-section">
        <h3>Productos ({activeOrder.items?.length || 0})</h3>
        {activeOrder.items && activeOrder.items.length > 0 ? (
          <div className="items-list">
            {activeOrder.items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">x{item.quantity}</span>
                <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay productos</p>
        )}
      </div>

      <div className="detail-section">
        <h3>Detalles</h3>
        <p><strong>Total:</strong> {formatPrice(activeOrder.total)}</p>
        <p><strong>Plataforma:</strong> {activeOrder.platform === 'ubereats' ? 'Uber Eats' : 'Local'}</p>
        <p><strong>Hora de orden:</strong> {formatDate(activeOrder.timestamp)}</p>
        {activeOrder.deliveryTime && (
          <p><strong>Tiempo de entrega:</strong> {activeOrder.deliveryTime}</p>
        )}
      </div>
    </div>
  );
}
