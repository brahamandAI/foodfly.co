import { verifyToken } from '@/lib/backend/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import Cart from '@/lib/backend/models/cart.model';
import Notification from '@/lib/backend/models/notification.model';
import User from '@/lib/backend/models/user.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeCancelled = searchParams.get('includeCancelled') === 'true';
    const status = searchParams.get('status');
    
    // Build query filter
    let queryFilter: any = { customerId: user._id };
    
    // Filter by specific status if provided
    if (status && status !== 'all') {
      queryFilter.status = status;
    } else if (!includeCancelled) {
      // By default, exclude cancelled orders unless specifically requested
      queryFilter.status = { $ne: 'cancelled' };
    }

    // Get user's orders using customerId field
    const orders = await Order.find(queryFilter)
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      orders: orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        restaurant: {
          _id: order.restaurantId,
          name: order.restaurantName
        },
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        taxes: order.taxes,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        specialInstructions: order.specialInstructions,
        placedAt: order.placedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      message: 'Orders retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const { items, deliveryAddress, paymentMethod, specialInstructions, totalAmount } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Get user details
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Extract restaurant info from cart items
    const restaurantId = items[0]?.restaurantId || 'default-restaurant';
    const restaurantName = items[0]?.restaurantName || 'Restaurant';

    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= 300 ? 0 : 40; // Free delivery above ₹300
    const taxes = Math.round(subtotal * 0.05); // 5% tax
    const calculatedTotal = subtotal + deliveryFee + taxes;
    const finalTotal = totalAmount || calculatedTotal;

    // Generate unique order number
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create new order with consistent field names
    const order = new Order({
      customerId: user._id,
      customerEmail: dbUser.email,
      restaurantId,
      restaurantName,
      orderNumber,
      items: items.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations || []
      })),
      subtotal,
      deliveryFee,
      taxes,
      totalAmount: finalTotal,
      status: 'pending',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      deliveryAddress: {
        name: deliveryAddress.name,
        phone: deliveryAddress.phone,
        street: deliveryAddress.street,
        landmark: deliveryAddress.landmark || '',
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode
      },
      specialInstructions: specialInstructions || '',
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      placedAt: new Date()
    });

    await order.save();

    // Create order confirmation notification
    const orderNotification = new Notification({
      userId: user._id,
      type: 'order_confirmed',
      title: 'Order placed successfully! 🎉',
      message: `Your order from ${restaurantName} has been placed and will be delivered in 30-45 minutes.`,
      priority: 'high',
      channels: ['app'],
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        restaurantName,
        totalAmount: finalTotal,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    });

    await orderNotification.save();

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { userId: user._id },
      { $set: { items: [] } }
    );

    return NextResponse.json({
      message: 'Order placed successfully',
      orderId: order._id,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        createdAt: order.createdAt
      }
    });

  } catch (error: any) {
    console.error('Create order error:', error);
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