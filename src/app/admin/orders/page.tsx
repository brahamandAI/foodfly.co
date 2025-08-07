"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Eye, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  AlertCircle,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  IndianRupee
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Restaurant {
  _id: string;
  name: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  customizations?: string[];
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  restaurant: Restaurant;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  placedAt: string;
  estimatedDeliveryTime: string;
  deliveryAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  specialInstructions?: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-purple-100 text-purple-800 border-purple-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: CheckCircle,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('Admin authentication required');
        setOrders([]);
        return;
      }

      // Use database admin orders API exclusively
      const response = await fetch('/api/admin/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load orders: ${response.status}`);
      }

      const data = await response.json();
      const dbOrders = data.orders || [];
      console.log(`✅ Loaded ${dbOrders.length} orders from database`);
      
      // Sort by creation date (newest first)
      dbOrders.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(dbOrders);
      
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders from database');
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    try {
      // Use database admin API exclusively
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders from database
      await fetchOrders();
      toast.success(`Order status updated to ${statusLabels[newStatus as keyof typeof statusLabels]}`);
      
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryAddress.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-gray-600">Monitor and update order status</p>
              </div>
            </div>
            
            <button
              onClick={fetchOrders}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.preparing}</div>
            <div className="text-sm text-gray-600">Preparing</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.ready}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.out_for_delivery}</div>
            <div className="text-sm text-gray-600">Out for Delivery</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, customer, or restaurant..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Status ({stats.total})</option>
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = stats[status as keyof typeof stats] as number;
                  return (
                    <option key={status} value={status}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-semibold">{error}</p>
              <button 
                onClick={fetchOrders}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {orders.length === 0 ? 'No orders found' : `No orders match the current filter`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Items & Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status];
                    const nextStatus = getNextStatus(order.status);
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">{order.restaurant.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{order.paymentMethod}</p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                            <p className="text-sm text-gray-600">{order.customerEmail}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {order.deliveryAddress.phone}
                            </p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-sm text-gray-600">{order.items.length} items</p>
                            <div className="text-xs text-gray-500 max-w-xs">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <span key={idx}>
                                  {item.name} x{item.quantity}
                                  {idx < Math.min(order.items.length, 2) - 1 && ', '}
                                </span>
                              ))}
                              {order.items.length > 2 && `... +${order.items.length - 2} more`}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(order.placedAt)}
                            </p>
                            {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                              <p className="text-gray-600 flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                ETA: {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {nextStatus && !['delivered', 'cancelled'].includes(order.status) && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, nextStatus)}
                                disabled={updatingStatus[order._id]}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {updatingStatus[order._id] ? '...' : `Mark ${statusLabels[nextStatus as keyof typeof statusLabels]}`}
                              </button>
                            )}
                            
                            {!['delivered', 'cancelled'].includes(order.status) && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                disabled={updatingStatus[order._id]}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Order Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Order Number:</span>
                        <span className="ml-2 font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Restaurant:</span>
                        <span className="ml-2 font-medium">{selectedOrder.restaurant.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium">{statusLabels[selectedOrder.status]}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment:</span>
                        <span className="ml-2 font-medium capitalize">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-600">Name:</span> <span className="ml-2">{selectedOrder.deliveryAddress.name}</span></p>
                      <p><span className="text-gray-600">Email:</span> <span className="ml-2">{selectedOrder.customerEmail}</span></p>
                      <p><span className="text-gray-600">Phone:</span> <span className="ml-2">{selectedOrder.deliveryAddress.phone}</span></p>
                      <p><span className="text-gray-600">Address:</span> <span className="ml-2">
                        {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, 
                        {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}
                      </span></p>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.price)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-red-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedOrder.specialInstructions && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedOrder.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 