'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, UserX, LogIn } from 'lucide-react';

interface RealUserGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RealUserGuard({ children, fallback }: RealUserGuardProps) {
  const [isRealUser, setIsRealUser] = useState<boolean | null>(null);
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
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsRealUser(false);
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

  if (!isRealUser) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <UserX className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {user?.isGuest ? 'Sign Up Required' : 'Please Sign In'}
            </h2>
            <p className="text-gray-600 mb-6">
              {user?.isGuest 
                ? 'Hi Guest! To place orders and access all features, please create a FoodFly account or sign in.' 
                : 'You need to be signed in to access this feature.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In / Sign Up</span>
              </button>
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