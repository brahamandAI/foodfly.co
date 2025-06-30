import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients: string[];
  allergens?: string[];
  
  // Enhanced Nutritional Information
  nutritionalInfo: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    sugar?: number; // grams
    sodium?: number; // mg
    cholesterol?: number; // mg
    saturatedFat?: number; // grams
    transFat?: number; // grams
    vitaminC?: number; // mg
    iron?: number; // mg
    calcium?: number; // mg
  };

  // Health & Diet Classifications
  healthTags: {
    dietTypes: ('vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'low-carb' | 'high-protein' | 'diabetic-friendly')[];
    healthBenefits: ('heart-healthy' | 'brain-food' | 'immune-boost' | 'energy-boost' | 'muscle-building' | 'weight-loss' | 'anti-inflammatory')[];
    cookingMethods: ('grilled' | 'baked' | 'steamed' | 'fried' | 'raw' | 'boiled' | 'roasted')[];
    servingInfo: {
      portionSize: string; // "1 bowl", "2 pieces", etc.
      servingWeight?: number; // grams
    };
  };

  // Health Scoring
  healthScore: {
    overall: number; // 1-10 scale
    breakdown: {
      nutritionalDensity: number; // 1-10
      processingLevel: number; // 1-10 (10 = least processed)
      ingredientQuality: number; // 1-10
      allergenSafety: number; // 1-10
    };
    lastCalculated: Date;
  };

  // Diet Compatibility Flags
  dietCompatibility: {
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    eggFree: boolean;
    soyFree: boolean;
    lowSodium: boolean; // < 600mg
    lowSugar: boolean; // < 10g
    organic: boolean;
    locallySourced: boolean;
    nonGMO: boolean;
  };

  // Allergen Information (Enhanced)
  allergenInfo: {
    contains: string[];
    mayContain: string[];
    severity: 'low' | 'moderate' | 'high';
    crossContaminationRisk: boolean;
  };

  // Special Dietary Notes
  specialNotes: {
    pregnancySafe: boolean;
    diabeticFriendly: boolean;
    heartHealthy: boolean;
    kidneyFriendly: boolean;
    lowCholesterol: boolean;
    antiInflammatory: boolean;
    probiotics: boolean;
    superfoods: string[]; // list of superfood ingredients
  };

  customizationOptions?: {
    name: string;
    options: {
      name: string;
      price: number;
      healthImpact?: {
        calorieChange: number;
        healthScoreChange: number;
      };
    }[];
  }[];

  // AI Analysis Data
  aiAnalysis?: {
    descriptionProcessed: boolean;
    ingredientsAnalyzed: boolean;
    healthTagsGenerated: boolean;
    lastAnalyzed: Date;
    confidence: number; // 0-1
  };

  // Instance methods
  calculateHealthScore(): void;
  updateDietCompatibility(): void;
  isCompatibleWithProfile(healthProfile: any): boolean;
  getHealthMatchScore(healthProfile: any): number;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    ingredients: [{
      type: String,
      required: true,
    }],
    allergens: [{
      type: String,
    }],
    
    // Enhanced Nutritional Information
    nutritionalInfo: {
      calories: {
        type: Number,
        required: true,
        min: 0,
      },
      protein: {
        type: Number,
        required: true,
        min: 0,
      },
      carbs: {
        type: Number,
        required: true,
        min: 0,
      },
      fat: {
        type: Number,
        required: true,
        min: 0,
      },
      fiber: Number,
      sugar: Number,
      sodium: Number,
      cholesterol: Number,
      saturatedFat: Number,
      transFat: Number,
      vitaminC: Number,
      iron: Number,
      calcium: Number,
    },

    // Health & Diet Classifications
    healthTags: {
      dietTypes: [{
        type: String,
        enum: ['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low-carb', 'high-protein', 'diabetic-friendly'],
      }],
      healthBenefits: [{
        type: String,
        enum: ['heart-healthy', 'brain-food', 'immune-boost', 'energy-boost', 'muscle-building', 'weight-loss', 'anti-inflammatory'],
      }],
      cookingMethods: [{
        type: String,
        enum: ['grilled', 'baked', 'steamed', 'fried', 'raw', 'boiled', 'roasted'],
      }],
      servingInfo: {
        portionSize: String,
        servingWeight: Number,
      },
    },

    // Health Scoring
    healthScore: {
      overall: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
      },
      breakdown: {
        nutritionalDensity: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
        },
        processingLevel: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
        },
        ingredientQuality: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
        },
        allergenSafety: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
        },
      },
      lastCalculated: {
        type: Date,
        default: Date.now,
      },
    },

    // Diet Compatibility Flags
    dietCompatibility: {
      glutenFree: {
        type: Boolean,
        default: false,
      },
      dairyFree: {
        type: Boolean,
        default: false,
      },
      nutFree: {
        type: Boolean,
        default: false,
      },
      eggFree: {
        type: Boolean,
        default: false,
      },
      soyFree: {
        type: Boolean,
        default: false,
      },
      lowSodium: {
        type: Boolean,
        default: false,
      },
      lowSugar: {
        type: Boolean,
        default: false,
      },
      organic: {
        type: Boolean,
        default: false,
      },
      locallySourced: {
        type: Boolean,
        default: false,
      },
      nonGMO: {
        type: Boolean,
        default: false,
      },
    },

    // Enhanced Allergen Information
    allergenInfo: {
      contains: [String],
      mayContain: [String],
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high'],
        default: 'low',
      },
      crossContaminationRisk: {
        type: Boolean,
        default: false,
      },
    },

    // Special Dietary Notes
    specialNotes: {
      pregnancySafe: {
        type: Boolean,
        default: true,
      },
      diabeticFriendly: {
        type: Boolean,
        default: false,
      },
      heartHealthy: {
        type: Boolean,
        default: false,
      },
      kidneyFriendly: {
        type: Boolean,
        default: true,
      },
      lowCholesterol: {
        type: Boolean,
        default: false,
      },
      antiInflammatory: {
        type: Boolean,
        default: false,
      },
      probiotics: {
        type: Boolean,
        default: false,
      },
      superfoods: [String],
    },
    customizationOptions: [{
      name: String,
      options: [{
        name: String,
        price: Number,
        healthImpact: {
          calorieChange: Number,
          healthScoreChange: Number,
        },
      }],
    }],

    // AI Analysis Data
    aiAnalysis: {
      descriptionProcessed: {
        type: Boolean,
        default: false,
      },
      ingredientsAnalyzed: {
        type: Boolean,
        default: false,
      },
      healthTagsGenerated: {
        type: Boolean,
        default: false,
      },
      lastAnalyzed: Date,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient health-based queries
menuItemSchema.index({ 'healthTags.dietTypes': 1 });
menuItemSchema.index({ 'healthScore.overall': -1 });
menuItemSchema.index({ 'dietCompatibility.glutenFree': 1 });
menuItemSchema.index({ 'dietCompatibility.dairyFree': 1 });
menuItemSchema.index({ 'allergenInfo.contains': 1 });
menuItemSchema.index({ 'nutritionalInfo.calories': 1 });
menuItemSchema.index({ restaurant: 1, 'healthScore.overall': -1 });

// Calculate health score before saving
menuItemSchema.pre('save', function(next) {
  // Auto-calculate health score if not manually set
  if (!this.healthScore.lastCalculated || 
      new Date().getTime() - this.healthScore.lastCalculated.getTime() > 24 * 60 * 60 * 1000) {
    
    this.calculateHealthScore();
  }
  
  // Auto-determine diet compatibility flags
  this.updateDietCompatibility();
  
  next();
});

// Instance methods
menuItemSchema.methods.calculateHealthScore = function() {
  let nutritionalDensity = 5;
  let processingLevel = 5;
  let ingredientQuality = 5;
  let allergenSafety = 5;

  // Nutritional Density (based on nutrient content per calorie)
  if (this.nutritionalInfo.calories > 0) {
    const proteinRatio = (this.nutritionalInfo.protein * 4) / this.nutritionalInfo.calories;
    const fiberRatio = (this.nutritionalInfo.fiber || 0) / this.nutritionalInfo.calories * 1000;
    
    nutritionalDensity = Math.min(10, Math.max(1, 
      5 + proteinRatio * 10 + fiberRatio * 5
    ));
  }

  // Processing Level (based on cooking method and ingredients)
  const healthyCookingMethods = ['grilled', 'baked', 'steamed', 'raw', 'boiled'];
  const unhealthyCookingMethods = ['fried'];
  
  if (this.healthTags.cookingMethods.some((method: string) => healthyCookingMethods.includes(method))) {
    processingLevel += 2;
  }
  if (this.healthTags.cookingMethods.some((method: string) => unhealthyCookingMethods.includes(method))) {
    processingLevel -= 2;
  }

  // Ingredient Quality
  if (this.dietCompatibility.organic) ingredientQuality += 1;
  if (this.dietCompatibility.locallySourced) ingredientQuality += 1;
  if (this.dietCompatibility.nonGMO) ingredientQuality += 1;
  if (this.specialNotes.superfoods.length > 0) ingredientQuality += 2;

  // Allergen Safety
  allergenSafety = Math.max(1, 10 - this.allergenInfo.contains.length);
  if (this.allergenInfo.crossContaminationRisk) allergenSafety -= 2;

  // Normalize scores
  nutritionalDensity = Math.min(10, Math.max(1, nutritionalDensity));
  processingLevel = Math.min(10, Math.max(1, processingLevel));
  ingredientQuality = Math.min(10, Math.max(1, ingredientQuality));
  allergenSafety = Math.min(10, Math.max(1, allergenSafety));

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (nutritionalDensity * 0.4 + 
     processingLevel * 0.25 + 
     ingredientQuality * 0.2 + 
     allergenSafety * 0.15) * 10
  ) / 10;

  this.healthScore = {
    overall,
    breakdown: {
      nutritionalDensity,
      processingLevel,
      ingredientQuality,
      allergenSafety,
    },
    lastCalculated: new Date(),
  };
};

