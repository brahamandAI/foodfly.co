'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  DollarSign, 
  ChefHat,
  Check,
  ArrowLeft,
  Star,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface EventDetails {
  type: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  guestCount: number;
  cuisine: string[];
  specialRequests: string;
  dietaryRestrictions: string[];
  customMenu: {
    isCustom: boolean;
    appetizers: string[];
    mainCourses: string[];
    desserts: string[];
    beverages: string[];
    additionalRequests: string;
  };
}

interface LocationDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  venue_type: string;
}

interface BudgetDetails {
  min: number;
  max: number;
  isFlexible: boolean;
}

export default function BookChefPage() {
  const searchParams = useSearchParams();
  const preferredChefId = searchParams?.get('chef');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedChef, setSelectedChef] = useState<any>(null);
  
  // Form data
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    type: '',
    title: '',
    description: '',
    date: '',
    duration: 4,
    guestCount: 10,
    cuisine: [],
    specialRequests: '',
    dietaryRestrictions: [],
    customMenu: {
      isCustom: false,
      appetizers: [],
      mainCourses: [],
      desserts: [],
      beverages: [],
      additionalRequests: ''
    }
  });

  const [locationDetails, setLocationDetails] = useState<LocationDetails>({
    address: '',
    city: '',
    state: '',
    pincode: '',
    venue_type: 'home'
  });

  const [budgetDetails, setBudgetDetails] = useState<BudgetDetails>({
    min: 5000,
    max: 15000,
    isFlexible: false
  });

  const eventTypes = [
    { value: 'birthday', label: 'Birthday Party', icon: '🎂' },
    { value: 'anniversary', label: 'Anniversary', icon: '💕' },
    { value: 'wedding', label: 'Wedding', icon: '💒' },
    { value: 'corporate', label: 'Corporate Event', icon: '💼' },
    { value: 'family_gathering', label: 'Family Gathering', icon: '👨‍👩‍👧‍👦' },
    { value: 'other', label: 'Other', icon: '🎉' }
  ];

  const cuisineOptions = [
    'Indian', 'Chinese', 'Italian', 'Continental', 'Mexican', 'Thai', 
    'Japanese', 'Mediterranean', 'French', 'American', 'Fusion'
  ];

  const venueTypes = [
    { value: 'home', label: 'Home' },
    { value: 'outdoor', label: 'Outdoor Venue' },
    { value: 'banquet_hall', label: 'Banquet Hall' },
    { value: 'office', label: 'Office' },
    { value: 'other', label: 'Other' }
  ];

  const eventTypeMapping = {
    'birthday': 'private_dining',
    'anniversary': 'private_dining', 
    'wedding': 'catering',
    'corporate': 'catering',
    'family_gathering': 'private_dining',
    'other': 'private_dining'
  };

  useEffect(() => {
    if (preferredChefId) {
      loadChefDetails(preferredChefId);
    }
  }, [preferredChefId]);

  const loadChefDetails = async (chefId: string) => {
    try {
      const response = await fetch('/api/chef-services/chefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chefId })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedChef(data.chef);
      }
    } catch (error) {
      console.error('Error loading chef details:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to book a chef');
        return;
      }

      // Check if user has phone number in profile
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (!user.phone) {
            toast.error('Please update your profile with a phone number before booking a chef');
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      // Validate required fields before sending
      const chefId = preferredChefId || selectedChef?._id;
      if (!chefId) {
        toast.error('Please select a chef to book');
        return;
      }

      // Check if selected chef has required details
      if (selectedChef && !selectedChef.phone) {
        toast.error('Selected chef does not have a phone number. Please choose another chef or contact support.');
        return;
      }

      if (!eventDetails.type) {
        toast.error('Please select an event type');
        return;
      }

      if (!eventDetails.date) {
        toast.error('Please select event date and time');
        return;
      }

      // Check if date is in the past
      const selectedDate = new Date(eventDetails.date);
      const now = new Date();
      if (selectedDate <= now) {
        toast.error('Please select a future date and time for your event');
        return;
      }

      if (eventDetails.cuisine.length === 0) {
        toast.error('Please select at least one cuisine');
        return;
      }

      // Validate duration and guest count
      if (eventDetails.duration < 1 || eventDetails.duration > 24) {
        toast.error('Duration must be between 1 and 24 hours');
        return;
      }

      if (eventDetails.guestCount < 1 || eventDetails.guestCount > 200) {
        toast.error('Guest count must be between 1 and 200');
        return;
      }

      if (!locationDetails.address || !locationDetails.city || !locationDetails.state || !locationDetails.pincode) {
        toast.error('Please fill in complete location details');
        return;
      }

      // Extract date and time from datetime-local input
      const eventDateTime = new Date(eventDetails.date);
      const eventDateOnly = eventDateTime.toISOString().split('T')[0];
      // Ensure time is in 24-hour format (HH:MM)
      const eventTimeOnly = eventDateTime.toTimeString().slice(0, 5);

      console.log('Date parsing:', {
        original: eventDetails.date,
        parsed: eventDateTime,
        dateOnly: eventDateOnly,
        timeOnly: eventTimeOnly
      });

      const bookingData = {
        chefId,
        eventType: eventTypeMapping[eventDetails.type as keyof typeof eventTypeMapping] || 'private_dining',
        eventDate: eventDateOnly,
        eventTime: eventTimeOnly,
        duration: eventDetails.duration,
        guestCount: eventDetails.guestCount,
        cuisine: eventDetails.cuisine,
        venue: {
          type: locationDetails.venue_type === 'home' ? 'customer_home' : 'external_venue',
          address: {
            street: locationDetails.address,
            city: locationDetails.city,
            state: locationDetails.state,
            zipCode: locationDetails.pincode
          }
        },
        specialRequests: eventDetails.specialRequests || '',
        dietaryRestrictions: (eventDetails.dietaryRestrictions || []).map(restriction => restriction.toLowerCase()),
        customMenu: eventDetails.customMenu.isCustom ? eventDetails.customMenu : undefined,
        paymentMethod: 'cod'
      };

      console.log('Sending booking request with data:', JSON.stringify(bookingData, null, 2));

      const response = await fetch('/api/chef-services/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Booking successful:', result);
        toast.success('Chef booking request sent successfully!');
        setStep(5); // Success step
      } else {
        const error = await response.json();
        console.error('Booking failed:', error);
        console.error('Response status:', response.status);
        console.error('Error details:', error);
        toast.error(error.error || 'Failed to book chef');
      }
    } catch (error) {
      console.error('Error booking chef:', error);
      toast.error('Failed to book chef');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleCuisine = (cuisine: string) => {
    setEventDetails(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine]
    }));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setEventDetails(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return eventDetails.type && eventDetails.title && eventDetails.description && 
               eventDetails.date && eventDetails.cuisine.length > 0;
      case 2:
        return locationDetails.address && locationDetails.city && 
               locationDetails.state && locationDetails.pincode;
      case 3:
        return budgetDetails.min > 0 && budgetDetails.max > budgetDetails.min;
      case 4:
        const chefId = preferredChefId || selectedChef?._id;
        return chefId && eventDetails.type && eventDetails.date && 
               eventDetails.cuisine.length > 0 && locationDetails.address &&
               locationDetails.city && locationDetails.state && locationDetails.pincode;
      default:
        return true;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-2">
                <ChefHat className="h-6 w-6 text-orange-500" />
                <Image
                  src="/images/logo.png"
                  alt="FoodFly"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <h1 className="text-xl font-bold text-gray-900">Book a Chef</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {step !== 5 && (
          <div className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
                    </div>
                    {stepNumber < 4 && (
                      <div className={`w-16 h-1 mx-2 ${
                        step > stepNumber ? 'bg-orange-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Event Details</span>
                <span>Location</span>
                <span>Budget</span>
                <span>Review</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Selected Chef Display */}
          {selectedChef && step !== 5 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Chef</h2>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedChef.profilePhoto ? (
                    <Image
                      src={selectedChef.profilePhoto}
                      alt={selectedChef.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <ChefHat className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedChef.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{selectedChef.chefProfile.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{selectedChef.chefProfile.experience} years experience</span>
                    <span>•</span>
                    <span>₹{selectedChef.chefProfile.priceRange.min.toLocaleString()} - ₹{selectedChef.chefProfile.priceRange.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
              
              <div className="space-y-6">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Event Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setEventDetails(prev => ({ ...prev, type: type.value }))}
                        className={`p-4 border rounded-lg text-left hover:border-orange-500 ${
                          eventDetails.type === type.value 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={eventDetails.title}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., John's 30th Birthday Party"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                {/* Event Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                  <textarea
                    value={eventDetails.description}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your event, any special requirements, theme, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                {/* Date, Duration, Guest Count */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                    <input
                      type="datetime-local"
                      value={eventDetails.date}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                    <input
                      type="number"
                      value={eventDetails.duration}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="1"
                      max="24"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Count</label>
                    <input
                      type="number"
                      value={eventDetails.guestCount}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Cuisine Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Cuisines</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <button
                        key={cuisine}
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3 py-2 border rounded-lg text-sm font-semibold transition-all ${
                          eventDetails.cuisine.includes(cuisine)
                            ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    value={eventDetails.specialRequests}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any specific dishes, presentation style, or special requirements..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Dietary Restrictions (Optional)
                    <span className="text-sm font-normal text-gray-600 block">Select any dietary requirements for your event</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                    {[
                      { label: 'Vegetarian', value: 'vegetarian' },
                      { label: 'Vegan', value: 'vegan' },
                      { label: 'Gluten-Free', value: 'gluten-free' },
                      { label: 'Dairy-Free', value: 'dairy-free' },
                      { label: 'Nut-Free', value: 'nut-free' },
                      { label: 'Halal', value: 'halal' },
                      { label: 'Kosher', value: 'kosher' },
                      { label: 'Keto', value: 'keto' }
                    ].map((restriction) => (
                      <button
                        key={restriction.value}
                        type="button"
                        onClick={() => toggleDietaryRestriction(restriction.value)}
                        className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          eventDetails.dietaryRestrictions.includes(restriction.value)
                            ? 'border-green-500 bg-green-500 text-white shadow-lg scale-105'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:shadow-md'
                        }`}
                      >
                        {restriction.label}
                      </button>
                    ))}
                  </div>
                  {eventDetails.dietaryRestrictions.length > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {eventDetails.dietaryRestrictions.length} restriction{eventDetails.dietaryRestrictions.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Menu Customization */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="customMenu"
                      checked={eventDetails.customMenu.isCustom}
                      onChange={(e) => setEventDetails(prev => ({
                        ...prev,
                        customMenu: { ...prev.customMenu, isCustom: e.target.checked }
                      }))}
                      className="h-5 w-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="customMenu" className="text-lg font-semibold text-gray-900">
                      🍽️ Customize Your Menu
                    </label>
                  </div>
                  
                  {eventDetails.customMenu.isCustom && (
                    <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-4">
                      <p className="text-sm text-orange-700 font-medium mb-4">
                        Work with your chef to create a personalized menu for your event
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Appetizers */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Appetizers</label>
                          <textarea
                            value={eventDetails.customMenu.appetizers.join(', ')}
                            onChange={(e) => setEventDetails(prev => ({
                              ...prev,
                              customMenu: {
                                ...prev.customMenu,
                                appetizers: e.target.value.split(', ').filter(item => item.trim())
                              }
                            }))}
                            placeholder="e.g., Bruschetta, Spring Rolls, Cheese Platter"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>

                        {/* Main Courses */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Main Courses</label>
                          <textarea
                            value={eventDetails.customMenu.mainCourses.join(', ')}
                            onChange={(e) => setEventDetails(prev => ({
                              ...prev,
                              customMenu: {
                                ...prev.customMenu,
                                mainCourses: e.target.value.split(', ').filter(item => item.trim())
                              }
                            }))}
                            placeholder="e.g., Grilled Salmon, Chicken Tikka, Pasta Primavera"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>

                        {/* Desserts */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Desserts</label>
                          <textarea
                            value={eventDetails.customMenu.desserts.join(', ')}
                            onChange={(e) => setEventDetails(prev => ({
                              ...prev,
                              customMenu: {
                                ...prev.customMenu,
                                desserts: e.target.value.split(', ').filter(item => item.trim())
                              }
                            }))}
                            placeholder="e.g., Chocolate Cake, Tiramisu, Fresh Fruit"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>

                        {/* Beverages */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Beverages</label>
                          <textarea
                            value={eventDetails.customMenu.beverages.join(', ')}
                            onChange={(e) => setEventDetails(prev => ({
                              ...prev,
                              customMenu: {
                                ...prev.customMenu,
                                beverages: e.target.value.split(', ').filter(item => item.trim())
                              }
                            }))}
                            placeholder="e.g., Fresh Juices, Wine, Cocktails, Tea/Coffee"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Additional Menu Requests */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Menu Requests</label>
                        <textarea
                          value={eventDetails.customMenu.additionalRequests}
                          onChange={(e) => setEventDetails(prev => ({
                            ...prev,
                            customMenu: { ...prev.customMenu, additionalRequests: e.target.value }
                          }))}
                          placeholder="Any specific cooking methods, presentation styles, or special menu requirements..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location Details */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Location</h2>
              
              <div className="space-y-6">
                {/* Venue Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Venue Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {venueTypes.map((venue) => (
                      <button
                        key={venue.value}
                        onClick={() => setLocationDetails(prev => ({ ...prev, venue_type: venue.value }))}
                        className={`p-4 border rounded-lg text-center ${
                          locationDetails.venue_type === venue.value 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-300 hover:border-orange-500'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">{venue.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                  <textarea
                    value={locationDetails.address}
                    onChange={(e) => setLocationDetails(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter complete address including building name, street, landmark"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={locationDetails.city}
                      onChange={(e) => setLocationDetails(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={locationDetails.state}
                      onChange={(e) => setLocationDetails(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={locationDetails.pincode}
                      onChange={(e) => setLocationDetails(prev => ({ ...prev, pincode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget Range</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Budget (₹)</label>
                    <input
                      type="number"
                      value={budgetDetails.min}
                      onChange={(e) => setBudgetDetails(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                      min="1000"
                      step="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Budget (₹)</label>
                    <input
                      type="number"
                      value={budgetDetails.max}
                      onChange={(e) => setBudgetDetails(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                      min="1000"
                      step="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="flexible"
                    checked={budgetDetails.isFlexible}
                    onChange={(e) => setBudgetDetails(prev => ({ ...prev, isFlexible: e.target.checked }))}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="flexible" className="text-sm text-gray-600">
                    My budget is flexible for the right chef
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">What's included in the price?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Chef's cooking services</li>
                    <li>• Menu planning and preparation</li>
                    <li>• Serving and presentation</li>
                    <li>• Basic cleanup</li>
                    <li>• Ingredients and groceries (may vary by chef)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Request</h2>
                <p className="text-gray-600">Please review all details before submitting your chef booking request</p>
              </div>
              
              <div className="space-y-6">
                {/* Event Summary */}
                <div className="border border-orange-200 rounded-lg p-6 bg-gradient-to-r from-orange-50 to-red-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 text-orange-500 mr-2" />
                    Event Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Event:</span>
                      <span className="ml-2 font-bold text-gray-900">{eventDetails.title}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Type:</span>
                      <span className="ml-2 font-bold text-gray-900">{eventTypes.find(t => t.value === eventDetails.type)?.label}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Date:</span>
                      <span className="ml-2 font-bold text-gray-900">{new Date(eventDetails.date).toLocaleString()}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Duration:</span>
                      <span className="ml-2 font-bold text-gray-900">{eventDetails.duration} hours</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Guests:</span>
                      <span className="ml-2 font-bold text-gray-900">{eventDetails.guestCount} people</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Cuisines:</span>
                      <span className="ml-2 font-bold text-orange-600">{eventDetails.cuisine.join(', ')}</span>
                    </div>
                  </div>
                  {eventDetails.description && (
                    <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                      <span className="text-gray-700 font-semibold">Description:</span>
                      <p className="mt-2 text-gray-900 font-medium">{eventDetails.description}</p>
                    </div>
                  )}
                  {eventDetails.customMenu.isCustom && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                      <span className="text-gray-700 font-semibold flex items-center">
                        🍽️ Custom Menu Requested
                      </span>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {eventDetails.customMenu.appetizers.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-700">Appetizers:</span>
                            <p className="text-gray-700">{eventDetails.customMenu.appetizers.join(', ')}</p>
                          </div>
                        )}
                        {eventDetails.customMenu.mainCourses.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-700">Main Courses:</span>
                            <p className="text-gray-700">{eventDetails.customMenu.mainCourses.join(', ')}</p>
                          </div>
                        )}
                        {eventDetails.customMenu.desserts.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-700">Desserts:</span>
                            <p className="text-gray-700">{eventDetails.customMenu.desserts.join(', ')}</p>
                          </div>
                        )}
                        {eventDetails.customMenu.beverages.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-700">Beverages:</span>
                            <p className="text-gray-700">{eventDetails.customMenu.beverages.join(', ')}</p>
                          </div>
                        )}
                      </div>
                      {eventDetails.customMenu.additionalRequests && (
                        <div className="mt-3">
                          <span className="font-medium text-orange-700">Additional Requests:</span>
                          <p className="text-gray-700 text-sm">{eventDetails.customMenu.additionalRequests}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Location Summary */}
                <div className="border border-blue-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                    Location
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Venue Type:</span>
                      <span className="ml-2 font-bold text-gray-900">{venueTypes.find(v => v.value === locationDetails.venue_type)?.label}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-gray-700 font-semibold">Address:</span>
                      <p className="mt-1 font-bold text-gray-900">{locationDetails.address}, {locationDetails.city}, {locationDetails.state} - {locationDetails.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="border border-green-200 rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                    Budget
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700 font-semibold">Range:</span>
                      <span className="font-bold text-2xl text-green-600">₹{budgetDetails.min.toLocaleString()} - ₹{budgetDetails.max.toLocaleString()}</span>
                      {budgetDetails.isFlexible && (
                        <span className="text-orange-600 text-sm bg-orange-100 px-3 py-1 rounded-full font-semibold">Flexible</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 5 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Sent Successfully!</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your chef booking request has been sent. You'll receive a notification once a chef accepts your request.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="bg-orange-500 text-white py-2 px-6 rounded-lg hover:bg-orange-600 transition duration-200"
                >
                  View My Requests
                </button>
                <button
                  onClick={() => window.location.href = '/chef-services'}
                  className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Book Another Chef
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== 5 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={`px-6 py-2 rounded-lg border ${
                  step === 1 
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className={`px-6 py-2 rounded-lg ${
                    isStepValid()
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  className={`px-6 py-2 rounded-lg ${
                    loading || !isStepValid()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {loading ? 'Sending Request...' : 'Send Request'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}