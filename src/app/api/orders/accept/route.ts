import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is a delivery partner
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'delivery') {
      return NextResponse.json(
        { error: 'Access denied. Delivery partner role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, customerName, customerPhone, pickupAddress, deliveryAddress, estimatedTime, earnings, items, distance, restaurantName } = body;

    // Create or update order in database
    const orderData = {
      _id: id,
      customerId: 'temp_customer', // In real app, get from order
      restaurantId: 'temp_restaurant', // In real app, get from order
      deliveryPartnerId: decoded.userId,
      customerName,
      customerPhone,
      pickupAddress,
      deliveryAddress,
      estimatedDeliveryTime: estimatedTime,
      deliveryFee: earnings,
      items: items.map((item: string) => ({ name: item, quantity: 1 })),
      distance,
      restaurantName,
      deliveryStatus: 'accepted',
      orderStatus: 'confirmed',
      acceptedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const order = await Order.findByIdAndUpdate(
      id,
      orderData,
      { upsert: true, new: true }
    );

    // Update delivery partner stats
    await User.findByIdAndUpdate(decoded.userId, {
      $inc: { 
        'deliveryProfile.totalDeliveries': 0, // Will increment on completion
        'deliveryProfile.totalEarnings': 0    // Will increment on completion
      },
      $set: {
        'deliveryProfile.lastOrderAcceptedAt': new Date(),
        'deliveryProfile.isActive': true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      order: {
        id: order._id,
        status: order.deliveryStatus,
        acceptedAt: order.acceptedAt
      }
    });

  } catch (error) {
    console.error('Error accepting order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}