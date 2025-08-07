import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB();
    
    const orderId = params.orderId;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get token from headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch order with populated fields
    const order = await Order.findById(orderId)
      .populate({
        path: 'restaurant',
        select: 'name image phone address'
      })
      .populate({
        path: 'items.menuItem',
        select: 'name price image isVeg description category'
      })
      .populate({
        path: 'deliveryPartner',
        select: 'name phone vehicleNumber'
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Format the response
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      restaurant: {
        _id: order.restaurant._id,
        name: order.restaurant.name,
        image: order.restaurant.image,
        phone: order.restaurant.phone,
        address: order.restaurant.address
      },
      items: order.items.map((item: any) => ({
        _id: item._id,
        menuItem: {
          _id: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          image: item.menuItem.image,
          isVeg: item.menuItem.isVeg,
          description: item.menuItem.description,
          category: item.menuItem.category
        },
        quantity: item.quantity,
        price: item.price,
        customization: item.customization
      })),
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      subtotal: order.subtotal,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      placedAt: order.placedAt,
      deliveredAt: order.deliveredAt,
      rating: order.rating,
      review: order.review,
      createdAt: order.createdAt,
      cancelledAt: order.cancelledAt,
      deliveryPartner: order.deliveryPartner ? {
        _id: order.deliveryPartner._id,
        name: order.deliveryPartner.name,
        phone: order.deliveryPartner.phone,
        vehicleNumber: order.deliveryPartner.vehicleNumber
      } : null
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch (error: any) {
    console.error('Error fetching order details:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
} 