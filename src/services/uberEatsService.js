// Servicio para integración con Uber Eats API a través del backend

class UberEatsService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.tokenKey = 'uber_eats_token';
  }

  /**
   * Obtiene el access token almacenado
   */
  getAccessToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Headers con autenticación
   */
  getAuthHeaders() {
    const token = this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Obtiene órdenes de Uber Eats
   * Primero intenta obtener órdenes recibidas por webhook
   * Si no hay, intenta obtener de la API de Uber
   */
  async getOrders() {
    try {
      console.log('📨 Obteniendo órdenes de Uber Eats...');

      // Obtener órdenes del webhook (órdenes locales)
      try {
        console.log('   📋 Obteniendo órdenes del webhook local...');
        const webhookResponse = await fetch(`${this.apiBaseUrl}/webhooks/uber/orders`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log('✅ Órdenes obtenidas:', webhookData.total);
          return webhookData.orders || [];
        } else {
          console.warn('⚠️  No se pudieron obtener órdenes del webhook');
          return [];
        }
      } catch (webhookError) {
        console.warn('⚠️  Error obteniendo órdenes:', webhookError.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error en getOrders:', error);
      throw error;
    }
  }

  /**
   * Obtiene una orden específica
   */
  async getOrder(orderId) {
    try {
      console.log('📨 Obteniendo orden:', orderId);

      const response = await fetch(`${this.apiBaseUrl}/uber/orders/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Failed to fetch order');
      }

      const data = await response.json();
      console.log('✅ Orden obtenida');
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo orden:', error);
      throw error;
    }
  }

  /**
   * Acepta una orden
   */
  async acceptOrder(orderId) {
    try {
      console.log('✅ Aceptando orden:', orderId);

      const response = await fetch(`${this.apiBaseUrl}/uber/orders/${orderId}/accept`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Failed to accept order');
      }

      const data = await response.json();
      console.log('✅ Orden aceptada');
      return data;
    } catch (error) {
      console.error('❌ Error aceptando orden:', error);
      throw error;
    }
  }

  /**
   * Rechaza una orden
   */
  async rejectOrder(orderId, reason = 'OUT_OF_STOCK') {
    try {
      console.log('❌ Rechazando orden:', orderId, 'Razón:', reason);

      const response = await fetch(`${this.apiBaseUrl}/uber/orders/${orderId}/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Failed to reject order');
      }

      const data = await response.json();
      console.log('✅ Orden rechazada');
      return data;
    } catch (error) {
      console.error('❌ Error rechazando orden:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateOrderStatus(orderId, status) {
    try {
      console.log('🔄 Actualizando estado de orden:', orderId, 'Estado:', status);

      const response = await fetch(`${this.apiBaseUrl}/uber/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Failed to update order status');
      }

      const data = await response.json();
      console.log('✅ Estado actualizado');
      return data;
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw error;
    }
  }

  /**
   * Marca una orden como lista para entrega
   */
  async markOrderReady(orderId) {
    return this.updateOrderStatus(orderId, 'READY');
  }

  /**
   * Marca una orden como entregada
   */
  async markOrderDelivered(orderId) {
    return this.updateOrderStatus(orderId, 'DELIVERED');
  }

  /**
   * Marca una orden como en preparación
   */
  async markOrderPreparing(orderId) {
    return this.updateOrderStatus(orderId, 'PREPARING');
  }
}

export default new UberEatsService();
