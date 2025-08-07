import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import Order from '@/lib/backend/models/order.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    const { orderId } = params;
    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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
        ...(status === 'cancelled' && { cancelledAt: new Date() }),
        updatedAt: new Date()
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
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
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