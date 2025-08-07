import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import Order from '@/lib/backend/models/order.model';
import User from '@/lib/backend/models/user.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all orders from database with user details
    const orders = await Order.find({})
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 }); // Newest first

    return NextResponse.json({
      orders: orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId._id,
        customerEmail: order.customerId.email,
        restaurant: {
          _id: order.restaurantId || 'unknown',
          name: order.restaurantName || 'Unknown Restaurant'
        },
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        placedAt: order.placedAt || order.createdAt,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        specialInstructions: order.specialInstructions
      })),
      message: 'Orders retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get admin orders error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const user = verifyToken(request);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { orderId, status, notes } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        ...(notes && { adminNotes: notes }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
        ...(status === 'cancelled' && { cancelledAt: new Date() })
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 