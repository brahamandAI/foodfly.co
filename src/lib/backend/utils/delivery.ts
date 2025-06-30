import { calculateDistance } from './distance';

interface Location {
  lat: number;
  lng: number;
}

interface DeliveryOptions {
  restaurantLocation: Location;
  customerLocation: Location;
  maxRobotDistance: number; // in kilometers
}

export const checkRobotDelivery = async (options: DeliveryOptions): Promise<{
  isRobotDeliveryPossible: boolean;
  distance: number;
  estimatedTime: number;
}> => {
  try {
    // Calculate distance between restaurant and customer
    const distance = calculateDistance(
      options.restaurantLocation.lat,
      options.restaurantLocation.lng,
      options.customerLocation.lat,
      options.customerLocation.lng
    );

    // Check if distance is within robot delivery range
    const isRobotDeliveryPossible = distance <= options.maxRobotDistance;

    // Calculate estimated delivery time (assuming average robot speed of 5 km/h)
    const estimatedTime = Math.ceil((distance / 5) * 60); // in minutes

    return {
      isRobotDeliveryPossible,
      distance,
      estimatedTime
    };
  } catch (error) {
    console.error('Error checking robot delivery:', error);
    throw new Error('Failed to check robot delivery availability');
  }
}; 