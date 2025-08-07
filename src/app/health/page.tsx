'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Activity, 
  Target, 
  TrendingUp, 
  Star, 
  Clock, 
  Leaf, 
  Shield, 
  Award,
  ArrowLeft,
  Plus,
  ChevronDown,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HealthProfile {
  _id: string;
  user: string;
  dietaryPreferences: {
    primaryDiet: string;
    secondaryPreferences: string[];
    allergies: string[];
  };
  fitnessGoals: {
    primaryGoal: string;
    targetCalories: number;
    targetWeight: number;
    activityLevel: string;
  };
  healthTracking: {
  currentStreak: number;
  totalHealthyMeals: number;
    lastHealthyMeal: Date;
    weeklyStats: any[];
  };
  healthScore: number;
}

interface HealthyMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  restaurant: {
    _id: string;
    name: string;
  };
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  healthScore: {
    overall: number;
    nutrition: number;
    ingredients: number;
  };
  healthTags: {
    dietTypes: string[];
    healthBenefits: string[];
    allergens: string[];
  };
  personalizationScore?: number;
  personalizationReason?: string;
}

export default function HealthPage() {
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [healthyRecommendations, setHealthyRecommendations] = useState<HealthyMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDietFilter, setSelectedDietFilter] = useState<string>('all');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      loadHealthProfile();
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const loadHealthProfile = async () => {
    try {
      setIsLoading(true);
      
      // Mock health profile for testing
      const mockProfile: HealthProfile = {
        _id: 'profile_001',
        user: 'user_001',
        dietaryPreferences: {
          primaryDiet: 'vegetarian',
          secondaryPreferences: ['low-carb', 'high-protein'],
          allergies: ['nuts']
        },
        fitnessGoals: {
          primaryGoal: 'weight-loss',
          targetCalories: 1800,
          targetWeight: 70,
          activityLevel: 'moderate'
        },
        healthTracking: {
          currentStreak: 7,
          totalHealthyMeals: 45,
          lastHealthyMeal: new Date(),
          weeklyStats: []
        },
        healthScore: 8.2
      };
      
      setHealthProfile(mockProfile);
      loadHealthyRecommendations();
    } catch (error) {
      console.error('Error loading health profile:', error);
      loadGeneralHealthyOptions();
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthyRecommendations = async () => {
    loadGeneralHealthyOptions();
  };

  const loadGeneralHealthyOptions = () => {
    // Mock healthy food recommendations
    const mockHealthyItems: HealthyMenuItem[] = [
      {
        _id: 'healthy_001',
        name: 'Quinoa Buddha Bowl',
        description: 'Nutritious bowl with quinoa, roasted vegetables, avocado, and tahini dressing',
        price: 349,
        image: '/images/categories/North-indian.jpg',
        restaurant: { _id: 'rest_001', name: 'Healthy Bites' },
        nutritionalInfo: {
          calories: 420,
          protein: 18,
          carbohydrates: 45,
          fat: 16,
          fiber: 12
        },
        healthScore: {
          overall: 9.2,
          nutrition: 9.5,
          ingredients: 8.8
        },
        healthTags: {
          dietTypes: ['vegan', 'gluten-free'],
          healthBenefits: ['high-fiber', 'heart-healthy', 'weight-loss'],
          allergens: ['nuts']
        },
        personalizationScore: 95,
        personalizationReason: 'Perfect for your weight-loss goals'
      },
      {
        _id: 'healthy_002',
        name: 'Grilled Salmon Salad',
        description: 'Fresh salmon with mixed greens, cherry tomatoes, and lemon vinaigrette',
        price: 449,
        image: '/images/categories/European.jpg',
        restaurant: { _id: 'rest_002', name: 'Ocean Fresh' },
        nutritionalInfo: {
          calories: 380,
          protein: 32,
          carbohydrates: 15,
          fat: 22,
          fiber: 8
        },
        healthScore: {
          overall: 8.9,
          nutrition: 9.2,
          ingredients: 8.5
        },
        healthTags: {
          dietTypes: ['keto-friendly', 'high-protein'],
          healthBenefits: ['omega-3', 'muscle-building', 'heart-healthy'],
          allergens: ['fish']
        },
        personalizationScore: 88,
        personalizationReason: 'Great source of protein for muscle building'
      },
      {
        _id: 'healthy_003',
        name: 'Chickpea Power Bowl',
        description: 'Protein-rich chickpeas with brown rice, roasted vegetables, and hummus',
        price: 299,
        image: '/images/categories/North-indian.jpg',
        restaurant: { _id: 'rest_003', name: 'Green Garden' },
        nutritionalInfo: {
          calories: 465,
          protein: 20,
          carbohydrates: 68,
          fat: 14,
          fiber: 16
        },
        healthScore: {
          overall: 8.7,
          nutrition: 8.9,
          ingredients: 8.4
        },
        healthTags: {
          dietTypes: ['vegetarian', 'high-fiber'],
          healthBenefits: ['plant-protein', 'digestive-health', 'sustainable'],
          allergens: []
        },
        personalizationScore: 82,
        personalizationReason: 'High in plant-based protein and fiber'
      },
      {
        _id: 'healthy_004',
        name: 'Avocado Toast with Poached Egg',
        description: 'Whole grain toast with avocado, poached egg, and microgreens',
        price: 249,
        image: '/images/categories/European.jpg',
        restaurant: { _id: 'rest_004', name: 'Morning Glory' },
        nutritionalInfo: {
          calories: 340,
          protein: 16,
          carbohydrates: 28,
          fat: 20,
          fiber: 10
        },
        healthScore: {
          overall: 8.4,
          nutrition: 8.6,
          ingredients: 8.2
        },
        healthTags: {
          dietTypes: ['vegetarian', 'high-protein'],
          healthBenefits: ['heart-healthy', 'energy-boost', 'brain-food'],
          allergens: ['eggs', 'gluten']
        },
        personalizationScore: 78,
        personalizationReason: 'Good balance of healthy fats and protein'
      }
    ];

    setHealthyRecommendations(mockHealthyItems);
  };

  const addToCart = async (item: any) => {
    try {
      // Enhanced cart service for better item management
      const { enhancedCartService } = await import('@/lib/api');
      
      const success = enhancedCartService.addItem({
        id: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        isVeg: item.isVeg,
        quantity: 1
      });

      if (success) {
        toast.success(`${item.name} added to cart!`);
        
        // Update cart count in header
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        toast.error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 9) return 'text-green-600 bg-green-100';
    if (score >= 7.5) return 'text-blue-600 bg-blue-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getDietTypeColor = (dietType: string): string => {
    const colors: Record<string, string> = {
      'vegan': 'bg-green-100 text-green-800',
      'vegetarian': 'bg-green-100 text-green-700',
      'keto-friendly': 'bg-purple-100 text-purple-800',
      'high-protein': 'bg-blue-100 text-blue-800',
      'gluten-free': 'bg-yellow-100 text-yellow-800',
      'dairy-free': 'bg-orange-100 text-orange-800'
    };
    return colors[dietType] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Sign in to access personalized health recommendations and track your nutrition goals.
          </p>
          <button
            onClick={() => (window as any).showAuthPopup?.()}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-500" />
                <span>Health Dashboard</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Health Profile Summary */}
        {healthProfile && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{healthProfile.healthScore}/10</div>
                <div className="text-sm text-gray-600">Health Score</div>
          </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{healthProfile.healthTracking.currentStreak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                  <Target className="h-8 w-8 text-purple-600" />
            </div>
                <div className="text-2xl font-bold text-gray-900">{healthProfile.fitnessGoals.targetCalories}</div>
                <div className="text-sm text-gray-600">Daily Calories</div>
          </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{healthProfile.healthTracking.totalHealthyMeals}</div>
                <div className="text-sm text-gray-600">Healthy Meals</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Healthy Recommendations</h2>
            
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedDietFilter}
                onChange={(e) => setSelectedDietFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Diets</option>
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="keto-friendly">Keto Friendly</option>
                <option value="high-protein">High Protein</option>
                <option value="gluten-free">Gluten Free</option>
              </select>

              <select
                value={selectedGoalFilter}
                onChange={(e) => setSelectedGoalFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Goals</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="heart-healthy">Heart Healthy</option>
                <option value="energy-boost">Energy Boost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Healthy Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthyRecommendations
            .filter(item => 
              selectedDietFilter === 'all' || item.healthTags.dietTypes.includes(selectedDietFilter)
            )
            .filter(item =>
              selectedGoalFilter === 'all' || item.healthTags.healthBenefits.includes(selectedGoalFilter)
            )
            .map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
              <div className="relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                
                {/* Health Score Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(item.healthScore.overall)}`}>
                  ♥ {item.healthScore.overall.toFixed(1)}
                </div>

                {/* Personalization Score */}
                {item.personalizationScore && (
                  <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {item.personalizationScore}% Match
                </div>
                )}
            </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-red-600">₹{item.price}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                {/* Personalization Reason */}
                {item.personalizationReason && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-2 mb-3">
                    <p className="text-xs text-purple-700 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      {item.personalizationReason}
                    </p>
                  </div>
                )}

                {/* Nutritional Info */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                  <div>Calories: {item.nutritionalInfo.calories}</div>
                  <div>Protein: {item.nutritionalInfo.protein}g</div>
                  <div>Carbs: {item.nutritionalInfo.carbohydrates}g</div>
                  <div>Fiber: {item.nutritionalInfo.fiber}g</div>
          </div>

                {/* Diet Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.healthTags.dietTypes.slice(0, 2).map((dietType) => (
                    <span
                      key={dietType}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDietTypeColor(dietType)}`}
                    >
                      {dietType.replace('-', ' ')}
                    </span>
                  ))}
                </div>

                {/* Restaurant Info */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{item.restaurant.name}</span>
                  <div className="flex items-center space-x-1 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Healthy Choice</span>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {healthyRecommendations.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No healthy options found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later for new recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
} 