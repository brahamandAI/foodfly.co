import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
  google: any;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    if (typeof document !== 'undefined' && document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent infinite loop
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return;
    }

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
        setLoadError('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsLoaded(true);
        setLoadError(null);
      };

      script.onerror = () => {
        setLoadError('Failed to load Google Maps API. Please check your API key and internet connection.');
      };

      if (typeof document !== 'undefined') {
        document.head.appendChild(script);
      }
    };

    loadGoogleMaps();
  }, []);

  return {
    isLoaded,
    loadError,
    google: typeof window !== 'undefined' ? window.google || null : null
  };
}

// Hook for creating a map instance
export function useGoogleMap(
  mapRef: React.RefObject<HTMLDivElement>,
  options: google.maps.MapOptions = {}
) {
  const { isLoaded, loadError, google } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current) return;

    const defaultOptions: google.maps.MapOptions = {
      zoom: 13,
      center: { lat: 28.6139, lng: 77.2090 }, // Delhi, India
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      ...options
    };

    const mapInstance = new google.maps.Map(mapRef.current, defaultOptions);
    setMap(mapInstance);

    return () => {
      setMap(null);
    };
  }, [isLoaded, google, mapRef, options]);

  return {
    map,
    isLoaded,
    loadError,
    google
  };
} 