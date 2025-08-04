import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import DeliveryLocation from '@/lib/backend/models/deliveryLocation.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  metadata?: {
    batteryLevel?: number;
    networkType?: string;
    deviceInfo?: string;
  };
}

// POST /api/delivery/[deliveryId]/location - Update delivery location
export async function POST(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    let user;
    try {
      user = verifyToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has delivery role
    if (user.role !== 'delivery' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Delivery role required.' },
        { status: 403 }
      );
    }

    const { deliveryId } = params;
    const body: LocationUpdateRequest = await request.json();
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (body.latitude < -90 || body.latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude. Must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude. Must be between -180 and 180' },
        { status: 400 }
      );
    }

    // For now, we'll use deliveryId as orderId and user._id as deliveryPersonId
    // In a real implementation, you'd fetch the actual order and validate permissions
    const locationData = {
      deliveryId,
      orderId: deliveryId, // TODO: Replace with actual order lookup
      deliveryPersonId: user._id,
      customerId: 'temp-customer', // TODO: Get from order
      location: {
        type: 'Point' as const,
        coordinates: [body.longitude, body.latitude]
      },
      timestamp: new Date(),
      accuracy: body.accuracy,
      speed: body.speed,
      heading: body.heading,
      address: body.address,
      status: 'active' as const,
      isLive: true,
      metadata: body.metadata
    };

    // Create new location entry
    const deliveryLocation = new DeliveryLocation(locationData);
    await deliveryLocation.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Location updated successfully',
        data: {
          deliveryId,
          location: deliveryLocation.location,
          timestamp: deliveryLocation.timestamp,
          status: deliveryLocation.status
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating delivery location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/delivery/[deliveryId]/location - Get latest delivery location
export async function GET(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    let user;
    try {
      user = verifyToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow customers to track their own orders and delivery personnel to see their deliveries
    // Admin can see all deliveries
    if (!['customer', 'delivery', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { deliveryId } = params;
    const { searchParams } = new URL(request.url);
    const getHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '1');

    if (getHistory) {
      // Get location history
      const locationHistory = await DeliveryLocation.find({ deliveryId })
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 100)) // Cap at 100 for performance
        .select('location timestamp accuracy speed heading status address');

      return NextResponse.json(
        {
          success: true,
          data: {
            deliveryId,
            history: locationHistory,
            count: locationHistory.length
          }
        },
        { status: 200 }
      );
    } else {
      // Get latest location
      const latestLocation = await DeliveryLocation.findOne({ 
        deliveryId, 
        isLive: true 
      }).sort({ timestamp: -1 });

      if (!latestLocation) {
        return NextResponse.json(
          { error: 'No location data found for this delivery' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            deliveryId,
            location: latestLocation.location,
            timestamp: latestLocation.timestamp,
            accuracy: latestLocation.accuracy,
            speed: latestLocation.speed,
            heading: latestLocation.heading,
            status: latestLocation.status,
            address: latestLocation.address
          }
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error fetching delivery location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/delivery/[deliveryId]/location - Stop tracking (mark as completed)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    let user;
    try {
      user = verifyToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only delivery personnel and admin can stop tracking
    if (user.role !== 'delivery' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Delivery role required.' },
        { status: 403 }
      );
    }

    const { deliveryId } = params;

    // Update the live location to completed status
    const result = await DeliveryLocation.updateOne(
      { deliveryId, isLive: true },
      { 
        status: 'completed',
        isLive: false,
        timestamp: new Date()
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No active delivery found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Delivery tracking stopped successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error stopping delivery tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 