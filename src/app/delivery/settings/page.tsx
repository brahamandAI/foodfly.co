'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Settings, 
  Bell, 
  Shield,
  LogOut,
  Edit3,
  Camera,
  Save,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import RealUserGuard from '@/components/RealUserGuard';

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  profilePhoto?: string;
  deliveryProfile: {
    vehicleType: string;
    vehicleNumber: string;
    currentZone: string;
    isVerified: boolean;
    totalDeliveries: number;
    rating: number;
    joinedAt: string;
  };
}

export default function DeliverySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleNumber: '',
    currentZone: ''
  });
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    promotional: false,
    paymentUpdates: true,
    ratingFeedback: true
  });

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || 'Delivery Partner',
        phone: parsedUser.phone || '+91 9876543210',
        email: parsedUser.email || 'partner@foodfly.com',
        profilePhoto: parsedUser.profilePhoto,
        deliveryProfile: {
          vehicleType: parsedUser.deliveryProfile?.vehicleType || 'bike',
          vehicleNumber: parsedUser.deliveryProfile?.vehicleNumber || 'DL01AB1234',
          currentZone: parsedUser.deliveryProfile?.currentZone || 'Delhi Central',
          isVerified: parsedUser.deliveryProfile?.isVerified || true,
          totalDeliveries: parsedUser.deliveryProfile?.totalDeliveries || 127,
          rating: 4.8,
          joinedAt: parsedUser.deliveryProfile?.joinedAt || '2023-06-15'
        }
      });

      setFormData({
        name: parsedUser.name || '',
        phone: parsedUser.phone || '',
        email: parsedUser.email || '',
        vehicleNumber: parsedUser.deliveryProfile?.vehicleNumber || '',
        currentZone: parsedUser.deliveryProfile?.currentZone || ''
      });
    }
  }, []);

  const handleSave = async () => {
    try {
      // In a real app, you'd send this to your API
      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        deliveryProfile: {
          ...user?.deliveryProfile,
          vehicleNumber: formData.vehicleNumber,
          currentZone: formData.currentZone
        }
      };

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser as UserProfile);
      setEditing(false);
      toast.success('✅ Profile updated successfully!');
    } catch (error) {
      toast.error('❌ Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    toast.success('👋 Logged out successfully');
    router.push('/login?role=delivery');
  };

  const vehicleIcons = {
    bike: '🏍️',
    scooter: '🛵',
    bicycle: '🚲',
    car: '🚗',
    walking: '🚶'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <RealUserGuard requiredRoles={['delivery', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between py-4 px-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">⚙️ Settings</h1>
            <button
              onClick={() => editing ? setEditing(false) : setEditing(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {editing ? <X className="h-6 w-6 text-gray-600" /> : <Edit3 className="h-6 w-6 text-gray-600" />}
            </button>
          </div>
        </header>

        <main className="pb-20">
          {/* Profile Card */}
          <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                {editing && (
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  {user.deliveryProfile.isVerified && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    {user.deliveryProfile.rating}
                  </span>
                  <span>{user.deliveryProfile.totalDeliveries} deliveries</span>
                </div>
                <p className="text-sm text-gray-500">
                  Partner since {new Date(user.deliveryProfile.joinedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Vehicle Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Type:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {vehicleIcons[user.deliveryProfile.vehicleType as keyof typeof vehicleIcons]}
                    </span>
                    <span className="font-medium text-gray-900">
                      {user.deliveryProfile.vehicleType.charAt(0).toUpperCase() + user.deliveryProfile.vehicleType.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Number:</span>
                  <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {user.deliveryProfile.vehicleNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Zone</label>
                  <input
                    type="text"
                    value={formData.currentZone}
                    onChange={(e) => setFormData({...formData, currentZone: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {key === 'orderAlerts' && '🔔 New Order Alerts'}
                      {key === 'promotional' && '📢 Promotional Offers'}
                      {key === 'paymentUpdates' && '💰 Payment Updates'}
                      {key === 'ratingFeedback' && '⭐ Rating & Feedback'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'orderAlerts' && 'Get notified when new orders are available'}
                      {key === 'promotional' && 'Receive promotional offers and bonus campaigns'}
                      {key === 'paymentUpdates' && 'Weekly payout and earnings notifications'}
                      {key === 'ratingFeedback' && 'Customer ratings and feedback alerts'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, [key]: !value})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="m-4 space-y-3">
            <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>Change Working Zone</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <span>Privacy & Security</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span>Support & Help</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="m-4 mt-8">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* App Info */}
          <div className="m-4 bg-gray-100 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm mb-2">FoodFly Delivery Partner</p>
            <p className="text-gray-400 text-xs">Version 2.1.0 • Build 2024.01.15</p>
          </div>
        </main>
      </div>
    </RealUserGuard>
  );
}