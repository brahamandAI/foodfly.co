'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DeliveryLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/delivery-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (typeof window !== 'undefined') {
          console.log('✅ Delivery login success:', data);
        }
        
        // Store DELIVERY-ONLY auth data
        if (typeof window !== 'undefined') {
          if (data.delivery && data.delivery.role === 'delivery' && data.userType === 'delivery') {
            localStorage.setItem('delivery-token', data.token);
            localStorage.setItem('delivery-user', JSON.stringify(data.delivery));
            localStorage.setItem('delivery-isLoggedIn', 'true');
            localStorage.setItem('delivery-userType', 'delivery');
            localStorage.setItem('delivery-sessionId', data.sessionId);
            
            // Clear any other user data to prevent mixing
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userType');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('chef-token');
            localStorage.removeItem('chef-user');
            localStorage.removeItem('chef-isLoggedIn');
            localStorage.removeItem('chef-userType');
            localStorage.removeItem('chef-sessionId');
          }
        }

        const redirectUrl = data.redirectTo || '/delivery/dashboard';
        console.log('🚚 Redirecting to:', redirectUrl);
        
        // Force immediate redirect
        window.location.href = redirectUrl;
      } else {
        const error = await response.json();
        console.error('❌ Delivery login failed:', error);
        
        // Handle role-specific errors
        if (error.userRole && error.redirectTo) {
          const shouldRedirect = window.confirm(
            `${error.error} Would you like to go to the ${error.userRole} login instead?`
          );
          
          if (shouldRedirect) {
            window.location.href = error.redirectTo;
            return;
          }
        }
        
        toast.error(error.error || 'Delivery login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-900/90 shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Truck className="h-6 w-6 text-yellow-500" />
              <Image
                src="/images/logo.png"
                alt="FoodFly"
                width={24}
                height={24}
                className="rounded"
              />
              <h1 className="text-xl font-bold text-white">Delivery Login</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-lg p-8 border border-gray-700/50">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Delivery Login</h2>
              <p className="text-gray-300">Welcome back to FoodFly Delivery Portal</p>
              <div className="mt-4 px-3 py-2 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-r-lg">
                <p className="text-xs text-yellow-300 font-medium flex items-center">
                  <span className="mr-2">🚚</span>
                  DELIVERY-ONLY LOGIN - For registered delivery partners only
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800/70 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Delivery Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800/70 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-10 text-white placeholder-gray-400"
                    placeholder="Enter your delivery password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold transition duration-200 text-lg ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 shadow-lg transform hover:scale-105 border border-yellow-500/50'
                }`}
              >
                {loading ? '🔄 Signing In...' : '🚚 Sign In as Delivery Partner'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Don't have a delivery account?{' '}
                <Link href="/register-delivery" className="text-yellow-400 hover:text-yellow-300 font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-300">
                Looking for customer login?
              </Link>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-xs text-blue-300 font-mono">
                🔍 Debug: This is the delivery-specific login at /delivery/login
              </p>
              <p className="text-xs text-blue-300 font-mono mt-1">
                API endpoint: /api/auth/delivery-login
              </p>
              <div className="mt-2">
                <p className="text-xs text-blue-300 font-mono">
                  Storage keys: delivery-token, delivery-user, delivery-isLoggedIn
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}