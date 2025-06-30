import OpenAI from 'openai';
import { HealthProfile } from '../models/healthProfile.model';
import { MenuItem } from '../models/menuItem.model';
import Order from '../models/order.model';
import { User } from '../models/user.model';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

const initializeOpenAI = (): OpenAI => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai!;
};

const isOpenAIAvailable = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};

export class HealthService {
  // Analyze menu item description with AI to extract health data
  async analyzeMenuItemWithAI(menuItem: any): Promise<any> {
    if (!isOpenAIAvailable()) {
      console.warn('OpenAI API key not configured. Skipping AI analysis for menu item.');
      return null;
    }
    
    try {
      const client = initializeOpenAI();
      const prompt = `
Analyze this food item and provide comprehensive health information in JSON format:

Name: ${menuItem.name}
Description: ${menuItem.description}
Ingredients: ${menuItem.ingredients.join(', ')}

Please provide:
1. Estimated nutritional info (calories, protein, carbs, fat, fiber, sugar, sodium)
2. Diet types it fits (vegetarian, vegan, keto, paleo, etc.)
3. Health benefits
4. Cooking methods used
5. Allergens present
6. Special dietary flags
7. Health notes

Return as JSON with this structure:
{
  "nutritionalInfo": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "healthTags": {
    "dietTypes": ["vegetarian", "keto", etc.],
    "healthBenefits": ["heart-healthy", "weight-loss", etc.],
    "cookingMethods": ["grilled", "baked", etc.]
  },
  "dietCompatibility": {
    "glutenFree": boolean,
    "dairyFree": boolean,
    "nutFree": boolean,
    "lowSodium": boolean,
    "lowSugar": boolean
  },
  "allergenInfo": {
    "contains": ["nuts", "dairy", etc.],
    "mayContain": [],
    "severity": "low|moderate|high"
  },
  "specialNotes": {
    "diabeticFriendly": boolean,
    "heartHealthy": boolean,
    "antiInflammatory": boolean,
    "superfoods": ["quinoa", "blueberries", etc.]
  }
}
`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert and food analyst. Provide accurate nutritional analysis in the requested JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      console.error('AI menu analysis error:', error);
      return null;
    }
  }