menuItemSchema.methods.updateDietCompatibility = function() {
  // Auto-detect diet compatibility based on ingredients and allergens
  const lowerIngredients = this.ingredients.map((ing: string) => ing.toLowerCase());
  const allergens = this.allergenInfo.contains.map((all: string) => all.toLowerCase());

  // Gluten-free check
  this.dietCompatibility.glutenFree = !allergens.includes('gluten') && 
    !allergens.includes('wheat') &&
    !lowerIngredients.some((ing: string) => ing.includes('wheat') || ing.includes('flour'));

  // Dairy-free check
  this.dietCompatibility.dairyFree = !allergens.includes('dairy') && 
    !allergens.includes('lactose') &&
    !lowerIngredients.some((ing: string) => 
      ing.includes('milk') || ing.includes('cheese') || 
      ing.includes('butter') || ing.includes('cream') || 
      ing.includes('yogurt')
    );

  // Nut-free check
  this.dietCompatibility.nutFree = !allergens.includes('nuts') && 
    !allergens.includes('tree-nuts') && 
    !allergens.includes('peanuts');

  // Low sodium check (< 600mg)
  this.dietCompatibility.lowSodium = (this.nutritionalInfo.sodium || 0) < 600;

  // Low sugar check (< 10g)
  this.dietCompatibility.lowSugar = (this.nutritionalInfo.sugar || 0) < 10;
};

