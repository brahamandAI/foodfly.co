'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Play, Square, Clock, Battery, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import RealUserGuard from '@/components/RealUserGuard';
import DeliveryTracker from '@/components/DeliveryTracker';

export default function LiveTrackingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [trackingStats, setTrackingStats] = useState({
    startTime: null as Date | null,
    totalUpdates: 0,
    lastUpdate: null as Date | null
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationAccuracy(position.coords.accuracy);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
      return;
    }

    setIsTracking(true);
    setTrackingStats({
      startTime: new Date(),
      totalUpdates: 0,
      lastUpdate: null
    });

    toast.success('🚀 Live tracking started!');

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationAccuracy(position.coords.accuracy);
        setTrackingStats(prev => ({
          ...prev,
          totalUpdates: prev.totalUpdates + 1,
          lastUpdate: new Date()
        }));
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Error getting location updates');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    // Store watch ID for cleanup
    (window as any).locationWatchId = watchId;
  };

  const stopTracking = () => {
    if ((window as any).locationWatchId) {
      navigator.geolocation.clearWatch((window as any).locationWatchId);
      (window as any).locationWatchId = null;
    }

    setIsTracking(false);
    setTrackingStats({
      startTime: null,
      totalUpdates: 0,
      lastUpdate: null
    });

    toast.success('📍 Live tracking stopped');
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getTrackingDuration = () => {
    if (!trackingStats.startTime) return '00:00:00';
    const now = new Date();
    const diff = now.getTime() - trackingStats.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-gray-500';
    if (accuracy <= 10) return 'text-green-500';
    if (accuracy <= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAccuracyLabel = (accuracy: number | null) => {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 10) return 'Excellent';
    if (accuracy <= 50) return 'Good';
    return 'Poor';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <RealUserGuard requiredRoles={['delivery', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between py-4 px-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">📍 Live Tracking</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </header>

        <main className="pb-20">
          {/* Status Card */}
          <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Tracking Status</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {isTracking ? 'Live Tracking' : 'Offline'}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-6">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="h-6 w-6" />
                  <span>Start Tracking</span>
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  <Square className="h-6 w-6" />
                  <span>Stop Tracking</span>
                </button>
              )}
            </div>

            {/* Tracking Stats */}
            {isTracking && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{getTrackingDuration()}</div>
                    <div className="text-sm text-green-700">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{trackingStats.totalUpdates}</div>
                    <div className="text-sm text-green-700">Updates Sent</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Location */}
          {currentLocation && (
            <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                Current Location
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Latitude</span>
                      <span className="font-mono text-gray-900">{formatCoordinate(currentLocation.lat, 'lat')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Longitude</span>
                      <span className="font-mono text-gray-900">{formatCoordinate(currentLocation.lng, 'lng')}</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">GPS Accuracy</span>
                  <div className="text-right">
                    <div className={`font-bold ${getAccuracyColor(locationAccuracy)}`}>
                      {locationAccuracy ? `±${Math.round(locationAccuracy)}m` : 'Unknown'}
                    </div>
                    <div className={`text-xs ${getAccuracyColor(locationAccuracy)}`}>
                      {getAccuracyLabel(locationAccuracy)}
                    </div>
                  </div>
                </div>

                {/* Last Update */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="font-mono text-gray-900">{formatTime(trackingStats.lastUpdate)}</span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>View on Map</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${currentLocation.lat}, ${currentLocation.lng}`);
                      toast.success('📋 Coordinates copied!');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Copy Coords
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Device Status */}
          <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Device Status</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Battery className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Battery</span>
                </div>
                <span className="text-gray-900 font-medium">85% (Good)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700">Network</span>
                </div>
                <span className="text-gray-900 font-medium">4G (Strong)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">GPS</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {navigator.geolocation ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Tracking */}
          <div className="m-4">
            <h3 className="font-bold text-gray-900 mb-4">🔧 Advanced Tracking</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <DeliveryTracker 
                userId={user._id || user.id} 
                userName={user.name}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="m-4 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">💡 Tracking Tips</h3>
            <div className="text-blue-800 space-y-1">
              <p className="text-sm">• Keep your phone charged during deliveries</p>
              <p className="text-sm">• Stay in areas with good network coverage</p>
              <p className="text-sm">• Enable high accuracy GPS for better tracking</p>
              <p className="text-sm">• Don't close the app while on delivery</p>
            </div>
          </div>
        </main>
      </div>
    </RealUserGuard>
  );
}