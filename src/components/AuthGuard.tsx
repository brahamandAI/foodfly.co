'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const isGuest = localStorage.getItem('guest') === 'true';
      
      // Allow both authenticated users (with token) and guest users
      const authenticated = !!((token && user && isLoggedIn) || (isGuest && user && isLoggedIn));
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      if (!authenticated) {
        // Redirect to login with current page as redirect parameter
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectUrl}`);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' || e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    const handleAuthStateChange = (e: CustomEvent) => {
      const { isLoggedIn, user } = e.detail;
      // Check if user is guest or authenticated
      const isGuest = user?.isGuest || localStorage.getItem('guest') === 'true';
      const authenticated = isLoggedIn && (user || localStorage.getItem('user'));
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectUrl}`);
      }
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

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 