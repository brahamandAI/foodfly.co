'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, UserIcon, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authApi, enhancedCartService } from '@/lib/api';
import Image from 'next/image';
import GoogleLoginButton from '@/components/GoogleLoginButton';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const mode = searchParams.get('mode'); // Check for signup mode
  const role = searchParams.get('role'); // Check for delivery role
  
  const [isLogin, setIsLogin] = useState(mode !== 'signup'); // Default to signup if mode=signup
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        // Don't clear cart data - instead migrate it to user-specific storage after login
        
        // Login
        const response = await authApi.login(formData.email, formData.password);
        
        if (response.token && response.user) {
          // Clear any existing guest state first
          localStorage.removeItem('guest');
          
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('isLoggedIn', 'true');
          
          // Trigger storage event for real-time updates
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'isLoggedIn',
            newValue: 'true',
            oldValue: null
          }));

          // Trigger custom auth state change event
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn: true, user: response.user }
          }));

          toast.success('Successfully logged in!');
          
          // Load user-specific data and migrate any existing data
          try {
            const { userStorage } = await import('@/lib/api');
            userStorage.loadUserData(response.user.id || response.user._id);
          } catch (error) {
            console.error('Error loading user data:', error);
          }
          
                     // Migrate guest cart and load user cart from database
           const { unifiedCartService } = await import('@/lib/api');
           await unifiedCartService.migrateGuestCartOnLogin();
           await unifiedCartService.loadUserCartFromDatabase();
           
           // Migrate guest addresses to database
           const { addressService } = await import('@/lib/addressService');
           await addressService.migrateGuestAddresses();
          
          // Redirect to the intended page or delivery dashboard for delivery users
          const finalRedirect = role === 'delivery' && redirectUrl === '/' ? '/delivery' : decodeURIComponent(redirectUrl);
          router.push(finalRedirect);
        }
      } else {
        // Register
        const response = await authApi.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (response.token && response.user) {
          // Clear any existing guest state first
          localStorage.removeItem('guest');
          
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('isLoggedIn', 'true');
          
          // Trigger storage event for real-time updates
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'isLoggedIn',
            newValue: 'true',
            oldValue: null
          }));

          // Trigger custom auth state change event
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn: true, user: response.user }
          }));

                     // Load user-specific data and migrate any existing data
           try {
             const { userStorage } = await import('@/lib/api');
             userStorage.loadUserData(response.user.id || response.user._id);
           } catch (error) {
             console.error('Error loading user data:', error);
           }

           // Migrate guest addresses to database
           const { addressService } = await import('@/lib/addressService');
           await addressService.migrateGuestAddresses();

           toast.success('Account created successfully!');
          
          // Redirect to the intended page or delivery dashboard for delivery users
          const finalRedirect = role === 'delivery' && redirectUrl === '/' ? '/delivery' : decodeURIComponent(redirectUrl);
          router.push(finalRedirect);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrors({ submit: error.message || 'Authentication failed' });
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGuestLogin = () => {
    // Create a guest user object
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest User',
      email: 'guest@foodfly.com',
      isGuest: true
    };

    // Set guest session in localStorage
    localStorage.setItem('guest', 'true');
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('isLoggedIn', 'true');

    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { isLoggedIn: true, user: guestUser }
    }));

    // Show success message
    toast.success('Welcome! You are now logged in as a guest.');

    // Redirect to intended page or home
    router.push(decodeURIComponent(redirectUrl));
  };

  const handleGoogleLoginSuccess = () => {
    // Redirect to intended page after Google login
    router.push(decodeURIComponent(redirectUrl));
  };

  const inputClasses = `w-full px-4 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-white border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`;
  const errorInputClasses = `w-full px-4 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-white border border-red-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background Images */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Thali Image */}
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[120%]">
          <Image
            src="/images/hero-vegthali.jpg"
            alt="Veg Thali"
            fill
            className="object-cover"
            priority
            quality={100}
          />
        </div>
        {/* Burger Image */}
        <div className="absolute -top-[10%] right-[0%] w-[60%] h-[120%]">
          <Image
            src="/images/hero-burger.jpg"
            alt="Burger"
            fill
            className="object-cover"
            priority
            quality={100}
          />
        </div>
        {/* Blur Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
      </div>

      {/* Auth Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700/50 p-8 flex flex-col items-center animate-fade-in backdrop-blur-xl bg-gray-900/90">
        {/* Close/Back button */}
                  <button
          onClick={() => router.push('/')}
          className="absolute right-4 top-4 p-2 bg-gray-800 hover:bg-red-900 rounded-full transition-colors duration-200 shadow-md"
        >
          <X className="h-5 w-5 text-gray-300 hover:text-red-400" />
        </button>

        <div className="w-full">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <Image src="/images/logo.png" alt="FoodFly Logo" width={60} height={60} className="rounded-full shadow-md border-2 border-yellow-400 bg-white" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">
              {role === 'delivery' 
                ? (isLogin ? 'Delivery Partner Sign In' : 'Join Delivery Team')
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </h2>
            <p className="mt-2 text-gray-300 font-medium">
              {role === 'delivery' 
                ? (isLogin ? 'Sign in to your delivery partner account' : 'Register as a delivery partner')
                : (isLogin 
                  ? 'Sign in to access your account' 
                  : 'Join us and start ordering delicious food')
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <label className="block text-sm font-bold text-white mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-10 text-white placeholder-gray-400 bg-gray-800/70 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-gray-800 transition-all duration-200 shadow-sm ${errors.name ? 'border-red-500 bg-red-900/30' : 'hover:border-gray-500'}`}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <div className="mt-2 bg-red-900/30 border border-red-500 rounded-lg p-2">
                    <p className="text-sm text-red-400 font-semibold">{errors.name}</p>
                  </div>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <label className="block text-sm font-bold text-white mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pl-10 text-white placeholder-gray-400 bg-gray-800/70 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-gray-800 transition-all duration-200 shadow-sm ${errors.email ? 'border-red-500 bg-red-900/30' : 'hover:border-gray-500'}`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <div className="mt-2 bg-red-900/30 border border-red-500 rounded-lg p-2">
                  <p className="text-sm text-red-400 font-semibold">{errors.email}</p>
                </div>
              )}
            </div>

            {/* Password field */}
            <div className="relative">
              <label className="block text-sm font-bold text-white mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pl-10 text-white placeholder-gray-400 bg-gray-800/70 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-gray-800 transition-all duration-200 shadow-sm ${errors.password ? 'border-red-500 bg-red-900/30' : 'hover:border-gray-500'}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <div className="mt-2 bg-red-900/30 border border-red-500 rounded-lg p-2">
                  <p className="text-sm text-red-400 font-semibold">{errors.password}</p>
                </div>
              )}
            </div>

            {/* Confirm Password field (for registration) */}
            {!isLogin && (
              <div className="relative">
                <label className="block text-sm font-bold text-white mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-10 text-white placeholder-gray-400 bg-gray-800/70 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-gray-800 transition-all duration-200 shadow-sm ${errors.confirmPassword ? 'border-red-500 bg-red-900/30' : 'hover:border-gray-500'}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <div className="mt-2 bg-red-900/30 border border-red-500 rounded-lg p-2">
                    <p className="text-sm text-red-400 font-semibold">{errors.confirmPassword}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Error Display */}
                      {errors.submit && (
            <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-4">
              <p className="text-red-300 font-semibold text-center">{errors.submit}</p>
            </div>
          )}

                                                   {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isLogin 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 border-2 border-red-500/30' 
                    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 border-2 border-gray-600'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-300 font-semibold bg-gray-900/90 rounded-full">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-4">
                             {/* Google Login Button */}
               <GoogleLoginButton
                 onSuccess={handleGoogleLoginSuccess}
                 text="Continue with Google"
                 className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white py-3 font-bold shadow-xl rounded-xl transform hover:scale-105 transition-all duration-200 border-2 border-gray-600"
               />

                                                           {/* Guest Login Button */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-gray-600"
                >
                  <User className="h-5 w-5" />
                  Continue as Guest
                </button>
            </div>
          </form>



          {/* Toggle between login and register */}
          <div className="mt-6 text-center">
            {role === 'delivery' ? (
              <div className="space-y-2">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-300 hover:text-white font-bold transition-colors duration-200 block underline decoration-2 underline-offset-4"
                >
                  {isLogin ? "Don't have a delivery account? Register" : 'Already have a delivery account? Sign in'}
                </button>
                {!isLogin && (
                  <button
                    onClick={() => router.push('/register-delivery')}
                    className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200 text-sm underline"
                  >
                    Go to full delivery registration →
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-300 hover:text-white font-bold transition-colors duration-200 underline decoration-2 underline-offset-4"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
} 