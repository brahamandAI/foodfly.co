'use client';

import { useState } from 'react';
import LiveMap from '@/components/LiveMap';
import { DeliveryLocation } from '@/lib/deliveryService';

export default function TrackOrderPage() {
  const [deliveryId, setDeliveryId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DeliveryLocation | null>(null);

  // Sample customer address (in real app, this would come from order data)
  const customerAddress = {
    lat: 28.6139,
    lng: 77.2090,
    address: 'Connaught Place, New Delhi, Delhi 110001, India'
  };

  const startTracking = () => {
    if (!deliveryId.trim()) {
      alert('Please enter a delivery ID');
      return;
    }
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
    setCurrentLocation(null);
    setDeliveryId('');
  };

  const handleLocationUpdate = (location: DeliveryLocation | null) => {
    setCurrentLocation(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🍔 FoodFly - Track Your Order
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Real-time delivery tracking
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {!isTracking ? (
            /* Delivery ID Input Form */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Track Your Delivery
                  </h2>
                  <p className="text-gray-600">
                    Enter your delivery ID to see real-time location tracking
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="deliveryId" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery ID
                    </label>
                    <input
                      type="text"
                      id="deliveryId"
                      value={deliveryId}
                      onChange={(e) => setDeliveryId(e.target.value)}
                      placeholder="e.g., delivery_123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      For demo purposes, use any delivery ID from the delivery dashboard
                    </p>
                  </div>

                  <button
                    onClick={startTracking}
                    disabled={!deliveryId.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    🔍 Start Tracking
                  </button>
                </div>

                {/* Demo Instructions */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">🧪 Demo Instructions</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open the delivery dashboard in another tab: <code className="bg-blue-100 px-1 rounded">/delivery</code></li>
                    <li>Create a delivery user account with the "delivery" role</li>
                    <li>Start delivery tracking and note the delivery ID</li>
                    <li>Come back here and enter that delivery ID to track</li>
                    <li>Watch the map update in real-time as location changes!</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            /* Tracking Interface */
            <div className="space-y-6">
              {/* Tracking Header */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Tracking: <span className="text-orange-600">{deliveryId}</span>
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Delivery to: {customerAddress.address}
                    </p>
                  </div>
                  <button
                    onClick={stopTracking}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Stop Tracking
                  </button>
                </div>

                {/* Order Status */}
                {currentLocation && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          🚚
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-900">
                          Your order is {currentLocation.status === 'active' ? 'on the way' : currentLocation.status}
                        </h3>
                        <p className="text-sm text-green-700">
                          Last updated: {new Date(currentLocation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Map */}
              <LiveMap
                deliveryId={deliveryId}
                customerAddress={customerAddress}
                height="500px"
                showControls={true}
                onLocationUpdate={handleLocationUpdate}
              />

              {/* Additional Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                    <p className="text-sm text-gray-600">{customerAddress.address}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tracking Status</h4>
                    <div className="text-sm text-gray-600">
                      {currentLocation ? (
                        <div className="space-y-1">
                          <p>Status: <span className="font-medium">{currentLocation.status}</span></p>
                          <p>Last Update: <span className="font-medium">{new Date(currentLocation.timestamp).toLocaleTimeString()}</span></p>
                          {currentLocation.accuracy && (
                            <p>GPS Accuracy: <span className="font-medium">±{Math.round(currentLocation.accuracy)}m</span></p>
                          )}
                        </div>
                      ) : (
                        <p>Waiting for location data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>FoodFly Delivery Tracking System - Real-time GPS tracking for your orders</p>
            <p className="mt-1">
              🔧 Demo Environment - For testing delivery tracking functionality
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 