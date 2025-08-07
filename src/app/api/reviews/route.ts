import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Review from '@/lib/backend/models/review.model';
import User from '@/lib/backend/models/user.model';
import { Restaurant } from '@/lib/backend/models/restaurant.model';
import Chef from '@/lib/backend/models/chef.model';
import Order from '@/lib/backend/models/order.model';
import ChefBooking from '@/lib/backend/models/chefBooking.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
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
    const userId = decoded.userId;

    const body = await request.json();
    const {
      targetType,
      targetId,
      orderId,
      chefBookingId,
      rating,
      review,
      title,
      breakdown,
      media,
      context
    } = body;

    // Validate required fields
    if (!targetType || !targetId || !rating) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: targetType, targetId, rating' 
        },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Rating must be between 1 and 5' 
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Verify target exists and get target details
    let target: any = {};
    let isVerifiedPurchase = false;

    switch (targetType) {
      case 'restaurant':
        const restaurant = await Restaurant.findById(targetId);
        if (!restaurant) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Restaurant not found' 
            },
            { status: 404 }
          );
        }
        target = {
          name: restaurant.name,
          type: restaurant.cuisine || 'Restaurant',
          location: restaurant.location
        };
        
        // Check if user has ordered from this restaurant
        if (orderId) {
          const order = await Order.findOne({ 
            _id: orderId, 
            userId, 
            restaurantId: targetId,
            status: 'delivered' 
          });
          isVerifiedPurchase = !!order;
        }
        break;

      case 'chef':
        const chef = await Chef.findById(targetId).select('-password');
        if (!chef) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Chef not found' 
            },
            { status: 404 }
          );
        }
        target = {
          name: chef.name,
          type: chef.chefProfile.specialization.join(', '),
          location: chef.chefProfile.location.serviceAreas.join(', ')
        };

        // Check if user has booked this chef
        if (chefBookingId) {
          const booking = await ChefBooking.findOne({
            _id: chefBookingId,
            customerId: userId,
            chefId: targetId,
            status: 'completed'
          });
          isVerifiedPurchase = !!booking;
        }
        break;

      case 'order':
        const order = await Order.findOne({ 
          _id: targetId, 
          userId,
          status: 'delivered' 
        });
        if (!order) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Order not found or not delivered' 
            },
            { status: 404 }
          );
        }
        target = {
          name: `Order #${order._id.toString().slice(-6)}`,
          type: 'Food Order',
          location: order.deliveryAddress?.city || ''
        };
        isVerifiedPurchase = true;
        break;

      case 'chef_booking':
        const booking = await ChefBooking.findOne({
          _id: targetId,
          customerId: userId,
          status: 'completed'
        });
        if (!booking) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Chef booking not found or not completed' 
            },
            { status: 404 }
          );
        }
        target = {
          name: booking.chef.name,
          type: booking.bookingDetails.eventType,
          location: booking.bookingDetails.venue.address.city
        };
        isVerifiedPurchase = true;
        break;

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid target type' 
          },
          { status: 400 }
        );
    }

    // Check for duplicate reviews (for restaurants and chefs)
    if (['restaurant', 'chef'].includes(targetType)) {
      const existingReview = await Review.findOne({
        userId,
        targetType,
        targetId
      });

      if (existingReview) {
        return NextResponse.json(
          { 
            success: false,
            error: 'You have already reviewed this ' + targetType 
          },
          { status: 409 }
        );
      }
    }

    // Count user's total reviews
    const userReviewCount = await Review.countDocuments({ userId });

    // Create review
    const newReview = new Review({
      userId,
      targetType,
      targetId,
      orderId,
      chefBookingId,
      rating,
      review,
      title,
      breakdown: breakdown || {},
      media: {
        images: media?.images || [],
        videos: media?.videos || []
      },
      context: {
        ...context,
        isVerifiedPurchase
      },
      user: {
        name: user.name,
        profilePicture: user.picture,
        isVerified: user.isEmailVerified,
        totalReviews: userReviewCount + 1,
        memberSince: user.createdAt || new Date()
      },
      target,
      engagement: {
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        reportCount: 0,
        replies: []
      },
      status: 'pending', // Will be auto-approved for verified purchases
      metadata: {
        source: 'web',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        language: 'en'
      },
      submittedAt: new Date()
    });

    // Auto-approve reviews from verified purchases
    if (isVerifiedPurchase) {
      newReview.status = 'approved';
    }

    await newReview.save();

    // Update target's rating if review is approved
    if (newReview.status === 'approved') {
      await updateTargetRating(targetType, targetId);
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        reviewId: newReview._id,
        status: newReview.status,
        isVerifiedPurchase
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to submit review' 
      },
      { status: 500 }
    );
  }
}

// GET /api/reviews - Get reviews with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const targetType = url.searchParams.get('targetType');
    const targetId = url.searchParams.get('targetId');
    const userId = url.searchParams.get('userId');
    const rating = url.searchParams.get('rating');
    const status = url.searchParams.get('status') || 'approved';
    const verifiedOnly = url.searchParams.get('verifiedOnly') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'recent'; // recent, helpful, rating_high, rating_low
    const skip = (page - 1) * limit;

    // Build query
    let query: any = { status };

    if (targetType && targetId) {
      query.targetType = targetType;
      query.targetId = targetId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (verifiedOnly) {
      query['context.isVerifiedPurchase'] = true;
    }

    // Sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'helpful':
        sortOptions = { 'engagement.helpfulVotes': -1, submittedAt: -1 };
        break;
      case 'rating_high':
        sortOptions = { rating: -1, submittedAt: -1 };
        break;
      case 'rating_low':
        sortOptions = { rating: 1, submittedAt: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { submittedAt: -1 };
    }

    // Get reviews
    const reviews = await Review.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);

    // Get review statistics if filtering by target
    let stats: any = null;
    if (targetType && targetId) {
      stats = await Review.aggregate([
        { 
          $match: { 
            targetType, 
            targetId, 
            status: 'approved' 
          } 
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (stats.length > 0) {
        const distribution = stats[0].ratingDistribution;
        stats[0].ratingDistribution = {
          5: distribution.filter((r: number) => r === 5).length,
          4: distribution.filter((r: number) => r === 4).length,
          3: distribution.filter((r: number) => r === 3).length,
          2: distribution.filter((r: number) => r === 2).length,
          1: distribution.filter((r: number) => r === 1).length,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: reviews.length,
          totalReviews: total
        },
        stats: stats?.[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch reviews' 
      },
      { status: 500 }
    );
  }
}

// Helper function to update target rating
async function updateTargetRating(targetType: string, targetId: string) {
  try {
    const reviews = await Review.find({
      targetType,
      targetId,
      status: 'approved'
    });

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const totalReviews = reviews.length;

    switch (targetType) {
      case 'restaurant':
        await Restaurant.findByIdAndUpdate(targetId, {
          'rating.average': Number(averageRating.toFixed(1)),
          'rating.count': totalReviews
        });
        break;

      case 'chef':
        await Chef.findByIdAndUpdate(targetId, {
          'chefProfile.rating': Number(averageRating.toFixed(1)),
          'chefProfile.totalEvents': totalReviews
        });
        break;
    }
  } catch (error) {
    console.error('Error updating target rating:', error);
  }
}