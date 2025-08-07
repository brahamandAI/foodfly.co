'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import PhotoUpload from '@/components/PhotoUpload';

interface DeliveryRegistrationData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  vehicleType: 'bike' | 'bicycle' | 'scooter' | 'robo' | '';
  vehicleNumber: string;
  currentZone: string;
  profilePhoto: string;
  govtIdType: 'aadhar' | 'pan' | 'driving_license' | 'other' | '';
  govtIdNumber: string;
}

export default function DeliveryRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeliveryRegistrationData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleNumber: '',
    currentZone: '',
    profilePhoto: '',
    govtIdType: '',
    govtIdNumber: ''
  });

  const [errors, setErrors] = useState<Partial<DeliveryRegistrationData>>({});

  const vehicleTypes = [
    { value: 'bike', label: '🏍️ Motorcycle/Bike', description: 'Fast delivery, longer range' },
    { value: 'scooter', label: '🛵 Scooter', description: 'Good for city delivery' },
    { value: 'bicycle', label: '🚲 Bicycle', description: 'Eco-friendly, good exercise' },
    { value: 'robo', label: '🤖 Robo Delivery', description: 'Automated delivery system' }
  ];

  const govtIdTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'other', label: 'Other ID' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof DeliveryRegistrationData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryRegistrationData> = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.currentZone.trim()) newErrors.currentZone = 'Current zone/area is required';

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Email validation (if provided)
    if (formData.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Vehicle number validation for motorized vehicles
    if (['bike', 'scooter', 'car'].includes(formData.vehicleType) && !formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required for this vehicle type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber || undefined,
        currentZone: formData.currentZone.trim(),
        profilePhoto: formData.profilePhoto || undefined,
        govtIdProof: formData.govtIdType && formData.govtIdNumber ? {
          type: formData.govtIdType,
          number: formData.govtIdNumber
        } : undefined
      };

      const response = await fetch('/api/auth/register-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and user data properly
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.removeItem('guest'); // Ensure no guest flag

      // Trigger storage events for real-time updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'isLoggedIn',
        newValue: 'true',
        oldValue: null
      }));

      // Trigger custom auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isLoggedIn: true, user: data.user }
      }));
      
      toast.success('Registration successful! Welcome to FoodFly Delivery!');
      router.push('/delivery');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-yellow-400">🍔 FoodFly</span>
            </Link>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/delivery/login" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                Already have an account? Sign In
              </Link>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6 text-black">
            <h1 className="text-3xl font-bold mb-2">🚚 Join FoodFly Delivery Team</h1>
            <p className="text-gray-900">
              Become a delivery partner and start earning with flexible hours!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.name ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.phone ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="+91 9876543210"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="currentZone" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Area/Zone *
                  </label>
                  <input
                    type="text"
                    id="currentZone"
                    name="currentZone"
                    value={formData.currentZone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.currentZone ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="e.g., Connaught Place, Delhi"
                  />
                  {errors.currentZone && <p className="mt-1 text-sm text-red-400">{errors.currentZone}</p>}
                </div>
              </div>
            </section>

            {/* Account Security */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                Account Security
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter a strong password"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>
            </section>

            {/* Vehicle Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                Vehicle Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Vehicle Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicleTypes.map((vehicle) => (
                      <label
                        key={vehicle.value}
                        className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-yellow-400/60 ${
                          formData.vehicleType === vehicle.value
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : 'border-gray-600 bg-black/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicleType"
                          value={vehicle.value}
                          checked={formData.vehicleType === vehicle.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="text-lg font-medium text-white">{vehicle.label}</span>
                        <span className="text-sm text-gray-400 mt-1">{vehicle.description}</span>
                        {formData.vehicleType === vehicle.value && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.vehicleType && <p className="mt-2 text-sm text-red-400">{errors.vehicleType}</p>}
                </div>

                {['bike', 'scooter', 'car'].includes(formData.vehicleType) && (
                  <div>
                    <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-300 mb-2">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      id="vehicleNumber"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-black/40 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400 ${
                        errors.vehicleNumber ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="e.g., DL01AB1234"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.vehicleNumber && <p className="mt-1 text-sm text-red-400">{errors.vehicleNumber}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* Optional Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  4
                </span>
                Additional Information (Optional)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="govtIdType" className="block text-sm font-medium text-gray-300 mb-2">
                    Government ID Type
                  </label>
                  <select
                    id="govtIdType"
                    name="govtIdType"
                    value={formData.govtIdType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white"
                  >
                    <option value="" className="bg-gray-800">Select ID type</option>
                    {govtIdTypes.map((idType) => (
                      <option key={idType.value} value={idType.value} className="bg-gray-800">
                        {idType.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.govtIdType && (
                  <div>
                    <label htmlFor="govtIdNumber" className="block text-sm font-medium text-gray-300 mb-2">
                      {govtIdTypes.find(t => t.value === formData.govtIdType)?.label} Number
                    </label>
                    <input
                      type="text"
                      id="govtIdNumber"
                      name="govtIdNumber"
                      value={formData.govtIdNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                      placeholder="Enter ID number"
                    />
                  </div>
                )}
              </div>

              {/* Profile Photo */}
              <div className="mt-6">
                <PhotoUpload
                  value={formData.profilePhoto}
                  onChange={(photoUrl) => {
                    setFormData(prev => ({ ...prev, profilePhoto: photoUrl }));
                  }}
                  label="Profile Photo (Optional)"
                />
              </div>
            </section>

            {/* Terms and Submit */}
            <section className="border-t border-gray-700 pt-6">
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-400 mb-2">📋 What happens next?</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your application will be reviewed within 24-48 hours</li>
                  <li>• You'll receive verification details via SMS/Email</li>
                  <li>• Complete profile verification to start earning</li>
                  <li>• Begin accepting delivery requests in your area</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  '🚀 Join FoodFly Delivery Team'
                )}
              </button>

              <p className="mt-4 text-center text-sm text-gray-400">
                By registering, you agree to FoodFly's{' '}
                <Link href="/terms" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </section>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 FoodFly. All rights reserved.</p>
            <p className="mt-1">Join thousands of delivery partners earning with us!</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 