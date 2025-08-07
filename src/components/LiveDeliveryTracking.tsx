'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, User, Phone, Navigation, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeliveryLocation {
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DeliveryTracking {
  order: {
    id: string;
    status: string;
    deliveryPartner?: {
      name: string;
      phone: string;
      profilePicture?: string;
    };
    deliveryAddress: {
      street: string;
      city: string;
      coordinates: [number, number];
    };
    orderTime: string;
  };
  tracking: {
    currentLocation: DeliveryLocation | null;
    route: DeliveryLocation[];
    estimates: {
      distanceRemaining: number | null;
      timeRemaining: number | null;
      avgSpeed: number | null;
    };
    isLive: boolean;
    lastUpdate: string | null;
  };
}

interface LiveDeliveryTrackingProps {
  orderId: string;
  className?: string;
  refreshInterval?: number; // in seconds
}

export default function LiveDeliveryTracking({ 
  orderId, 
  className = '',
  refreshInterval = 30 
}: LiveDeliveryTrackingProps) {
  const [trackingData, setTrackingData] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTrackingData();
    
    // Set up auto-refresh
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        loadTrackingData(false);
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, refreshInterval]);

  useEffect(() => {
    if (trackingData && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    } else if (trackingData && mapInstanceRef.current) {
      updateMap();
    }
  }, [trackingData]);

  const loadTrackingData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/delivery/customer-tracking/${orderId}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data.data);
        setLastRefresh(new Date());
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast.error('Failed to load tracking data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.google || !trackingData || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: trackingData.tracking.currentLocation?.coordinates 
        ? { 
            lat: trackingData.tracking.currentLocation.coordinates[1], 
            lng: trackingData.tracking.currentLocation.coordinates[0] 
          }
        : { 
            lat: trackingData.order.deliveryAddress.coordinates[1], 
            lng: trackingData.order.deliveryAddress.coordinates[0] 
          },
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ weight: '2.00' }]
        },
        {
          featureType: 'all',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#9c9c9c' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    updateMap();
  };

  const updateMap = () => {
    if (!mapInstanceRef.current || !trackingData) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    // Note: In a real implementation, you'd want to track and remove previous markers

    // Add delivery address marker
    new window.google.maps.Marker({
      position: {
        lat: trackingData.order.deliveryAddress.coordinates[1],
        lng: trackingData.order.deliveryAddress.coordinates[0]
      },
      map,
      title: 'Delivery Address',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="2"/>
            <path d="M16 8L20 16L16 24L12 16Z" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    // Add current delivery location marker if available
    if (trackingData.tracking.currentLocation) {
      const deliveryMarker = new window.google.maps.Marker({
        position: {
          lat: trackingData.tracking.currentLocation.coordinates[1],
          lng: trackingData.tracking.currentLocation.coordinates[0]
        },
        map,
        title: 'Delivery Partner',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#F59E0B" stroke="white" stroke-width="2"/>
              <path d="M12 12h8v8h-8z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Center map on delivery location
      map.setCenter({
        lat: trackingData.tracking.currentLocation.coordinates[1],
        lng: trackingData.tracking.currentLocation.coordinates[0]
      });
    }

    // Draw route if available
    if (trackingData.tracking.route.length > 1) {
      const routePath = trackingData.tracking.route.map(location => ({
        lat: location.coordinates[1],
        lng: location.coordinates[0]
      }));

      new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#F59E0B',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map
      });
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'Calculating...';
    
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (km: number | null) => {
    if (!km) return 'Calculating...';
    
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    
    return `${km.toFixed(1)} km`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order tracking not available
          </h3>
          <p className="text-gray-600">
            Tracking information will be available once your order is confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order Tracking
          </h3>
          <p className="text-sm text-gray-600">
            Order #{trackingData.order.id.slice(-6)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trackingData.order.status)}`}>
            {formatStatusText(trackingData.order.status)}
          </span>
          
          <button
            onClick={() => loadTrackingData(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Refresh tracking"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="w-full h-64 rounded-lg border"
          style={{ minHeight: '256px' }}
        >
          {!window.google && (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        {trackingData.tracking.isLive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            Live
          </div>
        )}
      </div>

      {/* Delivery Info */}
      {trackingData.order.deliveryPartner && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            {trackingData.order.deliveryPartner.profilePicture ? (
              <img
                src={trackingData.order.deliveryPartner.profilePicture}
                alt={trackingData.order.deliveryPartner.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {trackingData.order.deliveryPartner.name}
            </p>
            <p className="text-sm text-gray-600">Your delivery partner</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <Phone className="h-4 w-4" />
            Call
          </button>
        </div>
      )}

      {/* Tracking Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">ETA</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatTime(trackingData.tracking.estimates.timeRemaining)}
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Distance</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {formatDistance(trackingData.tracking.estimates.distanceRemaining)}
          </p>
        </div>
      </div>

      {/* Last Update */}
      {trackingData.tracking.lastUpdate && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(trackingData.tracking.lastUpdate).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {refreshInterval > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Auto-refreshing every {refreshInterval} seconds
          </p>
        </div>
      )}
    </div>
  );
}