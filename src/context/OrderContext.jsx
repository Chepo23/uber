import { createContext, useState, useCallback, useEffect } from 'react';
import * as sierraApi from '../services/sierraApi';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [uberOrders, setUberOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Sincronizar órdenes y menú desde la API de Sierra al iniciar
  useEffect(() => {
    fetchOrdersFromSierra();
    fetchMenuFromSierra();
  }, []);

  // ✅ Obtener órdenes de la API real
  const fetchOrdersFromSierra = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sierraApi.getOrders({ pageSize: 100 });
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('No se pudo conectar a Sierra API, usando datos locales:', err);
      setError('Operando en modo local (sin sincronización)');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Obtener menú desde la API real
  const fetchMenuFromSierra = useCallback(async () => {
    try {
      const menuData = await sierraApi.getCompleteMenu();
      if (Array.isArray(menuData) && menuData.length > 0) {
        setProducts(menuData);
        console.log('✅ Menú cargado desde Sierra:', menuData);
      }
    } catch (err) {
      console.warn('No se pudo conectar al menú de Sierra, usando datos locales:', err);
      // Mantener menú local como fallback
    }
  }, []);

  // ✅ Crear orden Y subirla a Sierra
  const addOrder = useCallback(async (order) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📤 Creando orden en Sierra:', order);
      
      // Subir a Sierra
      const response = await sierraApi.uploadSalesData(order);
      console.log('✅ Orden creada en Sierra:', response);
      
      // Si funciona, guardar también localmente para sincronización
      setOrders(prev => [order, ...prev]);
      
      return { order, sierra: response };
    } catch (err) {
      console.error('❌ Error al crear orden en Sierra:', err);
      setError(`Error: ${err.message}`);
      throw err; // Re-lanzar el error para que el componente lo maneje
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Subir orden a la API de Sierra (directamente, sin formateo extra)
  const uploadOrderToSierra = useCallback(async (order) => {
    try {
      console.log('📤 Enviando orden a Sierra:', order);
      const response = await sierraApi.uploadSalesData(order);
      console.log('✅ Orden subida a Sierra exitosamente:', response);
      return response;
    } catch (err) {
      console.error('❌ Error al subir a Sierra:', err);
      throw err;
    }
  }, []);

  const updateOrder = useCallback((orderId, updates) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      )
    );
    if (activeOrder?.id === orderId) {
      setActiveOrder(prev => ({ ...prev, ...updates }));
    }
    
    // Intentar sincronizar con Sierra
    const updatedOrder = orders.find(o => o.id === orderId);
    if (updatedOrder) {
      uploadOrderToSierra({ ...updatedOrder, ...updates });
    }
  }, [orders, activeOrder?.id]);

  const deleteOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    if (activeOrder?.id === orderId) {
      setActiveOrder(null);
    }
  }, [activeOrder?.id]);

  const addUberOrder = useCallback((order) => {
    setUberOrders(prev => [order, ...prev]);
    // También guardar en órdenes generales
    uploadOrderToSierra({ ...order, platform: 'ubereats' });
  }, []);

  const updateUberOrder = useCallback((orderId, updates) => {
    setUberOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      )
    );
  }, []);

  const value = {
    orders,
    setOrders,
    activeOrder,
    setActiveOrder,
    fetchMenuFromSierra,
    products,
    setProducts,
    uberOrders,
    setUberOrders,
    loading,
    setLoading,
    error,
    setError,
    addOrder,
    updateOrder,
    deleteOrder,
    addUberOrder,
    updateUberOrder,
    fetchOrdersFromSierra,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
