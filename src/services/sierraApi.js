// Servicio para la API Real de Sistemas Sierra
const API_BASE_URL = import.meta.env.VITE_SIERRA_API_URL || 'https://demo-services-alternative.sierraerp.com';
const API_KEY = 'QUXMIFIPVVlgQkFTRSBUkUQkVlgQkFTRSBHUkUQkVlgQkFTRSBH'; // Hardcoded para testing

console.log('🔑 Sierra API Key:', API_KEY.substring(0, 10) + '...');
console.log('🌐 Sierra API URL:', API_BASE_URL);

// Headers con autenticación
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key': API_KEY,
});

// ✅ Subir datos de ventas
export const uploadSalesData = async (salesData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/data`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(salesData),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading sales data:', error);
    throw error;
  }
};

// ✅ Obtener ventas acumuladas
export const getSalesData = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('sales', params.sales || false);
    queryParams.append('pageNumber', params.pageNumber || 1);
    queryParams.append('pageSize', params.pageSize || 100);
    
    if (params.filterBy) queryParams.append('filterBy', params.filterBy);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.desc) queryParams.append('desc', params.desc);

    const response = await fetch(
      `${API_BASE_URL}/api/v2/data?${queryParams}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }
};

// ✅ Obtener órdenes acumuladas
export const getOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('sales', params.sales || false);
    queryParams.append('pageNumber', params.pageNumber || 1);
    queryParams.append('pageSize', params.pageSize || 100);
    
    if (params.filterBy) queryParams.append('filterBy', params.filterBy);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.desc) queryParams.append('desc', params.desc);

    const response = await fetch(
      `${API_BASE_URL}/api/v2/data/orders?${queryParams}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// ✅ Obtener órdenes duplicadas
export const getDuplicateOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', params.pageNumber || 1);
    queryParams.append('pageSize', params.pageSize || 100);
    
    if (params.filterBy) queryParams.append('filterBy', params.filterBy);
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.desc) queryParams.append('desc', params.desc);

    const response = await fetch(
      `${API_BASE_URL}/api/v2/data/orders/duplicates?${queryParams}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching duplicate orders:', error);
    throw error;
  }
};

// ✅ Obtener categorías del menú
export const getCategories = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/plus/categories`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// ✅ Obtener subcategorías
export const getSubCategories = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/plus/sub-categories`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    throw error;
  }
};

// ✅ Obtener productos de una categoría
export const getProductsByCategory = async (category, minAmount = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/plus/categories/${encodeURIComponent(category)}/${minAmount}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error);
    throw error;
  }
};

// ✅ Obtener menú completo formateado
export const getCompleteMenu = async () => {
  try {
    const categories = await getCategories();
    
    // Transformar a estructura esperada
    const menuData = await Promise.all(
      (Array.isArray(categories) ? categories : []).map(async (category) => {
        try {
          const products = await getProductsByCategory(category.name || category.id, 0);
          return {
            id: category.id || category.name,
            name: category.name || 'Sin nombre',
            description: category.description || '',
            products: Array.isArray(products) ? products : []
          };
        } catch (err) {
          console.warn(`No se pudieron cargar productos para ${category.name}:`, err);
          return {
            id: category.id || category.name,
            name: category.name || 'Sin nombre',
            description: category.description || '',
            products: []
          };
        }
      })
    );

    return menuData;
  } catch (error) {
    console.error('Error fetching complete menu:', error);
    throw error;
  }
};

// ✅ Función para crear/formatear datos de venta para upload
export const formatOrderForUpload = (order) => {
  return {
    orderNumber: order.id,
    customerName: order.customerName || 'Cliente',
    total: order.total,
    items: order.products || [],
    platform: order.platform || 'local', // 'local' o 'ubereats'
    status: order.status || 'pending',
    timestamp: order.timestamp || new Date().toISOString(),
  };
};
