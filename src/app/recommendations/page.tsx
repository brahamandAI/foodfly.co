'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Thermometer, 
  MapPin, 
  Star, 
  Plus, 
  ArrowLeft, 
  BarChart3,
  Calendar,
  Target,
  Settings,
  Zap,
  Sun,
  Cloud,
  CloudRain
} from 'lucide-react';
import SmartRecommendations from '../../components/SmartRecommendations';
import AuthGuard from '../../components/AuthGuard';
import { 
  initializeUserProfile, 
  UserProfile, 
  getTrendingMeals,
  getRecommendations 
} from '../../lib/recommendations';
import { getCurrentUser } from '../../lib/api';

export default function RecommendationsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'profile' | 'trending'>('recommendations');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser?._id || currentUser?.id || 'user_001';
      const profile = initializeUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopCuisines = () => {
    if (!userProfile) return [];
    return Object.entries(userProfile.preferences.cuisines)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getTopDishes = () => {
    if (!userProfile) return [];
    return Object.entries(userProfile.preferences.dishes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getOrderingPatterns = () => {
    if (!userProfile) return { time: [], day: [], weather: [] };
    
    const timePatterns = Object.entries(userProfile.behaviorData.timePatterns)
      .map(([time, cuisines]) => ({ time, count: cuisines.length, cuisines: Array.from(new Set(cuisines)) }))
      .sort((a, b) => b.count - a.count);

    const dayPatterns = Object.entries(userProfile.behaviorData.dayPatterns)
      .map(([day, cuisines]) => ({ day, count: cuisines.length, cuisines: Array.from(new Set(cuisines)) }))
      .sort((a, b) => b.count - a.count);

    const weatherPatterns = Object.entries(userProfile.behaviorData.weatherPatterns)
      .map(([weather, dishes]) => ({ weather, count: dishes.length, dishes: Array.from(new Set(dishes)) }))
      .sort((a, b) => b.count - a.count);

    return { 
      time: timePatterns.slice(0, 4), 
      day: dayPatterns.slice(0, 4), 
      weather: weatherPatterns.slice(0, 4) 
    };
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'cold': return <Thermometer className="h-4 w-4 text-blue-600" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your taste profile...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Smart Recommendations</h1>
                <p className="text-gray-600">Personalized just for you</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'recommendations'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                For You
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Trending
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <SmartRecommendations
            userId={getCurrentUser()?._id || getCurrentUser()?.id || "user_001"}
            location="Mumbai"
            maxRecommendations={12}
            showTrending={false}
            showContext={true}
            onAddToCart={(item) => {
              console.log('Adding to cart:', item);
              // Cart functionality will be handled by the component
            }}
          />
        )}

        {/* User Profile Tab */}
        {activeTab === 'profile' && userProfile && (
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  Your Taste Profile
                </h2>
                <button className="text-red-600 hover:text-red-700 flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>Customize</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center text-blue-700 mb-2">
                    <Target className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Total Orders</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{userProfile.totalOrders}</p>
                  <p className="text-blue-600 text-sm">orders placed</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center text-green-700 mb-2">
                    <Star className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Avg Order</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">₹{Math.round(userProfile.averageOrderValue)}</p>
                  <p className="text-green-600 text-sm">per order</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center text-purple-700 mb-2">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Last Order</span>
                  </div>
                  <p className="text-lg font-bold text-purple-800">
                    {userProfile.lastOrderDate ? 
                      new Date(userProfile.lastOrderDate).toLocaleDateString() : 
                      'No orders yet'
                    }
                  </p>
                  <p className="text-purple-600 text-sm">most recent</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center text-orange-700 mb-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Top Area</span>
                  </div>
                  <p className="text-lg font-bold text-orange-800">
                    {Object.entries(userProfile.behaviorData.locationPreferences)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data'}
                  </p>
                  <p className="text-orange-600 text-sm">favorite area</p>
                </div>
              </div>
            </div>

            {/* Cuisine Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Favorite Cuisines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTopCuisines().length > 0 ? (
                  getTopCuisines().map(([cuisine, count], index) => (
                    <div key={cuisine} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-800">{cuisine}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count} orders</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-2">Order some food to see your cuisine preferences!</p>
                )}
              </div>
            </div>

            {/* Favorite Dishes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Favorite Dishes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTopDishes().length > 0 ? (
                  getTopDishes().map(([dish, count], index) => (
                    <div key={dish} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <Link 
                          href={`/dish/${encodeURIComponent(dish)}`}
                          className="font-medium text-gray-800 hover:text-red-600 transition-colors"
                        >
                          {dish}
                        </Link>
                      </div>
                      <span className="text-sm text-gray-600">{count} times</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-2">Order some dishes to see your favorites!</p>
                )}
              </div>
            </div>

            {/* Ordering Patterns */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Ordering Patterns</h3>
              
              {userProfile.totalOrders > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Time Patterns */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      By Time of Day
                    </h4>
                    <div className="space-y-2">
                      {getOrderingPatterns().time.map(({ time, count, cuisines }) => (
                        <div key={time} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{time}</span>
                            <span className="text-sm text-gray-600">{count} orders</span>
                          </div>
                          <p className="text-xs text-gray-500">{cuisines.slice(0, 2).join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day Patterns */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      By Day of Week
                    </h4>
                    <div className="space-y-2">
                      {getOrderingPatterns().day.map(({ day, count, cuisines }) => (
                        <div key={day} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{day}</span>
                            <span className="text-sm text-gray-600">{count} orders</span>
                          </div>
                          <p className="text-xs text-gray-500">{cuisines.slice(0, 2).join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weather Patterns */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Thermometer className="h-4 w-4 mr-2" />
                      By Weather
                    </h4>
                    <div className="space-y-2">
                      {getOrderingPatterns().weather.map(({ weather, count, dishes }) => (
                        <div key={weather} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {getWeatherIcon(weather)}
                              <span className="font-medium capitalize">{weather}</span>
                            </div>
                            <span className="text-sm text-gray-600">{count} orders</span>
                          </div>
                          <p className="text-xs text-gray-500">{dishes.slice(0, 2).join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Order more meals to see your patterns!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <TrendingUp className="h-6 w-6 text-green-500 mr-3" />
                Trending in Mumbai
              </h2>
              <Link href="/search?tab=dishes" className="text-red-600 hover:text-red-700 font-medium">
                View All Dishes
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getTrendingMeals('Mumbai').map((meal, index) => (
                <Link
                  key={index}
                  href={`/dish/${encodeURIComponent(meal.name)}`}
                  className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 hover:shadow-md transition-all duration-300 group border border-orange-100"
                >
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={meal.image}
                      alt={meal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      #{index + 1} Trending
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">
                    {meal.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{meal.orderCount} orders this week</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{meal.avgRating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-orange-600 font-medium mb-3">{meal.trendingReason}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800">
                      ₹{meal.priceRange.min}-{meal.priceRange.max}
                    </span>
                    <span className="text-sm text-gray-500">{meal.restaurants} restaurants</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
} 