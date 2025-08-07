import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Review from '@/lib/backend/models/review.model';

// GET /api/reviews/order/[id] - Get reviews for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Get review for this specific order
    const review = await Review.findOne({
      targetType: 'order',
      targetId: id,
      status: 'approved'
    }).lean();

    if (!review) {
      return NextResponse.json({
        success: true,
        data: {
          review: null,
          hasReview: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        review,
        hasReview: true
      }
    });

  } catch (error) {
    console.error('Error fetching order review:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch order review' 
      },
      { status: 500 }
    );
  }
}