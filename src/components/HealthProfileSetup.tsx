'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface HealthProfile {
  dietaryPreferences: {
    primaryDiet: string;
    secondaryPreferences: string[];
    restrictions: string[];
  };
  allergies: {
    severity: 'mild' | 'moderate' | 'severe';
    allergens: string[];
  }[];
  fitnessGoals: {
    primaryGoal: string;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    activityLevel: string;
  };
  personalInfo: {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    targetWeight?: number;
  };
  nutritionalPreferences: {
    maxSodium?: number;
    maxSugar?: number;
    minFiber?: number;
    preferLowGI?: boolean;
    preferOrganic?: boolean;
    preferLocallySourced?: boolean;
  };
  notifications: {
    healthReminders: boolean;
    weeklyReports: boolean;
    mealSuggestions: boolean;
    goalProgress: boolean;
    emailReports: boolean;
  };
}

interface HealthProfileSetupProps {
  onSave?: (profile: HealthProfile) => void;
  onClose?: () => void;
  initialProfile?: Partial<HealthProfile>;
}

const HealthProfileSetup: React.FC<HealthProfileSetupProps> = ({
  onSave,
  onClose,
  initialProfile
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<HealthProfile>({
    dietaryPreferences: {
      primaryDiet: 'none',
      secondaryPreferences: [],
      restrictions: []
    },
    allergies: [],
    fitnessGoals: {
      primaryGoal: 'general-health',
      activityLevel: 'moderately-active'
    },
    personalInfo: {},
    nutritionalPreferences: {
      preferLowGI: false,
      preferOrganic: false,
      preferLocallySourced: false
    },
    notifications: {
      healthReminders: true,
      weeklyReports: true,
      mealSuggestions: true,
      goalProgress: true,
      emailReports: false
    }
  });

  const [newAllergy, setNewAllergy] = useState({
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    allergens: [] as string[]
  });

  const steps = [
    'Dietary Preferences',
    'Allergies & Restrictions',
    'Fitness Goals',
    'Personal Information',
    'Nutritional Preferences',
    'Notifications'
  ];

  const dietOptions = [
    { value: 'none', label: 'No specific diet', description: 'I eat everything' },
    { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, but dairy and eggs are okay' },
    { value: 'vegan', label: 'Vegan', description: 'Plant-based only' },
    { value: 'keto', label: 'Ketogenic', description: 'High fat, very low carb' },
    { value: 'paleo', label: 'Paleo', description: 'Whole foods, no processed items' },
    { value: 'mediterranean', label: 'Mediterranean', description: 'Fish, vegetables, olive oil focused' },
    { value: 'low-carb', label: 'Low Carb', description: 'Reduced carbohydrate intake' },
    { value: 'high-protein', label: 'High Protein', description: 'Protein-focused for fitness' },
    { value: 'diabetic-friendly', label: 'Diabetic Friendly', description: 'Blood sugar management' }
  ];

  const secondaryPreferences = [
    'gluten-free', 'dairy-free', 'nut-free', 'low-sodium', 'low-sugar', 
    'organic', 'locally-sourced', 'non-gmo'
  ];

  const allergenOptions = [
    'nuts', 'tree-nuts', 'peanuts', 'dairy', 'lactose', 'gluten', 'wheat',
    'eggs', 'shellfish', 'fish', 'soy', 'sesame', 'mustard', 'celery'
  ];

  const fitnessGoalOptions = [
    { value: 'weight-loss', label: 'Weight Loss', description: 'Reduce body weight healthily' },
    { value: 'weight-gain', label: 'Weight Gain', description: 'Increase body weight healthily' },
    { value: 'muscle-gain', label: 'Muscle Gain', description: 'Build lean muscle mass' },
    { value: 'maintenance', label: 'Maintenance', description: 'Maintain current weight' },
    { value: 'performance', label: 'Performance', description: 'Optimize athletic performance' },
    { value: 'general-health', label: 'General Health', description: 'Overall health and wellness' }
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'lightly-active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderately-active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very-active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: 'extremely-active', label: 'Extremely Active', description: 'Very hard exercise, physical job' }
  ];

  useEffect(() => {
    if (initialProfile) {
      setProfile(prev => ({ ...prev, ...initialProfile }));
    }
  }, [initialProfile]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/health/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to save health profile');
      }

      const data = await response.json();
      toast.success('Health profile saved successfully!');
      
      if (onSave) {
        onSave(profile);
      }
    } catch (error) {
      console.error('Error saving health profile:', error);
      toast.error('Failed to save health profile');
    }
  };

  const addAllergy = () => {
    if (newAllergy.allergens.length > 0) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy }]
      }));
      setNewAllergy({ severity: 'moderate', allergens: [] });
    }
  };

  const removeAllergy = (index: number) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const calculateBMR = () => {
    const { age, gender, height, weight } = profile.personalInfo;
    if (!age || !gender || !height || !weight) return 0;

    // Harris-Benedict Formula
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extremely-active': 1.9
    };

    const tdee = bmr * activityMultipliers[profile.fitnessGoals.activityLevel as keyof typeof activityMultipliers];
    
    // Adjust based on goals
    switch (profile.fitnessGoals.primaryGoal) {
      case 'weight-loss':
        return Math.round(tdee - 500);
      case 'weight-gain':
        return Math.round(tdee + 500);
      case 'muscle-gain':
        return Math.round(tdee + 300);
      default:
        return Math.round(tdee);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Dietary Preferences
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">What's your primary diet?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dietOptions.map((diet) => (
                  <div
                    key={diet.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      profile.dietaryPreferences.primaryDiet === diet.value
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      dietaryPreferences: {
                        ...prev.dietaryPreferences,
                        primaryDiet: diet.value
                      }
                    }))}
                  >
                    <h4 className="font-semibold text-white">{diet.label}</h4>
                    <p className="text-sm text-gray-400 mt-1">{diet.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Additional preferences (optional)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {secondaryPreferences.map((pref) => (
                  <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.dietaryPreferences.secondaryPreferences.includes(pref)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProfile(prev => ({
                          ...prev,
                          dietaryPreferences: {
                            ...prev.dietaryPreferences,
                            secondaryPreferences: checked
                              ? [...prev.dietaryPreferences.secondaryPreferences, pref]
                              : prev.dietaryPreferences.secondaryPreferences.filter(p => p !== pref)
                          }
                        }));
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300 capitalize">{pref.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Allergies & Restrictions
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Food Allergies & Intolerances</h3>
              
              {/* Current Allergies */}
              {profile.allergies.length > 0 && (
                <div className="mb-6 space-y-3">
                  {profile.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            allergy.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                            allergy.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {allergy.severity}
                          </span>
                        </div>
                        <span className="text-white">{allergy.allergens.join(', ')}</span>
                      </div>
                      <button
                        onClick={() => removeAllergy(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Allergy */}
              <div className="p-4 bg-gray-800 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
                  <select
                    value={newAllergy.severity}
                    onChange={(e) => setNewAllergy(prev => ({ ...prev, severity: e.target.value as 'mild' | 'moderate' | 'severe' }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="mild">Mild (discomfort)</option>
                    <option value="moderate">Moderate (avoid when possible)</option>
                    <option value="severe">Severe (life-threatening)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Allergens</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {allergenOptions.map((allergen) => (
                      <label key={allergen} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAllergy.allergens.includes(allergen)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNewAllergy(prev => ({
                              ...prev,
                              allergens: checked
                                ? [...prev.allergens, allergen]
                                : prev.allergens.filter(a => a !== allergen)
                            }));
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-xs text-gray-300 capitalize">{allergen.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={addAllergy}
                  disabled={newAllergy.allergens.length === 0}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Allergy
                </button>
              </div>
            </div>
          </div>
        );

      case 2: // Fitness Goals
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">What's your primary fitness goal?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fitnessGoalOptions.map((goal) => (
                  <div
                    key={goal.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      profile.fitnessGoals.primaryGoal === goal.value
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      fitnessGoals: {
                        ...prev.fitnessGoals,
                        primaryGoal: goal.value
                      }
                    }))}
                  >
                    <h4 className="font-semibold text-white">{goal.label}</h4>
                    <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Activity Level</h3>
              <div className="space-y-3">
                {activityLevels.map((level) => (
                  <div
                    key={level.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.fitnessGoals.activityLevel === level.value
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      fitnessGoals: {
                        ...prev.fitnessGoals,
                        activityLevel: level.value
                      }
                    }))}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{level.label}</h4>
                        <p className="text-sm text-gray-400">{level.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Personal Information
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information (for calorie calculations)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={profile.personalInfo.age || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      age: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <select
                  value={profile.personalInfo.gender || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      gender: e.target.value || undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={profile.personalInfo.height || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      height: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="170"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Weight (kg)</label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={profile.personalInfo.weight || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      weight: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="70"
                />
              </div>

              {(profile.fitnessGoals.primaryGoal === 'weight-loss' || profile.fitnessGoals.primaryGoal === 'weight-gain') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Weight (kg)</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={profile.personalInfo.targetWeight || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        targetWeight: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                    placeholder="65"
                  />
                </div>
              )}
            </div>

            {calculateBMR() > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Calculated Daily Calorie Goal</h4>
                <p className="text-2xl font-bold text-orange-500">{calculateBMR()} calories</p>
                <p className="text-sm text-gray-400 mt-1">
                  Based on your {profile.fitnessGoals.primaryGoal.replace('-', ' ')} goal and {profile.fitnessGoals.activityLevel.replace('-', ' ')} activity level
                </p>
              </div>
            )}
          </div>
        );

      case 4: // Nutritional Preferences
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Nutritional Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Sodium per meal (mg)</label>
                <input
                  type="number"
                  min="0"
                  value={profile.nutritionalPreferences.maxSodium || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      maxSodium: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Sugar per meal (g)</label>
                <input
                  type="number"
                  min="0"
                  value={profile.nutritionalPreferences.maxSugar || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      maxSugar: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Fiber per meal (g)</label>
                <input
                  type="number"
                  min="0"
                  value={profile.nutritionalPreferences.minFiber || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      minFiber: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.nutritionalPreferences.preferLowGI || false}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      preferLowGI: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-white">Prefer Low Glycemic Index foods</span>
                  <p className="text-sm text-gray-400">Better for blood sugar control</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.nutritionalPreferences.preferOrganic || false}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      preferOrganic: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-white">Prefer Organic foods</span>
                  <p className="text-sm text-gray-400">When available</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.nutritionalPreferences.preferLocallySourced || false}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    nutritionalPreferences: {
                      ...prev.nutritionalPreferences,
                      preferLocallySourced: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-white">Prefer Locally Sourced foods</span>
                  <p className="text-sm text-gray-400">Support local businesses</p>
                </div>
              </label>
            </div>
          </div>
        );

      case 5: // Notifications
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
            
            <div className="space-y-4">
              {[
                { key: 'healthReminders', label: 'Health Reminders', desc: 'Tips and reminders for healthy eating' },
                { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of your health progress' },
                { key: 'mealSuggestions', label: 'Meal Suggestions', desc: 'Personalized food recommendations' },
                { key: 'goalProgress', label: 'Goal Progress', desc: 'Updates on your fitness goal progress' },
                { key: 'emailReports', label: 'Email Reports', desc: 'Receive reports via email' }
              ].map((notification) => (
                <label key={notification.key} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={profile.notifications[notification.key as keyof typeof profile.notifications]}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [notification.key]: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-white font-medium">{notification.label}</span>
                    <p className="text-sm text-gray-400">{notification.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Health Profile Setup</h2>
              <p className="text-gray-400 mt-1">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full ${
                    index <= currentStep ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Save Profile
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthProfileSetup;