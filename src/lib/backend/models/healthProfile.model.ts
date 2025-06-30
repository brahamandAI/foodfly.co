import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthProfile extends Document {
  user: mongoose.Types.ObjectId;
  
  // Dietary Preferences
  dietaryPreferences: {
    primaryDiet: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'low-carb' | 'high-protein' | 'diabetic-friendly';
    secondaryPreferences: string[]; // ['gluten-free', 'dairy-free', 'organic', etc.]
    restrictions: string[];
  };

  // Allergies & Intolerances
  allergies: {
    severity: 'mild' | 'moderate' | 'severe';
    allergens: string[]; // ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', etc.]
  }[];

  // Fitness & Health Goals
  fitnessGoals: {
    primaryGoal: 'weight-loss' | 'weight-gain' | 'muscle-gain' | 'maintenance' | 'performance' | 'general-health';
    targetCalories?: number;
    targetProtein?: number; // grams
    targetCarbs?: number; // grams
    targetFat?: number; // grams
    activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active';
  };

  // Personal Info for Calculations
  personalInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    height?: number; // cm
    weight?: number; // kg
    targetWeight?: number; // kg
  };

  // Health Conditions
  healthConditions: {
    condition: string; // 'diabetes', 'hypertension', 'heart-disease', etc.
    severity: 'mild' | 'moderate' | 'severe';
    medications?: string[];
  }[];

  // Nutritional Preferences
  nutritionalPreferences: {
    maxSodium?: number; // mg per meal
    maxSugar?: number; // g per meal
    minFiber?: number; // g per meal
    preferLowGI?: boolean; // Low Glycemic Index
    preferOrganic?: boolean;
    preferLocallySourced?: boolean;
  };

  // Meal Timing Preferences
  mealPreferences: {
    breakfastTime?: string;
    lunchTime?: string;
    dinnerTime?: string;
    snackTimes?: string[];
    intermittentFasting?: {
      enabled: boolean;
      startTime?: string;
      endTime?: string;
      type?: '16:8' | '18:6' | '20:4' | 'custom';
    };
  };

  // Health Tracking Data
  healthTracking: {
    dailyCalorieGoal?: number;
    weeklyCalorieGoal?: number;
    currentStreak?: number; // days following healthy choices
    totalHealthyMeals?: number;
    lastHealthyMeal?: Date;
    
    // Weekly stats
    weeklyStats?: {
      week: Date;
      caloriesConsumed: number;
      healthyMealsCount: number;
      dietGoalCompliance: number; // percentage
      averageRating: number; // health rating of meals
    }[];
  };

  // Integration Settings
  integrations: {
    googleFit?: {
      enabled: boolean;
      accessToken?: string;
      lastSync?: Date;
    };
    appleHealth?: {
      enabled: boolean;
      accessToken?: string;
      lastSync?: Date;
    };
    myFitnessPal?: {
      enabled: boolean;
      username?: string;
      lastSync?: Date;
    };
  };

  // Notification Preferences
  notifications: {
    healthReminders: boolean;
    weeklyReports: boolean;
    mealSuggestions: boolean;
    goalProgress: boolean;
    emailReports: boolean;
    pushNotifications: boolean;
  };

  // Profile Status
  isActive: boolean;
  completionScore: number; // 0-100, how complete the profile is
  lastUpdated: Date;
  createdAt: Date;

  // Instance methods
  calculateDailyCalories(): number | null;
  getHealthScore(): number;
}

