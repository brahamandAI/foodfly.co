"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserCheck,
  Package,
  Target
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalRestaurants: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageRating: number;
  todaysOrders: number;
  todaysRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  completionRate: number;
  cancellationRate: number;
  orderGrowth: number;
  revenueGrowth: number;
  averageOrderValue: number;
  paymentMethods: {
    cod: number;
    online: number;
    total: number;
  };
  ordersByStatus: Record<string, number>;
  systemHealth: {
    averageDeliveryTime: number;
    customerSatisfaction: number;
    platformUptime: number;
    activeRestaurants: number;
  };
  insights: {
    topPaymentMethod: string;
    dailyAverageOrders: number;
    peakOrderDay: string;
    popularRestaurant: string;
  };
  // Delivery Partner Stats
  totalDeliveryPartners: number;
  activeDeliveryPartners: number;
  avgDeliveryTime: number;
  deliveryPartnerRating: number;
  // Chef Stats
  totalChefs: number;
  activeChefs: number;
  avgChefRating: number;
  totalChefBookings: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  restaurant: {
    name: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [analyticsResponse, ordersResponse] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAllOrders()
      ]);

      setStats(analyticsResponse);
      setRecentOrders(ordersResponse.slice(0, 10) || []);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FoodFly Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">Comprehensive food delivery platform analytics</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                stats?.revenueGrowth >= 0 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {stats?.revenueGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(stats?.revenueGrowth || 0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                stats?.orderGrowth >= 0 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {stats?.orderGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(stats?.orderGrowth || 0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{(stats?.totalOrders || 0).toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Total Orders</p>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <Link href="/admin/users" className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                <Eye className="h-4 w-4" />
                <span>View</span>
              </Link>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{(stats?.totalUsers || 0).toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Active Users</p>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(stats?.averageRating || 0)
                        ? 'text-amber-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats?.averageRating || 0}</p>
              <p className="text-gray-600 mt-1">Customer Rating</p>
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Today's Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orders</span>
                <span className="text-2xl font-bold text-gray-900">{stats?.todaysOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="text-2xl font-bold text-gray-900">₹{(stats?.todaysRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Order Value</span>
                <span className="text-xl font-semibold text-gray-900">₹{stats?.averageOrderValue || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate</span>
                <span className="text-2xl font-bold text-emerald-600">{stats?.completionRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancellation Rate</span>
                <span className="text-2xl font-bold text-red-500">{stats?.cancellationRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Restaurants</span>
                <span className="text-xl font-semibold text-gray-900">{stats?.totalRestaurants || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Peak Day</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.insights?.peakOrderDay || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Top Payment</span>
                <span className="text-lg font-semibold text-gray-900 uppercase">{stats?.insights?.topPaymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Daily Average</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.insights?.dailyAverageOrders || 0} orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Order Status Overview</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-700">{stats?.pendingOrders || 0}</p>
              <p className="text-yellow-600 font-medium">Pending</p>
            </div>
            
            <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="p-3 bg-emerald-100 rounded-full w-fit mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats?.deliveredOrders || 0}</p>
              <p className="text-emerald-600 font-medium">Delivered</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700">{stats?.cancelledOrders || 0}</p>
              <p className="text-red-600 font-medium">Cancelled</p>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="p-3 bg-indigo-100 rounded-full w-fit mx-auto mb-3">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-700">{stats?.totalRestaurants || 0}</p>
              <p className="text-indigo-600 font-medium">Restaurants</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            </div>
            <Link 
              href="/admin/orders" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Order ID</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Customer</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Restaurant</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Amount</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Status</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 8).map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-gray-200 text-gray-900 px-3 py-1 rounded-md font-medium border">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{order.customerName}</td>
                      <td className="py-4 px-4 text-gray-600">{order.restaurant?.name || 'N/A'}</td>
                      <td className="py-4 px-4 font-semibold">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delivery Partners & Chefs Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Delivery Partners Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Partners</h2>
              </div>
              <Link href="/admin/delivery-partners" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All →
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-700">
                  {stats?.totalDeliveryPartners || 0}
                </div>
                <div className="text-sm text-blue-600">Total Partners</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-700">
                  {stats?.activeDeliveryPartners || 0}
                </div>
                <div className="text-sm text-green-600">Online Now</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {stats?.deliveryPartnerRating || 0}⭐
                </div>
                <div className="text-sm text-purple-600">Avg Rating</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-orange-700">
                  {stats?.avgDeliveryTime || 0}m
                </div>
                <div className="text-sm text-orange-600">Avg Delivery</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/delivery-partners" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors">
                Manage Partners
              </Link>
              <Link href="/admin/delivery-assignments" className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-center font-medium transition-colors">
                Live Tracking
              </Link>
            </div>
          </div>

          {/* Chefs Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Chef Services</h2>
              </div>
              <Link href="/admin/chefs" className="text-orange-600 hover:text-orange-800 font-medium text-sm">
                View All →
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-orange-700">
                  {stats?.totalChefs || 0}
                </div>
                <div className="text-sm text-orange-600">Total Chefs</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-700">
                  {stats?.activeChefs || 0}
                </div>
                <div className="text-sm text-green-600">Available</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {stats?.avgChefRating || 0}⭐
                </div>
                <div className="text-sm text-purple-600">Avg Rating</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-700">
                  {stats?.totalChefBookings || 0}
                </div>
                <div className="text-sm text-blue-600">Total Bookings</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/chefs" className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors">
                Manage Chefs
              </Link>
              <Link href="/admin/chef-bookings" className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-center font-medium transition-colors">
                View Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
            <Link href="/admin/orders" className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
              <ShoppingBag className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700">Orders</span>
            </Link>
            
            <Link href="/admin/users" className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
              <Users className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700">Users</span>
            </Link>
            
            <Link href="/admin/restaurants" className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group">
              <Package className="h-8 w-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-emerald-700">Restaurants</span>
            </Link>
            
            <Link href="/admin/analytics" className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group">
              <BarChart3 className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-indigo-700">Analytics</span>
            </Link>
            
            <button onClick={fetchDashboardData} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <RefreshCw className="h-8 w-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </button>
            
            <Link href="/admin/delivery-partners" className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
              <Package className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700">Delivery</span>
            </Link>
            
            <Link href="/admin/chefs" className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors group">
              <Star className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-orange-700">Chefs</span>
            </Link>
            
            <Link href="/admin/support" className="flex flex-col items-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group">
              <Activity className="h-8 w-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-amber-700">Support</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
} 