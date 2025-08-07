// Smart Meal Recommender System
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  preferences: {
    cuisines: { [cuisine: string]: number }; // preference score 0-10
    dishes: { [dish: string]: number };
    priceRange: { min: number; max: number };
    dietary: 'all' | 'vegetarian' | 'non-vegetarian' | 'vegan' | 'jain';
    spiceLevel: 'mild' | 'medium' | 'spicy';
  };
  orderHistory: OrderHistoryItem[];
  behaviorData: {
    timePatterns: { [hour: string]: string[] }; // favorite cuisines by hour
    dayPatterns: { [day: string]: string[] }; // favorite cuisines by day
    weatherPatterns: { [weather: string]: string[] }; // favorite dishes by weather
    locationPreferences: { [area: string]: number };
  };
  lastOrderDate?: string;
  totalOrders: number;
  averageOrderValue: number;
}

export interface OrderHistoryItem {
  _id: string;
  dishName: string;
  cuisine: string;
  price: number;
  rating?: number;
  restaurant: {
    _id: string;
    name: string;
    area: string;
  };
  orderDate: string;
  orderTime: string;
  weather?: string;
  dayOfWeek: string;
}

export interface RecommendationItem {
  dish: {
    name: string;
    image: string;
    category: string;
    isVeg: boolean;
    avgPrice: number;
    avgRating: number;
    description: string;
  };
  restaurants: Array<{
    _id: string;
    name: string;
    price: number;
    rating: number;
    deliveryTime: string;
    deliveryFee: number;
  }>;
  reason: string;
  confidence: number; // 0-100
  tags: string[];
}

export interface TrendingMeal {
  name: string;
  image: string;
  orderCount: number;
  avgRating: number;
  priceRange: { min: number; max: number };
  cuisine: string;
  trendingReason: string;
  restaurants: number;
}

class SmartRecommendationEngine {
  private weatherConditions = {
    'rainy': ['Hot Soup', 'Masala Chai', 'Pakoda', 'Maggi', 'Hot Coffee'],
    'sunny': ['Cold Coffee', 'Ice Cream', 'Fresh Juice', 'Salad', 'Smoothie'],
    'cloudy': ['Pizza', 'Burger', 'Sandwich', 'Pasta', 'Biryani'],
    'cold': ['Hot Chocolate', 'Soup', 'Tea', 'Paratha', 'Dal Rice']
  };

  private timeBasedSuggestions = {
    'breakfast': ['Poha', 'Upma', 'Dosa', 'Idli', 'Paratha', 'Sandwich', 'Omelette'],
    'lunch': ['Biryani', 'Dal Rice', 'Roti Sabzi', 'Thali', 'Fried Rice', 'Curry'],
    'evening': ['Tea', 'Samosa', 'Pakoda', 'Burger', 'Pizza', 'Chat'],
    'dinner': ['Biryani', 'Chicken Curry', 'Dal Tadka', 'Roti', 'Naan', 'Rice']
  };

  private cuisineAffinityMatrix = {
    'North Indian': ['Mughlai', 'Punjabi', 'Rajasthani'],
    'South Indian': ['Tamil', 'Kerala', 'Andhra'],
    'Chinese': ['Thai', 'Japanese', 'Asian'],
    'Italian': ['Continental', 'Mediterranean'],
    'Fast Food': ['American', 'Continental']
  };

