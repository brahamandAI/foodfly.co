'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Star, 
  Package, 
  Truck, 
  CheckCircle, 
  Phone, 
  RefreshCw, 
  Receipt, 
  AlertCircle, 
  Search, 
  Eye,
  Repeat,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface OrderItem {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
  };
  quantity: number;
  price: number;
  customization?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    _id: string;
    name: string;
    image: string;
    phone: string;
    address: {
      street: string;
      city: string;
      area: string;
    };
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryFee: number;
  tax: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  deliveryAddress: {
    name: string;
    phone: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  estimatedDeliveryTime: string;
  placedAt: string;
  deliveredAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  cancelledAt?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusConfig = {
    pending: { 
      label: 'Order Placed', 
      icon: Clock, 
      color: 'text-yellow-600 bg-yellow-100 border-yellow-200', 
      description: 'Waiting for confirmation' 
    },
    confirmed: { 
      label: 'Confirmed', 
      icon: CheckCircle, 
      color: 'text-blue-600 bg-blue-100 border-blue-200', 
      description: 'Restaurant confirmed' 
    },
    preparing: { 
      label: 'Preparing', 
      icon: Package, 
      color: 'text-orange-600 bg-orange-100 border-orange-200', 
      description: 'Being prepared' 
    },
    ready: { 
      label: 'Ready', 
      icon: CheckCircle, 
      color: 'text-purple-600 bg-purple-100 border-purple-200', 
      description: 'Ready for pickup' 
    },
    out_for_delivery: { 
      label: 'Out for Delivery', 
      icon: Truck, 
      color: 'text-indigo-600 bg-indigo-100 border-indigo-200', 
      description: 'On the way' 
    },
    delivered: { 
      label: 'Delivered', 
      icon: CheckCircle, 
      color: 'text-green-600 bg-green-100 border-green-200', 
      description: 'Successfully delivered' 
    },
    cancelled: { 
      label: 'Cancelled', 
      icon: AlertCircle, 
      color: 'text-red-600 bg-red-100 border-red-200', 
      description: 'Order cancelled' 
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedFilter]); // Refetch when filter changes

  const filterOptions = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'active', label: 'Active Orders', count: orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
  ];

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters based on selected filter
      const params = new URLSearchParams();
      if (selectedFilter === 'cancelled') {
        params.append('status', 'cancelled');
      } else if (selectedFilter !== 'all') {
        params.append('status', selectedFilter);
      }
      // Note: cancelled orders are excluded by default unless status=cancelled
      
      // Fetch orders from database API
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      // Transform orders to match expected interface
      const transformedOrders = data.orders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        restaurant: {
          _id: order.restaurant._id,
          name: order.restaurant.name,
          image: '/images/restaurants/cafe.jpg', // Default image
          phone: '+91 9876543210', // Default phone
          address: {
            street: 'Main Street',
            city: 'Your City',
            area: 'Food District'
          }
        },
        items: order.items.map((item: any) => ({
          _id: item.menuItemId,
          menuItem: {
            _id: item.menuItemId,
            name: item.name,
            price: item.price,
            image: '/images/placeholder.svg',
            isVeg: true
          },
          quantity: item.quantity,
          price: item.price
        })),
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee || 0,
        tax: order.taxes || 0,
        subtotal: order.subtotal || 0,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        placedAt: order.placedAt || order.createdAt,
        createdAt: order.createdAt,
        specialInstructions: order.specialInstructions
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      // Clear current cart first and add items using unified cart service
      const { unifiedCartService } = require('@/lib/api');
      await unifiedCartService.clearCart();
      
      // Add items to cart using unified cart service
      for (const orderItem of order.items) {
        await unifiedCartService.addToCart(
          orderItem.menuItem._id,
          orderItem.menuItem.name,
          `Delicious ${orderItem.menuItem.name}`,
          orderItem.menuItem.price,
          orderItem.quantity,
          orderItem.menuItem.image || '/images/placeholder.svg',
          order.restaurant._id,
          order.restaurant.name,
          []
        );
      }

      toast.success('Items added to cart successfully!');
      window.location.href = '/cart';
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Server-side filtering handles status filters, we only need to handle search
    const matchesSearch = searchQuery === '' || 
      order.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEstimatedTime = (estimatedDeliveryTime: string) => {
    const estimated = new Date(estimatedDeliveryTime);
    const now = new Date();
    const diffMinutes = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Arriving soon';
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
                  <p className="text-gray-600">Track and manage your food orders</p>
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

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, restaurants, or dishes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFilter === option.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {orders.length === 0 ? 'No orders yet' : 'No orders found'}
              </h2>
              <p className="text-gray-600 mb-8">
                {orders.length === 0 
                  ? "You haven't placed any orders yet. Start exploring our delicious menu!"
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {orders.length === 0 && (
                <Link
                  href="/menu"
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Browse Menu
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={order._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.restaurant.name}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                              <StatusIcon className="h-4 w-4 mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Order #{order.orderNumber}</span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(order.placedAt)} at {formatTime(order.placedAt)}
                            </span>
                            {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                              <span className="flex items-center text-green-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {getEstimatedTime(order.estimatedDeliveryTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{order.totalAmount}</p>
                          <p className="text-sm text-gray-600">{order.items.length} items</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Items Ordered</h4>
                          <div className="space-y-2">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className="w-10 h-10 relative flex-shrink-0">
                                  <Image
                                    src={item.menuItem.image || '/images/placeholder.svg'}
                                    alt={item.menuItem.name}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                  {item.menuItem.isVeg && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.menuItem.name}
                                  </p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  ₹{item.price}
                                </p>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-sm text-gray-600">
                                +{order.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                            <p>{order.deliveryAddress.street}</p>
                            <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                            <p className="flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {order.deliveryAddress.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Payment: <span className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                          </span>
                          <span className={`text-sm font-medium ${
                            order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleReorder(order)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Repeat className="h-4 w-4" />
                            <span>Reorder</span>
                          </button>
                          
                          <Link
                            href={`/orders/${order._id}`}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 