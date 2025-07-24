'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import AuthPopup from './AuthPopup';
import NotificationSystem from './NotificationSystem';
import { initializeTestData } from '@/lib/testData';
import { clearInvalidAuth } from '@/lib/api';

const PROTECTED_ROUTES = ['/cart', '/checkout', '/profile', '/orders', '/favorites', '/health'];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Initialize test data for development/testing
    initializeTestData();
    
    // Clear any invalid authentication tokens
    clearInvalidAuth();
    
    // Check authentication status without forcing login popup
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const isGuest = localStorage.getItem('guest') === 'true';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    const authenticated = !!((token && userData) || (isGuest && userData && isLoggedIn));
    setIsAuthenticated(authenticated);
    setIsLoading(false);

    // Show auth popup if trying to access protected route without authentication
    if (!authenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      setShowAuthPopup(true);
      return;
    }

    // Listen for auth state changes
    const handleAuthChange = (e: CustomEvent) => {
      const { isLoggedIn } = e.detail;
      setIsAuthenticated(isLoggedIn);
      
      // If user just logged out and is on protected route, redirect to home
      if (!isLoggedIn && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        router.push('/');
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, [pathname, router]);

  const handleCloseAuthPopup = () => {
    setShowAuthPopup(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthPopup(false);
  };

  const handleShowAuthPopup = () => {
    // Don't show auth popup if user is already authenticated
    if (isAuthenticated) {
      return;
    }
    setShowAuthPopup(true);
  };

  // Make auth functions available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showAuthPopup = handleShowAuthPopup;
    }
  }, []);

  // Show loading spinner for protected routes while checking auth
  if (isLoading && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <NotificationSystem />
      {showAuthPopup && (
        <AuthPopup
          onClose={handleCloseAuthPopup}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
} 