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
  const [customerName, setCustomerName] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);

  // ✅ Sincronizar menú desde el contexto
  useEffect(() => {
    if (products && products.length > 0) {
      setMenu(products);
      setLoadingMenu(false);
    } else {
      // Fallback al menú local si no hay datos de Sierra
      setMenu(restaurantApi.getDemoMenu().categories);
      setLoadingMenu(false);
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

  const handleCreateOrder = () => {
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const order = {
      customer: customerName,
      items: cart,
      total: calculateTotal(),
      platform: 'local',
      notes: ''
    };

    addOrder(order);
    setCustomerName('');
    setCart([]);
    alert('Orden creada exitosamente');
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
          <div className="categories">
            {menu && menu.length > 0 ? (
              menu.map(category => (
                <div key={category.id} className="category">
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
                </div>
              ))
            ) : (
              <p className="no-menu">No hay categorías disponibles</p>
            )}
          </div>
        )}
      </div>

      <div className="menu-right">
        <div className="cart-container">
          <h2>Carrito de Compras</h2>
          
          <div className="customer-input">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
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
