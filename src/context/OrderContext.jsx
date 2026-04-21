import { createContext, useState, useCallback, useEffect } from 'react';
import * as sierraApi from '../services/sierraApi';
import { useAuth } from './AuthContext';

export const OrderContext = createContext();

const ORDER_STORAGE_PREFIX = 'sierra.pos.orders.user';

const getStorageKey = (userId) => `${ORDER_STORAGE_PREFIX}.${String(userId)}`;

const toIsoDate = (value) => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const sortOrdersDesc = (orders) => {
  return [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const normalizeOrder = (order) => {
  return {
    id: String(order?.id || order?.orderNumber || Date.now()),
    orderNumber: String(order?.orderNumber || order?.id || Date.now()),
    timestamp: toIsoDate(order?.timestamp),
    status: order?.status || 'pending',
    items: Array.isArray(order?.items) ? order.items : [],
    total: Number(order?.total || 0),
    platform: order?.platform || 'local',
    customer: order?.customer || order?.customerName || 'Cliente',
    customerName: order?.customerName || order?.customer || 'Cliente',
    createdByUserId: order?.createdByUserId ? String(order.createdByUserId) : null,
    createdByUserName: order?.createdByUserName || null,
    syncStatus: order?.syncStatus || 'local-only',
    ...order,
  };
};

const loadOrdersForUser = (userId) => {
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return sortOrdersDesc(parsed.map(normalizeOrder));
  } catch {
    return [];
  }
};

const persistOrdersForUser = (userId, orders) => {
  if (!userId) return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(sortOrdersDesc(orders)));
};

const toRemoteOrder = (remoteOrder, userId) => {
  const possibleOwner =
    remoteOrder?.createdByUserId ||
    remoteOrder?.userId ||
    remoteOrder?.accountUserId ||
    remoteOrder?.client?.[0]?.memo1 ||
    null;

  if (!possibleOwner || String(possibleOwner) !== String(userId)) {
    return null;
  }

  return normalizeOrder({
    ...remoteOrder,
    id: remoteOrder.id || remoteOrder.order || remoteOrder.orderNumber,
    orderNumber: remoteOrder.orderNumber || remoteOrder.order || remoteOrder.id,
    customer:
      remoteOrder.customer || remoteOrder.customerName || remoteOrder.client?.[0]?.name || 'Cliente',
    customerName:
      remoteOrder.customerName || remoteOrder.customer || remoteOrder.client?.[0]?.name || 'Cliente',
    platform: remoteOrder.platform || 'local',
    syncStatus: 'synced',
  });
};