  // Initialize or get user profile
  getUserProfile(userId: string): UserProfile {
    const stored = localStorage.getItem(`userProfile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Default profile for new users
    return {
      _id: userId,
      name: 'User',
      email: '',
      preferences: {
        cuisines: {},
        dishes: {},
        priceRange: { min: 100, max: 1000 },
        dietary: 'all',
        spiceLevel: 'medium'
      },
      orderHistory: [],
      behaviorData: {
        timePatterns: {},
        dayPatterns: {},
        weatherPatterns: {},
        locationPreferences: {}
      },
      totalOrders: 0,
      averageOrderValue: 0
    };
  }

  // Update user profile based on order
  updateUserProfile(userId: string, order: OrderHistoryItem): void {
    const profile = this.getUserProfile(userId);
    
    // Add to order history
    profile.orderHistory.unshift(order);
    if (profile.orderHistory.length > 50) {
      profile.orderHistory = profile.orderHistory.slice(0, 50); // Keep last 50 orders
    }

    // Update preferences
    const cuisine = order.cuisine;
    const dish = order.dishName;
    
    profile.preferences.cuisines[cuisine] = (profile.preferences.cuisines[cuisine] || 0) + 1;
    profile.preferences.dishes[dish] = (profile.preferences.dishes[dish] || 0) + 1;

    // Update behavior patterns
    const hour = new Date(order.orderTime).getHours();
    const timeSlot = this.getTimeSlot(hour);
    
    if (!profile.behaviorData.timePatterns[timeSlot]) {
      profile.behaviorData.timePatterns[timeSlot] = [];
    }
    profile.behaviorData.timePatterns[timeSlot].push(cuisine);

    if (!profile.behaviorData.dayPatterns[order.dayOfWeek]) {
      profile.behaviorData.dayPatterns[order.dayOfWeek] = [];
    }
    profile.behaviorData.dayPatterns[order.dayOfWeek].push(cuisine);

    if (order.weather) {
      if (!profile.behaviorData.weatherPatterns[order.weather]) {
        profile.behaviorData.weatherPatterns[order.weather] = [];
      }
      profile.behaviorData.weatherPatterns[order.weather].push(dish);
    }

    // Update location preferences
    const area = order.restaurant.area;
    profile.behaviorData.locationPreferences[area] = 
      (profile.behaviorData.locationPreferences[area] || 0) + 1;

    // Update stats
    profile.totalOrders += 1;
    profile.averageOrderValue = 
      (profile.averageOrderValue * (profile.totalOrders - 1) + order.price) / profile.totalOrders;
    profile.lastOrderDate = order.orderDate;

    // Save updated profile
    localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile));
  }

  // Get personalized recommendations
  getPersonalizedRecommendations(userId: string, context?: {
    weather?: string;
    timeOfDay?: string;
    location?: string;
  }): RecommendationItem[] {
    const profile = this.getUserProfile(userId);
    const recommendations: RecommendationItem[] = [];

    // If new user, return cold start recommendations
    if (profile.totalOrders === 0) {
      return this.getColdStartRecommendations(context);
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    const timeSlot = context?.timeOfDay || this.getTimeSlot(currentHour);
    const timeRecs = this.getTimeBasedRecommendations(profile, timeSlot);
    recommendations.push(...timeRecs);

    // Weather-based recommendations
    if (context?.weather) {
      const weatherRecs = this.getWeatherBasedRecommendations(profile, context.weather);
      recommendations.push(...weatherRecs);
    }

    // Cuisine preference recommendations
    const cuisineRecs = this.getCuisineBasedRecommendations(profile);
    recommendations.push(...cuisineRecs);

    // Collaborative filtering recommendations
    const collabRecs = this.getCollaborativeRecommendations(profile);
    recommendations.push(...collabRecs);

    // Remove duplicates and sort by confidence
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return uniqueRecs.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  // Get trending meals
  getTrendingMeals(location?: string): TrendingMeal[] {
    // Mock trending data - in production, this would come from analytics
    const trendingData: TrendingMeal[] = [
      {
        name: 'Butter Chicken',
        image: '/images/categories/chicken.jpg',
        orderCount: 1247,
        avgRating: 4.6,
        priceRange: { min: 299, max: 429 },
        cuisine: 'North Indian',
        trendingReason: 'Most ordered this week',
        restaurants: 15
      },
      {
        name: 'Margherita Pizza',
        image: '/images/categories/pizza-2.jpeg',
        orderCount: 987,
        avgRating: 4.4,
        priceRange: { min: 299, max: 449 },
        cuisine: 'Italian',
        trendingReason: 'Weekend favorite',
        restaurants: 12
      },
      {
        name: 'Chicken Biryani',
        image: '/images/categories/chicken.jpg',
        orderCount: 856,
        avgRating: 4.7,
        priceRange: { min: 249, max: 399 },
        cuisine: 'Hyderabadi',
        trendingReason: 'Dinner special',
        restaurants: 18
      },
      {
        name: 'Masala Dosa',
        image: '/images/categories/South-indian.jpg',
        orderCount: 743,
        avgRating: 4.5,
        priceRange: { min: 89, max: 149 },
        cuisine: 'South Indian',
        trendingReason: 'Breakfast champion',
        restaurants: 22
      },
      {
        name: 'Hakka Noodles',
        image: '/images/categories/Chinese.jpg',
        orderCount: 692,
        avgRating: 4.3,
        priceRange: { min: 179, max: 249 },
        cuisine: 'Chinese',
        trendingReason: 'Quick bite favorite',
        restaurants: 16
      }
    ];

    return trendingData;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'breakfast';
    if (hour >= 12 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'dinner';
  }

  private getColdStartRecommendations(context?: {
    weather?: string;
    timeOfDay?: string;
    location?: string;
  }): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    
    // Time-based cold start
    const timeSlot = context?.timeOfDay || this.getTimeSlot(new Date().getHours());
    const timeDishes = this.timeBasedSuggestions[timeSlot] || [];
    
    timeDishes.slice(0, 3).forEach(dish => {
      recommendations.push({
        dish: {
          name: dish,
          image: this.getDishImage(dish),
          category: this.getDishCategory(dish),
          isVeg: this.isDishVeg(dish),
          avgPrice: this.getAvgPrice(dish),
          avgRating: 4.2,
          description: `Popular ${dish.toLowerCase()} perfect for ${timeSlot}`
        },
        restaurants: this.getMockRestaurants(dish),
        reason: `Perfect for ${timeSlot}`,
        confidence: 75,
        tags: ['popular', timeSlot]
      });
    });

    // Weather-based cold start
    if (context?.weather && this.weatherConditions[context.weather]) {
      const weatherDishes = this.weatherConditions[context.weather];
      weatherDishes.slice(0, 2).forEach(dish => {
        recommendations.push({
          dish: {
            name: dish,
            image: this.getDishImage(dish),
            category: this.getDishCategory(dish),
            isVeg: this.isDishVeg(dish),
            avgPrice: this.getAvgPrice(dish),
            avgRating: 4.3,
            description: `Ideal for ${context.weather} weather`
          },
          restaurants: this.getMockRestaurants(dish),
          reason: `Perfect for ${context.weather} weather`,
          confidence: 70,
          tags: ['weather-based', context.weather]
        });
      });
    }

    // Add trending dishes for new users
    const trending = this.getTrendingMeals();
    trending.slice(0, 3).forEach(trend => {
      recommendations.push({
        dish: {
          name: trend.name,
          image: trend.image,
          category: trend.cuisine,
          isVeg: this.isDishVeg(trend.name),
          avgPrice: (trend.priceRange.min + trend.priceRange.max) / 2,
          avgRating: trend.avgRating,
          description: trend.trendingReason
        },
        restaurants: this.getMockRestaurants(trend.name),
        reason: trend.trendingReason,
        confidence: 80,
        tags: ['trending', 'popular']
      });
    });

    return recommendations;
  }

  private getTimeBasedRecommendations(profile: UserProfile, timeSlot: string): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const timePreferences = profile.behaviorData.timePatterns[timeSlot] || [];
    
    // Get most frequent cuisines for this time
    const cuisineFreq = timePreferences.reduce((acc, cuisine) => {
      acc[cuisine] = (acc[cuisine] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topCuisines = Object.entries(cuisineFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([cuisine]) => cuisine);

    topCuisines.forEach(cuisine => {
      const dishes = this.getDishesForCuisine(cuisine);
      dishes.slice(0, 2).forEach(dish => {
        recommendations.push({
          dish: {
            name: dish,
            image: this.getDishImage(dish),
            category: cuisine,
            isVeg: this.isDishVeg(dish),
            avgPrice: this.getAvgPrice(dish),
            avgRating: 4.4,
            description: `Your usual ${timeSlot} choice`
          },
          restaurants: this.getMockRestaurants(dish),
          reason: `You usually love this for ${timeSlot}`,
          confidence: 85,
          tags: ['time-based', 'personal-habit']
        });
      });
    });

    return recommendations;
  }

  private getWeatherBasedRecommendations(profile: UserProfile, weather: string): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const weatherDishes = this.weatherConditions[weather] || [];
    const userWeatherHistory = profile.behaviorData.weatherPatterns[weather] || [];

    // Combine general weather preferences with user history
    const combinedDishes = [...weatherDishes, ...userWeatherHistory];
    const uniqueDishes = [...new Set(combinedDishes)];

    uniqueDishes.slice(0, 2).forEach(dish => {
      const isPersonal = userWeatherHistory.includes(dish);
      recommendations.push({
        dish: {
          name: dish,
          image: this.getDishImage(dish),
          category: this.getDishCategory(dish),
          isVeg: this.isDishVeg(dish),
          avgPrice: this.getAvgPrice(dish),
          avgRating: 4.3,
          description: `Perfect comfort food for ${weather} weather`
        },
        restaurants: this.getMockRestaurants(dish),
        reason: isPersonal ? `You enjoyed this last ${weather} day` : `Perfect for ${weather} weather`,
        confidence: isPersonal ? 90 : 75,
        tags: ['weather-based', weather, ...(isPersonal ? ['personal'] : [])]
      });
    });

    return recommendations;
  }

  private getCuisineBasedRecommendations(profile: UserProfile): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    
    // Get top cuisines from user preferences
    const topCuisines = Object.entries(profile.preferences.cuisines)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    topCuisines.forEach(cuisine => {
      // Find related cuisines
      const relatedCuisines = this.cuisineAffinityMatrix[cuisine] || [];
      const allCuisines = [cuisine, ...relatedCuisines];

      allCuisines.slice(0, 2).forEach(c => {
        const dishes = this.getDishesForCuisine(c);
        const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
        
        recommendations.push({
          dish: {
            name: randomDish,
            image: this.getDishImage(randomDish),
            category: c,
            isVeg: this.isDishVeg(randomDish),
            avgPrice: this.getAvgPrice(randomDish),
            avgRating: 4.5,
            description: `You love ${cuisine} cuisine`
          },
          restaurants: this.getMockRestaurants(randomDish),
          reason: cuisine === c ? `Your favorite cuisine` : `Similar to your favorite ${cuisine}`,
          confidence: cuisine === c ? 88 : 75,
          tags: ['cuisine-based', 'personal-preference']
        });
      });
    });

    return recommendations;
  }

  private getCollaborativeRecommendations(profile: UserProfile): RecommendationItem[] {
    // Mock collaborative filtering - in production, this would use actual user similarity
    const recommendations: RecommendationItem[] = [];
    
    const userFavoriteDishes = Object.entries(profile.preferences.dishes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([dish]) => dish);

    // Mock "users who ordered X also ordered Y" logic
    const collaborativeMap = {
      'Butter Chicken': ['Garlic Naan', 'Basmati Rice', 'Paneer Makhani'],
      'Margherita Pizza': ['Garlic Bread', 'Pepperoni Pizza', 'Chicken Wings'],
      'Biryani': ['Raita', 'Shorba', 'Kebab'],
      'Masala Dosa': ['Filter Coffee', 'Idli', 'Vada'],
      'Hakka Noodles': ['Manchurian', 'Spring Rolls', 'Fried Rice']
    };

    userFavoriteDishes.forEach(favDish => {
      const similarDishes = collaborativeMap[favDish] || [];
      similarDishes.slice(0, 1).forEach(dish => {
        recommendations.push({
          dish: {
            name: dish,
            image: this.getDishImage(dish),
            category: this.getDishCategory(dish),
            isVeg: this.isDishVeg(dish),
            avgPrice: this.getAvgPrice(dish),
            avgRating: 4.4,
            description: `Popular with people who love ${favDish}`
          },
          restaurants: this.getMockRestaurants(dish),
          reason: `People who love ${favDish} also enjoy this`,
          confidence: 82,
          tags: ['collaborative', 'similar-users']
        });
      });
    });

    return recommendations;
  }

  private deduplicateRecommendations(recommendations: RecommendationItem[]): RecommendationItem[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.dish.name)) {
        return false;
      }
      seen.add(rec.dish.name);
      return true;
    });
  }

  // Helper methods
  private getDishImage(dish: string): string {
    const imageMap = {
      'Butter Chicken': '/images/categories/chicken.jpg',
      'Pizza': '/images/categories/pizza-2.jpeg',
      'Biryani': '/images/categories/chicken.jpg',
      'Dosa': '/images/categories/South-indian.jpg',
      'Noodles': '/images/categories/Chinese.jpg',
      'Burger': '/images/categories/burger-2.jpg',
      'Soup': '/images/categories/chicken.jpg',
      'Tea': '/images/categories/Bevarages.jpg',
      'Coffee': '/images/categories/Bevarages.jpg'
    };

    for (const [key, image] of Object.entries(imageMap)) {
      if (dish.toLowerCase().includes(key.toLowerCase())) {
        return image;
      }
    }
    return '/images/categories/Fast-food.jpg';
  }

  private getDishCategory(dish: string): string {
    const categoryMap = {
      'Pizza': 'Italian',
      'Burger': 'Fast Food',
      'Biryani': 'Indian',
      'Dosa': 'South Indian',
      'Noodles': 'Chinese',
      'Chicken': 'North Indian',
      'Paneer': 'North Indian',
      'Soup': 'Continental'
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (dish.toLowerCase().includes(key.toLowerCase())) {
        return category;
      }
    }
    return 'Mixed';
  }

  private isDishVeg(dish: string): boolean {
    const nonVegKeywords = ['chicken', 'mutton', 'beef', 'fish', 'egg', 'meat'];
    return !nonVegKeywords.some(keyword => 
      dish.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private getAvgPrice(dish: string): number {
    const priceMap = {
      'Pizza': 350,
      'Burger': 200,
      'Biryani': 280,
      'Dosa': 120,
      'Noodles': 220,
      'Chicken': 320,
      'Paneer': 280,
      'Soup': 150,
      'Tea': 50,
      'Coffee': 80
    };

    for (const [key, price] of Object.entries(priceMap)) {
      if (dish.toLowerCase().includes(key.toLowerCase())) {
        return price;
      }
    }
    return 200;
  }

  private getDishesForCuisine(cuisine: string): string[] {
    const cuisineDishes = {
      'North Indian': ['Butter Chicken', 'Paneer Makhani', 'Dal Tadka', 'Garlic Naan', 'Biryani'],
      'South Indian': ['Masala Dosa', 'Idli Sambhar', 'Vada', 'Uttapam', 'Filter Coffee'],
      'Chinese': ['Hakka Noodles', 'Fried Rice', 'Manchurian', 'Spring Rolls', 'Hot & Sour Soup'],
      'Italian': ['Margherita Pizza', 'Pasta Arrabiata', 'Garlic Bread', 'Lasagna', 'Risotto'],
      'Fast Food': ['Burger', 'French Fries', 'Sandwich', 'Wrap', 'Hot Dog'],
      'Continental': ['Grilled Chicken', 'Caesar Salad', 'Mushroom Soup', 'Pasta', 'Steak']
    };

    return cuisineDishes[cuisine] || ['Mixed Platter', 'Chef Special', 'House Special'];
  }

  private getMockRestaurants(dish: string) {
    return [
      {
        _id: 'rest_001',
        name: `${dish} House`,
        price: this.getAvgPrice(dish),
        rating: 4.3 + Math.random() * 0.7,
        deliveryTime: '25-35 mins',
        deliveryFee: 40
      },
      {
        _id: 'rest_002', 
        name: `Royal ${dish}`,
        price: this.getAvgPrice(dish) + 50,
        rating: 4.5 + Math.random() * 0.5,
        deliveryTime: '30-40 mins',
        deliveryFee: 50
      }
    ];
  }
}

// Export singleton instance
export const recommendationEngine = new SmartRecommendationEngine();

// Export utility functions
export const initializeUserProfile = (userId: string) => {
  return recommendationEngine.getUserProfile(userId);
};

export const updateUserProfile = (userId: string, order: OrderHistoryItem) => {
  recommendationEngine.updateUserProfile(userId, order);
};

export const getRecommendations = (userId: string, context?: {
  weather?: string;
  timeOfDay?: string;
  location?: string;
}) => {
  return recommendationEngine.getPersonalizedRecommendations(userId, context);
};

export const getTrendingMeals = (location?: string) => {
  return recommendationEngine.getTrendingMeals(location);
}; 