  // Get personalized menu recommendations for a user
  async getPersonalizedRecommendations(
    userId: string, 
    restaurantId?: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch',
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Get user's health profile
      const healthProfile = await HealthProfile.findOne({ user: userId, isActive: true });
      
      if (!healthProfile) {
        // Return general healthy options if no profile
        return await this.getGeneralHealthyOptions(restaurantId, limit);
      }

      // Build query based on health profile
      const query: any = { isAvailable: true };
      
      if (restaurantId) {
        query.restaurant = restaurantId;
      }

      // Filter by diet type
      if (healthProfile.dietaryPreferences.primaryDiet !== 'none') {
        query['healthTags.dietTypes'] = healthProfile.dietaryPreferences.primaryDiet;
      }

      // Filter out allergens
      if (healthProfile.allergies.length > 0) {
        const severeAllergens = healthProfile.allergies
          .filter(allergy => allergy.severity === 'severe')
          .flatMap(allergy => allergy.allergens);
        
        if (severeAllergens.length > 0) {
          query['allergenInfo.contains'] = { $nin: severeAllergens };
        }
      }

      // Calorie range filter
      if (healthProfile.fitnessGoals.targetCalories) {
        const dailyCalories = healthProfile.fitnessGoals.targetCalories;
        const mealCalories = this.getMealCalorieRange(dailyCalories, mealType);
        
        query['nutritionalInfo.calories'] = {
          $gte: mealCalories.min,
          $lte: mealCalories.max
        };
      }

      // Nutritional preferences
      if (healthProfile.nutritionalPreferences.maxSodium) {
        query['nutritionalInfo.sodium'] = { $lte: healthProfile.nutritionalPreferences.maxSodium };
      }

      if (healthProfile.nutritionalPreferences.maxSugar) {
        query['nutritionalInfo.sugar'] = { $lte: healthProfile.nutritionalPreferences.maxSugar };
      }

      // Get matching items
      let menuItems = await MenuItem.find(query)
        .populate('restaurant', 'name')
        .sort({ 'healthScore.overall': -1 })
        .limit(limit * 2); // Get more to score and filter

      // Score items based on health profile compatibility
      const scoredItems = menuItems.map(item => ({
        ...item.toObject(),
        healthMatchScore: this.calculateHealthMatchScore(item, healthProfile),
        personalizedReason: this.getPersonalizationReason(item, healthProfile)
      }));

      // Sort by health match score and return top items
      return scoredItems
        .sort((a, b) => b.healthMatchScore - a.healthMatchScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Get general healthy options when no profile exists
  async getGeneralHealthyOptions(restaurantId?: string, limit: number = 10): Promise<any[]> {
    const query: any = { 
      isAvailable: true,
      'healthScore.overall': { $gte: 7 } // High health score items
    };
    
    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    return await MenuItem.find(query)
      .populate('restaurant', 'name')
      .sort({ 'healthScore.overall': -1 })
      .limit(limit);
  }

  // Calculate health match score between item and profile
  calculateHealthMatchScore(menuItem: any, healthProfile: any): number {
    let score = 50; // Base score

    // Diet type match (25 points)
    const primaryDiet = healthProfile.dietaryPreferences.primaryDiet;
    if (primaryDiet !== 'none' && menuItem.healthTags.dietTypes.includes(primaryDiet)) {
      score += 25;
    }

    // Health goal alignment (20 points)
    const primaryGoal = healthProfile.fitnessGoals.primaryGoal;
    const goalBenefitMap: Record<string, string[]> = {
      'weight-loss': ['weight-loss', 'low-calorie'],
      'muscle-gain': ['muscle-building', 'high-protein'],
      'performance': ['energy-boost', 'performance'],
      'general-health': ['heart-healthy', 'immune-boost']
    };

    const targetBenefits = goalBenefitMap[primaryGoal] || [];
    const matchingBenefits = menuItem.healthTags.healthBenefits.filter((benefit: string) => 
      targetBenefits.includes(benefit)
    );
    score += matchingBenefits.length * 10;

    // Calorie alignment (15 points)
    if (healthProfile.fitnessGoals.targetCalories) {
      const itemCalories = menuItem.nutritionalInfo.calories;
      const targetCalories = healthProfile.fitnessGoals.targetCalories;
      const calorieRatio = itemCalories / (targetCalories / 3); // Assume 3 meals per day
      
      if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
        score += 15;
      } else if (calorieRatio >= 0.6 && calorieRatio <= 1.4) {
        score += 10;
      }
    }

    // Health score bonus (15 points)
    score += (menuItem.healthScore.overall - 5) * 3;

    // Secondary preferences bonus (10 points)
    const secondaryPrefs = healthProfile.dietaryPreferences.secondaryPreferences;
    if (secondaryPrefs.includes('organic') && menuItem.dietCompatibility.organic) score += 5;
    if (secondaryPrefs.includes('locally-sourced') && menuItem.dietCompatibility.locallySourced) score += 5;

    // Allergen penalty (severe)
    for (const allergy of healthProfile.allergies) {
      for (const allergen of allergy.allergens) {
        if (menuItem.allergenInfo.contains.includes(allergen)) {
          score -= allergy.severity === 'severe' ? 50 : 
                   allergy.severity === 'moderate' ? 30 : 15;
        }
        if (menuItem.allergenInfo.mayContain.includes(allergen)) {
          score -= allergy.severity === 'severe' ? 25 : 
                   allergy.severity === 'moderate' ? 15 : 5;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // Get personalization reason for UI display
  getPersonalizationReason(menuItem: any, healthProfile: any): string {
    const reasons = [];

    // Diet match
    const primaryDiet = healthProfile.dietaryPreferences.primaryDiet;
    if (primaryDiet !== 'none' && menuItem.healthTags.dietTypes.includes(primaryDiet)) {
      reasons.push(`Perfect for your ${primaryDiet} diet`);
    }

    // Goal alignment
    const primaryGoal = healthProfile.fitnessGoals.primaryGoal;
    const goalMessages: Record<string, string> = {
      'weight-loss': 'Supports your weight loss goals',
      'muscle-gain': 'Great for building muscle',
      'performance': 'Boosts energy and performance',
      'general-health': 'Excellent for overall health'
    };

    if (goalMessages[primaryGoal]) {
      reasons.push(goalMessages[primaryGoal]);
    }

    // Health highlights
    if (menuItem.healthScore.overall >= 8) {
      reasons.push('High health score');
    }

    if (menuItem.specialNotes.superfoods.length > 0) {
      reasons.push(`Contains superfoods: ${menuItem.specialNotes.superfoods.slice(0, 2).join(', ')}`);
    }

    return reasons.slice(0, 2).join(' • ') || 'Matches your preferences';
  }

  // Get meal calorie range based on daily target
  getMealCalorieRange(dailyCalories: number, mealType: string): { min: number; max: number } {
    const distributions: Record<string, { min: number; max: number }> = {
      breakfast: { min: 0.20, max: 0.30 },
      lunch: { min: 0.30, max: 0.40 },
      dinner: { min: 0.30, max: 0.40 },
      snack: { min: 0.05, max: 0.15 }
    };

    const dist = distributions[mealType] || distributions.lunch;
    return {
      min: Math.round(dailyCalories * dist.min),
      max: Math.round(dailyCalories * dist.max)
    };
  }

  // Filter menu items by health criteria
  async filterMenuByHealth(
    restaurantId: string,
    filters: {
      dietType?: string;
      maxCalories?: number;
      minProtein?: number;
      glutenFree?: boolean;
      dairyFree?: boolean;
      nutFree?: boolean;
      healthScoreMin?: number;
    }
  ): Promise<any[]> {
    const query: any = { 
      restaurant: restaurantId,
      isAvailable: true 
    };

    if (filters.dietType) {
      query['healthTags.dietTypes'] = filters.dietType;
    }

    if (filters.maxCalories) {
      query['nutritionalInfo.calories'] = { $lte: filters.maxCalories };
    }

    if (filters.minProtein) {
      query['nutritionalInfo.protein'] = { $gte: filters.minProtein };
    }

    if (filters.glutenFree) {
      query['dietCompatibility.glutenFree'] = true;
    }

    if (filters.dairyFree) {
      query['dietCompatibility.dairyFree'] = true;
    }

    if (filters.nutFree) {
      query['dietCompatibility.nutFree'] = true;
    }

    if (filters.healthScoreMin) {
      query['healthScore.overall'] = { $gte: filters.healthScoreMin };
    }

    return await MenuItem.find(query)
      .populate('restaurant', 'name')
      .sort({ 'healthScore.overall': -1 });
  }

  // Track user's meal and update health stats
  async trackMeal(userId: string, orderId: string): Promise<void> {
    try {
      const order = await Order.findById(orderId).populate('items.menuItem');
      const healthProfile = await HealthProfile.findOne({ user: userId });

      if (!order || !healthProfile) return;

      // Calculate meal stats
      const totalCalories = order.items.reduce((sum: number, item: any) => 
        sum + (item.menuItem.nutritionalInfo.calories * item.quantity), 0
      );

      const avgHealthScore = order.items.reduce((sum: number, item: any) => 
        sum + item.menuItem.healthScore.overall, 0
      ) / order.items.length;

      // Check diet compliance
      const dietCompliant = order.items.every((item: any) => 
        item.menuItem.healthTags.dietTypes.includes(healthProfile.dietaryPreferences.primaryDiet) ||
        healthProfile.dietaryPreferences.primaryDiet === 'none'
      );

      // Update health tracking (ensure fields exist)
      if (!healthProfile.healthTracking.totalHealthyMeals) {
        healthProfile.healthTracking.totalHealthyMeals = 0;
      }
      if (!healthProfile.healthTracking.currentStreak) {
        healthProfile.healthTracking.currentStreak = 0;
      }

      healthProfile.healthTracking.totalHealthyMeals += avgHealthScore >= 7 ? 1 : 0;
      healthProfile.healthTracking.lastHealthyMeal = avgHealthScore >= 7 ? new Date() : healthProfile.healthTracking.lastHealthyMeal;

      // Update streak
      if (avgHealthScore >= 7) {
        healthProfile.healthTracking.currentStreak += 1;
      } else {
        healthProfile.healthTracking.currentStreak = 0;
      }

      // Update weekly stats
      const currentWeek = this.getWeekStart(new Date());
      let weeklyStats = healthProfile.healthTracking.weeklyStats?.find(
        week => week.week.getTime() === currentWeek.getTime()
      );

      if (!weeklyStats) {
        weeklyStats = {
          week: currentWeek,
          caloriesConsumed: 0,
          healthyMealsCount: 0,
          dietGoalCompliance: 0,
          averageRating: 0
        };
        healthProfile.healthTracking.weeklyStats = healthProfile.healthTracking.weeklyStats || [];
        healthProfile.healthTracking.weeklyStats.push(weeklyStats);
      }

      weeklyStats.caloriesConsumed += totalCalories;
      weeklyStats.healthyMealsCount += avgHealthScore >= 7 ? 1 : 0;
      weeklyStats.dietGoalCompliance = dietCompliant ? 
        (weeklyStats.dietGoalCompliance + 1) : weeklyStats.dietGoalCompliance;
      weeklyStats.averageRating = (weeklyStats.averageRating + avgHealthScore) / 2;

      await healthProfile.save();
    } catch (error) {
      console.error('Error tracking meal:', error);
    }
  }

  // Generate weekly health report
  async generateWeeklyReport(userId: string): Promise<any> {
    try {
      const healthProfile = await HealthProfile.findOne({ user: userId });
      const user = await User.findById(userId);

      if (!healthProfile || !user) return null;

      const lastWeek = this.getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const weeklyStats = healthProfile.healthTracking.weeklyStats?.find(
        week => week.week.getTime() === lastWeek.getTime()
      );

      if (!weeklyStats) return null;

      // Calculate insights
      const targetCalories = healthProfile.fitnessGoals.targetCalories || 2000;
      const avgDailyCalories = weeklyStats.caloriesConsumed / 7;
      const calorieGoalPercentage = (avgDailyCalories / targetCalories) * 100;

      const report = {
        user: {
          name: user.name,
          email: user.email
        },
        week: lastWeek,
        stats: weeklyStats,
        insights: {
          calorieGoalPercentage: Math.round(calorieGoalPercentage),
          healthScoreRating: this.getHealthScoreRating(weeklyStats.averageRating),
          streakStatus: healthProfile.healthTracking.currentStreak,
          achievements: this.getWeeklyAchievements(weeklyStats, healthProfile),
          recommendations: this.getWeeklyRecommendations(weeklyStats, healthProfile)
        },
        goals: {
          current: healthProfile.fitnessGoals.primaryGoal,
          targetCalories: targetCalories,
          progress: this.calculateGoalProgress(weeklyStats, healthProfile)
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return null;
    }
  }

  // Helper methods
  getWeekStart(date: Date): Date {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getHealthScoreRating(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    return 'Needs Improvement';
  }

  getWeeklyAchievements(weeklyStats: any, healthProfile: any): string[] {
    const achievements = [];
    
    if (weeklyStats.healthyMealsCount >= 5) {
      achievements.push('🏆 Healthy Choices Champion - 5+ healthy meals this week!');
    }
    
    if (healthProfile.healthTracking.currentStreak >= 7) {
      achievements.push('🔥 Week-long Streak - 7 days of healthy eating!');
    }
    
    if (weeklyStats.dietGoalCompliance >= 6) {
      achievements.push('🎯 Diet Goal Master - Stayed true to your diet plan!');
    }

    return achievements;
  }

  getWeeklyRecommendations(weeklyStats: any, healthProfile: any): string[] {
    const recommendations = [];
    
    if (weeklyStats.averageRating < 6) {
      recommendations.push('Try adding more vegetables and lean proteins to your meals');
    }
    
    if (weeklyStats.caloriesConsumed / 7 > (healthProfile.fitnessGoals.targetCalories || 2000) * 1.1) {
      recommendations.push('Consider smaller portions or lower-calorie alternatives');
    }
    
    if (weeklyStats.healthyMealsCount < 3) {
      recommendations.push('Aim for at least 3 healthy meals this week');
    }

    return recommendations;
  }

  calculateGoalProgress(weeklyStats: any, healthProfile: any): number {
    const goal = healthProfile.fitnessGoals.primaryGoal;
    
    switch (goal) {
      case 'weight-loss':
        return weeklyStats.averageRating >= 7 && 
               weeklyStats.caloriesConsumed / 7 <= (healthProfile.fitnessGoals.targetCalories || 2000) 
               ? 85 : 60;
      case 'muscle-gain':
        return weeklyStats.averageRating >= 6 ? 80 : 50;
      default:
        return weeklyStats.averageRating * 10;
    }
  }
}

export const healthService = new HealthService();