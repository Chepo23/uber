// Servicio para la API Real de Sistemas Sierra
const API_BASE_URL = import.meta.env.VITE_SIERRA_API_URL || 'https://demo-services-alternative.sierraerp.com';
const API_KEY = 'CxzKRteOXeAr5fpa1D2wOm4tlMs64Jsz6wPoYQye8Kdz6sgZ9r0w9JOh3JbJZmlV'; // API Key válida
const PREFERRED_EMPLOYEE_SHORT = (import.meta.env.VITE_SIERRA_EMPLOYEE_SHORT || 'BRANDON').toString();
const PREFERRED_EMPLOYEE_ID = (import.meta.env.VITE_SIERRA_EMPLOYEE_ID || '1002').toString();

console.log('🔑 Sierra API Key:', API_KEY.substring(0, 10) + '...');
console.log('🌐 Sierra API URL:', API_BASE_URL);

// Headers con autenticación
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key': API_KEY,
});

const normalizeEmployeeCode = (employee) => {
  if (!employee || typeof employee !== 'object') return null;
  return (
    employee.short_Name ||
    employee.long_Name ||
    (employee.id !== undefined && employee.id !== null ? String(employee.id) : null)
  );
};

const normalizeEmployeeId = (employee) => {
  if (!employee || typeof employee !== 'object') return null;
  return employee.id !== undefined && employee.id !== null ? String(employee.id) : null;
};

const isPlaceholderEmployee = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === '' || normalized === 'SYSTEM' || normalized === 'WEB_CASHIER';
};

const getEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/employees`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const employees = await response.json();
  return Array.isArray(employees) ? employees : [];
};

const extractOrdersArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

const verifyOrderPersistence = async (orderNumber) => {
  try {
    const query = new URLSearchParams({
      Page: '1',
      PageSize: '50',
      Order: String(orderNumber),
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/orders?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      return {
        verified: false,
        reason: `No se pudo consultar orden en Sierra (${response.status})`,
      };
    }

    const payload = await response.json();
    const orders = extractOrdersArray(payload);

    const matched = orders.find((entry) => {
      const candidate = String(
        entry?.order || entry?.Order || entry?.orderNumber || entry?.OrderNumber || ''
      );
      return candidate === String(orderNumber);
    });

    if (!matched) {
      return {
        verified: false,
        reason: 'Sierra respondio OK, pero la orden no aparecio en la consulta inmediata',
      };
    }

    return {
      verified: true,
      order: matched,
    };
  } catch (error) {
    return {
      verified: false,
      reason: `Fallo la verificacion en Sierra: ${error.message}`,
    };
  }
};

// Generar GUID
const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ✅ Crear OrderTicket (esquema Sierra completo)
const createOrderTicket = (order) => {
  const total = parseFloat(order.total) || 0;
  const items = order.items || order.products || [];
  
  // Crear el array de productos (plus) - REQUERIDO
  const plusArray = items.map(item => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQty = parseFloat(item.quantity) || 1;
    
    return {
      plu: (item.id || item.plu || Date.now().toString()).toString(),
      description: (item.name || "Producto").substring(0, 100),
      quantity: itemQty,
      unitPrice: itemPrice,
      subTotal: itemQty * itemPrice,
      tax: 0.0,
      taxTable: "0",
      comments: item.comments ? item.comments.substring(0, 200) : null,
      subPlus: []
    };
  });
  
  // Crear OrderTicket - EXACTAMENTE según el esquema OrderTicket
  const orderTicket = {
    // REQUERIDO
    order: (order.id || order.orderNumber || 'ORD' + Date.now().toString().slice(-8)).toString(),
    
    // Operación - server/mesero debe ser null o un empleado válido
    terminal: (order.terminal || "POS_WEB").toString(),
    server: isPlaceholderEmployee(order.server) ? PREFERRED_EMPLOYEE_SHORT : order.server,
    cashier: isPlaceholderEmployee(order.cashier) ? PREFERRED_EMPLOYEE_SHORT : order.cashier,
    
    // Totales - como números o strings válidos
    subTotal: total,
    tax: 0.0,
    credits: total,
    change: 0.0,
    
    // Tipo - strings
    salesType: "7",
    orderType: "ORDEN WEB ONLINE",
    openStatus: "1",  // "1" = Cliente debe cerrar cuenta
    production: true,
    routeProducts: true,
    
    // Pago
    paymentTransactionId: ('TX' + Date.now().toString().slice(-10)).toString(),
    
    // Comentarios
    orderComments: order.orderComments ? order.orderComments.substring(0, 500) : "",
    
    // Datos del cliente (array)
    client: [
      {
        clientId: (order.clientId || "9999").toString(),
        name: (order.customerName || "Cliente").substring(0, 100),
        address: (order.address || "").substring(0, 100),
        address2: (order.address2 || "").substring(0, 100),
        city: (order.city || "").substring(0, 50),
        zipCode: (order.zipCode || "00000").toString(),
        email: (order.email || "").substring(0, 100),
        telephone: (order.telephone || "").substring(0, 20),
        mobilPhone: (order.phone || "").substring(0, 20),
        memo1: null,
        memo2: null,
        memo3: null,
        memo4: null
      }
    ],
    
    // PRODUCTOS (array) - REQUERIDO
    plus: plusArray.length > 0 ? plusArray : [{
      plu: "DEFAULT",
      description: "Producto",
      quantity: 1,
      unitPrice: total,
      subTotal: total,
      tax: 0.0,
      taxTable: "0",
      comments: null,
      subPlus: []
    }],
    
    // Pagos (array)
    payments: []
  };
  
  console.log('🎫 OrderTicket FINAL creado:', JSON.stringify(orderTicket, null, 2));
  return orderTicket;
};

// ✅ Subir datos de ventas - Usando endpoint /api/v1/orders
export const uploadSalesData = async (order) => {
  try {
    // Crear OrderTicket
    const orderTicket = createOrderTicket(order);
    console.log('🎫 OrderTicket FINAL creado:', JSON.stringify(orderTicket, null, 2));

    const sendOrder = async (ticket) => {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(ticket),
      });

      const responseText = await response.text();
      let parsed = null;
      try {
        parsed = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsed = null;
      }

      return { response, responseText, parsed };
    };

    let attemptTicket = { ...orderTicket };
    let { response, responseText, parsed } = await sendOrder(attemptTicket);
    console.log('📥 Respuesta del servidor:', responseText);

    const invalidEmployee =
      !response.ok &&
      parsed &&
      typeof parsed.msg === 'string' &&
      parsed.msg.includes('Empleado') &&
      parsed.msg.includes('no se encuentra');

    if (invalidEmployee) {
      console.warn('⚠️ Sierra rechazó mesero/cajero; intentando resolver empleado válido automáticamente...');

      try {
        const employees = await getEmployees();
        const preferredEmployee = employees.find(
          (emp) =>
            String(emp?.short_Name || '').toUpperCase() === PREFERRED_EMPLOYEE_SHORT.toUpperCase() ||
            String(emp?.long_Name || '').toUpperCase() === PREFERRED_EMPLOYEE_SHORT.toUpperCase() ||
            String(emp?.id || '') === PREFERRED_EMPLOYEE_ID
        );

        const activeEmployee =
          preferredEmployee ||
          employees.find((emp) => Number(emp?.status) === 1 && Number(emp?.on_Duty) === 1) ||
          employees.find((emp) => Number(emp?.status) === 1) ||
          employees[0];

        const employeeCode = normalizeEmployeeCode(activeEmployee);
        const employeeId = normalizeEmployeeId(activeEmployee);

        const attempts = [];

        // Try with employee id first; many Sierra installs validate by numeric id code.
        if (employeeId) {
          attempts.push({ server: employeeId, cashier: employeeId, reason: 'id/id' });
          attempts.push({ server: employeeId, cashier: null, reason: 'id/null' });
          attempts.push({ server: null, cashier: employeeId, reason: 'null/id' });
        }

        if (employeeCode) {
          attempts.push({ server: employeeCode, cashier: employeeCode, reason: 'name/name' });
          attempts.push({ server: employeeCode, cashier: null, reason: 'name/null' });
          attempts.push({ server: null, cashier: employeeCode, reason: 'null/name' });
        }

        attempts.push({ server: null, cashier: null, reason: 'null/null' });

        // Remove duplicate combinations.
        const uniqueAttempts = attempts.filter((candidate, index, arr) => {
          const key = `${candidate.server ?? 'NULL'}|${candidate.cashier ?? 'NULL'}`;
          return index === arr.findIndex((entry) => `${entry.server ?? 'NULL'}|${entry.cashier ?? 'NULL'}` === key);
        });

        if (uniqueAttempts.length === 0) {
          console.warn('⚠️ No fue posible obtener un código válido de empleado para reintento.');
        } else {
          for (const candidate of uniqueAttempts) {
            const baseCandidateTicket = {
              ...attemptTicket,
              server: candidate.server,
              cashier: candidate.cashier,
            };

            const candidateVariants = [
              {
                reason: `${candidate.reason}|base`,
                ticket: baseCandidateTicket,
              },
              {
                reason: `${candidate.reason}|terminal:null`,
                ticket: {
                  ...baseCandidateTicket,
                  terminal: null,
                },
              },
              {
                reason: `${candidate.reason}|capture:soft`,
                ticket: {
                  ...baseCandidateTicket,
                  terminal: null,
                  openStatus: '0',
                  routeProducts: false,
                },
              },
            ];

            for (const variant of candidateVariants) {
              attemptTicket = variant.ticket;

              console.log(
                `🔁 Reintento (${variant.reason}) con server=${attemptTicket.server} cashier=${attemptTicket.cashier} terminal=${attemptTicket.terminal} openStatus=${attemptTicket.openStatus} routeProducts=${attemptTicket.routeProducts}`
              );
              ({ response, responseText, parsed } = await sendOrder(attemptTicket));
              console.log('📥 Respuesta de reintento:', responseText);

              if (response.ok) {
                break;
              }
            }

            if (response.ok) {
              break;
            }
          }
        }
      } catch (employeeError) {
        console.warn('⚠️ No se pudo consultar /api/v1/employees para resolver empleado:', employeeError);
      }
    }

    if (!response.ok) {
      console.error('❌ HTTP Status:', response.status);
      throw new Error(`Error ${response.status}: ${responseText}`);
    }

    const result = parsed ?? (responseText ? JSON.parse(responseText) : {});
    const verification = await verifyOrderPersistence(orderTicket.order);

    console.log('✅ Respuesta exitosa de Sierra:', result);
    console.log('🔎 Verificacion de persistencia:', verification);

    return {
      ...result,
      requestOrder: orderTicket.order,
      verification,
    };
  } catch (error) {
    console.error('❌ Error en uploadSalesData:', error);
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
    
    console.log('📦 Raw categories from API:', categories);
    
    // Categorías a excluir (búsqueda parcial)
    const excludedKeywords = ['salon', 'uña', 'tablero', 'pago'];
    
    // Transformar a estructura esperada
    const menuData = await Promise.all(
      (Array.isArray(categories) ? categories : [])
        .filter(cat => {
          const catName = (cat.nombre_corto || cat.nombre_largo || '').toLowerCase();
          const shouldExclude = excludedKeywords.some(keyword => catName.includes(keyword));
          if (shouldExclude) {
            console.log('⛔ Excluida categoría:', cat.nombre_corto || cat.nombre_largo);
          }
          return !shouldExclude;
        })
        .map(async (category) => {
          try {
            console.log('📂 Processing category:', category);
            
            // Usa el ID de la categoría para buscar productos
            const products = await getProductsByCategory(category.id, 0);
            
            return {
              id: category.id,
              name: category.nombre_corto || category.nombre_largo || 'Sin nombre',
              description: category.nombre_largo || category.nombre_corto || '',
              products: Array.isArray(products) 
                ? products
                    .map(p => ({
                      id: p.id,
                      name: p.nombre_corto || p.nombre_largo || p.nombre || 'Producto',
                      description: p.nombre_largo || p.nombre_corto || p.descripcion || '',
                      price: parseFloat(p.precio1) || parseFloat(p.precio2) || parseFloat(p.price) || 0
                    }))
                    .filter(p => p.price > 0) // ✅ Filtrar solo productos con precio > 0
                : []
            };
          } catch (err) {
            console.warn(`No se pudieron cargar productos para ${category.nombre_corto}:`, err);
            return {
              id: category.id,
              name: category.nombre_corto || 'Sin nombre',
              description: category.nombre_largo || '',
              products: []
            };
          }
        })
    );

    console.log('✅ Formatted menu:', menuData);
    return menuData;
  } catch (error) {
    console.error('Error fetching complete menu:', error);
    throw error;
  }
};

// ✅ Función para crear/formatear datos de venta para upload (esquema Sierra)

