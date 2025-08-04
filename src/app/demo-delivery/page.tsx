'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function DemoDeliveryPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [deliverySession, setDeliverySession] = useState<any>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [demoDeliveryId, setDemoDeliveryId] = useState<string>('');

  const watchIdRef = useState<number | null>(null);
  const updateIntervalRef = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkLocationPermission();
    // Generate a demo delivery ID
    setDemoDeliveryId(`demo_delivery_${Date.now()}`);
    
    return () => {
      stopTracking();
    };
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      permission.addEventListener('change', () => {
        setLocationPermission(permission.state);
        if (permission.state === 'denied' && isTracking) {
          stopTracking();
        }
      });
    } catch (err) {
      console.warn('Permission API not supported, will request on demand');
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    try {
      setError(null);
      
      const session = {
        deliveryId: demoDeliveryId,
        status: 'active',
        startTime: new Date(),
        totalUpdates: 0
      };
      
      setDeliverySession(session);
      setIsTracking(true);
      
      toast.success('🚀 Demo delivery tracking started! (No real data sent)');

      const watchOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      };

      const watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        watchOptions
      );

      watchIdRef[0] = watchId;

      // Simulate sending updates every 5 seconds (but don't actually send)
      const interval = setInterval(() => {
        if (currentLocation) {
          console.log('Demo: Would send location update:', currentLocation);
          setDeliverySession((prev: any) => prev ? {
            ...prev,
            totalUpdates: prev.totalUpdates + 1,
            lastLocationUpdate: new Date()
          } : null);
        }
      }, 5000);

      updateIntervalRef[0] = interval;

    } catch (err) {
      console.error('Error starting tracking:', err);
      toast.error('Failed to start demo tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    try {
      if (watchIdRef[0] !== null) {
        navigator.geolocation.clearWatch(watchIdRef[0]);
        watchIdRef[0] = null;
      }

      if (updateIntervalRef[0]) {
        clearInterval(updateIntervalRef[0]);
        updateIntervalRef[0] = null;
      }

      setIsTracking(false);
      setDeliverySession(null);
      setCurrentLocation(null);
      toast.success('Demo tracking stopped');

    } catch (err) {
      console.error('Error stopping tracking:', err);
      toast.error('Error stopping demo tracking');
    }
  };

  const handleLocationUpdate = (position: GeolocationPosition) => {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    setCurrentLocation(locationData);
    setError(null);
    console.log('Demo location update:', locationData);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage = 'Location error: ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += 'Permission denied. Please enable location access.';
        setLocationPermission('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage += 'Position unavailable. Please check your GPS.';
        break;
      case error.TIMEOUT:
        errorMessage += 'Location request timed out. Trying again...';
        return;
      default:
        errorMessage += 'Unknown error occurred.';
        break;
    }

    setError(errorMessage);
    console.error('Geolocation error:', error);
    
    if (error.code === error.PERMISSION_DENIED) {
      stopTracking();
      toast.error('Location permission denied');
    }
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
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
              <Link href="/register-delivery" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                Register as Delivery Partner
              </Link>
              <Link href="/login?role=delivery" className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors">
                Delivery Login
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
            <h1 className="text-3xl font-bold mb-2">🧪 Demo Delivery Tracking</h1>
            <p className="text-gray-900">
              Test the delivery tracking functionality without registration!
            </p>
          </div>

          {/* Demo Info */}
          <div className="p-8">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-400 mb-2">🚀 Demo Mode Active</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• No account registration required</li>
                <li>• Location data is captured but NOT sent to servers</li>
                <li>• Perfect for testing GPS functionality</li>
                <li>• Your data stays on your device</li>
                <li>• Demo ID: <code className="bg-blue-800 px-1 rounded">{demoDeliveryId}</code></li>
              </ul>
            </div>

            {/* Status Card */}
            <div className="bg-black/40 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Demo Tracking Status</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isTracking ? '🟢 Demo Active' : '⚪ Demo Inactive'}
                </div>
              </div>

              {/* Location Permission Status */}
              {locationPermission === 'denied' && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-md">
                  <p className="text-sm text-red-300">
                    Location permission denied. Please enable location access in your browser settings and refresh the page.
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-md">
                  <p className="text-sm text-yellow-300">{error}</p>
                </div>
              )}

              {/* Current Location Info */}
              {currentLocation && (
                <div className="mb-4 p-4 bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2">📍 Current Location (Demo)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-300">Latitude:</span>
                      <span className="ml-2 font-mono text-white">{formatCoordinate(currentLocation.latitude, 'lat')}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Longitude:</span>
                      <span className="ml-2 font-mono text-white">{formatCoordinate(currentLocation.longitude, 'lng')}</span>
                    </div>
                    {currentLocation.accuracy && (
                      <div>
                        <span className="text-blue-300">Accuracy:</span>
                        <span className="ml-2 font-mono text-white">±{Math.round(currentLocation.accuracy)}m</span>
                      </div>
                    )}
                    {currentLocation.speed && (
                      <div>
                        <span className="text-blue-300">Speed:</span>
                        <span className="ml-2 font-mono text-white">{Math.round(currentLocation.speed * 3.6)} km/h</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Session Info */}
              {deliverySession && (
                <div className="mb-4 p-4 bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-400 mb-2">📊 Demo Session Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-300">Started:</span>
                      <span className="ml-2 text-white">{formatTime(deliverySession.startTime)}</span>
                    </div>
                    <div>
                      <span className="text-green-300">Updates Captured:</span>
                      <span className="ml-2 font-mono text-white">{deliverySession.totalUpdates}</span>
                    </div>
                    {deliverySession.lastLocationUpdate && (
                      <div className="md:col-span-2">
                        <span className="text-green-300">Last Update:</span>
                        <span className="ml-2 text-white">{formatTime(deliverySession.lastLocationUpdate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-4">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={locationPermission === 'denied'}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    🚀 Start Demo Tracking
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    🛑 Stop Demo Tracking
                  </button>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <h4 className="font-medium text-yellow-400 mb-2">🎯 Ready for the Real Thing?</h4>
              <div className="text-sm text-yellow-300 space-y-2">
                <p>Once you've tested the demo, you can:</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <Link 
                    href="/register-delivery"
                    className="inline-flex items-center justify-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                  >
                    📝 Register as Delivery Partner
                  </Link>
                  <Link 
                    href="/login?role=delivery"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    🔑 Login to Existing Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 FoodFly. All rights reserved.</p>
            <p className="mt-1">🧪 Demo Mode - Perfect for testing delivery functionality!</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 