import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';

export const dynamic = 'force-dynamic';

// Get list of available chefs
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const cuisine = url.searchParams.get('cuisine');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build query for chefs (include all active chefs, not just those with specific availability)
    let query: any = {
      role: 'chef',
      $or: [
        { 'chefProfile.availability.status': { $in: ['available', 'busy', 'offline'] } },
        { 'chefProfile.availability.status': { $exists: false } }, // Include new chefs without availability set
        { 'chefProfile': { $exists: true } } // Include chefs with basic profile
      ]
    };

    // Filter by city if provided
    if (city) {
      query['chefProfile.location.serviceAreas'] = { $in: [city] };
    }

    // Filter by cuisine if provided
    if (cuisine) {
      query['chefProfile.specialization'] = { $in: [cuisine] };
    }

    // Get chefs with pagination
    const chefs = await User.find(query)
      .select('name email phone chefProfile picture')
      .sort({ 
        'chefProfile.rating': -1,
        'chefProfile.performance.completedEvents': -1 
      })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Format chef data for response
    const formattedChefs = chefs.map(chef => ({
      _id: chef._id,
      name: chef.name,
      email: chef.email,
      phone: chef.phone,
      picture: chef.picture,
      profilePhoto: chef.picture, // Add for compatibility
      chefProfile: {
        rating: chef.chefProfile?.rating || 5.0,
        specialization: chef.chefProfile?.specialization || ['Multi-Cuisine'],
        experience: chef.chefProfile?.experience || 1,
        priceRange: chef.chefProfile?.priceRange || { min: 2000, max: 10000, currency: 'INR' },
        location: {
          serviceAreas: chef.chefProfile?.location?.serviceAreas || ['Available Online']
        },
        availability: {
          status: chef.chefProfile?.availability?.status || 'available'
        },
        performance: {
          completedEvents: chef.chefProfile?.performance?.completedEvents || 0
        },
        portfolio: {
          photos: chef.chefProfile?.portfolio?.photos || [],
          description: chef.chefProfile?.portfolio?.description || 'Professional chef with expertise in various cuisines.',
          signature_dishes: chef.chefProfile?.portfolio?.signature_dishes || ['Signature Dishes']
        },
        verification: {
          isVerified: chef.chefProfile?.verification?.isVerified || false
        },
        totalEvents: chef.chefProfile?.performance?.completedEvents || 0
      }
    }));

    return NextResponse.json({
      chefs: formattedChefs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        city,
        cuisine
      }
    });

  } catch (error) {
    console.error('Error fetching chefs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chefs' },
      { status: 500 }
    );
  }
}