/**
 * Google Maps Service
 * Handles geocoding, places search, and other map-related functionality
 */

export interface GeocodingResult {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  components: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  types?: string[];
}

class GoogleMapsService {
  private apiKey: string;
  private isLoaded: boolean = false;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Initialize Google Maps service
   */
  async initialize(): Promise<void> {
    if (this.isLoaded || !this.apiKey) return;

    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            const components: any = {};
            
            addressComponents.forEach(component => {
              const types = component.types;
              if (types.includes('street_number') || types.includes('route')) {
                components.street = components.street ? 
                  `${components.street} ${component.long_name}` : 
                  component.long_name;
              }
              if (types.includes('locality')) {
                components.city = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                components.state = component.long_name;
              }
              if (types.includes('postal_code')) {
                components.pincode = component.long_name;
              }
              if (types.includes('country')) {
                components.country = component.long_name;
              }
            });

            resolve({
              address: result.formatted_address,
              coordinates: { lat, lng },
              components
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Forward geocoding - convert address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode(
        { address },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const location = result.geometry.location;
            const addressComponents = result.address_components;
            
            const components: any = {};
            
            addressComponents.forEach(component => {
              const types = component.types;
              if (types.includes('street_number') || types.includes('route')) {
                components.street = components.street ? 
                  `${components.street} ${component.long_name}` : 
                  component.long_name;
              }
              if (types.includes('locality')) {
                components.city = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                components.state = component.long_name;
              }
              if (types.includes('postal_code')) {
                components.pincode = component.long_name;
              }
              if (types.includes('country')) {
                components.country = component.long_name;
              }
            });

            resolve({
              address: result.formatted_address,
              coordinates: { 
                lat: location.lat(), 
                lng: location.lng() 
              },
              components
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Search for places
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceSearchResult[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.TextSearchRequest = {
        query,
        ...(location && { location: new google.maps.LatLng(location.lat, location.lng) })
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.map(place => ({
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0
            },
            rating: place.rating,
            types: place.types
          }));
          
          resolve(places);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['name', 'formatted_address', 'geometry', 'rating', 'types', 'website', 'formatted_phone_number']
      };

      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  /**
   * Calculate route between two points
   */
  async getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<any> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Route calculation failed: ${status}`));
        }
      });
    });
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE';
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
export default googleMapsService; 