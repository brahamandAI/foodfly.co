'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, MapIcon, Loader2, X, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Address {
  _id?: string;
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Address) => void;
}

export default function LocationSelector({ isOpen, onClose, onLocationSelect }: LocationSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [formData, setFormData] = useState<Address>({
    label: 'Home',
    name: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  useEffect(() => {
    if (isOpen) {
      loadSavedAddresses();
    }
  }, [isOpen]);

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Try to fetch from database first
        try {
          const response = await fetch('/api/users/addresses', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const serverAddresses = data.addresses || [];
            
            // Update localStorage with fresh data from server
            const { userStorage } = await import('@/lib/api');
            userStorage.setUserAddresses(serverAddresses);
            
            setAddresses(serverAddresses);
            return;
          }
        } catch (fetchError) {
          console.log('Failed to fetch addresses from server, using localStorage:', fetchError);
        }
      }
      
      // Fallback to localStorage
      const { userStorage } = await import('@/lib/api');
      const localAddresses = userStorage.getUserAddresses();
      setAddresses(localAddresses);
      
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    }
  };

  const getCurrentLocation = () => {
    setLoadingGPS(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        try {
          // Reverse geocoding to get address details
          const address = await reverseGeocode(latitude, longitude);
          setFormData(prev => ({
            ...prev,
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            coordinates: { lat: latitude, lng: longitude }
          }));
          
          toast.success('Location detected successfully!');
    } catch (error) {
          console.error('Error getting address details:', error);
          toast.error('Location detected, but could not get address details. Please enter manually.');
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
        }
        
        setLoadingGPS(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        toast.error(errorMessage);
        setLoadingGPS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<Partial<Address>> => {
    try {
      // Using a simple reverse geocoding service (you can replace with Google Maps API)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_OPENCAGE_API_KEY`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        return {
          street: `${components.house_number || ''} ${components.road || ''} ${components.neighbourhood || ''}`.trim(),
          city: components.city || components.town || components.village || '',
          state: components.state || '',
          pincode: components.postcode || ''
        };
      }
      
      throw new Error('No results found');
    } catch (error) {
      // Fallback: Use a mock geocoding or ask user to enter manually
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  };

  const saveAddress = async () => {
    if (!validateAddress()) return;

    try {
      // Use database address API exclusively
      const { addressService } = require('@/lib/api');
      
      await addressService.addAddress({
        label: formData.label as 'Home' | 'Work' | 'Other',
        name: formData.name,
        phone: formData.phone,
        street: formData.street,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        isDefault: addresses.length === 0 // First address is default
      });
      
      // Reload addresses from database
      await loadSavedAddresses();
      
      // Trigger address update event
      window.dispatchEvent(new Event('addressesUpdated'));
      
      setShowAddForm(false);
      resetForm();
      toast.success('Address saved successfully!');
      
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address';
      toast.error(errorMessage);
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      // Use database address API exclusively
      const { addressService } = require('@/lib/api');
      
      await addressService.deleteAddress(addressId);
      
      // Reload addresses from database
      await loadSavedAddresses();
      
      // Trigger address update event
      window.dispatchEvent(new Event('addressesUpdated'));
      
      toast.success('Address deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
      toast.error(errorMessage);
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to set default address');
        return;
      }

      // Call backend API to set default address
      const response = await fetch('/api/users/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          addressId: addressId,
          isDefault: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default address');
      }

      // Also update localStorage backup
      const { userStorage } = await import('@/lib/api');
      userStorage.updateUserAddress(addressId, { isDefault: true });
      
      // Reload addresses from database
      await loadSavedAddresses();
      
      // Trigger events to update other components
      window.dispatchEvent(new Event('addressesUpdated'));
      
      toast.success('Default address updated!');
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast.error(error.message || 'Failed to update default address');
    }
  };

  const resetForm = () => {
    setFormData({
      label: 'Home',
      name: '',
      phone: '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });
    setEditingAddress(null);
    setShowAddForm(false);
    setCurrentLocation(null);
  };

  const handleEditAddress = (address: Address) => {
    setFormData(address);
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleSelectAddress = (address: Address) => {
    onLocationSelect(address);
    onClose();
  };

  const getAddressIcon = (label: string) => {
    switch (label) {
      case 'Home': return <Home className="h-5 w-5" />;
      case 'Work': return <Briefcase className="h-5 w-5" />;
      default: return <MapIcon className="h-5 w-5" />;
    }
  };

  const validateAddress = () => {
    if (!formData.name || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return false;
    }

    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }

    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-content-light rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between p-6 border-b border-gray-200 z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {showAddForm ? (editingAddress ? 'Edit Address' : 'Add New Address') : 'Select Delivery Address'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 bg-white">
          {showAddForm ? (
            /* Add/Edit Address Form */
            <div className="space-y-6">
              {/* GPS Location Button */}
              <div className="flex justify-center">
          <button
            onClick={getCurrentLocation}
                  disabled={loadingGPS}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                    loadingGPS 
                      ? 'border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50' 
                      : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  {loadingGPS ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Navigation className="h-5 w-5" />
                  )}
                  <span className="font-medium">{loadingGPS ? 'Getting your location...' : 'Use Current Location'}</span>
                </button>
              </div>
              
              {/* Address Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Address Type</label>
                <div className="flex space-x-3">
                  {(['Home', 'Work', 'Other'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, label: type }))}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.label === type
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {getAddressIcon(type)}
                      <span className="font-medium">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                    <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Address Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                  placeholder="House/Flat/Office No., Building, Street Name"
                    />
                  </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Landmark (Optional)</label>
                    <input
                      type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                  placeholder="Near Metro Station, Mall, etc."
                />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Mumbai"
                  />
                </div>
                  <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                    <input
                      type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                <input
                  type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="400001"
                    maxLength={6}
                />
                </div>
                </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAddress}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          ) : (
            /* Address List */
            <div className="space-y-4">
              {/* Add New Address Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-gray-700"
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Add New Address</span>
              </button>

              {/* Saved Addresses */}
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">No saved addresses yet</p>
                  <p className="text-sm text-gray-500">Add your first address to get started</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      address.isDefault 
                        ? 'border-red-500 bg-red-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    {address.isDefault && (
                      <span className="absolute top-3 right-3 text-xs bg-red-500 text-white px-3 py-1 rounded-full font-medium">
                        Default
                      </span>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className="text-red-600 mt-1 p-1 bg-red-50 rounded-full">
                        {getAddressIcon(address.label)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{address.label}</h3>
                          <span className="text-sm text-gray-600">• {address.name}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1 leading-relaxed">
                          {address.street}
                          {address.landmark && `, ${address.landmark}`}
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{address.phone}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-200">
                      {!address.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefaultAddress(address._id!);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 px-3 py-1 rounded transition-all duration-200"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address);
                        }}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700 font-medium hover:bg-gray-50 px-3 py-1 rounded transition-all duration-200"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(address._id!);
                        }}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 