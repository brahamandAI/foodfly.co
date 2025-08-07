import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authApi, enhancedCartService } from '@/lib/api';
import GoogleLoginButton from './GoogleLoginButton';

const LoginPopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const isGuest = localStorage.getItem('guest') === 'true';
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      const authenticated = !!((token && userData) || (isGuest && userData && isLoggedIn));
      
      if (authenticated) {
        // User is already authenticated, close the popup
        onClose();
        return;
      }
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login(formData.email, formData.password);
      
      if (response.token && response.user) {
        // Clear any existing guest state first
        localStorage.removeItem('guest');
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { isLoggedIn: true, user: response.user }
        }));

        toast.success('Successfully logged in!');
        
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
        
        onClose();
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
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
  };

  const handleGoogleLoginSuccess = () => {
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Close"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="text-sm text-gray-600 mt-1">Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Google Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLoginButton
              onSuccess={handleGoogleLoginSuccess}
              text="Sign in with Google"
            />
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?
          </p>
          <button
            onClick={() => {
              onClose();
              router.push('/login?mode=signup');
            }}
            className="mt-2 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup; 