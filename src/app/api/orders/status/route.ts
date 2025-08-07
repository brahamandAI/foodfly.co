import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { orderId, status, timestamp } = body;

    // Update order status
    const updateData: any = {
      deliveryStatus: status,
      updatedAt: new Date(timestamp)
    };

    // Set specific timestamps based on status
    if (status === 'picked_up') {
      updateData.pickedUpAt = new Date(timestamp);
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date(timestamp);
      updateData.orderStatus = 'completed';
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If order is delivered, update delivery partner stats
    if (status === 'delivered') {
      await User.findByIdAndUpdate(decoded.userId, {
        $inc: { 
          'deliveryProfile.totalDeliveries': 1,
          'deliveryProfile.totalEarnings': order.deliveryFee || 0
        },
        $set: {
          'deliveryProfile.lastDeliveryCompletedAt': new Date(timestamp)
        }
      });

      // In a real app, you would also:
      // 1. Send notification to customer
      // 2. Update restaurant about completion
      // 3. Process payment to delivery partner
      // 4. Update analytics/metrics
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: order._id,
        status: order.deliveryStatus,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}