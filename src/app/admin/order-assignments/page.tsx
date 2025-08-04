"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Truck,
  Package,
  User,
  MapPin,
  Phone,
  Calendar,
  Timer,
  RotateCcw,
  Ban,
  PlusCircle,
  Eye,
  Loader,
  ChevronDown,
  AlertCircle,
  Zap
} from 'lucide-react';

interface OrderAssignment {
  _id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  restaurantLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  customerLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    phone: string;
    email: string;
    deliveryProfile: {
      vehicleType: string;
      vehicleNumber?: string;
      rating?: number;
    };
  };
  status: 'pending' | 'assigned' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  timeoutAt?: string;
  currentAttempt: number;
  maxAssignmentAttempts: number;
  orderSummary: {
    totalAmount: number;
    itemCount: number;
    specialInstructions?: string;
    estimatedPrepTime: number;
  };
  timeElapsed: number;
  isTimedOut: boolean;
  formattedCreatedAt: string;
  formattedAssignedAt?: string;
  formattedAcceptedAt?: string;
  responseTime?: number;
  assignmentHistory: Array<{
    deliveryPartnerId: string;
    status: string;
    response?: string;
    formattedTimestamp: string;
  }>;
}

interface Summary {
  totalAssignments: number;
  pendingAssignments: number;
  assignedAssignments: number;
  acceptedAssignments: number;
  inTransitAssignments: number;
  deliveredAssignments: number;
  cancelledAssignments: number;
  failedAssignments: number;
  timedOutCount: number;
  avgAttempts: number;
  avgResponseTime: number;
}

