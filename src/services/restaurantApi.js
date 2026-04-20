// Servicio para la API del restaurante (demo)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class RestaurantAPI {
  // Obtener menú de productos
  async getMenu() {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`);
      if (!response.ok) throw new Error('Error fetching menu');
      return await response.json();
    } catch (error) {
      console.error('Error getting menu:', error);
      // Retornar datos demo si la API no está disponible
      return this.getDemoMenu();
    }
  }

  // Obtener una orden
  async getOrder(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      if (!response.ok) throw new Error('Error fetching order');
      return await response.json();
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  // Obtener todas las órdenes
  async getOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      if (!response.ok) throw new Error('Error fetching orders');
      return await response.json();
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  // Crear una orden
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Error creating order');
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Actualizar estado de una orden
  async updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error updating order');
      return await response.json();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Datos de demostración
  getDemoMenu() {
    return {
      categories: [
        {
          id: 1,
          name: 'Hamburguesas',
          products: [
            { id: 101, name: 'Hamburguesa Simple', price: 5.99, description: 'Con queso y tomate' },
            { id: 102, name: 'Hamburguesa Doble', price: 8.99, description: 'Doble carne y queso' },
            { id: 103, name: 'Hamburguesa Especial', price: 10.99, description: 'Carne premium con tocino' }
          ]
        },
        {
          id: 2,
          name: 'Pizzas',
          products: [
            { id: 201, name: 'Pepperoni', price: 12.99, description: 'Salsa, queso y pepperoni' },
            { id: 202, name: 'Vegetariana', price: 11.99, description: 'Verduras variadas' },
            { id: 203, name: 'Carnes Variadas', price: 14.99, description: 'Jamón, tocino y salchichas' }
          ]
        },
        {
          id: 3,
          name: 'Bebidas',
          products: [
            { id: 301, name: 'Refresco', price: 2.99, description: 'Coca-Cola, Fanta, Sprite' },
            { id: 302, name: 'Jugo Natural', price: 3.99, description: 'Jugo recién exprimido' },
            { id: 303, name: 'Agua', price: 1.99, description: 'Agua mineral o purificada' }
          ]
        }
      ]
    };
  }
}

export default new RestaurantAPI();
