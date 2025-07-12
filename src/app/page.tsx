'use client';

import React from "react";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, TrendingUp, Star, Clock, Tag, Mic, Brain, Heart, Sparkles, Plus, User, ShoppingCart, Zap, Leaf, Target, Smartphone, ChefHat, Utensils, Flame } from 'lucide-react';
import SmartRecommendations from '../components/SmartRecommendations';
import VoiceAssistant from '../components/VoiceAssistant';
import AuthPopup from '../components/AuthPopup';
import LocationSelector from '../components/LocationSelector';
import { toast } from 'react-hot-toast';
import { logout } from '@/lib/api';
import SignupPopup from '../components/SignupPopup';

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
  image: string;
  address: {
    city: string;
    area: string;
  };
  isActive: boolean;
  offers?: string[];
  menu?: MenuItem[];
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  preparationTime: string;
  customizations?: {
    name: string;
    options: { name: string; price: number }[];
  }[];
}

interface Address {
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

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Address | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showSmartFeatures, setShowSmartFeatures] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showSignupPopup, setShowSignupPopup] = useState(true);

  // Mock data for testing
  const mockRestaurants: Restaurant[] = [
    {
      _id: 'rest_001',
      name: 'Pizza Palace',
      cuisine: ['Italian', 'Fast Food'],
      rating: 4.5,
      deliveryTime: '25-35 mins',
      minimumOrder: 200,
      deliveryFee: 40,
      image: '/images/categories/pizza-2.jpeg',
      address: { city: 'Mumbai', area: 'Bandra' },
      isActive: true,
      offers: ['20% off on orders above ₹500'],
      menu: [
        {
          _id: 'item_001',
          name: 'Margherita Pizza',
          description: 'Fresh tomatoes, mozzarella cheese, basil',
          price: 299,
          image: '/images/categories/pizza-2.jpeg',
          category: 'Pizza',
          isVeg: true,
          rating: 4.6,
          preparationTime: '15-20 mins'
        }
      ]
    },
    {
      _id: 'rest_002',
      name: 'Burger Junction',
      cuisine: ['American', 'Fast Food'],
      rating: 4.3,
      deliveryTime: '20-30 mins',
      minimumOrder: 150,
      deliveryFee: 30,
      image: '/images/categories/burger-2.jpg',
      address: { city: 'Mumbai', area: 'Powai' },
      isActive: true,
      offers: ['Buy 1 Get 1 Free on Burgers'],
      menu: []
    },
    {
      _id: 'rest_003',
      name: 'Spice Garden',
      cuisine: ['Indian', 'North Indian'],
      rating: 4.7,
      deliveryTime: '30-40 mins',
      minimumOrder: 250,
      deliveryFee: 50,
      image: '/images/categories/North-indian.jpg',
      address: { city: 'Mumbai', area: 'Andheri' },
      isActive: true,
      offers: ['Free Dessert on orders above ₹600'],
      menu: []
    }
  ];

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const isGuest = localStorage.getItem('guest');
    
    if (token || isGuest) {
      setIsAuthenticated(true);
      if (token) {
      loadUserData();
      } else if (isGuest) {
        // Load guest user data from localStorage
        const guestUser = localStorage.getItem('user');
        if (guestUser) {
          try {
            setCurrentUser(JSON.parse(guestUser));
          } catch (error) {
            console.error('Error parsing guest user data:', error);
          }
        }
      }
    }

    // Load restaurants
    setRestaurants(mockRestaurants);
    setIsLoading(false);

    // Load cart count
    updateCartCount();
    
    // Load default location
    loadDefaultLocation();
    
    // Add event listeners
    window.addEventListener('authStateChange', handleAuthStateChange);
    window.addEventListener('cartUpdated', updateCartCount);
    
    // Listen for logout events to clear location data
    const handleLogout = () => {
      setSelectedLocation(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    };
    
    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('authStateChange', handleAuthStateChange);
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAuthStateChange = (e: CustomEvent) => {
    setIsAuthenticated(e.detail.isLoggedIn);
    if (e.detail.isLoggedIn) {
      if (e.detail.user && e.detail.user.isGuest) {
        // Handle guest user
        setCurrentUser(e.detail.user);
      } else {
        // Handle regular user
      loadUserData();
      }
    } else {
      setCurrentUser(null);
    }
  };

  const loadDefaultLocation = () => {
    // For logged-in users, sync with their saved addresses
    if (isAuthenticated) {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          const userAddressKey = `user_addresses_${user.id}`;
          const userAddresses = localStorage.getItem(userAddressKey);
          
          if (userAddresses) {
            const addresses = JSON.parse(userAddresses);
            const defaultAddress = addresses.find((addr: any) => addr.isDefault);
            
            if (defaultAddress) {
              // Convert address format to match the expected Location interface
              const locationFromAddress: Address = {
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
              
              setSelectedLocation(locationFromAddress);
              localStorage.setItem('selectedLocation', JSON.stringify(locationFromAddress));
              return;
            }
          }
        } catch (error) {
          console.error('Error loading user addresses:', error);
        }
      }
    }
    
    // For non-logged-in users, only load if previously saved
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      try {
        setSelectedLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing saved location:', error);
        setSelectedLocation(null);
      }
    } else {
      // Keep it blank by default
      setSelectedLocation(null);
    }
  };

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('testCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        const totalItems = Object.values(cartData).reduce((sum: number, count: unknown) => sum + Number(count), 0);
        setCartItemCount(Number(totalItems));
      } catch (error) {
        console.error('Error updating cart count:', error);
        setCartItemCount(0);
      }
    } else {
      setCartItemCount(0);
    }
  };

  const handleAuthSuccess = () => {
    // The AuthPopup will handle the authentication state changes
    // We just need to close the popup and update local state
    setShowAuthPopup(false);
    updateCartCount();
    loadDefaultLocation(); // Reload location after login
    toast.success('Welcome back!');
  };

  // Use centralized logout function instead of local implementation

  const handleAIFeatureClick = (feature: string) => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }
    
    switch (feature) {
      case 'voice':
        setShowVoiceAssistant(true);
        break;
      case 'smart':
        setShowSmartFeatures(true);
        break;
      case 'health':
        window.location.href = '/health';
        break;
      default:
        break;
    }
  };

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/restaurants');
      if (response.ok) {
        const result = await response.json();
        setRestaurants(result.data);
      } else {
        setRestaurants(mockRestaurants);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants(mockRestaurants);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(search)}`;
    }
  };

  return (
    <React.Fragment>
      <SignupPopup isOpen={showSignupPopup} onClose={() => setShowSignupPopup(false)} />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-black relative min-h-[600px] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center px-4 py-12 gap-8 relative z-10">
          {/* Left: Text */}
          <div className="flex-1 text-center md:text-left space-y-6 text-white">
            <div className="inline-block bg-accent-yellow text-[#232323] px-4 py-1 rounded-full text-sm font-semibold mb-2">From Screen To Stomach 🥘</div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Order Tasty And<br />Fresh Food Any Time</h1>
            {/* Marquee Robo Delivery Announcement */}
            <div className="flex justify-center items-center w-full my-6">
              <div className="overflow-hidden w-full bg-gradient-to-r from-yellow-900/20 via-yellow-800/30 to-yellow-900/20 rounded-xl border border-yellow-600/30 shadow-lg backdrop-blur-sm">
                <a href="/info-banner.pdf" target="_blank" rel="noopener noreferrer" className="block hover:bg-yellow-800/10 transition-all duration-300">
                  <div className="whitespace-nowrap animate-marquee flex items-center justify-center gap-4 cursor-pointer py-3 px-4 hover:scale-105 transition-transform duration-300">
                    <Image
                      src="/images/robo-delivery.png"
                      alt="Robo Delivery"
                      width={64}
                      height={64}
                      className="inline-block rounded-full border-2 border-yellow-400 bg-white shadow-lg hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:scale-110"
                    />
                    <span className="text-base md:text-lg font-bold text-yellow-300 drop-shadow-lg hover:text-yellow-200 transition-colors duration-300">
                       Coming soon: Robo Meal deliveries within 2 km of our restaurant! The future of food is rolling your way! 
                    </span>
                    <Image
                      src="/images/robo-delivery.png"
                      alt="Robo Delivery"
                      width={64}
                      height={64}
                      className="inline-block rounded-full border-2 border-yellow-400 bg-white shadow-lg hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:scale-110"
                    />
                  </div>
                </a>
              </div>
            </div>
            
              {/* Menu & Deals Quick Access (replaces Search Form) */}
              <div className="flex items-center justify-center md:justify-start gap-6 mt-6">
                <a href="/menu" className="flex flex-col items-center group">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 shadow-lg group-hover:scale-110 transition-transform">
                    <Utensils className="h-7 w-7 text-white" />
                  </span>
                  <span className="mt-2 text-sm font-semibold text-yellow-300 group-hover:text-yellow-200 transition-colors">Menu</span>
                </a>
                <a href="/deals" className="flex flex-col items-center group">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-red-500 to-yellow-400 shadow-lg group-hover:scale-110 transition-transform">
                    <Flame className="h-7 w-7 text-white animate-bounce" />
                  </span>
                  <span className="mt-2 text-sm font-semibold text-red-300 group-hover:text-yellow-200 transition-colors">Deals</span>
                </a>
              </div>

            {/* AI Features Quick Access */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => handleAIFeatureClick('voice')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Mic className="h-4 w-4" />
                Voice Order
              </button>
              <button
                onClick={() => handleAIFeatureClick('smart')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Brain className="h-4 w-4" />
                Smart Pick
              </button>
              <button
                onClick={() => handleAIFeatureClick('health')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Heart className="h-4 w-4" />
                Healthy Options
              </button>
            </div>
              </div>

          {/* Right: Food Images */}
          <div className="flex-1 flex justify-center items-center relative min-h-[320px] gap-6">
            <Image
              src="/images/hero-vegthali.jpg"
              alt="Veg Thali Hero"
              width={320}
              height={320}
              className="object-contain drop-shadow-2xl rounded-full border-8 border-white bg-white"
              priority
            />
            <Image
              src="/images/hero-burger.jpg"
              alt="Burger Hero"
              width={220}
              height={220}
              className="object-contain drop-shadow-xl rounded-full border-8 border-white bg-white md:-ml-12 -ml-4"
              priority
            />
          </div>
        </div>
        {/* Curved Divider */}
        <div className="divider-curve -mb-1">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0C360 60 1080 60 1440 0V60H0V0Z" fill="#fff"/></svg>
      </div>
      </section>

      {/* AI Features Section - Only show for authenticated users */}
      {isAuthenticated && (
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Smart Features</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">Experience the future of food ordering with our AI-powered features</p>
          </div>

            {/* Quick Navigation */}
            <div className="flex justify-center gap-6 mb-12">
              <Link 
                href="/menu" 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-700"
              >
                <span className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-yellow-400 opacity-30 animate-pulse"></span>
                  <Utensils className="h-6 w-6 text-red-400 z-10 animate-bounce" />
                </span>
                <span className="font-semibold">Menu</span>
              </Link>
              <Link 
                href="/deals" 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-700"
              >
                <span className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 opacity-40 animate-pulse"></span>
                  <Flame className="h-6 w-6 text-red-400 z-10 animate-bounce" />
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow animate-pulse">HOT</span>
                </span>
                <span className="font-semibold">Deals</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Voice Order */}
              <div 
                className="bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleAIFeatureClick('voice')}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-red-900 rounded-full mb-4">
                  <Mic className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Voice Order</h3>
                <p className="text-gray-300 mb-4">Order food naturally with your voice. Just speak and we'll understand your preferences.</p>
                <div className="flex items-center text-sm text-gray-400">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI-Powered
                </div>
              </div>

              {/* Smart Pick */}
              <div 
                className="bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleAIFeatureClick('smart')}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-blue-900 rounded-full mb-4">
                  <Brain className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Smart Pick</h3>
                <p className="text-gray-300 mb-4">Get personalized recommendations based on your taste, weather, and mood.</p>
                <div className="flex items-center text-sm text-gray-400">
                  <Target className="h-4 w-4 mr-1" />
                  Personalized
                </div>
              </div>

              {/* Healthy Options */}
              <div 
                className="bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleAIFeatureClick('health')}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-green-900 rounded-full mb-4">
                  <Heart className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Healthy Options</h3>
                <p className="text-gray-300 mb-4">Discover nutritious meals that match your dietary preferences and health goals.</p>
                <div className="flex items-center text-sm text-gray-400">
                  <Leaf className="h-4 w-4 mr-1" />
                  Health-Focused
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular Restaurants Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Restaurants</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Discover the most loved restaurants in your area, from local favorites to hidden gems.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Symposium World Cuisine */}
            <a 
              href="https://www.google.com/maps/place/Symposium+World+Cuisine/@28.5844,77.0474,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48">
                  <Image
                  src="/images/restaurants/symposium.jpg"
                  alt="Symposium World Cuisine"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-2xl font-bold">Symposium World Cuisine</h3>
                  <p className="text-white/90 text-sm">⭐ 4.5 (500+ reviews)</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm">101, First Floor, City Centre Mall, Sector 12 Dwarka, New Delhi, Delhi 110075</p>
                      <p className="text-gray-500 text-sm mt-1">Open • 11:00 AM - 11:00 PM</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Open Now</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">15% Off</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Fine Dining</span>
          </div>
        </div>
                  </div>
                </div>
            </div>
            </a>

            {/* Panache */}
            <a 
              href="https://www.google.com/maps/place/Panache/@28.5844,77.0474,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48">
                    <Image
                  src="/images/restaurants/panache.jpg"
                  alt="Panache"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-2xl font-bold">Panache</h3>
                  <p className="text-white/90 text-sm">⭐ 4.3 (300+ reviews)</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm">Sector 17, Dwarka, New Delhi</p>
                      <p className="text-gray-500 text-sm mt-1">Open • 12:00 PM - 11:00 PM</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Open Now</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Family Dining</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a>

            {/* Cafe After Hours */}
            <a 
              href="https://www.google.com/maps/place/Cafe+After+Hours/@28.5844,77.0474,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48">
                <Image
                  src="/images/restaurants/cafe.jpg"
                  alt="Cafe After Hours"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-2xl font-bold">Cafe After Hours</h3>
                  <p className="text-white/90 text-sm">⭐ 4.2 (400+ reviews)</p>
                </div>
                      </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm">Sector 12, Dwarka, New Delhi</p>
                      <p className="text-gray-500 text-sm mt-1">Open • 11:00 AM - 12:00 AM</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Open Now</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Late Night</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/restaurant" 
              className="inline-flex items-center gap-2 bg-accent-yellow text-[#232323] px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              View All Restaurants
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
                </Link>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showAuthPopup && (
        <AuthPopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showVoiceAssistant && (
        <VoiceAssistant
          isOpen={showVoiceAssistant}
          onClose={() => setShowVoiceAssistant(false)}
          onOrderAction={(action) => {
            console.log('Voice order action:', action);
            setShowVoiceAssistant(false);
          }}
        />
      )}

      {showLocationSelector && (
        <LocationSelector
          isOpen={showLocationSelector}
          onClose={() => setShowLocationSelector(false)}
          onLocationSelect={(address: Address) => {
            // Convert Address to the expected format for selectedLocation
            const location: Address = {
              _id: address._id,
              label: address.label,
              name: address.name,
              phone: address.phone,
              street: address.street,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              isDefault: address.isDefault,
              coordinates: address.coordinates
            };
            setSelectedLocation(location);
            setShowLocationSelector(false);
          }}
        />
      )}
    </div>
  </React.Fragment>
  );
} 