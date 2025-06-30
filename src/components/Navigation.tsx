'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu as MenuIcon, X } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }

    // Listen for auth state changes
    const handleAuthStateChange = (e: CustomEvent) => {
      const { isLoggedIn } = e.detail;
      setIsAuthenticated(isLoggedIn);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-3xl font-bold text-red-600">
              FoodFly
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              href="/menu" 
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Menu
            </Link>
            <Link 
              href="/offers" 
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Offers
            </Link>
            <Link 
              href="/track" 
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Track Order
            </Link>
            <Link 
              href="/cart" 
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
            </Link>
            {!isAuthenticated ? (
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors font-medium"
              >
                Sign In
              </button>
            ) : (
              <Link 
                href="/profile" 
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors font-medium"
              >
                Profile
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Link 
              href="/cart" 
              className="text-gray-700 hover:text-red-600 transition-colors mr-4"
            >
              <ShoppingCart className="h-6 w-6" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/menu"
              className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Menu
            </Link>
            <Link
              href="/offers"
              className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Offers
            </Link>
            <Link
              href="/track"
              className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Track Order
            </Link>
            {!isAuthenticated ? (
              <button 
                onClick={() => window.location.href = '/login'}
                className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Sign In
              </button>
            ) : (
              <Link
                href="/profile"
                className="block px-3 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                Profile
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 