export const OrderProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [uberOrders, setUberOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveOrders = useCallback(
    (nextOrders) => {
      if (!user?.id) return;
      persistOrdersForUser(user.id, nextOrders);
    },
    [user?.id]
  );

  const fetchMenuFromSierra = useCallback(async () => {
    try {
      const menuData = await sierraApi.getCompleteMenu();
      if (Array.isArray(menuData) && menuData.length > 0) {
        setProducts(menuData);
      }
    } catch (err) {
      console.warn('No se pudo conectar al menu de Sierra, usando datos locales:', err);
    }
  }, []);

  const fetchOrdersFromSierra = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await sierraApi.getOrders({ pageSize: 100 });
      const list = Array.isArray(data) ? data : [];
      const remoteOrders = list
        .map((entry) => toRemoteOrder(entry, user.id))
        .filter(Boolean);

      if (remoteOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map();

          for (const order of remoteOrders) {
            map.set(String(order.id), order);
          }

          for (const order of prev) {
            map.set(String(order.id), order);
          }

          const merged = sortOrdersDesc([...map.values()]);
          saveOrders(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn('No se pudo conectar a Sierra API, usando datos locales:', err);
      setError('Operando en modo local (sin sincronizacion)');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, saveOrders, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      setUberOrders([]);
      setProducts([]);
      setActiveOrder(null);
      return;
    }

    const localOrders = loadOrdersForUser(user.id);
    setOrders(localOrders);
    setActiveOrder(null);

    fetchMenuFromSierra();
    fetchOrdersFromSierra();
  }, [fetchMenuFromSierra, fetchOrdersFromSierra, isAuthenticated, user?.id]);

  const addOrder = useCallback(
    async (order) => {
      if (!isAuthenticated || !user?.id) {
        throw new Error('Debes iniciar sesion para crear ordenes.');
      }

      setLoading(true);
      setError(null);

      const baseOrder = normalizeOrder({
        ...order,
        id: order.id || Date.now().toString(),
        orderNumber: order.orderNumber || order.id || Date.now().toString(),
        status: order.status || 'pending',
        platform: order.platform || 'local',
        customer: order.customer || order.customerName,
        customerName: order.customerName || order.customer,
        createdByUserId: String(user.id),
        createdByUserName: user.username || 'Usuario',
      });

      let uploadError = null;
      let uploadResponse = null;

      try {
        uploadResponse = await sierraApi.uploadSalesData(baseOrder);
      } catch (err) {
        uploadError = err;
        setError(`Orden guardada localmente. Error de sincronizacion: ${err.message}`);
      }

      const finalOrder = {
        ...baseOrder,
        syncStatus: uploadError ? 'local-only' : 'synced',
        sierraResponse: uploadResponse,
      };

      setOrders((prev) => {
        const nextOrders = [
          finalOrder,
          ...prev.filter((existing) => String(existing.id) !== String(finalOrder.id)),
        ];
        saveOrders(nextOrders);
        return nextOrders;
      });

      setLoading(false);

      return {
        order: finalOrder,
        uploaded: !uploadError,
        error: uploadError,
      };
    },
    [isAuthenticated, saveOrders, user?.id, user?.username]
  );

  const uploadOrderToSierra = useCallback(async (order) => {
    try {
      return await sierraApi.uploadSalesData(order);
    } catch (err) {
      console.warn('No se pudo subir a Sierra, guardado localmente:', err);
      throw err;
    }
  }, []);

  const updateOrder = useCallback(
    (orderId, updates) => {
      setOrders((prev) => {
        const nextOrders = prev.map((order) =>
          String(order.id) === String(orderId)
            ? {
                ...order,
                ...updates,
              }
            : order
        );

        saveOrders(nextOrders);
        return nextOrders;
      });

      if (activeOrder?.id === orderId) {
        setActiveOrder((prev) => ({ ...prev, ...updates }));
      }

      const currentOrder = orders.find((order) => String(order.id) === String(orderId));
      if (currentOrder) {
        uploadOrderToSierra({ ...currentOrder, ...updates }).catch(() => {});
      }
    },
    [activeOrder?.id, orders, saveOrders, uploadOrderToSierra]
  );

  const deleteOrder = useCallback(
    (orderId) => {
      setOrders((prev) => {
        const nextOrders = prev.filter((order) => String(order.id) !== String(orderId));
        saveOrders(nextOrders);
        return nextOrders;
      });

      if (activeOrder?.id === orderId) {
        setActiveOrder(null);
      }
    },
    [activeOrder?.id, saveOrders]
  );

  const addUberOrder = useCallback(
    (order) => {
      const ownerOrder = {
        ...order,
        createdByUserId: user?.id ? String(user.id) : null,
        createdByUserName: user?.username || null,
      };

      setUberOrders((prev) => [ownerOrder, ...prev]);
      uploadOrderToSierra({ ...ownerOrder, platform: 'ubereats' }).catch(() => {});
    },
    [uploadOrderToSierra, user?.id, user?.username]
  );

  const updateUberOrder = useCallback((orderId, updates) => {
    setUberOrders((prev) =>
      prev.map((order) =>
        String(order.id) === String(orderId)
          ? {
              ...order,
              ...updates,
            }
          : order
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

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