menuItemSchema.methods.isCompatibleWithProfile = function(healthProfile: any) {
  // Check diet compatibility
  const primaryDiet = healthProfile.dietaryPreferences.primaryDiet;
  if (primaryDiet !== 'none' && !this.healthTags.dietTypes.includes(primaryDiet)) {
    return false;
  }

  // Check allergies
  for (const allergy of healthProfile.allergies) {
    if (allergy.severity === 'severe') {
      for (const allergen of allergy.allergens) {
        if (this.allergenInfo.contains.includes(allergen) || 
            this.allergenInfo.mayContain.includes(allergen)) {
          return false;
        }
      }
    }
  }

  // Check nutritional preferences
  const nutritionalPrefs = healthProfile.nutritionalPreferences;
  if (nutritionalPrefs.maxSodium && 
      (this.nutritionalInfo.sodium || 0) > nutritionalPrefs.maxSodium) {
    return false;
  }

  if (nutritionalPrefs.maxSugar && 
      (this.nutritionalInfo.sugar || 0) > nutritionalPrefs.maxSugar) {
    return false;
  }

  return true;
};

menuItemSchema.methods.getHealthMatchScore = function(healthProfile: any) {
  let score = 50; // Base score

  // Diet type match
  const primaryDiet = healthProfile.dietaryPreferences.primaryDiet;
  if (primaryDiet !== 'none' && this.healthTags.dietTypes.includes(primaryDiet)) {
    score += 20;
  }

  // Health goal alignment
  const primaryGoal = healthProfile.fitnessGoals.primaryGoal;
  const goalBenefitMap: { [key: string]: string } = {
    'weight-loss': 'weight-loss',
    'muscle-gain': 'muscle-building',
    'performance': 'energy-boost',
    'general-health': 'heart-healthy'
  };

  if (goalBenefitMap[primaryGoal] && 
      this.healthTags.healthBenefits.includes(goalBenefitMap[primaryGoal])) {
    score += 15;
  }

  // Calorie alignment
  if (healthProfile.fitnessGoals.targetCalories) {
    const calorieRatio = this.nutritionalInfo.calories / healthProfile.fitnessGoals.targetCalories;
    if (calorieRatio > 0.15 && calorieRatio < 0.4) { // Good portion for one meal
      score += 10;
    }
  }

  // Health score bonus
  score += this.healthScore.overall * 2;

  // Allergen penalty
  for (const allergy of healthProfile.allergies) {
    for (const allergen of allergy.allergens) {
      if (this.allergenInfo.contains.includes(allergen)) {
        score -= allergy.severity === 'severe' ? 50 : 
                 allergy.severity === 'moderate' ? 30 : 10;
      }
    }
  }

  return Math.max(0, Math.min(100, score));
};

export const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', menuItemSchema); 