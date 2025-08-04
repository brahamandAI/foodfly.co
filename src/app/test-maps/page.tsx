'use client';

import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

export default function TestMapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError, google } = useGoogleMaps();
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && google && mapRef.current && !mapInstance) {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 28.6139, lng: 77.2090 }, // Delhi
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      // Add a marker
      new google.maps.Marker({
        position: { lat: 28.6139, lng: 77.2090 },
        map,
        title: 'Test Location'
      });

      setMapInstance(map);
    }
  }, [isLoaded, google, mapInstance]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🗺️ Google Maps Integration Test
        </h1>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${isLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Google Maps API:</span>
              <span className="ml-2 text-sm">
                {isLoaded ? '✅ Loaded' : '❌ Not Loaded'}
              </span>
            </div>

            {loadError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">
                  <strong>Error:</strong> {loadError}
                </p>
              </div>
            )}

            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${google ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Google Object:</span>
              <span className="ml-2 text-sm">
                {google ? '✅ Available' : '❌ Not Available'}
              </span>
            </div>

            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${mapInstance ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="font-medium">Map Instance:</span>
              <span className="ml-2 text-sm">
                {mapInstance ? '✅ Created' : '⏳ Creating...'}
              </span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Interactive Map</h2>
            <p className="text-sm text-gray-600">
              Test zoom, pan, and marker functionality
            </p>
          </div>
          
          <div 
            ref={mapRef}
            className="w-full h-96"
            style={{ minHeight: '384px' }}
          >
            {!isLoaded && (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">✅ What to Test:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Map loads without errors</li>
            <li>• Zoom in/out functionality works</li>
            <li>• Pan/drag functionality works</li>
            <li>• Marker is visible at Delhi coordinates</li>
            <li>• No console errors in browser dev tools</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        {loadError && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">🔧 Troubleshooting:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Check if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in .env.local</li>
              <li>• Verify API key has Maps JavaScript API enabled</li>
              <li>• Check browser console for detailed errors</li>
              <li>• Ensure billing is enabled on Google Cloud</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 