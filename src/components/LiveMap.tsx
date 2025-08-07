'use client';

import { useEffect, useRef, useState } from 'react';
import { useGoogleMap } from '@/hooks/useGoogleMaps';
import deliveryService, { DeliveryLocation } from '@/lib/deliveryService';
import { toast } from 'react-hot-toast';

interface LiveMapProps {
  deliveryId: string;
  customerAddress?: {
    lat: number;
    lng: number;
    address: string;
  };
  height?: string;
  showControls?: boolean;
  onLocationUpdate?: (location: DeliveryLocation | null) => void;
}

export default function LiveMap({
  deliveryId,
  customerAddress,
  height = '400px',
  showControls = true,
  onLocationUpdate
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded, loadError, google } = useGoogleMap(mapRef);
  
  const [currentLocation, setCurrentLocation] = useState<DeliveryLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for markers
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const customerMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // Polling ref
  const pollingRef = useRef<(() => void) | null>(null);

  // Initialize map markers and start tracking
  useEffect(() => {
    if (!map || !google || !deliveryId) return;

    initializeMap();
    startTracking();

    return () => {
      stopTracking();
      clearMarkers();
    };
  }, [map, google, deliveryId]);

  const initializeMap = () => {
    if (!map || !google) return;

    // Create customer marker if address provided
    if (customerAddress) {
      customerMarkerRef.current = new google.maps.Marker({
        position: { lat: customerAddress.lat, lng: customerAddress.lng },
        map: map,
        title: 'Delivery Address',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#fff" stroke-width="2"/>
              <circle cx="16" cy="16" r="8" fill="#fff"/>
              <text x="16" y="20" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">🏠</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Add info window for customer address
      const customerInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-bold text-gray-900">Delivery Address</h3>
            <p class="text-sm text-gray-600">${customerAddress.address}</p>
          </div>
        `
      });

      customerMarkerRef.current.addListener('click', () => {
        customerInfoWindow.open(map, customerMarkerRef.current);
      });
    }
  };

  const startTracking = () => {
    if (pollingRef.current) return; // Already tracking

    setIsTracking(true);
    setError(null);

    pollingRef.current = deliveryService.startLocationPolling(
      deliveryId,
      handleLocationUpdate,
      handleTrackingError,
      5000 // Poll every 5 seconds
    );
  };

  const stopTracking = () => {
    if (pollingRef.current) {
      pollingRef.current();
      pollingRef.current = null;
    }
    setIsTracking(false);
  };

  const handleLocationUpdate = (location: DeliveryLocation | null) => {
    setCurrentLocation(location);
    setLastUpdate(new Date());
    onLocationUpdate?.(location);

    if (location && map && google) {
      updateDeliveryMarker(location);
      updateMapView(location);
    }
  };

  const handleTrackingError = (error: Error) => {
    console.error('Tracking error:', error);
    setError(error.message);
    
    // Don't show toast for 404 errors (no location data yet)
    if (!error.message.includes('404')) {
      toast.error('Error updating delivery location');
    }
  };

  const updateDeliveryMarker = (location: DeliveryLocation) => {
    const [lng, lat] = location.location.coordinates;
    const position = { lat, lng };

    if (deliveryMarkerRef.current) {
      // Update existing marker
      deliveryMarkerRef.current.setPosition(position);
    } else {
      // Create new delivery marker
      deliveryMarkerRef.current = new google.maps.Marker({
        position,
        map,
        title: 'Delivery Vehicle',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#16a34a" stroke="#fff" stroke-width="2"/>
              <circle cx="20" cy="20" r="12" fill="#fff"/>
              <text x="20" y="26" text-anchor="middle" fill="#16a34a" font-size="16">🚚</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        animation: google.maps.Animation.DROP
      });

      // Add info window for delivery marker
      const deliveryInfoWindow = new google.maps.InfoWindow({
        content: ''
      });

      deliveryMarkerRef.current.addListener('click', () => {
        const content = `
          <div class="p-3">
            <h3 class="font-bold text-gray-900 mb-2">
              ${deliveryService.getStatusIcon(location.status)} Delivery Vehicle
            </h3>
            <div class="space-y-1 text-sm">
              <p><span class="font-medium">Status:</span> <span class="${deliveryService.getStatusColor(location.status)}">${location.status}</span></p>
              <p><span class="font-medium">Last Update:</span> ${new Date(location.timestamp).toLocaleTimeString()}</p>
              ${location.speed ? `<p><span class="font-medium">Speed:</span> ${Math.round(location.speed * 3.6)} km/h</p>` : ''}
              ${location.accuracy ? `<p><span class="font-medium">Accuracy:</span> ±${Math.round(location.accuracy)}m</p>` : ''}
              ${location.address ? `<p><span class="font-medium">Address:</span> ${location.address}</p>` : ''}
            </div>
          </div>
        `;
        deliveryInfoWindow.setContent(content);
        deliveryInfoWindow.open(map, deliveryMarkerRef.current);
      });
    }

    // Draw route if customer address is available
    if (customerAddress) {
      drawRoute(position, { lat: customerAddress.lat, lng: customerAddress.lng });
    }
  };

  const updateMapView = (location: DeliveryLocation) => {
    if (!map) return;

    const [lng, lat] = location.location.coordinates;
    const bounds = new google.maps.LatLngBounds();

    // Add delivery location to bounds
    bounds.extend({ lat, lng });

    // Add customer address to bounds if available
    if (customerAddress) {
      bounds.extend({ lat: customerAddress.lat, lng: customerAddress.lng });
    }

    // Fit map to show both locations
    map.fitBounds(bounds);

    // Set reasonable zoom limits
    const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
      if (map.getZoom() > 15) map.setZoom(15);
      if (map.getZoom() < 10) map.setZoom(10);
      google.maps.event.removeListener(listener);
    });
  };

  const drawRoute = (from: google.maps.LatLng, to: google.maps.LatLng) => {
    // Clear existing route
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    // Simple straight line route (you can enhance this with Directions API)
    routePolylineRef.current = new google.maps.Polyline({
      path: [from, to],
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: map
    });
  };

  const clearMarkers = () => {
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setMap(null);
      deliveryMarkerRef.current = null;
    }
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setMap(null);
      customerMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
  };

  const calculateDistance = () => {
    if (!currentLocation || !customerAddress) return null;
    
    const [lng, lat] = currentLocation.location.coordinates;
    return deliveryService.calculateDistance(
      lat, lng,
      customerAddress.lat, customerAddress.lng
    );
  };

  const estimatedTime = () => {
    if (!currentLocation || !customerAddress) return null;
    
    const [lng, lat] = currentLocation.location.coordinates;
    return deliveryService.estimateDeliveryTime(
      lat, lng,
      customerAddress.lat, customerAddress.lng
    );
  };

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Map Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{loadError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      {showControls && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isTracking ? '🔴 Live Tracking' : '⚪ Not Tracking'}
              </div>
              
              {currentLocation && (
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  deliveryService.getStatusColor(currentLocation.status).replace('text-', 'bg-').replace('-600', '-100')
                } ${deliveryService.getStatusColor(currentLocation.status)}`}>
                  {deliveryService.getStatusIcon(currentLocation.status)} {currentLocation.status}
                </div>
              )}
            </div>

            {lastUpdate && (
              <div className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Delivery Info */}
          {currentLocation && customerAddress && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-2">
                <span className="text-blue-700 font-medium">Distance:</span>
                <span className="ml-1">{deliveryService.formatDistance(calculateDistance() || 0)}</span>
              </div>
              <div className="bg-green-50 rounded p-2">
                <span className="text-green-700 font-medium">ETA:</span>
                <span className="ml-1">{deliveryService.formatTime(estimatedTime() || 0)}</span>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <span className="text-purple-700 font-medium">Speed:</span>
                <span className="ml-1">
                  {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} km/h` : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="bg-gray-200 rounded-lg overflow-hidden shadow">
        <div ref={mapRef} style={{ height, width: '100%' }} />
      </div>

      {/* Instructions */}
      {!currentLocation && isTracking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Waiting for delivery location...
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your delivery will appear on the map once the driver starts tracking their location.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 