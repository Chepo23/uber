import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
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

    // Llamar a Uber para aceptar la orden
    const acceptResponse = await fetch(`https://api.uber.com/v1/marketplace/orders/${orderId}/accept`, {
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

    // Llamar a Uber para rechazar la orden
    const rejectResponse = await fetch(`https://api.uber.com/v1/marketplace/orders/${orderId}/reject`, {
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

    // Llamar a Uber para actualizar estado
    const updateResponse = await fetch(`https://api.uber.com/v1/marketplace/orders/${orderId}`, {
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
  console.log('');
});
