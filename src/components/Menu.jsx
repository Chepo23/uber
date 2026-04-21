import { useContext, useState, useEffect } from 'react';
import { OrderContext } from '../context/OrderContext';
import restaurantApi from '../services/restaurantApi';
import { X } from 'lucide-react';
import './Menu.css';
import { formatPrice } from '../utils/helpers';

export default function Menu() {
  const { addOrder, products } = useContext(OrderContext);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  
  // ✅ Datos del cliente (completo según Sierra)
  const [customerData, setCustomerData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    address2: '',
    city: '',
    zipCode: '',
    orderComments: ''
  });
  
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // ✅ Sincronizar menú desde el contexto
  useEffect(() => {
    if (products && products.length > 0) {
      setMenu(products);
      setLoadingMenu(false);
      // Expandir primera categoría por defecto
      if (products.length > 0) {
        setExpandedCategory(products[0].id);
      }
    } else {
      // Fallback al menú local si no hay datos de Sierra
      const demoMenu = restaurantApi.getDemoMenu().categories;
      setMenu(demoMenu);
      setLoadingMenu(false);
      if (demoMenu.length > 0) {
        setExpandedCategory(demoMenu[0].id);
      }
    }
  }, [products]);

  const addToCart = (product, categoryName) => {
    const cartItem = {
      ...product,
      category: categoryName,
      quantity: 1
    };
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    // ✅ Validar datos obligatorios
    if (!customerData.customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    if (!customerData.phone.trim()) {
      alert('Por favor ingresa el teléfono');
      return;
    }
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // ✅ Crear orden completa según esquema Sierra
    const order = {
      // IDs
      id: 'ORD' + Date.now().toString().slice(-8),
      orderNumber: 'ORD' + Date.now().toString().slice(-8),
      
      // Datos del cliente
      customerName: customerData.customerName,
      customer: customerData.customerName,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      address2: customerData.address2,
      city: customerData.city,
      zipCode: customerData.zipCode,
      
      // Información operacional
      terminal: "POS_WEB",
      cashier: "WEB_CASHIER",
      salesType: "7",
      orderType: "ORDEN WEB ONLINE",
      
      // Totales
      total: calculateTotal(),
      
      // Items del carrito
      items: cart.map(item => ({
        id: item.id || item.plu,
        plu: item.id || item.plu,
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        tax: 0, // Calculateado por Sierra
        taxTable: "0"
      })),
      
      // Metadatos
      products: cart,
      platform: 'WEB_POS',
      status: 'pending',
      orderComments: customerData.orderComments,
      timestamp: new Date().toISOString(),
      paymentMethod: 'ONLINE_PAYMENT'
    };

    try {
      console.log('📦 Enviando orden a Sierra:', order);
      const result = await addOrder(order);
      
      // ✅ Limpiar formulario
      setCustomerData({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        address2: '',
        city: '',
        zipCode: '',
        orderComments: ''
      });
      setCart([]);

      if (result.uploaded) {
        alert('✅ Orden creada y sincronizada con Sierra');
      } else {
        alert('⚠️ Orden guardada en tu cuenta, pero no se sincronizo con Sierra en este momento');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('❌ Error al crear la orden: ' + err.message);
    }
  };

  return (
    <div className="menu-container">
      <div className="menu-left">
        <h2>Menú del Restaurante</h2>
        {loadingMenu ? (
          <div className="loading">
            <p>Cargando menú...</p>
          </div>
        ) : (
          <>
            {/* Botones de Categorías */}
            <div className="category-buttons">
              {menu && menu.length > 0 ? (
                menu.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${expandedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  >
                    {category.name}
                  </button>
                ))
              ) : (
                <p className="no-menu">No hay categorías disponibles</p>
              )}
            </div>

            {/* Productos de la categoría seleccionada - aparecen DEBAJO */}
            {expandedCategory && menu.length > 0 && (
              <div className="expanded-products">
                {(() => {
                  const category = menu.find(cat => cat.id === expandedCategory);
                  if (!category) return null;
                  
                  return (
                    <>
                      <h3>{category.name}</h3>
                      <div className="products">
                        {(category.products || []).length > 0 ? (
                          category.products.map(product => (
                            <div key={product.id} className="product-card">
                              <div className="product-info">
                                <h4>{product.name}</h4>
                                <p>{product.description}</p>
                                <div className="product-footer">
                                  <span className="price">{formatPrice(product.price)}</span>
                                  <button 
                                    className="add-btn"
                                    onClick={() => addToCart(product, category.name)}
                                  >
                                    + Agregar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-products">Sin productos en esta categoría</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      <div className="menu-right">
        <div className="cart-container">
          <h2>Carrito de Compras</h2>
          
          <div className="customer-form">
            <div className="form-group">
              <label htmlFor="customerName">Nombre *</label>
              <input
                id="customerName"
                type="text"
                placeholder="Nombre del cliente"
                value={customerData.customerName}
                onChange={(e) => setCustomerData({...customerData, customerName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="customerPhone">Telefono *</label>
              <input
                id="customerPhone"
                type="tel"
                placeholder="+34 600 123 456"
                value={customerData.phone}
                onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="customerEmail">Email</label>
              <input
                id="customerEmail"
                type="email"
                placeholder="cliente@example.com"
                value={customerData.email}
                onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="customerAddress">Direccion</label>
              <input
                id="customerAddress"
                type="text"
                placeholder="Calle y número"
                value={customerData.address}
                onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="customerAddress2">Colonia</label>
              <input
                id="customerAddress2"
                type="text"
                placeholder="Colonia/Barrio"
                value={customerData.address2}
                onChange={(e) => setCustomerData({...customerData, address2: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerCity">Ciudad</label>
                <input
                  id="customerCity"
                  type="text"
                  placeholder="Ciudad"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerZipCode">Codigo Postal</label>
                <input
                  id="customerZipCode"
                  type="text"
                  placeholder="00000"
                  value={customerData.zipCode}
                  onChange={(e) => setCustomerData({...customerData, zipCode: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerNotes">Comentarios/Notas</label>
              <textarea
                id="customerNotes"
                placeholder="Ej: Sin cebolla, alergia a nueces..."
                value={customerData.orderComments}
                onChange={(e) => setCustomerData({...customerData, orderComments: e.target.value})}
                rows="2"
              />
            </div>
          </div>

          {cart.length === 0 ? (
            <p className="empty-cart">El carrito está vacío</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-category">{item.category}</p>
                    </div>
                    
                    <div className="item-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <button 
                className="create-order-btn"
                onClick={handleCreateOrder}
              >
                Crear Orden
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
