import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Review from '@/lib/backend/models/review.model';

// GET /api/reviews/restaurant/[id] - Get reviews for a specific restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const rating = url.searchParams.get('rating');
    const sortBy = url.searchParams.get('sortBy') || 'recent';
    const verifiedOnly = url.searchParams.get('verifiedOnly') === 'true';
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {
      targetType: 'restaurant',
      targetId: id,
      status: 'approved'
    };

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

    // Get review statistics
    const stats = await Review.aggregate([
      { 
        $match: { 
          targetType: 'restaurant',
          targetId: id,
          status: 'approved' 
        } 
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          avgFood: { $avg: '$breakdown.food' },
          avgService: { $avg: '$breakdown.service' },
          avgDelivery: { $avg: '$breakdown.delivery' },
          avgValue: { $avg: '$breakdown.value' },
          avgAmbiance: { $avg: '$breakdown.ambiance' },
          avgCleanliness: { $avg: '$breakdown.cleanliness' },
          ratingDistribution: {
            $push: '$rating'
          },
          verifiedReviews: {
            $sum: { $cond: ['$context.isVerifiedPurchase', 1, 0] }
          }
        }
      }
    ]);

    let reviewStats: any = null;
    if (stats.length > 0) {
      const distribution = stats[0].ratingDistribution;
      reviewStats = {
        ...stats[0],
        ratingDistribution: {
          5: distribution.filter((r: number) => r === 5).length,
          4: distribution.filter((r: number) => r === 4).length,
          3: distribution.filter((r: number) => r === 3).length,
          2: distribution.filter((r: number) => r === 2).length,
          1: distribution.filter((r: number) => r === 1).length,
        }
      };
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
        stats: reviewStats
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch restaurant reviews' 
      },
      { status: 500 }
    );
  }
}