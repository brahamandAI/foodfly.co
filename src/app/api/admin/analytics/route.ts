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

    // Get database statistics
    const [
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({}),
      
      // Total users (excluding admins)
      User.countDocuments({ role: { $ne: 'admin' } }),
      
      // Total revenue from delivered orders
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Pending orders count
      Order.countDocuments({ 
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } 
      }),
      
      // Delivered orders count
      Order.countDocuments({ status: 'delivered' }),
      
      // Cancelled orders count
      Order.countDocuments({ status: 'cancelled' }),
      
      // Recent orders for additional stats
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .select('totalAmount rating createdAt status')
    ]);

    // Calculate average rating from orders that have ratings
    const ordersWithRating = recentOrders.filter(order => order.rating && order.rating > 0);
    const averageRating = ordersWithRating.length > 0 
      ? ordersWithRating.reduce((sum, order) => sum + order.rating, 0) / ordersWithRating.length
      : 0;

    // Get unique restaurant count from orders
    const uniqueRestaurants = await Order.distinct('restaurantId');
    const totalRestaurants = uniqueRestaurants.length;

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todaysOrders, todaysRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // This month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const [monthlyOrders, monthlyRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const analytics = {
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalRestaurants,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      
      // Today's stats
      todaysOrders,
      todaysRevenue: todaysRevenue[0]?.total || 0,
      
      // This month's stats
      monthlyOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      
      // Additional insights
      completionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      cancellationRate: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
      
      // Growth metrics (simplified - comparing this month vs all time)
      orderGrowth: totalOrders > 0 ? Math.round((monthlyOrders / totalOrders) * 100) : 0,
      revenueGrowth: totalRevenue[0]?.total > 0 ? Math.round((monthlyRevenue[0]?.total || 0) / totalRevenue[0].total * 100) : 0
    };

    return NextResponse.json(analytics);

  } catch (error: any) {
    console.error('Get admin analytics error:', error);
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