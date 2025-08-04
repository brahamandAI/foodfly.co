import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import DeliveryLocation from '@/lib/backend/models/deliveryLocation.model';
import Order from '@/lib/backend/models/order.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// GET /api/delivery/customer-tracking/[orderId] - Get real-time delivery location for customers
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB();

    const { orderId } = params;

    // Optional authentication - customers can track without login using order ID
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let authenticatedUserId: string | null = null;
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        authenticatedUserId = decoded.userId;
      } catch (error) {
        // Continue without authentication for public tracking
      }
    }

    // Get order details
    const order = await Order.findById(orderId)
      .select('userId deliveryStatus assignedDeliveryPartner deliveryAddress createdAt')
      .lean();

    if (!order) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Order not found' 
        },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this order (if authenticated)
    if (authenticatedUserId && order.userId !== authenticatedUserId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized to track this order' 
        },
        { status: 403 }
      );
    }

    // Get latest delivery location
    const latestLocation = await DeliveryLocation.findOne({
      orderId,
      isLive: true,
      status: 'active'
    })
    .sort({ timestamp: -1 })
    .lean();

    // Get delivery route (last 10 locations for route visualization)
    const deliveryRoute = await DeliveryLocation.find({
      orderId,
      status: 'active'
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('location timestamp accuracy')
    .lean();

    // Calculate estimated time remaining (basic estimation)
    let estimatedTimeRemaining: number | null = null;
    let distanceRemaining: number | null = null;

    if (latestLocation && order.deliveryAddress?.coordinates) {
      const deliveryLat = order.deliveryAddress.coordinates[1];
      const deliveryLng = order.deliveryAddress.coordinates[0];
      const currentLat = latestLocation.location.coordinates[1];
      const currentLng = latestLocation.location.coordinates[0];

      // Calculate distance using Haversine formula
      distanceRemaining = calculateDistance(currentLat, currentLng, deliveryLat, deliveryLng);
      
      // Estimate time based on average speed (assuming 25 km/h average)
      if (latestLocation.speed && latestLocation.speed > 0) {
        estimatedTimeRemaining = Math.round((distanceRemaining / latestLocation.speed) * 60); // in minutes
      } else {
        estimatedTimeRemaining = Math.round((distanceRemaining / 25) * 60); // default speed
      }
    }

    // Get delivery timeline
    const deliveryTimeline = await DeliveryLocation.aggregate([
      { $match: { orderId } },
      {
        $group: {
          _id: null,
          firstLocation: { $first: '$$ROOT' },
          lastLocation: { $last: '$$ROOT' },
          totalLocations: { $sum: 1 },
          avgSpeed: { $avg: '$speed' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order._id,
          status: order.deliveryStatus,
          deliveryPartner: order.assignedDeliveryPartner,
          deliveryAddress: order.deliveryAddress,
          orderTime: order.createdAt
        },
        tracking: {
          currentLocation: latestLocation ? {
            coordinates: latestLocation.location.coordinates,
            address: latestLocation.address,
            timestamp: latestLocation.timestamp,
            accuracy: latestLocation.accuracy,
            speed: latestLocation.speed,
            heading: latestLocation.heading
          } : null,
          route: deliveryRoute.map(loc => ({
            coordinates: loc.location.coordinates,
            timestamp: loc.timestamp,
            accuracy: loc.accuracy
          })),
          estimates: {
            distanceRemaining: distanceRemaining ? Math.round(distanceRemaining * 100) / 100 : null,
            timeRemaining: estimatedTimeRemaining,
            avgSpeed: deliveryTimeline[0]?.avgSpeed || null
          },
          isLive: !!latestLocation,
          lastUpdate: latestLocation?.timestamp || null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching delivery tracking:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch delivery tracking' 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}