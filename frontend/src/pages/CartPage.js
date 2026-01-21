import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Minus, Trash2, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, tableInfo, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings`);
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const formatPrice = (price) => {
    return `${settings?.currency || '$'}${price.toFixed(2)}`;
  };

  const subtotal = getTotal();
  const taxRate = settings?.taxRate || 0.08;
  const tax = subtotal * taxRate;
  const serviceFee = settings?.serviceFee || 0;
  const total = subtotal + tax + serviceFee;

  const handlePlaceOrder = async () => {
    if (!tableInfo) {
      toast.error('Please select a table first');
      navigate('/order');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        tableId: tableInfo.id,
        tableNumber: tableInfo.number,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || undefined,
          modifiers: item.modifiers || []
        }))
      };

      const response = await axios.post(`${API}/orders`, orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-status/${response.data.id}`);
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="cart-page-empty">
        {/* Header */}
        <div className="glass sticky top-0 z-40 border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/order')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Your Cart
            </h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
            <Button
              onClick={() => navigate('/order')}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
              data-testid="browse-menu-btn"
            >
              Browse Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48" data-testid="cart-page">
      {/* Header */}
      <div className="glass sticky top-0 z-40 border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/order')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Your Cart
            </h1>
          </div>
          {tableInfo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
              <MapPin className="w-4 h-4" />
              Table {tableInfo.number}
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {cart.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            data-testid={`cart-item-${index}`}
          >
            <div className="flex">
              {item.imageUrl && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.modifiers?.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {item.modifiers.map(m => m.label).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-400 italic">"{item.notes}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    data-testid={`remove-item-${index}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      data-testid={`decrease-${index}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      data-testid={`increase-${index}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-semibold text-orange-600">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Contact Info (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                data-testid="customer-name-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Your phone number"
                data-testid="customer-phone-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Order Notes</label>
            <Textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Any special requests?"
              rows={2}
              data-testid="order-notes-input"
            />
          </div>
        </div>
      </div>

      {/* Order Summary - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-gray-100 z-50">
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Service Fee</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-orange-600">{formatPrice(total)}</span>
          </div>
          
          <Button
            onClick={handlePlaceOrder}
            disabled={loading || !tableInfo}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
            data-testid="place-order-btn"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
