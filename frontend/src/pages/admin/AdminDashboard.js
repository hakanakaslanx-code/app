import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Clock, Check, ChefHat, Bell, Package, X, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-500', icon: Check },
  preparing: { label: 'Preparing', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', icon: Bell },
  completed: { label: 'Completed', color: 'bg-slate-500', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: X },
};

const NEXT_STATUS = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const AdminDashboard = () => {
  const { getAuthHeader } = useAuth();
  const eventSourceRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settings, setSettings] = useState(null);

  const fetchOrders = async () => {
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/orders`, getAuthHeader()),
        axios.get(`${API}/settings`)
      ]);
      setOrders(ordersRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Set up SSE for real-time updates
  useEffect(() => {
    const connectSSE = () => {
      eventSourceRef.current = new EventSource(`${API}/admin/sse/orders`);
      
      eventSourceRef.current.addEventListener('new_order', (event) => {
        const newOrder = JSON.parse(event.data);
        setOrders(prev => [newOrder, ...prev]);
        
        // Play sound notification
        if (soundEnabled) {
          playNotificationSound();
        }
        
        toast.success(`New order from Table ${newOrder.tableNumber}!`, {
          duration: 5000,
        });
      });
      
      eventSourceRef.current.addEventListener('order_updated', (event) => {
        const updatedOrder = JSON.parse(event.data);
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      });
      
      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [soundEnabled]);

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleShQp+PkqWAuOYvb6pJdN0OIxdqZajRPf7nUmXU5U3mryYx3O0l0mrSAizxLb4WhfJY7QmpymXCgOzhqZ4RjoDs0ZWRyYJgwMF5eZF2LLS5WV11YgSsrT1JaVHoqKUpOUU51JydESEtJaSYlPkRHRl4lJDo/QkJTJCM2Oj4+SSMAAAA=');
    audio.play().catch(() => {});
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        getAuthHeader()
      );
      toast.success(`Order marked as ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order status');
    }
  };

  const formatPrice = (price) => {
    return `${settings?.currency || '$'}${price.toFixed(2)}`;
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !['completed', 'cancelled'].includes(order.status);
    return order.status === activeTab;
  });

  const orderCounts = {
    all: orders.length,
    active: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  if (loading) {
    return (
      <div className="p-6" data-testid="admin-dashboard-loading">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Orders Dashboard
          </h1>
          <p className="text-gray-500">Real-time order management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-full"
            data-testid="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            variant="outline"
            onClick={fetchOrders}
            className="rounded-full"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-100 p-1 rounded-full">
          <TabsTrigger value="all" className="rounded-full" data-testid="tab-all">
            All ({orderCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-full" data-testid="tab-active">
            Active ({orderCounts.active})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full" data-testid="tab-pending">
            Pending ({orderCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="rounded-full" data-testid="tab-preparing">
            Preparing ({orderCounts.preparing})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-full" data-testid="tab-ready">
            Ready ({orderCounts.ready})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No orders to display</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status];
            const StatusIcon = statusConfig.icon;
            const nextStatus = NEXT_STATUS[order.status];
            
            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border-l-4 shadow-sm overflow-hidden transition-all hover:shadow-md ${statusConfig.color}`}
                data-testid={`order-card-${order.id}`}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge className={`${statusConfig.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Table {order.tableNumber} • {formatTime(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Info */}
                  {(order.customerName || order.notes) && (
                    <div className="text-sm text-gray-500 mb-4 pt-3 border-t border-gray-100">
                      {order.customerName && <p>Customer: {order.customerName}</p>}
                      {order.notes && <p className="italic">Note: {order.notes}</p>}
                    </div>
                  )}

                  {/* Total & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-lg text-orange-600">
                      {formatPrice(order.total)}
                    </span>
                    
                    <div className="flex gap-2">
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <>
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                              data-testid={`advance-order-${order.id}`}
                            >
                              {nextStatus === 'accepted' && 'Accept'}
                              {nextStatus === 'preparing' && 'Start'}
                              {nextStatus === 'ready' && 'Ready'}
                              {nextStatus === 'completed' && 'Complete'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="text-red-500 border-red-200 hover:bg-red-50 rounded-full"
                            data-testid={`cancel-order-${order.id}`}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
