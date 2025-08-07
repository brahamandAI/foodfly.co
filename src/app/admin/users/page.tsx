"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Shield,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'user').length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
        <div className="text-center py-16">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchUsers}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-orange-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage FoodFly platform users and administrators
                </p>
              </div>
            </div>
            
            <button 
              onClick={fetchUsers}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Refresh Users</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              label: 'Total Users',
              value: userStats.total,
              icon: Users,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50'
            },
            {
              label: 'Active Users',
              value: userStats.active,
              icon: UserCheck,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50'
            },
            {
              label: 'Inactive Users',
              value: userStats.inactive,
              icon: UserX,
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-50'
            },
            {
              label: 'Administrators',
              value: userStats.admins,
              icon: Shield,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50'
            },
            {
              label: 'Customers',
              value: userStats.customers,
              icon: User,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-50'
            }
          ].map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-white/20`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>

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
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Customers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {users.length === 0 
                ? "No users have registered on the platform yet"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">User Details</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Contact</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Role & Status</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Activity</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Orders</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-orange-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className={`h-5 w-5 ${user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrator' : 'Customer'}
                          </span>
                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            Joined: {formatDate(user.createdAt)}
                          </div>
                          {user.lastLogin && (
                            <div className="text-xs text-gray-500">
                              Last login: {formatDate(user.lastLogin)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {user.role === 'user' ? (
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {user.totalOrders || 0} orders
                            </div>
                            <div className="text-gray-600">
                              {user.totalSpent ? formatCurrency(user.totalSpent) : '₹0'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              user.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
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
  );
} 