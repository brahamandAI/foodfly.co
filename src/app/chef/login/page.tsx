'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChefLoginPage() {
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
      const response = await fetch('/api/auth/chef-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (typeof window !== 'undefined') {
          console.log('✅ Chef login success:', data); // Debug log
        }
        
        // Store CHEF-ONLY auth data (client-side only with chef-specific keys)
        if (typeof window !== 'undefined') {
          // Ensure we're storing chef data only
          if (data.chef && data.chef.role === 'chef' && data.userType === 'chef') {
            // Use CHEF-SPECIFIC localStorage keys to prevent mixing
            localStorage.setItem('chef-token', data.token);
            localStorage.setItem('chef-user', JSON.stringify(data.chef));
            localStorage.setItem('chef-isLoggedIn', 'true');
            localStorage.setItem('chef-userType', 'chef'); // Explicit chef marking
            localStorage.setItem('chef-sessionId', data.sessionId); // Store session ID for database tracking
            
            // Clear any regular user data to prevent mixing
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userType');
            
            // Trigger storage events for real-time updates (chef-specific)
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'chef-isLoggedIn',
              newValue: 'true',
              oldValue: null
            }));
            
            toast.success('Chef login successful! Redirecting to chef dashboard...');
            
            // Use the redirect URL from response
            const redirectUrl = data.redirectTo || '/chef/dashboard';
            console.log('🍳 Redirecting to:', redirectUrl);
            
            // Force immediate redirect
            window.location.href = redirectUrl;
          } else {
            throw new Error('Invalid chef authentication data');
          }
        }
      } else {
        const error = await response.json();
        console.error('❌ Chef login failed:', error);
        
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
        
        toast.error(error.error || 'Chef login failed');
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
              href="/chef-services"
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chef Services</span>
            </Link>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-6 w-6 text-orange-500" />
              <Image
                src="/images/logo.png"
                alt="FoodFly"
                width={24}
                height={24}
                className="rounded"
              />
              <h1 className="text-xl font-bold text-white">Chef Login</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-lg p-8 border border-gray-700/50">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Chef Login</h2>
              <p className="text-gray-300">Welcome back to FoodFly Chef Portal</p>
              <div className="mt-4 px-3 py-2 bg-green-900/30 border-l-4 border-green-500 rounded-r-lg">
                <p className="text-xs text-green-300 font-medium flex items-center">
                  <span className="mr-2">🍳</span>
                  CHEF-ONLY LOGIN - For registered chefs only
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
                  className="w-full px-3 py-2 bg-gray-800/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Chef Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 text-white placeholder-gray-400"
                    placeholder="Enter your chef password"
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg transform hover:scale-105'
                }`}
              >
                {loading ? '🔄 Signing In...' : '👨‍🍳 Sign In as Chef'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Don't have a chef account?{' '}
                <Link href="/chef/register" className="text-orange-400 hover:text-orange-300 font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-300">
                Looking for customer login?
              </Link>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}