import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Chef from '@/lib/backend/models/chef.model';
import Review from '@/lib/backend/models/review.model';
import ChefBooking from '@/lib/backend/models/chefBooking.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// GET /api/chefs/[id] - Get specific chef profile with reviews and availability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Get chef details
    const chef = await Chef.findById(id)
      .select('-password')
      .lean();

    if (!chef || !chef.isActive) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef not found or inactive' 
        },
        { status: 404 }
      );
    }

    // Get chef reviews
    const reviews = await Review.find({
      targetType: 'chef',
      targetId: id,
      status: 'approved'
    })
    .sort({ submittedAt: -1 })
    .limit(10)
    .lean();

    // Get chef booking statistics
    const bookingStats = await ChefBooking.aggregate([
      { $match: { chefId: id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgRating: { $avg: '$feedback.customer.rating' },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'completed'] },
                '$pricing.totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get availability for next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const bookedDates = await ChefBooking.find({
      chefId: id,
      'bookingDetails.eventDate': {
        $gte: today,
        $lte: thirtyDaysLater
      },
      status: { $in: ['confirmed', 'chef_assigned', 'in_progress'] }
    })
    .select('bookingDetails.eventDate bookingDetails.eventTime bookingDetails.duration')
    .lean();

    // Calculate review summary
    const reviewSummary = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : chef.chefProfile.rating,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        chef,
        reviews: {
          summary: reviewSummary,
          recent: reviews.slice(0, 5) // Latest 5 reviews
        },
        stats: bookingStats[0] || {
          totalBookings: 0,
          completedBookings: 0,
          avgRating: chef.chefProfile.rating,
          totalRevenue: 0
        },
        availability: {
          schedule: chef.chefProfile.availability,
          bookedDates: bookedDates.map(booking => ({
            date: booking.bookingDetails.eventDate,
            time: booking.bookingDetails.eventTime,
            duration: booking.bookingDetails.duration
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching chef profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch chef profile' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/chefs/[id] - Update chef profile (authenticated chef only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication token required' 
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    const { id } = params;

    // Verify chef can only update their own profile or admin
    if (decoded.userId !== id && decoded.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized to update this profile' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only allow specific fields to be updated
    const allowedFields = [
      'name', 'phone', 'profilePhoto',
      'chefProfile.specialization',
      'chefProfile.priceRange',
      'chefProfile.availability',
      'chefProfile.portfolio',
      'chefProfile.location.serviceAreas'
    ];

    // Build update object based on allowed fields
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      } else if (key.startsWith('chefProfile.') && allowedFields.some(field => key.startsWith(field))) {
        updateData[key] = body[key];
      }
    });

    const chef = await Chef.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!chef) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chef profile updated successfully',
      data: chef
    });

  } catch (error) {
    console.error('Error updating chef profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update chef profile' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/chefs/[id] - Deactivate chef profile (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication token required' 
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    // Only admin can deactivate chef profiles
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Admin access required' 
        },
        { status: 403 }
      );
    }

    const { id } = params;

    const chef = await Chef.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');

    if (!chef) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chef profile deactivated successfully',
      data: chef
    });

  } catch (error) {
    console.error('Error deactivating chef profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to deactivate chef profile' 
      },
      { status: 500 }
    );
  }
}