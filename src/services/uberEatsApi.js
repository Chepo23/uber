// Servicio para integración con Uber Eats API

const UBER_API_BASE_URL = import.meta.env.VITE_UBER_API_URL || 'http://localhost:3002/api';
const UBER_AUTH_TOKEN = import.meta.env.VITE_UBER_AUTH_TOKEN;

class UberEatsAPI {
  constructor() {
    this.authToken = UBER_AUTH_TOKEN;
  }

  // Headers comunes para requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    };
  }

  // Obtener órdenes de Uber Eats
  async getUberOrders() {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/orders`, {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Error fetching Uber orders');
      return await response.json();
    } catch (error) {
      console.error('Error getting Uber orders:', error);
      // Retornar datos demo si la API no está disponible
      return this.getDemoUberOrders();
    }
  }

  // Obtener una orden específica de Uber
  async getUberOrder(orderId) {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/orders/${orderId}`, {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Error fetching Uber order');
      return await response.json();
    } catch (error) {
      console.error('Error getting Uber order:', error);
      return null;
    }
  }

  // Actualizar estado de orden en Uber
  async updateUberOrderStatus(orderId, status) {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error updating Uber order status');
      return await response.json();
    } catch (error) {
      console.error('Error updating Uber order status:', error);
      throw error;
    }
  }

  // Obtener detalles del restaurante
  async getRestaurantInfo() {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/restaurant/info`, {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Error fetching restaurant info');
      return await response.json();
    } catch (error) {
      console.error('Error getting restaurant info:', error);
      return null;
    }
  }

  // Confirmar una orden
  async confirmOrder(orderId) {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Error confirming order');
      return await response.json();
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  }

  // Rechazar una orden
  async rejectOrder(orderId, reason) {
    try {
      const response = await fetch(`${UBER_API_BASE_URL}/orders/${orderId}/reject`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Error rejecting order');
      return await response.json();
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  // Datos demo de Uber Eats
  getDemoUberOrders() {
    return {
      orders: [
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
      ]
    };
  }
}

export default new UberEatsAPI();
