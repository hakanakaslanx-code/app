import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Clock, ChefHat, Bell, Package, X, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Received', icon: Clock, color: 'text-yellow-500' },
  { key: 'accepted', label: 'Order Accepted', icon: Check, color: 'text-blue-500' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-500' },
  { key: 'ready', label: 'Ready for Pickup', icon: Bell, color: 'text-green-500' },
  { key: 'completed', label: 'Completed', icon: Package, color: 'text-gray-500' },
];

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, settingsRes] = await Promise.all([
          axios.get(`${API}/orders/${orderId}`),
          axios.get(`${API}/settings`)
        ]);
        setOrder(orderRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [orderId]);

  // Set up SSE for real-time updates
  useEffect(() => {
    if (!orderId) return;

    const connectSSE = () => {
      eventSourceRef.current = new EventSource(`${API}/sse/orders/${orderId}`);
      
      eventSourceRef.current.addEventListener('status_update', (event) => {
        const data = JSON.parse(event.data);
        setOrder(data.order);
        
        // Show notification for status changes
        const statusStep = STATUS_STEPS.find(s => s.key === data.status);
        if (statusStep) {
          toast.success(`Order ${statusStep.label}!`);
        }
      });
      
      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close();
        // Reconnect after a delay
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [orderId]);

  const formatPrice = (price) => {
    return `${settings?.currency || '$'}${price.toFixed(2)}`;
  };

  const getStatusIndex = () => {
    if (!order) return -1;
    return STATUS_STEPS.findIndex(s => s.key === order.status);
  };

  const isCancelled = order?.status === 'cancelled';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4" data-testid="order-status-loading">
        <div className="max-w-lg mx-auto">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/order')}
            className="bg-orange-500 hover:bg-orange-600"
            data-testid="back-to-menu-btn"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const statusIndex = getStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="order-status-page">
      {/* Header */}
      <div className="glass sticky top-0 z-40 border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/order')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500">Table {order.tableNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {isCancelled ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Cancelled</h2>
              <p className="text-gray-500">Your order has been cancelled.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                {statusIndex < STATUS_STEPS.length - 1 ? (
                  <>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-status-pulse ${
                      STATUS_STEPS[statusIndex]?.color.replace('text-', 'bg-').replace('500', '100')
                    }`}>
                      {(() => {
                        const Icon = STATUS_STEPS[statusIndex]?.icon || Clock;
                        return <Icon className={`w-10 h-10 ${STATUS_STEPS[statusIndex]?.color}`} />;
                      })()}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {STATUS_STEPS[statusIndex]?.label}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Order Complete</h2>
                    <p className="text-gray-500">Thank you for your order!</p>
                  </>
                )}
              </div>

              {/* Progress Steps */}
              <div className="relative">
                {STATUS_STEPS.slice(0, -1).map((step, index) => {
                  const isCompleted = index < statusIndex;
                  const isCurrent = index === statusIndex;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex items-start mb-6 last:mb-0">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? `${step.color.replace('text-', 'bg-').replace('500', '100')} ${step.color}`
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        {index < STATUS_STEPS.length - 2 && (
                          <div className={`absolute left-1/2 top-10 w-0.5 h-6 -translate-x-1/2 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${
                          isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Order Details
          </h3>
          
          <div className="space-y-3 mb-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="text-gray-600">{item.quantity}x </span>
                  <span className="text-gray-900">{item.name}</span>
                  {item.modifiers?.length > 0 && (
                    <p className="text-sm text-gray-500 ml-6">
                      {item.modifiers.map(m => m.label).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-orange-600">{formatPrice(order.total)}</span>
            </div>
          </div>

          {order.customerName && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Customer: <span className="text-gray-900">{order.customerName}</span>
              </p>
            </div>
          )}
        </div>

        {/* New Order Button */}
        <Button
          onClick={() => navigate('/order')}
          variant="outline"
          className="w-full rounded-full py-6 border-gray-200 hover:bg-gray-50"
          data-testid="new-order-btn"
        >
          <Home className="w-5 h-5 mr-2" />
          Start New Order
        </Button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
