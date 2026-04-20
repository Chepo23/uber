# POS System - Uber Eats Integration

Sistema de Punto de Venta (POS) con integración de Uber Eats.

## 🚀 Características

- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión de órdenes locales
- ✅ Integración con Uber Eats API
- ✅ Menú editable de productos
- ✅ Carrito de compras
- ✅ Sincronización automática entre plataformas
- ✅ Interfaz responsive

## 📋 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:3001/api
VITE_UBER_API_URL=http://localhost:3002/api
VITE_UBER_AUTH_TOKEN=tu_token_aqui
```

3. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.jsx    # Panel de estadísticas
│   ├── Menu.jsx         # Creación de órdenes locales
│   ├── OrderList.jsx    # Lista de órdenes
│   ├── OrderDetail.jsx  # Detalles de orden
│   ├── UberEatsPanel.jsx# Gestión de Uber Eats
│   └── *.css           # Estilos de componentes
├── context/             # Context API
│   └── OrderContext.jsx # Estado global de órdenes
├── services/            # Servicios API
│   ├── restaurantApi.js # API del restaurante
│   └── uberEatsApi.js  # API de Uber Eats
├── utils/               # Funciones auxiliares
│   └── helpers.js      # Funciones de utilidad
├── pages/               # Páginas (para expansión futura)
└── App.jsx              # Componente principal
```

## 🔧 Funcionalidades

### Dashboard
- Muestra estadísticas en tiempo real
- Órdenes pendientes y completadas
- Ingresos totales
- Estado del sistema

### Crear Órdenes
- Menú interactivo con categorías
- Agregar productos al carrito
- Gestionar cantidades
- Crear órdenes locales

### Órdenes Locales
- Vista de lista con estado de órdenes
- Actualizar estado de órdenes
- Ver detalles de cada orden
- Editar información del cliente

### Uber Eats
- Sincronización con API de Uber
- Confirmar/rechazar órdenes
- Actualizar estados
- Ver órdenes pendientes

## 🔌 Integración APIs

### API del Restaurante (Demo)
La API del restaurante proporciona:
- Menú de productos
- Gestión de órdenes locales
- Estado de órdenes

### API Uber Eats (Demo)
La API de Uber Eats proporciona:
- Órdenes de Uber Eats
- Confirmación de órdenes
- Actualización de estado
- Rechazo de órdenes

## 💾 Almacenamiento

Actualmente usa **Context API** para almacenamiento local en memoria. Para producción, considera:
- Usar una base de datos (MongoDB, PostgreSQL)
- Redis para caché
- localStorage para persistencia básica

## 🎨 Tema de Colores

- **Principal:** #FF6B00 (Naranja Uber)
- **Éxito:** #4CAF50 (Verde)
- **Info:** #2196F3 (Azul)
- **Error:** #f44336 (Rojo)

## 🚀 Próximas Mejoras

- [ ] Autenticación de usuarios
- [ ] Base de datos persistente
- [ ] Historial de órdenes
- [ ] Reportes y analíticas
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Integración con más plataformas (DoorDash, etc)
- [ ] Gestión de inventario
- [ ] Sistema de promociones

## 📝 Notas

- Las APIs actualmente usan datos de demostración
- Para conectar a APIs reales, actualiza las URLs en `.env`
- El token de autenticación debe ser válido

## 🔒 Seguridad

- Nunca hagas commit del archivo `.env`
- Usa variables de entorno para tokens sensibles
- Valida siempre las entrada del usuario

## 📞 Soporte

Para soporte, contacta con el equipo de desarrollo.
