"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Star, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerEmail: string;
  deliveryAddress: {
    name: string;
    phone: string;
  };
  restaurant: {
    _id: string;
    name: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  placedAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    averageRating: 0,
    todaysOrders: 0,
    todaysRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    cancellationRate: 0,
    orderGrowth: 0,
    revenueGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchDashboardData(true); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const dashboardData = await adminApi.getDashboardStats();
      setStats({
        totalOrders: dashboardData.totalOrders || 0,
        totalRevenue: dashboardData.totalRevenue || 0,
        totalUsers: dashboardData.totalUsers || 0,
        totalRestaurants: dashboardData.totalRestaurants || 0,
        pendingOrders: dashboardData.pendingOrders || 0,
        deliveredOrders: dashboardData.deliveredOrders || 0,
        cancelledOrders: dashboardData.cancelledOrders || 0,
        averageRating: dashboardData.averageRating || 0,
        todaysOrders: dashboardData.todaysOrders || 0,
        todaysRevenue: dashboardData.todaysRevenue || 0,
        monthlyOrders: dashboardData.monthlyOrders || 0,
        monthlyRevenue: dashboardData.monthlyRevenue || 0,
        completionRate: dashboardData.completionRate || 0,
        cancellationRate: dashboardData.cancellationRate || 0,
        orderGrowth: dashboardData.orderGrowth || 0,
        revenueGrowth: dashboardData.revenueGrowth || 0
      });

      // Get recent orders - using the same API call for now
      const ordersData = await adminApi.getAllOrders();
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setLastUpdated(new Date());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#232323] p-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-[#232323] p-8">
        <div className="text-center py-16">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="px-6 py-3 bg-primary text-[#232323] rounded-lg hover:bg-yellow-600 font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 text-gray-800">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-orange-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500 text-white p-3 rounded-xl">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Foodfly Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm">
                  Real-time analytics and insights
                  {lastUpdated && (
                    <> • Last updated: {lastUpdated.toLocaleTimeString()}</>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-green-600 animate-spin' : 'text-gray-400'}`} />
                <label className="text-sm font-medium">Auto-refresh</label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                    autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    autoRefresh ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Manual refresh button */}
              <button 
                onClick={() => fetchDashboardData()}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Overview Metrics */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-800">Business Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Total Orders',
                value: stats.totalOrders.toLocaleString(),
                icon: ShoppingBag,
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                change: '+12%'
              },
              {
                label: 'Total Revenue',
                value: formatCurrency(stats.totalRevenue),
                icon: DollarSign,
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
                change: '+8%'
              },
              {
                label: 'Active Users',
                value: stats.totalUsers.toLocaleString(),
                icon: Users,
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
                change: '+15%'
              },
              {
                label: 'Partner Restaurants',
                value: stats.totalRestaurants.toLocaleString(),
                icon: Star,
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50',
                change: '+5%'
              }
            ].map((metric) => {
              const IconComponent = metric.icon;
              return (
                <div key={metric.label} className={`${metric.bgColor} backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
                      <TrendingUp className="h-3 w-3" />
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{metric.value}</div>
                  <div className="text-gray-600 font-medium">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Performance */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-800">Today's Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Today's Orders",
                value: stats.todaysOrders.toLocaleString(),
                icon: Clock,
                color: 'from-indigo-500 to-indigo-600',
                bgColor: 'bg-indigo-50'
              },
              {
                label: "Today's Revenue",
                value: formatCurrency(stats.todaysRevenue),
                icon: DollarSign,
                color: 'from-emerald-500 to-emerald-600',
                bgColor: 'bg-emerald-50'
              },
              {
                label: 'Monthly Orders',
                value: stats.monthlyOrders.toLocaleString(),
                icon: TrendingUp,
                color: 'from-cyan-500 to-cyan-600',
                bgColor: 'bg-cyan-50'
              },
              {
                label: 'Monthly Revenue',
                value: formatCurrency(stats.monthlyRevenue),
                icon: DollarSign,
                color: 'from-teal-500 to-teal-600',
                bgColor: 'bg-teal-50'
              }
            ].map((metric) => {
              const IconComponent = metric.icon;
              return (
                <div key={metric.label} className={`${metric.bgColor} backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{metric.value}</div>
                  <div className="text-gray-600 font-medium">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Order Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-800">Order Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Pending Orders',
                  value: stats.pendingOrders,
                  icon: Clock,
                  color: 'text-yellow-600',
                  bgColor: 'bg-yellow-100'
                },
                {
                  label: 'Completed',
                  value: stats.deliveredOrders,
                  icon: CheckCircle,
                  color: 'text-green-600',
                  bgColor: 'bg-green-100'
                },
                {
                  label: 'Cancelled',
                  value: stats.cancelledOrders,
                  icon: XCircle,
                  color: 'text-red-600',
                  bgColor: 'bg-red-100'
                },
                {
                  label: 'Avg Rating',
                  value: stats.averageRating.toFixed(1),
                  icon: Star,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-100'
                }
              ].map((metric) => {
                const IconComponent = metric.icon;
                return (
                  <div key={metric.label} className={`${metric.bgColor} rounded-xl p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-8 w-8 ${metric.color}`} />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{metric.value}</div>
                        <div className="text-sm text-gray-600">{metric.label}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-800">Performance Insights</h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: 'Order Completion Rate',
                  value: stats.completionRate,
                  suffix: '%',
                  color: stats.completionRate >= 80 ? 'text-green-600' : 'text-yellow-600',
                  bgColor: stats.completionRate >= 80 ? 'bg-green-100' : 'bg-yellow-100'
                },
                {
                  label: 'Cancellation Rate',
                  value: stats.cancellationRate,
                  suffix: '%',
                  color: stats.cancellationRate <= 10 ? 'text-green-600' : 'text-red-600',
                  bgColor: stats.cancellationRate <= 10 ? 'bg-green-100' : 'bg-red-100'
                },
                {
                  label: 'Monthly Growth',
                  value: stats.orderGrowth,
                  suffix: '%',
                  color: stats.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600',
                  bgColor: stats.orderGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
                },
                {
                  label: 'Revenue Growth',
                  value: stats.revenueGrowth,
                  suffix: '%',
                  color: stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600',
                  bgColor: stats.revenueGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
                }
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">{metric.label}</span>
                  <div className={`${metric.bgColor} ${metric.color} px-3 py-1 rounded-full font-bold text-sm`}>
                    {metric.value}{metric.suffix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            </div>
            <Link 
              href="/admin/orders" 
              className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
            >
              <span>View All Orders</span>
              <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent orders found</p>
              <p className="text-gray-400 text-sm">Orders will appear here once customers start placing them</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Order Details</th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Customer</th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Restaurant</th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Amount</th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map(order => (
                      <tr key={order._id} className="hover:bg-orange-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{order.deliveryAddress.name}</div>
                          <div className="text-sm text-gray-500">{order.deliveryAddress.phone}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{order.restaurant.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-lg text-green-600">{formatCurrency(order.totalAmount)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{formatDate(order.placedAt || order.createdAt)}</div>
                          <div className="text-xs text-gray-500">{new Date(order.placedAt || order.createdAt).toLocaleTimeString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 