'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface DeliveryTrackerProps {
  userId: string;
  userName: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DeliverySession {
  deliveryId: string;
  status: 'active' | 'paused' | 'stopped';
  startTime: Date;
  lastLocationUpdate?: Date;
  totalUpdates: number;
}

export default function DeliveryTracker({ userId, userName }: DeliveryTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [deliverySession, setDeliverySession] = useState<DeliverySession | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Refs for intervals and watchers
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Check location permission on component mount
  useEffect(() => {
    checkLocationPermission();
    return () => {
      // Cleanup on unmount
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
      
      // Generate unique delivery ID (in real app, this would come from an order)
      const deliveryId = `delivery_${userId}_${Date.now()}`;
      
      const session: DeliverySession = {
        deliveryId,
        status: 'active',
        startTime: new Date(),
        totalUpdates: 0
      };
      
      setDeliverySession(session);
      setIsTracking(true);
      
      toast.success('Starting delivery tracking...');

      // Start watching position
      const watchOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 // Cache for 1 second
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        watchOptions
      );

      // Set up interval to send location updates every 5 seconds
      updateIntervalRef.current = setInterval(() => {
        if (currentLocation && Date.now() - lastUpdateTimeRef.current >= 5000) {
          sendLocationUpdate(deliveryId, currentLocation);
        }
      }, 5000);

    } catch (err) {
      console.error('Error starting tracking:', err);
      toast.error('Failed to start tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      // Send final location update to mark as completed
      if (deliverySession && currentLocation) {
        await fetch(`/api/delivery/${deliverySession.deliveryId}/location`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setIsTracking(false);
      setDeliverySession(null);
      setCurrentLocation(null);
      toast.success('Delivery tracking stopped');

    } catch (err) {
      console.error('Error stopping tracking:', err);
      toast.error('Error stopping tracking');
    }
  };

  const handleLocationUpdate = (position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    setCurrentLocation(locationData);
    setError(null);

    // Update session
    if (deliverySession) {
      setDeliverySession(prev => prev ? {
        ...prev,
        lastLocationUpdate: new Date(),
        totalUpdates: prev.totalUpdates + 1
      } : null);
    }
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
        return; // Don't show error for timeout, just retry
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

  const sendLocationUpdate = async (deliveryId: string, location: LocationData) => {
    if (isUpdatingLocation) return; // Prevent duplicate requests
    
    try {
      setIsUpdatingLocation(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/delivery/${deliveryId}/location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          metadata: {
            batteryLevel: (navigator as any).getBattery ? 
              await (navigator as any).getBattery().then((battery: any) => Math.round(battery.level * 100)) : 
              undefined,
            networkType: (navigator as any).connection?.effectiveType || 'unknown',
            deviceInfo: navigator.userAgent
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      lastUpdateTimeRef.current = Date.now();
      
    } catch (error) {
      console.error('Failed to send location update:', error);
      // Don't show toast for every failed update to avoid spam
    } finally {
      setIsUpdatingLocation(false);
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
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Tracking Status</h3>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isTracking ? '🟢 Active' : '⚪ Inactive'}
          </div>
        </div>

        {/* Location Permission Status */}
        {locationPermission === 'denied' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              Location permission denied. Please enable location access in your browser settings and refresh the page.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        )}

        {/* Current Location Info */}
        {currentLocation && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Latitude:</span>
                <span className="ml-2 font-mono">{formatCoordinate(currentLocation.latitude, 'lat')}</span>
              </div>
              <div>
                <span className="text-blue-700">Longitude:</span>
                <span className="ml-2 font-mono">{formatCoordinate(currentLocation.longitude, 'lng')}</span>
              </div>
              {currentLocation.accuracy && (
                <div>
                  <span className="text-blue-700">Accuracy:</span>
                  <span className="ml-2 font-mono">±{Math.round(currentLocation.accuracy)}m</span>
                </div>
              )}
              {currentLocation.speed && (
                <div>
                  <span className="text-blue-700">Speed:</span>
                  <span className="ml-2 font-mono">{Math.round(currentLocation.speed * 3.6)} km/h</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Info */}
        {deliverySession && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Delivery Session</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-green-700">Started:</span>
                <span className="ml-2">{formatTime(deliverySession.startTime)}</span>
              </div>
              <div>
                <span className="text-green-700">Updates Sent:</span>
                <span className="ml-2 font-mono">{deliverySession.totalUpdates}</span>
              </div>
              {deliverySession.lastLocationUpdate && (
                <div className="md:col-span-2">
                  <span className="text-green-700">Last Update:</span>
                  <span className="ml-2">{formatTime(deliverySession.lastLocationUpdate)}</span>
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
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🚀 Start Delivery
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🛑 Stop Delivery
            </button>
          )}
          
          {isUpdatingLocation && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">📱 Instructions</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Ensure location services are enabled on your device</li>
          <li>• Keep this tab active for accurate tracking</li>
          <li>• Your location updates automatically every 5 seconds</li>
          <li>• Stop tracking when delivery is complete</li>
        </ul>
      </div>
    </div>
  );
} 