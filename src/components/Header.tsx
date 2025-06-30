'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User, Menu, X, MapPin, Heart, Clock, LogOut, ChevronDown, Mic } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LocationSelector from './LocationSelector';
import VoiceAssistant from './VoiceAssistant';
import { enhancedCartService, logout } from '@/lib/api';

interface Location {
  _id?: string;
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone?: string;
  street?: string;
  landmark?: string;
  city: string;
  state?: string;
  pincode?: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }

    // Load default location
    loadDefaultLocation();

    // Listen for storage changes (for auth state sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' || e.key === 'token' || e.key === 'user') {
        const newToken = localStorage.getItem('token');
        const newUserData = localStorage.getItem('user');
        
        if (newToken && newUserData) {
          setIsLoggedIn(true);
          setUser(JSON.parse(newUserData));
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      }
      if (e.key === 'cart' || e.key === 'testCart') {
        loadCartCount();
      }
    };

    // Listen for custom auth state changes
    const handleAuthStateChange = (e: CustomEvent) => {
      const { isLoggedIn: newAuthState } = e.detail;
      if (newAuthState) {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
          setIsLoggedIn(true);
          setUser(JSON.parse(userData));
          // Reload location for logged-in user
          loadDefaultLocation();
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        // Clear location for logged-out user
        setCurrentLocation(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', loadCartCount);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', loadCartCount);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  const loadCartCount = async () => {
    try {
      const { cartService } = await import('@/lib/api');
      const cartData = await cartService.getCart();
      setCartCount(cartData.totalItems || 0);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadCartCount();
      
      // Listen for cart updates - simple and direct
      const handleCartUpdate = () => loadCartCount();
      window.addEventListener('cartUpdated', handleCartUpdate);
      return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }
  }, [isLoggedIn]);

  const loadDefaultLocation = () => {
    try {
      // For logged-in users, get location from their saved addresses
      if (isLoggedIn) {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          const userAddressKey = `user_addresses_${user.id}`;
          const userAddresses = localStorage.getItem(userAddressKey);
          
          if (userAddresses) {
            const addresses = JSON.parse(userAddresses);
            const defaultAddress = addresses.find((addr: any) => addr.isDefault);
            
            if (defaultAddress) {
              // Convert address format to match the expected Location interface
                              const locationFromAddress: Location = {
                  _id: defaultAddress._id,
                  label: defaultAddress.label,
                  name: defaultAddress.name,
                  phone: defaultAddress.phone,
                  street: defaultAddress.street,
                  landmark: defaultAddress.landmark,
                  city: defaultAddress.city,
                  state: defaultAddress.state,
                  pincode: defaultAddress.pincode,
                  isDefault: defaultAddress.isDefault,
                  coordinates: defaultAddress.coordinates
                };
              
              setCurrentLocation(locationFromAddress);
              localStorage.setItem('defaultLocation', JSON.stringify(locationFromAddress));
              return;
            }
          }
        }
      }
      
      // For non-logged-in users or no saved addresses, check for previously selected location
      const defaultLocation = localStorage.getItem('defaultLocation');
      if (defaultLocation) {
        setCurrentLocation(JSON.parse(defaultLocation));
      } else {
        // Don't set any default location - keep it blank
        setCurrentLocation(null);
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setCurrentLocation(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Use the centralized logout function which properly clears all data
      logout();
      
      // Update local state
      setIsLoggedIn(false);
      setUser(null);
      setCartCount(0);
      
      // Clear location data for logged-out users
      setCurrentLocation(null);
      localStorage.removeItem('defaultLocation');
      localStorage.removeItem('selectedLocation');
      localStorage.removeItem('userLocations');
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error logging out');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search results page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLocationSelect = (address: Location) => {
    const locationWithId = {
      ...address,
      _id: address._id || Date.now().toString()
    };
    
    setCurrentLocation(locationWithId);
    localStorage.setItem('defaultLocation', JSON.stringify(locationWithId));
    
    setShowLocationSelector(false);
    toast.success('Location updated successfully');
  };

  const getLocationDisplayText = () => {
    if (!currentLocation) return 'Select Location';
    
    if (currentLocation.name) {
      return currentLocation.name;
    }
    
    // If no name, construct from address components
    if (currentLocation.street && currentLocation.city) {
      return `${currentLocation.city}`;
    }
    
    return 'Select Location';
  };

  return (
    <header className="bg-black shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/images/logo.png"
                alt="FoodFly"
                width={1500}
                height={860}
                className="h-20 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>
            
            {/* Location */}
            <div 
              onClick={() => setShowLocationSelector(true)}
              className="hidden md:flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer group bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <MapPin className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 group-hover:text-gray-300">Deliver to</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium max-w-32 truncate">
                    {getLocationDisplayText()}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for restaurants, dishes..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-600"
                />
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {/* Voice Assistant */}
            <button
              onClick={() => setShowVoiceAssistant(true)}
              className="hidden md:flex items-center space-x-2 text-gray-300 hover:text-red-500 transition-colors duration-200 group"
            >
              <Mic className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Voice</span>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative group">
              <div className="flex items-center space-x-2 text-gray-300 hover:text-red-500 transition-colors duration-200">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-sm font-medium">Cart</span>
              </div>
            </Link>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium">{user?.name || 'User'}</span>
                  <ChevronDown className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Orders
                  </Link>
                  <Link href="/favorites" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                    <Heart className="h-4 w-4 inline mr-2" />
                    Favorites
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search restaurants, dishes..."
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-400"
                  />
                </div>
              </form>

              {/* Mobile Navigation */}
              <div className="space-y-2">
                {isLoggedIn ? (
                  <>
                    <Link href="/profile" className="block text-gray-300 hover:text-white py-2">Profile</Link>
                    <Link href="/orders" className="block text-gray-300 hover:text-white py-2">Orders</Link>
                    <Link href="/favorites" className="block text-gray-300 hover:text-white py-2">Favorites</Link>
                    <button onClick={handleLogout} className="block text-red-400 hover:text-red-300 py-2">
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelector
          isOpen={showLocationSelector}
          onClose={() => setShowLocationSelector(false)}
          onLocationSelect={handleLocationSelect}
        />
      )}

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistant
          isOpen={showVoiceAssistant}
          onClose={() => setShowVoiceAssistant(false)}
        />
      )}
    </header>
  );
} 