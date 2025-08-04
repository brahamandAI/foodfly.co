import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    if (user.role !== 'chef') {
      return NextResponse.json(
        { error: 'Chef authentication required' },
        { status: 401 }
      );
    }

    // Get chef data with stats
    const chef = await User.findById(user._id);
    if (!chef || chef.role !== 'chef') {
      return NextResponse.json(
        { error: 'Chef not found' },
        { status: 404 }
      );
    }

    const stats = {
      chef: {
        name: chef.name,
        email: chef.email,
        rating: chef.chefProfile?.rating || 5.0,
        totalEvents: chef.chefProfile?.performance?.completedEvents || 0,
        availability: chef.chefProfile?.availability?.status || 'offline',
        specialization: chef.chefProfile?.specialization || [],
        priceRange: chef.chefProfile?.priceRange || { min: 0, max: 0, currency: 'INR' }
      },
      stats: {
        pendingRequests: 0, // Will be calculated from bookings
        completedEvents: chef.chefProfile?.performance?.completedEvents || 0,
        rating: chef.chefProfile?.rating || 5.0,
        earnings: 0 // Will be calculated from completed bookings
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching chef dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}