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

  // ✅ Crear orden y subir a Sierra
  const addOrder = useCallback((order) => {
    const newOrder = {
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'pending',
      items: [],
      total: 0,
      platform: 'local', // 'local' o 'ubereats'
      ...order
    };
    
    setOrders(prev => [newOrder, ...prev]);
    
    // Intentar subir a Sierra API
    uploadOrderToSierra(newOrder);
    
    return newOrder;
  }, []);

  // ✅ Subir orden a la API de Sierra
  const uploadOrderToSierra = useCallback(async (order) => {
    try {
      const formattedOrder = sierraApi.formatOrderForUpload(order);
      await sierraApi.uploadSalesData(formattedOrder);
      console.log('✅ Orden subida a Sierra:', order.id);
    } catch (err) {
      console.warn('No se pudo subir a Sierra, guardado localmente:', err);
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
