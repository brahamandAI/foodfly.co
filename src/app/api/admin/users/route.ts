import { verifyToken } from '@/lib/backend/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import Order from '@/lib/backend/models/order.model';

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

    // Get all users with their order statistics
    const users = await User.find({})
      .select('name email phone role isActive createdAt updatedAt lastLogin')
      .sort({ createdAt: -1 });

    // Get order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'user') {
          // Get order stats for customers only
          const [totalOrders, totalSpent] = await Promise.all([
            Order.countDocuments({ customerId: user._id }),
            Order.aggregate([
              { $match: { customerId: user._id, status: 'delivered' } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
          ]);

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            totalOrders,
            totalSpent: totalSpent[0]?.total || 0
          };
        } else {
          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            totalOrders: 0,
            totalSpent: 0
          };
        }
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      message: 'Users retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get admin users error:', error);
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