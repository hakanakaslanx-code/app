import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tableInfo, setTableInfo] = useState(() => {
    const saved = localStorage.getItem('tableInfo');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (tableInfo) {
      localStorage.setItem('tableInfo', JSON.stringify(tableInfo));
    }
  }, [tableInfo]);

  const addToCart = (item, quantity = 1, notes = '', selectedModifiers = []) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        cartItem => 
          cartItem.menuItemId === item.id && 
          cartItem.notes === notes &&
          JSON.stringify(cartItem.modifiers) === JSON.stringify(selectedModifiers)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
      
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price + modifierPrice,
        basePrice: item.price,
        quantity,
        notes,
        modifiers: selectedModifiers,
        imageUrl: item.imageUrl
      }];
    });
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      tableInfo,
      setTableInfo,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
