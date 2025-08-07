'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Star,
  CheckCircle,
  XCircle,
  Loader,
  ChefHat,
  Eye,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface ChefBooking {
  _id: string;
  status: string;
  bookingDetails: {
    eventType: string;
    eventDate: string;
    eventTime: string;
    duration: number;
    guestCount: number;
    cuisine: string[];
    specialRequests?: string;
  };
  chef: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
  };
  pricing: {
    totalAmount: number;
    currency: string;
  };
  timeline: {
    bookedAt: string;
    respondedAt?: string;
  };
  location?: {
    address: string;
    city: string;
    state: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chefBookings, setChefBookings] = useState<ChefBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    loadUserProfile();
    loadChefBookings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view your profile');
        window.location.href = '/login';
        return;
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadChefBookings = async () => {
    try {
      setBookingsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch('/api/chef-services/book', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChefBookings(data.data.bookings || []);
      } else if (response.status === 401) {
        toast.error('Please login to view your bookings');
        window.location.href = '/login';
      } else {
        throw new Error('Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading chef bookings:', error);
      toast.error('Failed to load chef bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <Star className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header */}
                  <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 shadow-2xl border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                            <h1 className="text-3xl font-bold text-white tracking-wide">My Profile</h1>
            <p className="text-gray-300 text-sm mt-1">Manage your account and bookings</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Card */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8 border border-gray-700/50">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user?.name || 'User'}</h2>
                <p className="text-gray-300">{user?.email}</p>
                {user?.phone && <p className="text-gray-300">{user.phone}</p>}
                <p className="text-sm text-gray-400 mt-2">
                  Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
                          <div className="border-b border-gray-700">
              <nav className="flex space-x-8 px-8">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'bookings'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ChefHat className="h-5 w-5" />
                    <span>Chef Bookings ({chefBookings.length})</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Chef Bookings Content */}
            <div className="p-8">
              {activeTab === 'bookings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Your Chef Booking Requests</h3>
                    <button
                      onClick={() => window.location.href = '/chef-services'}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Book Another Chef
                    </button>
                  </div>

                  {bookingsLoading ? (
                    <div className="text-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                      <p className="text-gray-600">Loading your bookings...</p>
                    </div>
                  ) : chefBookings.length > 0 ? (
                    <div className="space-y-6">
                      {chefBookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(booking.status)}`}>
                                    {getStatusIcon(booking.status)}
                                    <span className="ml-2 capitalize">{booking.status}</span>
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Booked on {new Date(booking.timeline.bookedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900 mb-3 capitalize">
                                    {booking.bookingDetails.eventType.replace('_', ' ')} Event
                                  </h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-orange-500" />
                                      <span>{new Date(booking.bookingDetails.eventDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-orange-500" />
                                      <span>{booking.bookingDetails.eventTime} • {booking.bookingDetails.duration} hours</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4 text-orange-500" />
                                      <span>{booking.bookingDetails.guestCount} guests</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <ChefHat className="h-4 w-4 text-orange-500" />
                                      <span>{booking.bookingDetails.cuisine.join(', ')}</span>
                                    </div>
                                    {booking.location && (
                                      <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-orange-500" />
                                        <span>{booking.location.city}, {booking.location.state}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-3">Chef Details</h5>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                      <ChefHat className="h-4 w-4 text-orange-500" />
                                      <span className="font-medium">{booking.chef.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Star className="h-4 w-4 text-yellow-500" />
                                      <span>{booking.chef.rating.toFixed(1)} rating</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <DollarSign className="h-4 w-4 text-green-500" />
                                      <span className="font-bold text-lg text-green-600">
                                        ₹{booking.pricing.totalAmount.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {booking.bookingDetails.specialRequests && (
                                    <div className="mt-4">
                                      <h6 className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-1">Special Requests</h6>
                                      <p className="text-sm text-gray-600 italic">{booking.bookingDetails.specialRequests}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Messages */}
                              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                                {booking.status === 'pending' && (
                                  <p className="text-sm text-yellow-700 font-medium">
                                    ⏳ Waiting for chef confirmation. You'll be notified once the chef responds to your request.
                                  </p>
                                )}
                                {booking.status === 'confirmed' && (
                                  <p className="text-sm text-green-700 font-medium">
                                    ✅ Your booking is confirmed! The chef will contact you closer to the event date with final details.
                                    {booking.timeline.respondedAt && (
                                      <span className="block text-xs text-gray-500 mt-1">
                                        Confirmed on {new Date(booking.timeline.respondedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                )}
                                {booking.status === 'cancelled' && (
                                  <p className="text-sm text-red-700 font-medium">
                                    ❌ This booking has been cancelled.
                                    {booking.timeline.respondedAt && (
                                      <span className="block text-xs text-gray-500 mt-1">
                                        Cancelled on {new Date(booking.timeline.respondedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                )}
                                {booking.status === 'completed' && (
                                  <p className="text-sm text-blue-700 font-medium">
                                    🎉 Event completed! We hope you had a wonderful experience with your chef.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ChefHat className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chef Bookings Yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        You haven't made any chef booking requests yet. Start by browsing our amazing chefs and book your first culinary experience!
                      </p>
                      <button
                        onClick={() => window.location.href = '/chef-services'}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        Browse Chefs
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}