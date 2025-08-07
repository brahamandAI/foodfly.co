'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Eye, EyeOff, ArrowLeft, Star, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChefRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: [] as string[],
    experience: '',
    priceRange: {
      min: '',
      max: '',
      currency: 'INR'
    },
    serviceAreas: [] as string[],
    description: '',
    signatureDishes: [] as string[]
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [clearedFields, setClearedFields] = useState<{[key: string]: boolean}>({});

  // Helper function to handle input changes and clear field errors
  const handleInputChange = (fieldName: string, value: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      // Mark field as cleared (for success indicator)
      setClearedFields(prev => ({ ...prev, [fieldName]: true }));
      
      // Remove cleared indicator after 3 seconds
      setTimeout(() => {
        setClearedFields(prev => {
          const newCleared = { ...prev };
          delete newCleared[fieldName];
          return newCleared;
        });
      }, 3000);
    }
    
    // Update form data
    if (fieldName.includes('.')) {
      const [parentKey, childKey] = fieldName.split('.');
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey as keyof typeof prev] as any,
          [childKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  const cuisineOptions = [
    'Indian', 'Chinese', 'Italian', 'Continental', 'Mexican', 'Thai', 
    'Japanese', 'Mediterranean', 'French', 'American', 'Fusion'
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik'
  ];

  const toggleSpecialization = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(cuisine)
        ? prev.specialization.filter(c => c !== cuisine)
        : [...prev.specialization, cuisine]
    }));
  };

  const toggleServiceArea = (city: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(city)
        ? prev.serviceAreas.filter(c => c !== city)
        : [...prev.serviceAreas, city]
    }));
  };

  const addSignatureDish = () => {
    setFormData(prev => ({
      ...prev,
      signatureDishes: [...prev.signatureDishes, '']
    }));
  };

  const updateSignatureDish = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      signatureDishes: prev.signatureDishes.map((dish, i) => 
        i === index ? value : dish
      )
    }));
  };

  const removeSignatureDish = (index: number) => {
    setFormData(prev => ({
      ...prev,
      signatureDishes: prev.signatureDishes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.specialization.length === 0) {
      toast.error('Please select at least one cuisine specialization');
      return;
    }

    if (formData.serviceAreas.length === 0) {
      toast.error('Please select at least one service area');
      return;
    }

    if (!formData.experience || parseInt(formData.experience) < 0) {
      toast.error('Please enter valid years of experience');
      return;
    }

    if (!formData.priceRange.min || !formData.priceRange.max) {
      toast.error('Please set your price range');
      return;
    }

    if (parseInt(formData.priceRange.min) >= parseInt(formData.priceRange.max)) {
      toast.error('Maximum price should be greater than minimum price');
      return;
    }

    setLoading(true);

    const registrationData = {
      ...formData,
      experience: parseInt(formData.experience),
      priceRange: {
        min: parseInt(formData.priceRange.min),
        max: parseInt(formData.priceRange.max),
        currency: formData.priceRange.currency
      },
      signatureDishes: formData.signatureDishes.filter(dish => dish.trim() !== '')
    };

    console.log('🍳 Sending chef registration data:', registrationData);

    try {
      const response = await fetch('/api/auth/chef-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chef registration successful:', data);
        
        // Clear any field errors on success
        setFieldErrors({});
        setClearedFields({});
        
        toast.success('Registration successful! Please login to continue.');
        
        // Redirect to chef login instead of auto-login
        setTimeout(() => {
          window.location.href = '/chef/login';
        }, 1000);
      } else {
        const error = await response.json();
        console.error('❌ Chef registration failed:', error);
        
        // Clear previous errors
        setFieldErrors({});
        
        // Handle specific field errors with role awareness
        if (error.field) {
          setFieldErrors({
            [error.field]: error.error
          });
          
          // Show toast with field-specific message
          toast.error(error.error);
          
          // Handle role-specific upgrade scenarios
          if (error.canUpgrade && error.existingRole) {
            setTimeout(() => {
              const shouldUpgrade = window.confirm(
                `You have a ${error.existingRole} account with this ${error.field}. Would you like to upgrade it to a chef account?`
              );
              
              if (shouldUpgrade) {
                handleUpgradeToChef();
              }
            }, 2000);
          }
          // Handle existing chef accounts
          else if (error.error.includes('Chef with this') && error.error.includes('already exists')) {
            setTimeout(() => {
              const shouldLogin = window.confirm(
                `You already have a chef account. Would you like to go to chef login instead?`
              );
              
              if (shouldLogin) {
                window.location.href = '/chef/login';
              }
            }, 2000);
          }
        } else {
          // General error
          toast.error(error.error || 'Chef registration failed');
        }
        
        // Show detailed error if available
        if (error.details) {
          console.error('Error details:', error.details);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setFieldErrors({}); // Clear field errors on network errors
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle upgrading existing user to chef
  const handleUpgradeToChef = async () => {
    setLoading(true);
    setFieldErrors({});

    const upgradeData = {
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      experience: formData.experience,
      priceRange: {
        min: parseInt(formData.priceRange.min),
        max: parseInt(formData.priceRange.max),
        currency: formData.priceRange.currency
      },
      serviceAreas: formData.serviceAreas,
      description: formData.description,
      signatureDishes: formData.signatureDishes.filter(dish => dish.trim() !== '')
    };

    console.log('🔄 Upgrading to chef:', upgradeData);

    try {
      const response = await fetch('/api/auth/upgrade-to-chef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upgradeData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upgrade to chef successful:', data);
        
        // Clear any field errors on success
        setFieldErrors({});
        setClearedFields({});
        
        toast.success('Successfully upgraded to chef account! Please login to continue.');
        
        // Redirect to chef login instead of auto-login
        setTimeout(() => {
          window.location.href = '/chef/login';
        }, 1000);
      } else {
        const error = await response.json();
        console.error('❌ Chef upgrade failed:', error);
        toast.error(error.error || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-900/90 shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/chef-services"
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chef Services</span>
            </Link>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-6 w-6 text-orange-500" />
              <Image
                src="/images/logo.png"
                alt="FoodFly"
                width={24}
                height={24}
                className="rounded"
              />
              <h1 className="text-xl font-bold text-white">Become a Chef Partner</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl p-8 border border-gray-700/50">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Join FoodFly as a Chef</h2>
            <p className="text-gray-300">Share your culinary skills and earn by cooking for special events</p>
            <div className="mt-4 px-4 py-2 bg-orange-900/30 border-l-4 border-orange-500 rounded-r-lg">
              <p className="text-sm text-orange-300 font-medium flex items-center">
                <span className="mr-2">👨‍🍳</span>
                CHEF REGISTRATION - This creates a chef-only account, separate from regular customers
              </p>
            </div>
          </div>

          {/* Error Banner for Duplicate Fields */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">Registration Error</h3>
                  <div className="mt-2 text-sm text-red-200">
                    {Object.entries(fieldErrors).map(([field, error]) => (
                      <p key={field} className="mt-1">
                        • <span className="font-medium capitalize">{field}</span>: {error}
                      </p>
                    ))}
                  </div>
                                      <div className="mt-3 text-xs text-red-300 space-y-1">
                      <p>💡 Tip: If you already have an account, try <a href="/chef/login" className="underline font-medium hover:text-red-200">logging in</a> instead.</p>
                      <p>🔄 Or <button 
                           onClick={handleUpgradeToChef} 
                           className="underline font-medium hover:text-red-200 bg-transparent border-none cursor-pointer p-0"
                         >
                           upgrade your existing account to chef
                         </button> right now!</p>
                    </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent bg-gray-800/70 text-white placeholder-gray-400 ${
                      fieldErrors.phone 
                        ? 'border-red-500 focus:ring-red-500' 
                        : clearedFields.phone
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-600 focus:ring-orange-500'
                    }`}
                    placeholder="Enter your phone number"
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.phone}
                    </p>
                  )}
                  {clearedFields.phone && !fieldErrors.phone && (
                    <p className="mt-1 text-sm text-green-400 flex items-center">
                      <span className="mr-1">✅</span>
                      Issue resolved! You can continue with registration.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-transparent bg-gray-800/70 text-white placeholder-gray-400 ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : clearedFields.email
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-600 focus:ring-orange-500'
                  }`}
                  placeholder="Enter your email address"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.email}
                  </p>
                )}
                {clearedFields.email && !fieldErrors.email && (
                  <p className="mt-1 text-sm text-green-400 flex items-center">
                    <span className="mr-1">✅</span>
                    Issue resolved! You can continue with registration.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 bg-gray-800/70 text-white placeholder-gray-400"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 bg-gray-800/70 text-white placeholder-gray-400"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Professional Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Years of Experience *</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  min="0"
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                  placeholder="Enter years of experience"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-semibold text-white mb-3">
                  Cuisine Specializations *
                  <span className="text-sm font-normal text-gray-300 block">Select the cuisines you specialize in</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  {cuisineOptions.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleSpecialization(cuisine)}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        formData.specialization.includes(cuisine)
                          ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500 hover:shadow-md hover:bg-gray-600'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
                {formData.specialization.length > 0 && (
                  <p className="text-sm text-green-400 font-medium">
                    ✓ {formData.specialization.length} cuisine{formData.specialization.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">About Yourself</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your cooking style, experience, and what makes you unique..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Signature Dishes</label>
                <div className="space-y-2">
                  {formData.signatureDishes.map((dish, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={dish}
                        onChange={(e) => updateSignatureDish(index, e.target.value)}
                        placeholder="Enter a signature dish"
                        className="flex-1 px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeSignatureDish(index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSignatureDish}
                    className="text-orange-400 hover:text-orange-300 text-sm"
                  >
                    + Add Signature Dish
                  </button>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-6 bg-gray-800/50 p-6 rounded-lg border-2 border-gray-600">
              <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2">Service Details</h3>
              
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-white mb-3">
                  Service Areas *
                  <span className="text-sm font-normal text-gray-300 block">Select cities where you provide chef services</span>
                </label>
                <div className="bg-gray-700/50 border-2 border-orange-500/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {indianCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleServiceArea(city)}
                        className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          formData.serviceAreas.includes(city)
                            ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500 hover:shadow-md hover:bg-gray-600'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  {formData.serviceAreas.length > 0 && (
                    <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400 font-medium">
                        ✓ {formData.serviceAreas.length} service area{formData.serviceAreas.length > 1 ? 's' : ''} selected:
                      </p>
                      <p className="text-sm text-green-300 mt-1">
                        {formData.serviceAreas.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Price Range (₹) *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={formData.priceRange.min}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, min: e.target.value }
                      }))}
                      placeholder="Minimum price"
                      min="1000"
                      step="500"
                      className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.priceRange.max}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, max: e.target.value }
                      }))}
                      placeholder="Maximum price"
                      min="1000"
                      step="500"
                      className="w-full px-3 py-2 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800/70 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1">Set your price range for event catering services</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 rounded-xl font-bold text-lg shadow-xl transition duration-200 transform hover:scale-105 ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                }`}
              >
                {loading ? 'Creating Account...' : 'Register as Chef'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-300">
                Already have an account?{' '}
                <Link href="/chef/login" className="text-orange-400 hover:text-orange-300 font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}