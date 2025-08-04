'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  CheckCircle,
  XCircle,
  Loader,
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Navigation,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeliveryOrder {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  restaurant: {
    name: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  distance: number;
  earnings: number;
}

interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  totalEarnings: number;
  averageRating: number;
  activeDeliveries: number;
  thisMonthDeliveries: number;
  thisMonthEarnings: number;
  availabilityStatus: 'available' | 'busy' | 'offline';
}

interface DeliveryNotification {
  id: string;
  type: 'new_order' | 'order_update' | 'payment_received' | 'rating_received';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
}

export default function DeliveryDashboard() {
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    activeDeliveries: 0,
    thisMonthDeliveries: 0,
    thisMonthEarnings: 0,
    availabilityStatus: 'available'
  });

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState('all');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('delivery-token');
      if (!token) {
        console.log('❌ No delivery token found for dashboard data');
        return;
      }

      console.log('🔄 Loading delivery dashboard data...');

      // Load stats
      const statsResponse = await fetch('/api/delivery/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Delivery stats loaded:', statsData);
        setStats(statsData);
        setAvailabilityStatus(statsData.availabilityStatus || 'available');
      } else {
        console.error('❌ Failed to load delivery stats:', statsResponse.status);
      }

      // Load orders
      const ordersResponse = await fetch('/api/delivery/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('📦 Delivery orders loaded:', ordersData);
        setOrders(ordersData.orders || []);
      } else {
        console.error('❌ Failed to load delivery orders:', ordersResponse.status);
      }

    } catch (error) {
      console.error('❌ Error loading delivery dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('delivery-token');
      if (!token) return;

      const response = await fetch('/api/delivery/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'pickup' | 'deliver') => {
    try {
      const token = localStorage.getItem('delivery-token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('Sending order action:', { orderId, action });
      
      const response = await fetch('/api/delivery/orders', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          action
        })
      });

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (response.ok) {
        const result = JSON.parse(responseData);
        toast.success(`Order ${action}ed successfully`);
        loadDashboardData(); // Reload data
      } else {
        try {
          const error = JSON.parse(responseData);
          toast.error(error.error || `Failed to ${action} order`);
        } catch (e) {
          toast.error(`Failed to ${action} order: ${responseData}`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing order:`, error);
      toast.error(`Failed to ${action} order`);
    }
  };

  const updateAvailability = async (status: 'available' | 'busy' | 'offline') => {
    try {
      const token = localStorage.getItem('delivery-token');
      if (!token) {
        console.log('❌ No delivery token found for availability update');
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/delivery/availability', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setAvailabilityStatus(status);
        toast.success(`Status updated to ${status}`);
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('delivery-token');
      
      if (token) {
        await fetch('/api/auth/delivery-logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear all delivery-specific localStorage data
      localStorage.removeItem('delivery-token');
      localStorage.removeItem('delivery-user');
      localStorage.removeItem('delivery-userType');
      localStorage.removeItem('delivery-sessionId');

      toast.success('Logged out successfully');
      window.location.href = '/delivery/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = '/delivery/login';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'picked_up': return 'bg-purple-500';
      case 'in_transit': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === orderFilter);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
            <div className="flex items-center space-x-2">
              <Truck className="h-6 w-6 text-yellow-500" />
              <p className="text-lg font-semibold text-white">Loading delivery dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header - Dark Theme */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 shadow-2xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-full p-3 mr-4 border border-gray-700">
                <Truck className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">Delivery Dashboard</h1>
                <p className="text-gray-300 text-sm mt-1">Manage your deliveries and earnings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Availability Status */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-300">Status:</span>
                <div className="flex space-x-3">
                  {[
                    { value: 'available', label: 'Available', color: 'green', icon: '✨', gradient: 'from-green-400 to-emerald-500' },
                    { value: 'busy', label: 'Busy', color: 'yellow', icon: '⚡', gradient: 'from-yellow-400 to-orange-500' },
                    { value: 'offline', label: 'Offline', color: 'red', icon: '🌙', gradient: 'from-gray-400 to-slate-500' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateAvailability(status.value as any)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        availabilityStatus === status.value
                          ? `bg-gradient-to-r ${status.gradient} text-white shadow-lg ring-2 ring-gray-600/50`
                          : 'bg-gray-800/60 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-600'
                      }`}
                    >
                      <span className="mr-2">{status.icon}</span>
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600/80 backdrop-blur-sm rounded-full px-6 py-3 text-white font-semibold hover:bg-red-700/90 transition-all duration-300 transform hover:scale-105 shadow-lg ring-2 ring-gray-600/50 border border-red-500/50"
              >
                <LogOut className="h-5 w-5 mr-2 inline" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Deliveries */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Deliveries</p>
                <p className="text-3xl font-bold text-white">{stats.totalDeliveries || 0}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Completed Deliveries */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Completed</p>
                <p className="text-3xl font-bold text-white">{stats.completedDeliveries || 0}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Earnings</p>
                <p className="text-3xl font-bold text-white">₹{(stats.totalEarnings || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Rating</p>
                <p className="text-3xl font-bold text-white">{(stats.averageRating || 0).toFixed(1)}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-full">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders - Dark Theme */}
        <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Package className="h-7 w-7 mr-3 text-yellow-500" />
              Active Delivery Orders
            </h2>
            <div className="flex space-x-2">
              {['all', 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    orderFilter === filter
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 border border-gray-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order._id} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${getOrderStatusColor(order.status)}`}></div>
                        <span className={`font-semibold text-sm px-3 py-1 rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50' :
                          order.status === 'assigned' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50' :
                          order.status === 'picked_up' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/50' :
                          order.status === 'in_transit' ? 'bg-orange-900/50 text-orange-300 border border-orange-500/50' :
                          order.status === 'delivered' ? 'bg-green-900/50 text-green-300 border border-green-500/50' :
                          'bg-gray-900/50 text-gray-300 border border-gray-500/50'
                        }`}>
                          {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">Order #{order.orderId}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <strong className="text-white">Customer:</strong> {order.customer.name}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Restaurant:</strong> {order.restaurant.name}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Items:</strong> {order.items.length} items
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <strong className="text-white">Total:</strong> ₹{order.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Earnings:</strong> ₹{order.earnings.toLocaleString()}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Distance:</strong> {order.distance} km
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex space-x-3 lg:ml-6">
                        <button
                          onClick={() => handleOrderAction(order._id, 'accept')}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleOrderAction(order._id, 'reject')}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {order.status === 'assigned' && (
                      <div className="flex space-x-3 lg:ml-6">
                        <button
                          onClick={() => handleOrderAction(order._id, 'pickup')}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Pick Up
                        </button>
                      </div>
                    )}

                    {order.status === 'picked_up' && (
                      <div className="flex space-x-3 lg:ml-6">
                        <button
                          onClick={() => handleOrderAction(order._id, 'deliver')}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
                  <Package className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No active orders</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  When new delivery orders are assigned to you, they will appear here for you to accept and manage.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 