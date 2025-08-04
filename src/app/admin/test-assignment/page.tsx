'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TestAssignmentData {
  orderId: string;
  customerId: string;
  restaurantId: string;
  restaurantLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  orderSummary: {
    totalAmount: number;
    itemCount: number;
    specialInstructions: string;
    estimatedPreparationTime: number;
  };
  priority: number;
}

export default function TestAssignmentPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TestAssignmentData>({
    orderId: `TEST_${Date.now()}`,
    customerId: 'test_customer_123',
    restaurantId: 'test_restaurant_456',
    restaurantLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bangalore, Karnataka 560001'
    },
    customerLocation: {
      latitude: 12.9756,
      longitude: 77.6014,
      address: 'Koramangala, Bangalore, Karnataka 560034'
    },
    orderSummary: {
      totalAmount: 450,
      itemCount: 3,
      specialInstructions: 'Extra spicy, handle with care',
      estimatedPreparationTime: 15
    },
    priority: 1
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: isNaN(Number(value)) ? value : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(Number(value)) ? value : Number(value)
      }));
    }
  };

  const createTestAssignment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login as admin first');
        return;
      }

      const response = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Test assignment created successfully!');
        
        // Generate new order ID for next test
        setFormData(prev => ({
          ...prev,
          orderId: `TEST_${Date.now()}`
        }));
        
        console.log('Assignment created:', data.assignment);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create assignment');
      }
    } catch (error: any) {
      console.error('Failed to create test assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = async (field: 'restaurant' | 'customer') => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      setFormData(prev => ({
        ...prev,
        [`${field}Location`]: {
          ...prev[`${field}Location` as keyof TestAssignmentData],
          latitude,
          longitude,
          address: `Current location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
        }
      }));

      toast.success(`${field} location updated with current position`);
    } catch (error) {
      toast.error('Failed to get current location');
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
            <div className="flex items-center space-x-4">
              <Link href="/delivery" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                Delivery Dashboard
              </Link>
              <Link href="/demo-delivery" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Demo Mode
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6 text-black">
            <h1 className="text-3xl font-bold mb-2">🧪 Test Order Assignment</h1>
            <p className="text-gray-900">
              Create test order assignments to test the delivery partner notification system
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Order Details */}
            <div className="bg-black/40 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order ID</label>
                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority (1-10)</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(p => (
                      <option key={p} value={p}>Priority {p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount (₹)</label>
                  <input
                    type="number"
                    name="orderSummary.totalAmount"
                    value={formData.orderSummary.totalAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Item Count</label>
                  <input
                    type="number"
                    name="orderSummary.itemCount"
                    value={formData.orderSummary.itemCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Special Instructions</label>
                  <textarea
                    name="orderSummary.specialInstructions"
                    value={formData.orderSummary.specialInstructions}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Location */}
            <div className="bg-black/40 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Restaurant Location</h3>
                <button
                  type="button"
                  onClick={() => useCurrentLocation('restaurant')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Use Current Location
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="restaurantLocation.latitude"
                    value={formData.restaurantLocation.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="restaurantLocation.longitude"
                    value={formData.restaurantLocation.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    name="restaurantLocation.address"
                    value={formData.restaurantLocation.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Customer Location */}
            <div className="bg-black/40 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Customer Location</h3>
                <button
                  type="button"
                  onClick={() => useCurrentLocation('customer')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Use Current Location
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="customerLocation.latitude"
                    value={formData.customerLocation.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="customerLocation.longitude"
                    value={formData.customerLocation.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    name="customerLocation.address"
                    value={formData.customerLocation.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                onClick={createTestAssignment}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Assignment...
                  </span>
                ) : (
                  '🚀 Create Test Assignment'
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <h4 className="font-medium text-blue-400 mb-2">📋 Instructions</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Make sure you have delivery partners registered and online</li>
                <li>• The assignment will be sent to the nearest available delivery partner</li>
                <li>• Check the delivery dashboard to see incoming assignments</li>
                <li>• You can test accept/reject functionality from there</li>
                <li>• Assignments timeout after 30 seconds if not responded</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 