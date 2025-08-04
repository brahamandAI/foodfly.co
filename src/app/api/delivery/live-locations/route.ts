import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import DeliveryLocation from '@/lib/backend/models/deliveryLocation.model';
import Order from '@/lib/backend/models/order.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// GET /api/delivery/live-locations - Get all active delivery locations (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication token required' 
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Admin access required' 
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const deliveryPartnerId = url.searchParams.get('deliveryPartnerId');
    const minutes = parseInt(url.searchParams.get('minutes') || '30'); // Last N minutes

    // Get active deliveries from last N minutes
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    let query: any = {
      isLive: true,
      status: 'active',
      timestamp: { $gte: cutoffTime }
    };

    if (deliveryPartnerId) {
      query.deliveryPersonId = deliveryPartnerId;
    }

    // Get latest location for each active delivery
    const activeDeliveries = await DeliveryLocation.aggregate([
      { $match: query },
      {
        $sort: { deliveryId: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: '$deliveryId',
          latestLocation: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestLocation' }
      }
    ]);

    // Get order details for each delivery
    const orderIds = activeDeliveries.map(delivery => delivery.orderId);
    const orders = await Order.find({
      _id: { $in: orderIds }
    })
    .select('userId deliveryAddress assignedDeliveryPartner createdAt totalAmount')
    .lean();

    // Combine delivery locations with order data
    const enrichedDeliveries = activeDeliveries.map(delivery => {
      const order = orders.find(o => o._id.toString() === delivery.orderId);
      return {
        ...delivery,
        orderDetails: order ? {
          id: order._id,
          customerAddress: order.deliveryAddress,
          orderValue: order.totalAmount,
          orderTime: order.createdAt,
          deliveryPartner: order.assignedDeliveryPartner
        } : null
      };
    });

    // Filter by city if specified
    let filteredDeliveries = enrichedDeliveries;
    if (city) {
      filteredDeliveries = enrichedDeliveries.filter(delivery => 
        delivery.orderDetails?.customerAddress?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    // Get summary statistics
    const stats = {
      totalActiveDeliveries: filteredDeliveries.length,
      avgSpeed: filteredDeliveries.reduce((sum, d) => sum + (d.speed || 0), 0) / filteredDeliveries.length || 0,
      cityCounts: {},
      lastUpdateTime: activeDeliveries.length > 0 ? 
        Math.max(...activeDeliveries.map(d => new Date(d.timestamp).getTime())) : null
    };

    // Count deliveries by city
    enrichedDeliveries.forEach(delivery => {
      const city = delivery.orderDetails?.customerAddress?.city || 'Unknown';
      stats.cityCounts[city] = (stats.cityCounts[city] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        activeDeliveries: filteredDeliveries,
        stats,
        lastRefresh: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching live delivery locations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch live delivery locations' 
      },
      { status: 500 }
    );
  }
}