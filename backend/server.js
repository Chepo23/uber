import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Crear directorio data si no existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('   Body:', req.body);
  }
  next();
});

/**
 * POST /api/auth/uber/callback
 * Intercambia el authorization code por access token
 */
app.post('/api/auth/uber/callback', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'missing_code',
        error_description: 'Authorization code is required'
      });
    }

    console.log('🔐 Intercambiando código por token...');
    console.log('   Code:', code.substring(0, 20) + '...');
    console.log('   Client ID:', process.env.UBER_CLIENT_ID);

    // Preparar parámetros para el token exchange
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      redirect_uri: redirect_uri || process.env.UBER_REDIRECT_URI
    });

    // Llamar a Uber para intercambiar el código
    const tokenResponse = await fetch(process.env.UBER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Error en token exchange:');
      console.error('   Status:', tokenResponse.status);
      console.error('   Response:', tokenData);

      return res.status(tokenResponse.status).json({
        error: tokenData.error || 'token_exchange_failed',
        error_description: tokenData.error_description || 'Failed to exchange code for token'
      });
    }

    console.log('✅ Token obtenido exitosamente');
    console.log('   Access Token:', tokenData.access_token ? tokenData.access_token.substring(0, 20) + '...' : 'N/A');
    console.log('   Token Type:', tokenData.token_type);
    console.log('   Expires In:', tokenData.expires_in);

    // Responder con los tokens
    return res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

  } catch (error) {
    console.error('❌ Error en /api/auth/uber/callback:');
    console.error('   Error:', error.message);

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    message: 'Uber OAuth Backend is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/uber/orders
 * Obtiene órdenes de Uber Eats
 */
app.get('/api/uber/orders', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Access token is required'
      });
    }

    console.log('📨 Obteniendo órdenes de Uber Eats...');
    console.log('   Access Token:', accessToken.substring(0, 20) + '...');

    // Llamar a Uber Eats API para obtener órdenes
    const ordersResponse = await fetch('https://api.uber.com/v1/marketplace/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const ordersData = await ordersResponse.json();

    if (!ordersResponse.ok) {
      console.error('❌ Error obteniendo órdenes de Uber:');
      console.error('   Status:', ordersResponse.status);
      console.error('   Response:', ordersData);

      return res.status(ordersResponse.status).json({
        error: ordersData.error || 'failed_to_fetch_orders',
        error_description: ordersData.message || 'Failed to fetch orders from Uber'
      });
    }

    console.log('✅ Órdenes obtenidas exitosamente');
    console.log('   Total órdenes:', ordersData.data?.length || 0);

    return res.json({
      orders: ordersData.data || [],
      total: ordersData.data?.length || 0
    });

  } catch (error) {
    console.error('❌ Error en /api/uber/orders:');
    console.error('   Error:', error.message);

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * POST /api/uber/orders/:orderId/accept
 * Acepta una orden de Uber Eats
 */
app.post('/api/uber/orders/:orderId/accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Access token is required'
      });
    }

    console.log('✅ Aceptando orden:', orderId);

    // Si es una orden de prueba, actualizar localmente
    if (orderId.startsWith('TEST-ORDER-')) {
      console.log('   (Orden de prueba - actualizando localmente)');
      const orderIndex = receivedOrders.findIndex(o => o.id === orderId);
      if (orderIndex >= 0) {
        receivedOrders[orderIndex].status = 'accepted';
        console.log('✅ Orden de prueba aceptada localmente');
        saveOrders(receivedOrders);
        return res.json({
          success: true,
          id: orderId,
          status: 'accepted',
          message: 'Test order accepted locally'
        });
      } else {
        return res.status(404).json({
          error: 'order_not_found',
          error_description: 'Test order not found'
        });
      }
    }

    // Llamar a Uber para aceptar la orden real
    const acceptResponse = await fetch(`https://test-api.uber.com/v1/marketplace/orders/${orderId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const acceptData = await acceptResponse.json();

    if (!acceptResponse.ok) {
      console.error('❌ Error aceptando orden:');
      console.error('   Status:', acceptResponse.status);
      console.error('   Response:', acceptData);

      return res.status(acceptResponse.status).json({
        error: acceptData.error || 'failed_to_accept_order',
        error_description: acceptData.message || 'Failed to accept order'
      });
    }

    console.log('✅ Orden aceptada');

    return res.json(acceptData);

  } catch (error) {
    console.error('❌ Error en /api/uber/orders/:orderId/accept:');
    console.error('   Error:', error.message);

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * POST /api/uber/orders/:orderId/reject
 * Rechaza una orden de Uber Eats
 */
app.post('/api/uber/orders/:orderId/reject', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Access token is required'
      });
    }

    console.log('❌ Rechazando orden:', orderId);
    console.log('   Razón:', reason);

    // Si es una orden de prueba, actualizar localmente
    if (orderId.startsWith('TEST-ORDER-')) {
      console.log('   (Orden de prueba - actualizando localmente)');
      const orderIndex = receivedOrders.findIndex(o => o.id === orderId);
      if (orderIndex >= 0) {
        receivedOrders[orderIndex].status = 'rejected';
        console.log('✅ Orden de prueba rechazada localmente');
        saveOrders(receivedOrders);
        return res.json({
          success: true,
          id: orderId,
          status: 'rejected',
          message: 'Test order rejected locally'
        });
      } else {
        return res.status(404).json({
          error: 'order_not_found',
          error_description: 'Test order not found'
        });
      }
    }

    // Llamar a Uber para rechazar la orden real
    const rejectResponse = await fetch(`https://test-api.uber.com/v1/marketplace/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason || 'OUT_OF_STOCK'
      })
    });

    const rejectData = await rejectResponse.json();

    if (!rejectResponse.ok) {
      console.error('❌ Error rechazando orden:');
      console.error('   Status:', rejectResponse.status);
      console.error('   Response:', rejectData);

      return res.status(rejectResponse.status).json({
        error: rejectData.error || 'failed_to_reject_order',
        error_description: rejectData.message || 'Failed to reject order'
      });
    }

    console.log('✅ Orden rechazada');

    return res.json(rejectData);

  } catch (error) {
    console.error('❌ Error en /api/uber/orders/:orderId/reject:');
    console.error('   Error:', error.message);

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * PATCH /api/uber/orders/:orderId/status
 * Actualiza el estado de una orden
 */
app.patch('/api/uber/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Access token is required'
      });
    }

    console.log('🔄 Actualizando estado de orden:', orderId);
    console.log('   Nuevo estado:', status);

    // Si es una orden de prueba, actualizar localmente
    if (orderId.startsWith('TEST-ORDER-')) {
      console.log('   (Orden de prueba - actualizando localmente)');
      const orderIndex = receivedOrders.findIndex(o => o.id === orderId);
      if (orderIndex >= 0) {
        receivedOrders[orderIndex].status = status;
        console.log('✅ Estado de orden de prueba actualizado localmente');
        saveOrders(receivedOrders);
        return res.json({
          success: true,
          id: orderId,
          status: status,
          message: 'Test order status updated locally'
        });
      } else {
        return res.status(404).json({
          error: 'order_not_found',
          error_description: 'Test order not found'
        });
      }
    }

    // Llamar a Uber para actualizar estado de orden real
    const updateResponse = await fetch(`https://test-api.uber.com/v1/marketplace/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: status
      })
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error('❌ Error actualizando estado:');
      console.error('   Status:', updateResponse.status);
      console.error('   Response:', updateData);

      return res.status(updateResponse.status).json({
        error: updateData.error || 'failed_to_update_status',
        error_description: updateData.message || 'Failed to update order status'
      });
    }

    console.log('✅ Estado actualizado');

    return res.json(updateData);

  } catch (error) {
    console.error('❌ Error en /api/uber/orders/:orderId/status:');
    console.error('   Error:', error.message);

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

// ========================================
// Funciones para persistencia de órdenes
// ========================================

/**
 * Cargar órdenes desde el archivo JSON
 */
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Error cargando órdenes:', error.message);
  }
  return [];
}

/**
 * Guardar órdenes en el archivo JSON
 */
function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    console.log('💾 Órdenes guardadas en archivo');
  } catch (error) {
    console.error('❌ Error guardando órdenes:', error.message);
  }
}

// Cargar órdenes al iniciar
let receivedOrders = loadOrders();
console.log(`📂 Se cargaron ${receivedOrders.length} órdenes del archivo`);

/**
 * POST /api/webhooks/uber/orders
 * Recibe webhooks de órdenes de Uber Eats
 */
app.post('/api/webhooks/uber/orders', (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('🔔 Webhook recibido de Uber Eats');
    console.log('   Tipo de evento:', webhookData.event_type);
    console.log('   Data:', JSON.stringify(webhookData, null, 2));

    // Procesar diferentes tipos de eventos
    if (webhookData.event_type === 'orders.notification') {
      const order = webhookData.data?.order || webhookData.data;
      
      if (order) {
        receivedOrders.push({
          id: order.id || `order-${Date.now()}`,
          orderId: order.id,
          status: order.status,
          customer: order.customer_name,
          total: order.total,
          items: order.items || [],
          platform: 'ubereats',
          paymentStatus: order.payment_status || 'complete',
          timestamp: new Date().toISOString(),
          rawData: order
        });
        
        console.log('✅ Orden guardada:', order.id);
        console.log('   Total de órdenes en memoria:', receivedOrders.length);
        
        // Guardar órdenes en archivo
        saveOrders(receivedOrders);
      }
    }

    // Responder a Uber que recibimos el webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook received and processed'
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:');
    console.error('   Error:', error.message);
    
    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * GET /api/webhooks/uber/orders
 * Obtiene órdenes recibidas por webhook (todas excepto terminadas)
 */
app.get('/api/webhooks/uber/orders', (req, res) => {
  console.log('📋 Obteniendo órdenes recibidas por webhook');
  
  // Mostrar todas las órdenes EXCEPTO las ya listas o canceladas
  const activeOrders = receivedOrders.filter(order => 
    order.status !== 'ready' && order.status !== 'cancelled'
  );
  
  console.log('   Total en archivo:', receivedOrders.length);
  console.log('   Activas:', activeOrders.length);
  
  return res.json({
    orders: activeOrders,
    total: activeOrders.length
  });
});

/**
 * POST /api/test/create-order
 * Endpoint de prueba para simular una orden de Uber
 * Body OPCIONAL:
 * {
 *   "customer_name": "Mi Cliente",
 *   "customer_phone": "+123456789",
 *   "delivery_address": "Mi Dirección",
 *   "items": [
 *     {"name": "Tacos", "quantity": 2, "price": 8.99},
 *     {"name": "Refresco", "quantity": 1, "price": 2.50}
 *   ]
 * }
 */
app.post('/api/test/create-order', (req, res) => {
  try {
    console.log('🧪 Creando orden de prueba...');
    console.log('   Body recibido:', JSON.stringify(req.body, null, 2));

    // Valores por defecto
    const defaultItems = [
      { name: 'Tacos al Pastor', quantity: 2, price: 8.99, subtotal: 17.98 },
      { name: 'Quesadilla de Pollo', quantity: 1, price: 6.99, subtotal: 6.99 },
      { name: 'Refresco Grande', quantity: 2, price: 2.50, subtotal: 5.00 }
    ];

    // Obtener datos del body o usar valores por defecto
    const items = req.body.items || defaultItems;
    
    // Calcular subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.subtotal || item.quantity * item.price);
    }, 0);
    
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const delivery_fee = 3.50;
    const total = Math.round((subtotal + tax + delivery_fee) * 100) / 100;

    const testOrder = {
      id: `TEST-ORDER-${Date.now()}`,
      status: 'pending',
      customer_name: req.body.customer_name || ('Cliente Test ' + Math.floor(Math.random() * 1000)),
      customer_phone: req.body.customer_phone || '+1234567890',
      delivery_address: req.body.delivery_address || '123 Main Street, Test City',
      items: items.map(item => ({
        ...item,
        subtotal: item.subtotal || (item.quantity * item.price)
      })),
      subtotal: subtotal,
      tax: tax,
      delivery_fee: delivery_fee,
      total: total,
      payment_method: 'card',
      payment_status: 'complete',
      created_at: new Date().toISOString(),
      estimated_pickup_time: 20
    };

    // Simular el webhook
    receivedOrders.push({
      id: testOrder.id,
      orderId: testOrder.id,
      status: testOrder.status,
      customer: testOrder.customer_name,
      total: testOrder.total,
      items: testOrder.items,
      platform: 'ubereats',
      paymentStatus: testOrder.payment_status,
      timestamp: new Date().toISOString(),
      rawData: testOrder
    });

    console.log('✅ Orden de prueba creada:', testOrder.id);
    console.log('   Cliente:', testOrder.customer_name);
    console.log('   Items:', testOrder.items.length);
    console.log('   Total:', testOrder.total);
    console.log('   Total de órdenes en memoria:', receivedOrders.length);

    // Guardar órdenes en archivo
    saveOrders(receivedOrders);

    return res.status(201).json({
      success: true,
      message: 'Test order created successfully',
      order: testOrder,
      webhookReceived: receivedOrders.length
    });

  } catch (error) {
    console.error('❌ Error creando orden de prueba:');
    console.error('   Error:', error.message);
    
    return res.status(500).json({
      error: 'internal_server_error',
      error_description: error.message
    });
  }
});

/**
 * DELETE /api/test/clear-orders
 * Limpia todas las órdenes de prueba (NO usar en producción)
 */
app.delete('/api/test/clear-orders', (req, res) => {
  const count = receivedOrders.length;
  receivedOrders = [];
  
  // Guardar en archivo (vacío)
  saveOrders(receivedOrders);
  
  console.log('🗑️  Órdenes limpiadas:', count);
  
  return res.json({
    success: true,
    message: `Cleared ${count} orders`
  });
});


// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    error: 'not_found',
    error_description: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  return res.status(500).json({
    error: 'internal_server_error',
    error_description: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Uber OAuth Backend Server         ║
║  Listening on: http://localhost:${PORT}  ║
║  Environment: ${process.env.NODE_ENV}             ║
║  CORS Origin: ${CORS_ORIGIN}  ║
╚════════════════════════════════════════╝
  `);
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /health');
  console.log('   POST /api/auth/uber/callback');
  console.log('   GET  /api/uber/orders');
  console.log('   POST /api/uber/orders/:orderId/accept');
  console.log('   POST /api/uber/orders/:orderId/reject');
  console.log('   PATCH /api/uber/orders/:orderId/status');
  console.log('   POST /api/webhooks/uber/orders');
  console.log('   GET  /api/webhooks/uber/orders');
  console.log('');
  console.log('🧪 Endpoints de PRUEBA (NO usar en producción):');
  console.log('   POST   /api/test/create-order');
  console.log('   DELETE /api/test/clear-orders');
  console.log('');
});
