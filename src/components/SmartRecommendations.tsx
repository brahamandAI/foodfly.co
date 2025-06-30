'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, TrendingUp, Zap, Brain, MapPin, Plus, Thermometer, Sun, Cloud, CloudRain, Sparkles, Heart, Shield, ChefHat, Target, Activity } from 'lucide-react';
import { 
  getRecommendations, 
  getTrendingMeals, 
  initializeUserProfile,
  RecommendationItem, 
  TrendingMeal, 
  UserProfile 
} from '../lib/recommendations';
import { toast } from 'react-hot-toast';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  tags: string[];
  dietaryFlags: string[];
  allergens: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'very_hot';
  preparationTime: number;
  rating: number;
  nutritionScore: number;
}

interface HealthProfile {
  dietaryPreferences: string[];
  healthGoals: string[];
  allergies: string[];
  calorieGoal?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  restrictions: string[];
  favoriteCuisines: string[];
}

interface SmartRecommendationsProps {
  userId: string;
  location?: string;
  maxRecommendations?: number;
  showTrending?: boolean;
  showContext?: boolean;
  restaurantId?: string;
  currentMeal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onAddToCart: (item: MenuItem) => void;
}

export default function SmartRecommendations({ 
  userId, 
  location, 
  maxRecommendations = 8,
  showTrending = true,
  showContext = true,
  restaurantId,
  currentMeal = 'lunch',
  onAddToCart
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [trendingMeals, setTrendingMeals] = useState<TrendingMeal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState<string>('sunny');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});
  const [cartMessage, setCartMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'health' | 'trending' | 'quick' | 'personalized'>('personalized');

  // Check if user is authenticated - only show recommendations to logged-in users
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    return token && isLoggedIn;
  };

  // If user is not authenticated, don't render recommendations
  if (!isAuthenticated()) {
    return null;
  }

  useEffect(() => {
    loadRecommendations();
    loadCartItems();
    updateTimeAndWeather();
    loadHealthProfile();
    
    // Update recommendations every 5 minutes
    const interval = setInterval(() => {
      loadRecommendations();
      updateTimeAndWeather();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, location, restaurantId, currentMeal]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      
      // Initialize user profile
      const profile = initializeUserProfile(userId);
      setUserProfile(profile);

      // Get current context
      const currentHour = new Date().getHours();
      const timeOfDay = getTimeOfDay(currentHour);
      
      // Mock weather detection (in production, use weather API)
      const weather = getCurrentWeather();
      setCurrentWeather(weather);
      setCurrentTime(timeOfDay);

      // Get personalized recommendations
      const recs = getRecommendations(userId, {
        weather,
        timeOfDay,
        location
      });
      setRecommendations(recs.slice(0, maxRecommendations));

      // Get trending meals
      if (showTrending) {
        const trending = getTrendingMeals(location);
        setTrendingMeals(trending.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCartItems = () => {
    const savedCart = localStorage.getItem('testCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        setCartItems(cartData);
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems({});
      }
    } else {
      setCartItems({});
    }
  };

  const updateTimeAndWeather = () => {
    const hour = new Date().getHours();
    setCurrentTime(getTimeOfDay(hour));
    // In production, integrate with weather API
    setCurrentWeather(getCurrentWeather());
  };

  const getTimeOfDay = (hour: number): string => {
    if (hour >= 6 && hour < 12) return 'breakfast';
    if (hour >= 12 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'dinner';
  };

  const getCurrentWeather = (): string => {
    // Mock weather - in production, integrate with OpenWeatherMap or similar
    const weathers = ['sunny', 'cloudy', 'rainy', 'cold'];
    const hour = new Date().getHours();
    
    // Simulate weather patterns
    if (hour >= 10 && hour <= 15) return 'sunny';
    if (hour >= 16 && hour <= 18) return 'cloudy';
    if (hour >= 19 || hour <= 6) return 'cold';
    return 'cloudy';
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  const showCartMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setCartMessage({ message, type });
    setTimeout(() => setCartMessage(null), 3000);
  };

  const addToCart = async (item: any) => {
    try {
      if (!isAuthenticated()) {
        toast.error('Please login to add items to cart');
        return;
      }

      // Use database cart API exclusively
      const { cartService } = require('@/lib/api');
      
      await cartService.addToCart(
        item.id || item._id,
        item.name,
        item.description || '',
        item.price,
        1, // quantity
        item.image || '',
        item.restaurantId || 'default-restaurant',
        item.restaurantName || 'Restaurant',
        [] // customizations
      );
      
      // Trigger cart update event for header
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success(`${item.name} added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      toast.error(errorMessage);
    }
  };

  const loadHealthProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Load from API for authenticated users
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHealthProfile(data.user?.preferences || null);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedProfile = localStorage.getItem('healthProfile');
        if (savedProfile) {
          setHealthProfile(JSON.parse(savedProfile));
        }
      }
    } catch (error) {
      console.error('Error loading health profile:', error);
    }
  };

  const calculatePersonalizedScore = (item: MenuItem, profile: HealthProfile | null): number => {
    let score = item.nutritionScore || 50;

    if (!profile) return score;

    // Dietary preferences matching
    const dietaryMatches = profile.dietaryPreferences.filter(pref => 
      item.dietaryFlags.includes(pref)
    ).length;
    score += dietaryMatches * 15;

    // Health goals alignment
    if (profile.healthGoals.includes('weight_loss') && item.calories && item.calories < 400) score += 10;
    if (profile.healthGoals.includes('muscle_gain') && item.protein && item.protein > 20) score += 10;
    if (profile.healthGoals.includes('heart_health') && item.tags.includes('heart-healthy')) score += 10;
    if (profile.healthGoals.includes('energy_boost') && item.tags.includes('high-protein')) score += 8;

    // Allergy penalties
    const allergyConflicts = profile.allergies.filter(allergy => 
      item.allergens.includes(allergy)
    ).length;
    score -= allergyConflicts * 50; // Heavy penalty for allergens

    // Calorie goal alignment
    if (profile.calorieGoal && item.calories) {
      const targetMealCalories = profile.calorieGoal / 3; // Rough estimate for main meal
      const calorieDeviation = Math.abs(item.calories - targetMealCalories);
      score -= calorieDeviation / 10;
    }

    // Quick preparation bonus for busy lifestyle
    if (profile.activityLevel === 'very_active' && item.preparationTime <= 10) score += 8;

    // Cuisine preference
    const cuisinePreference = profile.favoriteCuisines.some(cuisine => 
      item.category.toLowerCase().includes(cuisine) || 
      item.tags.some(tag => tag.includes(cuisine))
    );
    if (cuisinePreference) score += 12;

    return Math.max(0, Math.min(100, score));
  };

  const filterByCategory = (items: (MenuItem & { personalizedScore: number })[], category: string) => {
    switch (category) {
      case 'health':
        return items.filter(item => item.nutritionScore >= 80);
      case 'trending':
        return items.filter(item => item.rating >= 4.5);
      case 'quick':
        return items.filter(item => item.preparationTime <= 15);
      case 'personalized':
        return items.filter(item => item.personalizedScore >= 60);
      default:
        return items;
    }
  };

  const getRecommendationReason = (item: MenuItem & { personalizedScore?: number }): string => {
    if (!healthProfile) return 'Popular choice';

    const reasons = [];

    // Check dietary preferences
    const dietaryMatches = healthProfile.dietaryPreferences.filter(pref => 
      item.dietaryFlags.includes(pref)
    );
    if (dietaryMatches.length > 0) {
      reasons.push(`Matches your ${dietaryMatches.join(', ')} preference`);
    }

    // Check health goals
    if (healthProfile.healthGoals.includes('weight_loss') && item.calories && item.calories < 400) {
      reasons.push('Low calorie for weight loss');
    }
    if (healthProfile.healthGoals.includes('muscle_gain') && item.protein && item.protein > 20) {
      reasons.push('High protein for muscle gain');
    }
    if (healthProfile.healthGoals.includes('heart_health') && item.tags.includes('heart-healthy')) {
      reasons.push('Heart healthy option');
    }

    // Quick preparation
    if (item.preparationTime <= 10) {
      reasons.push('Quick preparation');
    }

    // High nutrition score
    if (item.nutritionScore >= 85) {
      reasons.push('Excellent nutrition profile');
    }

    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  };

  const handleAddToCart = (item: MenuItem) => {
    onAddToCart(item);
    toast.success(`Added ${item.name} to cart!`);
  };

  const categories = [
    { id: 'personalized', label: 'For You', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'health', label: 'Healthy', icon: <Heart className="h-4 w-4" /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'quick', label: 'Quick', icon: <Clock className="h-4 w-4" /> }
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cart Message */}
      {cartMessage && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          cartMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {cartMessage.message}
        </div>
      )}

      {/* Context Header */}
      {showContext && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Smart Recommendations</h3>
                <p className="text-sm text-gray-600">Personalized for you based on your preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="capitalize">{currentTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getWeatherIcon(currentWeather)}
                <span className="capitalize">{currentWeather}</span>
              </div>
              {location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-gray-800">Just for You</h2>
            </div>
            <div className="text-sm text-gray-600">
              {userProfile?.totalOrders > 0 ? 
                `Based on ${userProfile.totalOrders} previous orders` : 
                'Curated for new food explorer'
              }
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 group">
                                     <Link href={`/dish/${encodeURIComponent(rec.dish.name)}`}>
                       <div className="relative h-48">
                         <Image
                           src={rec.dish.image}
                           alt={rec.dish.name}
                           fill
                           className="object-cover group-hover:scale-105 transition-transform duration-300"
                         />
                         <div className="absolute top-3 left-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                             {rec.confidence}% match
                           </span>
                         </div>
                         <div className="absolute top-3 right-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                             rec.dish.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                           }`}>
                             {rec.dish.isVeg ? 'VEG' : 'NON-VEG'}
                           </span>
                         </div>
                       </div>
                     </Link>

                <div className="p-4">
                                       <div className="flex items-start justify-between mb-2">
                       <Link 
                         href={`/dish/${encodeURIComponent(rec.dish.name)}`}
                         className="font-semibold text-gray-800 hover:text-red-600 transition-colors"
                       >
                         {rec.dish.name}
                       </Link>
                       <div className="flex items-center space-x-1">
                         <Star className="h-4 w-4 text-yellow-400 fill-current" />
                         <span className="text-sm font-medium">{rec.dish.avgRating.toFixed(1)}</span>
                       </div>
                     </div>

                     <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>

                     <div className="flex items-center justify-between mb-3">
                       <span className="text-lg font-bold text-red-600">₹{rec.dish.avgPrice}</span>
                    <div className="flex flex-wrap gap-1">
                      {rec.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                                       <div className="flex space-x-2">
                       <button
                         onClick={() => addToCart(rec.dish.name)}
                         className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                       >
                         <Plus className="h-4 w-4" />
                         <span>Add</span>
                       </button>
                       <Link
                         href={`/dish/${encodeURIComponent(rec.dish.name)}`}
                         className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
                       >
                         View
                       </Link>
                     </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Meals */}
      {showTrending && trendingMeals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold text-gray-800">Trending Now</h2>
            </div>
            <Link href="/search?tab=dishes" className="text-red-600 hover:text-red-700 font-medium">
              View All Trending
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendingMeals.map((meal, index) => (
              <Link
                key={index}
                href={`/dish/${encodeURIComponent(meal.name)}`}
                className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 hover:shadow-md transition-all duration-300 group border border-orange-100"
              >
                <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={meal.image}
                    alt={meal.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    #{index + 1}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-red-600 transition-colors">
                  {meal.name}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>{meal.orderCount} orders</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span>{meal.avgRating}</span>
                  </div>
                </div>
                
                <p className="text-xs text-orange-600 font-medium mb-2">{meal.trendingReason}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">
                    ₹{meal.priceRange.min}-{meal.priceRange.max}
                  </span>
                  <span className="text-xs text-gray-500">{meal.restaurants} places</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Recommendations Fallback */}
      {recommendations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Building Your Taste Profile</h3>
          <p className="text-gray-600 mb-4">
            Order a few meals to get personalized recommendations based on your preferences!
          </p>
          <Link
            href="/search"
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Explore Dishes
          </Link>
        </div>
      )}

      {/* Health Profile Prompt */}
      {!healthProfile && (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-t">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Get Personalized Recommendations</h3>
              <p className="text-sm text-gray-600">Set your dietary preferences and health goals for tailored meal suggestions</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openHealthProfile'))}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Set Up Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 