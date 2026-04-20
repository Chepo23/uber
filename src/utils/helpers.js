// Funciones auxiliares

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#FFA500',
    confirmed: '#4CAF50',
    preparing: '#2196F3',
    ready: '#00BCD4',
    delivered: '#8BC34A',
    cancelled: '#F44336'
  };
  return colors[status] || '#757575';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
};

export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhoneNumber = (phone) => {
  const re = /^[\d+\-\s()]{10,}$/;
  return re.test(phone);
};
