import { toast } from 'react-hot-toast';

export interface DeliveryLocation {
  deliveryId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  address?: string;
}

export interface DeliveryLocationHistory {
  deliveryId: string;
  history: DeliveryLocation[];
  count: number;
}

class DeliveryService {
  private baseUrl = '/api/delivery';

  /**
   * Get the latest location for a delivery
   */
  async getLatestLocation(deliveryId: string): Promise<DeliveryLocation | null> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/${deliveryId}/location`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null; // No location data found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching latest location:', error);
      throw error;
    }
  }

  /**
   * Get location history for a delivery
   */
  async getLocationHistory(deliveryId: string, limit = 50): Promise<DeliveryLocationHistory | null> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/${deliveryId}/location?history=true&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null; // No location data found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching location history:', error);
      throw error;
    }
  }

  /**
   * Update delivery location (for delivery personnel)
   */
  async updateLocation(
    deliveryId: string, 
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      address?: string;
    }
  ): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/${deliveryId}/location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Stop delivery tracking (for delivery personnel)
   */
  async stopTracking(deliveryId: string): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/${deliveryId}/location`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error stopping tracking:', error);
      throw error;
    }
  }

  /**
   * Start polling for location updates
   */
  startLocationPolling(
    deliveryId: string, 
    onLocationUpdate: (location: DeliveryLocation | null) => void,
    onError: (error: Error) => void,
    intervalMs = 5000
  ): () => void {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const location = await this.getLatestLocation(deliveryId);
        onLocationUpdate(location);
      } catch (error) {
        onError(error as Error);
      }

      if (isPolling) {
        setTimeout(poll, intervalMs);
      }
    };

    // Start polling immediately
    poll();

    // Return cleanup function
    return () => {
      isPolling = false;
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  /**
   * Estimate delivery time based on distance and average speed
   */
  estimateDeliveryTime(
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number,
    averageSpeedKmh = 30
  ): number {
    const distance = this.calculateDistance(fromLat, fromLng, toLat, toLng);
    return Math.round((distance / averageSpeedKmh) * 60); // Return minutes
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  /**
   * Format time for display
   */
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if a delivery is currently active
   */
  isDeliveryActive(location: DeliveryLocation | null): boolean {
    if (!location) return false;
    
    const now = new Date();
    const locationTime = new Date(location.timestamp);
    const timeDiffMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60);
    
    // Consider delivery active if last update was within 10 minutes and status is active
    return location.status === 'active' && timeDiffMinutes < 10;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'completed': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get status icon for UI
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '🚚';
      case 'paused': return '⏸️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📍';
    }
  }
}

// Export singleton instance
export const deliveryService = new DeliveryService();
export default deliveryService; 