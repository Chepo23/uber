# 🚀 Uber Eats Integration - Backend + Frontend

Este proyecto integra OAuth de Uber Eats con un backend Node.js y frontend React + Vite.

---

## 📋 **Configuración Inicial - IMPORTANTE**

### **1. Obtener Client Secret de Uber**

El backend NECESITA el `client_secret` de Uber. Para obtenerlo:

1. Ve a https://developer.uber.com/dashboard
2. Selecciona tu aplicación
3. Ve a **Setup** → **Authentication**
4. Busca **"Client Secret"** (debajo de Authenticate with Client Secret)
5. Copia el valor

### **2. Actualizar backend/.env**

```bash
cd backend
```

Edita `backend/.env` y reemplaza:

```
UBER_CLIENT_SECRET=tu_client_secret_aqui
```

Con tu client secret real de Uber.

---

## 🏃 **Ejecutar Todo (dos terminales)**

### **Terminal 1: Backend (Puerto 3001)**

```bash
cd backend
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════╗
║  🚀 Uber OAuth Backend Server         ║
║  Listening on: http://localhost:3001  ║
╚════════════════════════════════════════╝
```

### **Terminal 2: Frontend (Puerto 5173)**

```bash
npm run dev
```

Deberías ver:
```
  VITE v8.0.9  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

---

## 🔐 **Flujo OAuth**

1. **Usuario hace click** en "Conectar con Uber Eats"
2. **Redirige a Uber** para autenticación
3. **Usuario autoriza** permisos a la app
4. **Uber redirige** a `http://localhost:5173/auth/callback?code=XXX`
5. **Frontend envía code** al backend: `POST /api/auth/uber/callback`
6. **Backend intercambia** code por access_token usando client_secret
7. **Frontend almacena** access_token en localStorage
8. **Usuario autenticado** ✅

---

## 📁 **Estructura**

```
uber/
├── backend/
│   ├── package.json
│   ├── server.js          # Express OAuth handler
│   └── .env               # Variables de entorno (CONFIDENCIAL)
├── src/
│   ├── services/
│   │   ├── uberOAuthService.js
│   │   └── ...
│   ├── components/
│   │   ├── OAuthCallback.jsx
│   │   └── ...
│   └── ...
├── .env                   # Frontend vars
└── package.json
```

---

## 🧪 **Testing**

### **Probar la autenticación:**

1. Abre http://localhost:5173
2. Haz click en "Conectar con Uber Eats"
3. Autoriza permisos en Uber
4. Deberías ver la pantalla de callback con espinner
5. Si todo funciona, serás redirigido al dashboard

### **Debugging:**

- **Console del navegador (F12):** Ver logs del frontend
- **Terminal backend:** Ver logs del server
- **DevTools → Network:** Ver requests HTTP

---

## 🛠️ **Troubleshooting**

### **Error: "Backend token exchange failed"**

Verifica en `backend/server.js` que el endpoint esté recibiendo requests:

```bash
# En la terminal del backend deberías ver:
📨 POST /api/auth/uber/callback
```

### **Error: 404 en backend**

Asegúrate que el backend está corriendo en puerto 3001:

```bash
curl http://localhost:3001/health
```

Debería responder con `{"status":"ok",...}`

### **Error: CORS bloqueado**

Verifica que `CORS_ORIGIN` en `backend/.env` sea `http://localhost:5173`

---

## 🔒 **Seguridad**

⚠️ **NUNCA** subas `backend/.env` a Git (incluye client_secret)

Agrega a `.gitignore`:

```
backend/.env
.env
node_modules/
dist/
```

---

## 📚 **Documentación Relacionada**

- [Uber Developers](https://developer.uber.com/dashboard)
- [Uber OAuth Docs](https://developer.uber.com/docs/guides/oauth-overview)
- [Vite Docs](https://vitejs.dev/)
- [Express Docs](https://expressjs.com/)

---

**¿Preguntas?** Revisa los logs en ambas terminales para más información.
