'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  ChefHat, 
  CheckCircle, 
  Bell, 
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChefEvent {
  _id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    title: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    guestCount: number;
    cuisine: string[];
    specialRequests?: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  pricing: {
    totalAmount: number;
    currency: string;
  };
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  timeline: {
    bookedAt: string;
    confirmedAt?: string;
    startedAt?: string;
    completedAt?: string;
  };
}

interface DashboardStats {
  totalBookings: number;
  completedEvents: number;
  totalRevenue: number;
  averageRating: number;
  pendingRequests: number;
  thisMonthBookings: number;
  thisMonthRevenue: number;
  availabilityStatus: 'available' | 'busy' | 'offline';
}

interface ChefNotification {
  id: string;
  type: 'booking_request' | 'payment_received' | 'review_received' | 'booking_cancelled';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  eventId?: string;
}

export default function ChefDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    completedEvents: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingRequests: 0,
    thisMonthBookings: 0,
    thisMonthRevenue: 0,
    availabilityStatus: 'available'
  });

  const [events, setEvents] = useState<ChefEvent[]>([]);
  const [notifications, setNotifications] = useState<ChefNotification[]>([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [eventFilter, setEventFilter] = useState('all');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('chef-token');
      if (!token) {
        console.log('❌ No chef token found for dashboard data');
        return;
      }

      console.log('🔄 Loading chef dashboard data...');

      // Load stats
      const statsResponse = await fetch('/api/chef/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Stats loaded:', statsData);
        setStats(statsData);
        setAvailabilityStatus(statsData.availabilityStatus || 'available');
      } else {
        console.error('❌ Failed to load stats:', statsResponse.status);
      }

      // Load events
      const eventsResponse = await fetch('/api/chef/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('📅 Events loaded:', eventsData);
        setEvents(eventsData.events || []);
      } else {
        console.error('❌ Failed to load events:', eventsResponse.status);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('chef-token');
      if (!token) return;

      const response = await fetch('/api/chef/notifications', {
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

  const handleEventAction = async (eventId: string, action: 'accept' | 'decline', message?: string) => {
    try {
      const token = localStorage.getItem('chef-token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('Sending action request:', { eventId, action, message });
      
      const response = await fetch('/api/chef/events', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          action,
          message
        })
      });

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (response.ok) {
        const result = JSON.parse(responseData);
        toast.success(`Booking ${action}ed successfully`);
        loadDashboardData(); // Reload data
      } else {
        try {
          const error = JSON.parse(responseData);
          toast.error(error.error || `Failed to ${action} booking`);
        } catch (e) {
          toast.error(`Failed to ${action} booking: ${responseData}`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      toast.error(`Failed to ${action} event`);
    }
  };

  const updateAvailability = async (status: 'available' | 'busy' | 'offline') => {
    try {
      const token = localStorage.getItem('chef-token');
      if (!token) {
        console.log('❌ No chef token found for availability update');
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/chef/availability', {
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
      const token = localStorage.getItem('chef-token');
      
      if (token) {
        await fetch('/api/auth/chef-logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear all chef-specific localStorage data
      localStorage.removeItem('chef-token');
      localStorage.removeItem('chef-user');
      localStorage.removeItem('chef-userType');
      localStorage.removeItem('chef-sessionId');

      toast.success('Logged out successfully');
      window.location.href = '/chef/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = '/chef/login';
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

  const filteredEvents = eventFilter === 'all' 
    ? events 
    : events.filter(event => event.status === eventFilter);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-6 w-6 text-orange-500" />
              <p className="text-lg font-semibold text-white">Loading chef dashboard...</p>
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
                <ChefHat className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">Chef Dashboard</h1>
                <p className="text-gray-300 text-sm mt-1">Manage your culinary services</p>
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
          {/* Total Bookings */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Bookings</p>
                <p className="text-3xl font-bold text-white">{stats.totalBookings || 0}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Completed Events */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Completed Events</p>
                <p className="text-3xl font-bold text-white">{stats.completedEvents || 0}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-3xl font-bold text-white">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-300">Average Rating</p>
                <p className="text-3xl font-bold text-white">{(stats.averageRating || 0).toFixed(1)}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-full">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Booking Requests - Dark Theme */}
        <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Calendar className="h-7 w-7 mr-3 text-orange-500" />
              Recent Booking Requests
            </h2>
            <div className="flex space-x-2">
              {['all', 'pending', 'confirmed', 'completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    eventFilter === filter
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 border border-gray-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event._id} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${
                          event.status === 'pending' ? 'bg-yellow-500' :
                          event.status === 'confirmed' ? 'bg-blue-500' :
                          event.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        <span className={`font-semibold text-sm px-3 py-1 rounded-full ${
                          event.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50' :
                          event.status === 'confirmed' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50' :
                          event.status === 'completed' ? 'bg-green-900/50 text-green-300 border border-green-500/50' :
                          'bg-gray-900/50 text-gray-300 border border-gray-500/50'
                        }`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{event.eventDetails.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <strong className="text-white">Customer:</strong> {event.customer.name}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Date:</strong> {new Date(event.eventDetails.date).toLocaleDateString()}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Guests:</strong> {event.eventDetails.guestCount}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <strong className="text-white">Duration:</strong> {event.eventDetails.duration} hours
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Amount:</strong> ₹{(event.budget?.max || event.pricing?.totalAmount || 0).toLocaleString()}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-white">Cuisine:</strong> {event.eventDetails.cuisine.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {event.status === 'pending' && (
                      <div className="flex space-x-3 lg:ml-6">
                        <button
                          onClick={() => handleEventAction(event._id, 'accept')}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleEventAction(event._id, 'decline')}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
                  <Calendar className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No booking requests</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  When customers book your services, their requests will appear here for you to review and respond to.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}