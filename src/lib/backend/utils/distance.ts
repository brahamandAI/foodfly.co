/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate delivery fee based on distance
 * @param distance - Distance in kilometers
 * @param baseDeliveryFee - Base delivery fee
 * @returns Calculated delivery fee
 */
export function calculateDeliveryFee(distance: number, baseDeliveryFee: number = 30): number {
  if (distance <= 2) {
    return baseDeliveryFee;
  } else if (distance <= 5) {
    return baseDeliveryFee + 10;
  } else if (distance <= 10) {
    return baseDeliveryFee + 20;
  } else {
    return baseDeliveryFee + 30;
  }
}

/**
 * Calculate estimated delivery time based on distance and current load
 * @param distance - Distance in kilometers
 * @param baseTime - Base delivery time in minutes
 * @param currentOrders - Number of current orders
 * @returns Estimated delivery time in minutes
 */
export function calculateEstimatedDeliveryTime(distance: number, baseTime: number = 30, currentOrders: number = 0): number {
  const distanceTime = Math.ceil(distance / 20 * 60); // Assuming 20 km/h average speed
  const loadTime = Math.min(currentOrders * 5, 30); // Max 30 minutes delay due to load
  
  return baseTime + distanceTime + loadTime;
}

const toRad = (value: number): number => {
  return value * Math.PI / 180;
}; 