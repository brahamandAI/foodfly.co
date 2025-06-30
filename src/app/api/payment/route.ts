import { verifyToken } from '@/lib/backend/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import Cart from '@/lib/backend/models/cart.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const { orderId, paymentMethod, paymentDetails } = await request.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Order ID and payment method are required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.customerId.toString() !== user._id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Process payment based on method
    let paymentStatus = 'pending';
    let transactionId = '';

    switch (paymentMethod) {
      case 'cod':
        paymentStatus = 'pending';
        transactionId = `COD_${Date.now()}`;
        break;
      
      case 'online':
        // In real implementation, integrate with payment gateway
        paymentStatus = 'completed';
        transactionId = paymentDetails?.transactionId || `TXN_${Date.now()}`;
        break;
      
      case 'upi':
        // In real implementation, integrate with UPI gateway
        paymentStatus = 'completed';
        transactionId = paymentDetails?.upiTransactionId || `UPI_${Date.now()}`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid payment method' },
          { status: 400 }
        );
    }

    // Update order with payment information
    order.payment = {
      method: paymentMethod,
      status: paymentStatus,
      transactionId,
      amount: order.total,
      processedAt: new Date(),
      details: paymentDetails || {}
    };

    // Update order status
    if (paymentStatus === 'completed') {
      order.status = 'confirmed';
    }

    await order.save();

    // Clear user's cart after successful payment
    if (paymentStatus === 'completed' || paymentMethod === 'cod') {
      await Cart.findOneAndUpdate(
        { userId: user._id },
        { $set: { items: [] } }
      );
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      order: {
        id: order._id,
        status: order.status,
        payment: order.payment,
        total: order.total
      }
    });

  } catch (error: any) {
    console.error('Payment processing error:', error);
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