export default function AdminOrderAssignmentsPage() {
  const [assignments, setAssignments] = useState<OrderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalAssignments: 0,
    pendingAssignments: 0,
    assignedAssignments: 0,
    acceptedAssignments: 0,
    inTransitAssignments: 0,
    deliveredAssignments: 0,
    cancelledAssignments: 0,
    failedAssignments: 0,
    timedOutCount: 0,
    avgAttempts: 0,
    avgResponseTime: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false
  });

  // Filters and search
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    orderId: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Selection and bulk operations
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [filters, pagination.currentPage]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAssignments();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, filters, pagination.currentPage]);

  const fetchAssignments = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        toast.error('Admin authentication required');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '20'
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.orderId) params.append('orderId', filters.orderId);

      const response = await fetch(`/api/admin/order-assignments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load order assignments: ${response.status}`);
      }

      const data = await response.json();
      
      setAssignments(data.assignments || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || {});
      
    } catch (error: any) {
      console.error('Error fetching order assignments:', error);
      toast.error('Failed to load order assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (assignmentId: string, action: string, data?: any) => {
    setActionLoading(prev => ({ ...prev, [assignmentId]: true }));
    
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/order-assignments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId,
          action,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform action');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh data
      fetchAssignments();
      
    } catch (error: any) {
      console.error('Error performing action:', error);
      toast.error(error.message || 'Failed to perform action');
    } finally {
      setActionLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedAssignments.length === 0) {
      toast.error('Please select assignments first');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/order-assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          assignmentIds: selectedAssignments,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      const result = await response.json();
      toast.success(result.message);
      
      setSelectedAssignments([]);
      setShowBulkActions(false);
      fetchAssignments();
      
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast.error(error.message || 'Failed to perform bulk action');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'assigned': return <User className="w-3 h-3" />;
      case 'accepted': return <CheckCircle className="w-3 h-3" />;
      case 'in_transit': return <Truck className="w-3 h-3" />;
      case 'delivered': return <Package className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'failed': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const toggleRowExpansion = (assignmentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 animate-spin text-yellow-400" />
          <p className="mt-4 text-gray-600">Loading order assignments...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Order Assignments</h1>
                <p className="text-gray-600">Monitor and manage delivery order assignments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>

              {selectedAssignments.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>{selectedAssignments.length} selected</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={fetchAssignments}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{summary.totalAssignments}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{summary.pendingAssignments}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{summary.assignedAssignments}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{summary.acceptedAssignments}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{summary.inTransitAssignments}</div>
            <div className="text-sm text-gray-600">In Transit</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{summary.deliveredAssignments}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{summary.cancelledAssignments}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{summary.timedOutCount}</div>
            <div className="text-sm text-gray-600">Timed Out</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{summary.avgResponseTime?.toFixed(0)}s</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                <input
                  type="text"
                  value={filters.assignedTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Delivery partner ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  type="text"
                  value={filters.orderId}
                  onChange={(e) => setFilters(prev => ({ ...prev, orderId: e.target.value }))}
                  placeholder="Order ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search assignments..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && selectedAssignments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-800">
                {selectedAssignments.length} assignments selected
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('bulkUpdateStatus', { newStatus: 'cancelled' })}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Cancel Selected
                </button>
                <button
                  onClick={() => handleBulkAction('handleTimeouts')}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                >
                  Handle Timeouts
                </button>
                <button
                  onClick={() => {
                    setSelectedAssignments([]);
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAssignments.length === assignments.length && assignments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssignments(assignments.map(a => a._id));
                        } else {
                          setSelectedAssignments([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Timing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <>
                    <tr key={assignment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAssignments.includes(assignment._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignments(prev => [...prev, assignment._id]);
                            } else {
                              setSelectedAssignments(prev => prev.filter(id => id !== assignment._id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              Order: {assignment.orderId.slice(-8)}
                            </span>
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(assignment.priority)}`}>
                              {assignment.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Attempt {assignment.currentAttempt}/{assignment.maxAssignmentAttempts}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.formattedCreatedAt}
                          </div>
                          {assignment.isTimedOut && (
                            <div className="flex items-center space-x-1 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>TIMED OUT</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.assignedTo ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.assignedTo.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignment.assignedTo.phone}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignment.assignedTo.deliveryProfile.vehicleType} - {assignment.assignedTo.deliveryProfile.vehicleNumber}
                            </div>
                            {assignment.assignedTo.deliveryProfile.rating && (
                              <div className="text-xs text-yellow-600">
                                ★ {assignment.assignedTo.deliveryProfile.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not assigned</div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            <span className="capitalize">{assignment.status.replace('_', ' ')}</span>
                          </span>
                          <div className="text-xs text-gray-500">
                            Elapsed: {formatTime(assignment.timeElapsed)}
                          </div>
                          {assignment.responseTime && (
                            <div className="text-xs text-green-600">
                              Response: {assignment.responseTime}s
                            </div>
                          )}
                          {assignment.timeoutAt && !assignment.isTimedOut && (
                            <div className="text-xs text-orange-600">
                              Timeout: {new Date(assignment.timeoutAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{assignment.orderSummary.totalAmount}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.orderSummary.itemCount} items
                          </div>
                          <div className="text-xs text-gray-500">
                            Prep: {assignment.orderSummary.estimatedPrepTime}min
                          </div>
                          {assignment.orderSummary.specialInstructions && (
                            <div className="text-xs text-blue-600 truncate max-w-32">
                              Note: {assignment.orderSummary.specialInstructions}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRowExpansion(assignment._id)}
                            className="p-1 text-gray-600 hover:text-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {assignment.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => handleAction(assignment._id, 'extendTimeout')}
                                disabled={actionLoading[assignment._id]}
                                className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                title="Extend Timeout"
                              >
                                <Timer className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  const newPartnerId = prompt('Enter new delivery partner ID:');
                                  if (newPartnerId) {
                                    handleAction(assignment._id, 'reassign', { newDeliveryPartnerId: newPartnerId });
                                  }
                                }}
                                disabled={actionLoading[assignment._id]}
                                className="p-1 text-orange-600 hover:text-orange-700 disabled:opacity-50"
                                title="Reassign"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {['pending', 'assigned', 'accepted'].includes(assignment.status) && (
                            <button
                              onClick={() => handleAction(assignment._id, 'cancel', { notes: 'Cancelled by admin' })}
                              disabled={actionLoading[assignment._id]}
                              className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="Cancel"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          
                          {assignment.status === 'pending' && (
                            <button
                              onClick={() => {
                                const partnerId = prompt('Enter delivery partner ID to force assign:');
                                if (partnerId) {
                                  handleAction(assignment._id, 'forceAssign', { newDeliveryPartnerId: partnerId });
                                }
                              }}
                              disabled={actionLoading[assignment._id]}
                              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Force Assign"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                          
                          {actionLoading[assignment._id] && (
                            <Loader className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {expandedRows.has(assignment._id) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Locations */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Locations</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <div className="font-medium text-gray-700">Restaurant:</div>
                                  <div className="text-gray-600">{assignment.restaurantLocation.address}</div>
                                  <div className="text-xs text-gray-500">
                                    {assignment.restaurantLocation.coordinates[1]}, {assignment.restaurantLocation.coordinates[0]}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700">Customer:</div>
                                  <div className="text-gray-600">{assignment.customerLocation.address}</div>
                                  <div className="text-xs text-gray-500">
                                    {assignment.customerLocation.coordinates[1]}, {assignment.customerLocation.coordinates[0]}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Assignment History */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Assignment History</h4>
                              <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                                {assignment.assignmentHistory.map((history, index) => (
                                  <div key={index} className="border-l-2 border-gray-200 pl-3">
                                    <div className="font-medium text-gray-700">
                                      Partner: {history.deliveryPartnerId.slice(-6)}
                                    </div>
                                    <div className="text-gray-600">
                                      Status: {history.status}
                                    </div>
                                    {history.response && (
                                      <div className="text-gray-600">
                                        Response: {history.response}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                      {history.formattedTimestamp}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Timestamps</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Created:</span>
                                  <span className="ml-2 text-gray-600">{assignment.formattedCreatedAt}</span>
                                </div>
                                {assignment.formattedAssignedAt && (
                                  <div>
                                    <span className="font-medium text-gray-700">Assigned:</span>
                                    <span className="ml-2 text-gray-600">{assignment.formattedAssignedAt}</span>
                                  </div>
                                )}
                                {assignment.formattedAcceptedAt && (
                                  <div>
                                    <span className="font-medium text-gray-700">Accepted:</span>
                                    <span className="ml-2 text-gray-600">{assignment.formattedAcceptedAt}</span>
                                  </div>
                                )}
                                {assignment.deliveredAt && (
                                  <div>
                                    <span className="font-medium text-gray-700">Delivered:</span>
                                    <span className="ml-2 text-gray-600">
                                      {new Date(assignment.deliveredAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {assignment.cancelledAt && (
                                  <div>
                                    <span className="font-medium text-gray-700">Cancelled:</span>
                                    <span className="ml-2 text-gray-600">
                                      {new Date(assignment.cancelledAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalCount)} of {pagination.totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 