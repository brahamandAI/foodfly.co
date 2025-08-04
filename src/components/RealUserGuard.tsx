'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, UserX, LogIn } from 'lucide-react';

interface RealUserGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: string[];
}

export default function RealUserGuard({ children, fallback, requiredRoles }: RealUserGuardProps) {
  const [isRealUser, setIsRealUser] = useState<boolean | null>(null);
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkRealUser = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const isGuest = localStorage.getItem('guest') === 'true';
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Additional check: if user object has isGuest flag, respect it
          if (parsedUser.isGuest === true) {
            setIsRealUser(false);
            setHasRequiredRole(false);
            setIsLoading(false);
            return;
          }

          // Check required roles if specified
          if (requiredRoles && requiredRoles.length > 0) {
            const userRole = parsedUser.role;
            const hasRole = requiredRoles.includes(userRole);
            setHasRequiredRole(hasRole);
          } else {
            setHasRequiredRole(true); // No specific role required
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsRealUser(false);
          setHasRequiredRole(false);
          setIsLoading(false);
          return;
        }
      }
      
      // Real user must have token and NOT be a guest
      const authenticated = !!(token && userData && isLoggedIn && !isGuest);
      setIsRealUser(authenticated);
      setIsLoading(false);
    };

    checkRealUser();

    // Listen for auth state changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' || e.key === 'token' || e.key === 'user' || e.key === 'guest') {
        checkRealUser();
      }
    };

    const handleAuthStateChange = (e: CustomEvent) => {
      const { isLoggedIn, user: newUser } = e.detail;
      if (newUser) {
        setUser(newUser);
      }
      // Check if it's a real user (not guest)
      const isGuest = localStorage.getItem('guest') === 'true';
      const token = localStorage.getItem('token');
      setIsRealUser(isLoggedIn && !isGuest && !!token);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, [router, pathname]);

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isRealUser || hasRequiredRole === false) {
    // Determine the appropriate login URL based on required roles
    const getLoginUrl = () => {
      if (requiredRoles?.includes('delivery')) {
        return '/login?role=delivery';
      } else if (requiredRoles?.includes('admin')) {
        return '/admin/login';
      }
      return '/login';
    };

    const getRegisterUrl = () => {
      if (requiredRoles?.includes('delivery')) {
        return '/register-delivery';
      }
      return '/register';
    };

    const getMessage = () => {
      if (!isRealUser) {
        if (user?.isGuest) {
          return 'Hi Guest! To access delivery features, please create a delivery partner account or sign in.';
        }
        return 'You need to be signed in to access this feature.';
      } else if (hasRequiredRole === false) {
        if (requiredRoles?.includes('delivery')) {
          return 'This page is for delivery partners only. Please sign in with a delivery account or register as a delivery partner.';
        } else if (requiredRoles?.includes('admin')) {
          return 'This page is for administrators only.';
        }
        return 'You do not have permission to access this page.';
      }
      return 'Access denied.';
    };

    const getTitle = () => {
      if (!isRealUser) {
        return user?.isGuest ? 'Sign Up Required' : 'Please Sign In';
      } else if (hasRequiredRole === false) {
        if (requiredRoles?.includes('delivery')) {
          return 'Delivery Partner Access Required';
        } else if (requiredRoles?.includes('admin')) {
          return 'Admin Access Required';
        }
        return 'Access Denied';
      }
      return 'Access Required';
    };

    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <UserX className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {getTitle()}
            </h2>
            <p className="text-gray-600 mb-6">
              {getMessage()}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(getLoginUrl())}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>
                  {requiredRoles?.includes('delivery') ? 'Delivery Partner Sign In' : 'Sign In'}
                </span>
              </button>
              {(!isRealUser && requiredRoles?.includes('delivery')) && (
                <button
                  onClick={() => router.push(getRegisterUrl())}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  Register as Delivery Partner
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 