const healthProfileSchema = new Schema<IHealthProfile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  dietaryPreferences: {
    primaryDiet: {
      type: String,
      enum: ['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low-carb', 'high-protein', 'diabetic-friendly'],
      default: 'none',
    },
    secondaryPreferences: [{
      type: String,
      enum: ['gluten-free', 'dairy-free', 'nut-free', 'low-sodium', 'low-sugar', 'organic', 'locally-sourced', 'non-gmo'],
    }],
    restrictions: [String],
  },

  allergies: [{
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true,
    },
    allergens: [{
      type: String,
      enum: ['nuts', 'tree-nuts', 'peanuts', 'dairy', 'lactose', 'gluten', 'wheat', 'eggs', 'shellfish', 'fish', 'soy', 'sesame', 'mustard', 'celery'],
    }],
  }],

  fitnessGoals: {
    primaryGoal: {
      type: String,
      enum: ['weight-loss', 'weight-gain', 'muscle-gain', 'maintenance', 'performance', 'general-health'],
      required: true,
    },
    targetCalories: Number,
    targetProtein: Number,
    targetCarbs: Number,
    targetFat: Number,
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extremely-active'],
      default: 'moderately-active',
    },
  },

  personalInfo: {
    age: {
      type: Number,
      min: 13,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    height: {
      type: Number,
      min: 100,
      max: 250,
    },
    weight: {
      type: Number,
      min: 20,
      max: 500,
    },
    targetWeight: {
      type: Number,
      min: 20,
      max: 500,
    },
  },

  healthConditions: [{
    condition: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild',
    },
    medications: [String],
  }],

  nutritionalPreferences: {
    maxSodium: Number,
    maxSugar: Number,
    minFiber: Number,
    preferLowGI: {
      type: Boolean,
      default: false,
    },
    preferOrganic: {
      type: Boolean,
      default: false,
    },
    preferLocallySourced: {
      type: Boolean,
      default: false,
    },
  },

  mealPreferences: {
    breakfastTime: String,
    lunchTime: String,
    dinnerTime: String,
    snackTimes: [String],
    intermittentFasting: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: String,
      endTime: String,
      type: {
        type: String,
        enum: ['16:8', '18:6', '20:4', 'custom'],
      },
    },
  },

  healthTracking: {
    dailyCalorieGoal: Number,
    weeklyCalorieGoal: Number,
    currentStreak: {
      type: Number,
      default: 0,
    },
    totalHealthyMeals: {
      type: Number,
      default: 0,
    },
    lastHealthyMeal: Date,
    weeklyStats: [{
      week: Date,
      caloriesConsumed: Number,
      healthyMealsCount: Number,
      dietGoalCompliance: Number,
      averageRating: Number,
    }],
  },

  integrations: {
    googleFit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      accessToken: String,
      lastSync: Date,
    },
    appleHealth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      accessToken: String,
      lastSync: Date,
    },
    myFitnessPal: {
      enabled: {
        type: Boolean,
        default: false,
      },
      username: String,
      lastSync: Date,
    },
  },

  notifications: {
    healthReminders: {
      type: Boolean,
      default: true,
    },
    weeklyReports: {
      type: Boolean,
      default: true,
    },
    mealSuggestions: {
      type: Boolean,
      default: true,
    },
    goalProgress: {
      type: Boolean,
      default: true,
    },
    emailReports: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  completionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

// Indexes for efficient queries
healthProfileSchema.index({ user: 1 });
healthProfileSchema.index({ 'dietaryPreferences.primaryDiet': 1 });
healthProfileSchema.index({ 'fitnessGoals.primaryGoal': 1 });
healthProfileSchema.index({ isActive: 1 });

// Calculate completion score before saving
healthProfileSchema.pre('save', function(next) {
  let score = 0;
  
  // Basic info (30 points)
  if (this.dietaryPreferences.primaryDiet !== 'none') score += 10;
  if (this.fitnessGoals.primaryGoal) score += 10;
  if (this.personalInfo.age && this.personalInfo.gender) score += 10;
  
  // Detailed preferences (30 points)
  if (this.allergies.length > 0) score += 10;
  if (this.healthConditions.length > 0) score += 10;
  if (Object.keys(this.nutritionalPreferences).length > 0) score += 10;
  
  // Advanced settings (40 points)
  if (this.personalInfo.height && this.personalInfo.weight) score += 15;
  if (this.fitnessGoals.targetCalories) score += 10;
  if (this.mealPreferences.breakfastTime || this.mealPreferences.lunchTime) score += 10;
  if (this.integrations.googleFit?.enabled || this.integrations.appleHealth?.enabled) score += 5;
  
  this.completionScore = score;
  this.lastUpdated = new Date();
  next();
});

// Instance methods
healthProfileSchema.methods.calculateDailyCalories = function() {
  if (!this.personalInfo.age || !this.personalInfo.gender || !this.personalInfo.weight || !this.personalInfo.height) {
    return null;
  }

  // Harris-Benedict Formula
  let bmr;
  if (this.personalInfo.gender === 'male') {
    bmr = 88.362 + (13.397 * this.personalInfo.weight) + (4.799 * this.personalInfo.height) - (5.677 * this.personalInfo.age);
  } else {
    bmr = 447.593 + (9.247 * this.personalInfo.weight) + (3.098 * this.personalInfo.height) - (4.330 * this.personalInfo.age);
  }

  // Activity multipliers with proper typing
  const activityMultipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extremely-active': 1.9,
  };

  const activityLevel = this.fitnessGoals.activityLevel;
  const multiplier = activityMultipliers[activityLevel] || 1.55; // Default to moderately-active
  const tdee = bmr * multiplier;
  
  // Adjust based on goals
  switch (this.fitnessGoals.primaryGoal) {
    case 'weight-loss':
      return Math.round(tdee - 500); // 500 calorie deficit
    case 'weight-gain':
      return Math.round(tdee + 500); // 500 calorie surplus
    case 'muscle-gain':
      return Math.round(tdee + 300); // 300 calorie surplus
    default:
      return Math.round(tdee);
  }
};

healthProfileSchema.methods.getHealthScore = function() {
  // Calculate a health score based on recent meal choices
  if (!this.healthTracking.weeklyStats || this.healthTracking.weeklyStats.length === 0) {
    return 0;
  }

  const recentWeeks = this.healthTracking.weeklyStats.slice(-4); // Last 4 weeks
  const avgCompliance = recentWeeks.reduce((sum: number, week: any) => sum + week.dietGoalCompliance, 0) / recentWeeks.length;
  const avgRating = recentWeeks.reduce((sum: number, week: any) => sum + week.averageRating, 0) / recentWeeks.length;
  
  return Math.round((avgCompliance * 0.6 + avgRating * 0.4) * 100) / 100;
};

export const HealthProfile = mongoose.model<IHealthProfile>('HealthProfile', healthProfileSchema);