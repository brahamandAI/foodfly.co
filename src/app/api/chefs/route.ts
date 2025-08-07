import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Chef from '@/lib/backend/models/chef.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// GET /api/chefs - List all available chefs with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const city = url.searchParams.get('city');
    const cuisine = url.searchParams.get('cuisine');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const rating = url.searchParams.get('rating');
    const availability = url.searchParams.get('availability');
    const experience = url.searchParams.get('experience');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const sortBy = url.searchParams.get('sortBy') || 'rating'; // rating, experience, price, recent
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {
      isActive: true,
      'chefProfile.verification.isVerified': true
    };

    // Location filter
    if (city) {
      query['chefProfile.location.serviceAreas'] = { $in: [city] };
    }

    // Cuisine filter
    if (cuisine) {
      query['chefProfile.specialization'] = { $in: [cuisine] };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['chefProfile.priceRange.min'] = {};
      if (minPrice) {
        query['chefProfile.priceRange.min'].$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query['chefProfile.priceRange.max'] = { $lte: parseFloat(maxPrice) };
      }
    }

    // Rating filter
    if (rating) {
      query['chefProfile.rating'] = { $gte: parseFloat(rating) };
    }

    // Availability filter
    if (availability) {
      query['chefProfile.availability.status'] = availability;
    }

    // Experience filter
    if (experience) {
      query['chefProfile.experience'] = { $gte: parseInt(experience) };
    }

    // Sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { 'chefProfile.rating': -1, 'chefProfile.totalEvents': -1 };
        break;
      case 'experience':
        sortOptions = { 'chefProfile.experience': -1, 'chefProfile.rating': -1 };
        break;
      case 'price_low':
        sortOptions = { 'chefProfile.priceRange.min': 1, 'chefProfile.rating': -1 };
        break;
      case 'price_high':
        sortOptions = { 'chefProfile.priceRange.max': -1, 'chefProfile.rating': -1 };
        break;
      case 'recent':
        sortOptions = { joinedAt: -1 };
        break;
      default:
        sortOptions = { 'chefProfile.rating': -1, 'chefProfile.totalEvents': -1 };
    }

    // Get chefs with pagination
    const chefs = await Chef.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Chef.countDocuments(query);

    // Get filter options for frontend
    const allCities = await Chef.distinct('chefProfile.location.serviceAreas', { 
      isActive: true,
      'chefProfile.verification.isVerified': true 
    });
    
    const allCuisines = await Chef.distinct('chefProfile.specialization', { 
      isActive: true,
      'chefProfile.verification.isVerified': true 
    });

    // Get price range
    const priceRange = await Chef.aggregate([
      { 
        $match: { 
          isActive: true,
          'chefProfile.verification.isVerified': true 
        } 
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$chefProfile.priceRange.min' },
          maxPrice: { $max: '$chefProfile.priceRange.max' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        chefs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: chefs.length,
          totalChefs: total
        },
        filters: {
          cities: allCities.sort(),
          cuisines: allCuisines.sort(),
          priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching chefs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch chefs' 
      },
      { status: 500 }
    );
  }
}

// POST /api/chefs - Create a new chef profile (Registration)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      specialization,
      experience,
      priceRange,
      serviceAreas,
      portfolio,
      availability
    } = body;

    // Check if chef already exists
    const existingChef = await Chef.findOne({ email });
    if (existingChef) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Create chef profile
    const chef = new Chef({
      name,
      email,
      phone,
      password, // Will be hashed by pre-save middleware
      role: 'chef',
      chefProfile: {
        specialization: specialization || [],
        experience: experience || 0,
        rating: 5.0,
        totalEvents: 0,
        priceRange: {
          min: priceRange?.min || 1000,
          max: priceRange?.max || 5000,
          currency: 'INR'
        },
        availability: {
          status: availability?.status || 'available',
          weeklySchedule: availability?.weeklySchedule || {},
          blackoutDates: []
        },
        portfolio: {
          photos: portfolio?.photos || [],
          description: portfolio?.description || '',
          signature_dishes: portfolio?.signature_dishes || []
        },
        location: {
          serviceAreas: serviceAreas || []
        },
        verification: {
          isVerified: false,
          documents: {
            certifications: [],
            experience_letters: [],
            health_certificate: ''
          }
        },
        performance: {
          acceptanceRate: 100,
          avgResponseTime: 30,
          completedEvents: 0,
          cancelledEvents: 0
        }
      },
      isActive: true,
      joinedAt: new Date()
    });

    await chef.save();

    // Remove password from response
    const chefResponse = chef.toObject();
    delete chefResponse.password;

    return NextResponse.json({
      success: true,
      message: 'Chef profile created successfully',
      data: chefResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating chef profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create chef profile' 
      },
      { status: 500 }
    );
  }
}