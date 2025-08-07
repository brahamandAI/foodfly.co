import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Chef from '@/lib/backend/models/chef.model';
import ChefBooking from '@/lib/backend/models/chefBooking.model';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/utils/jwt';

// POST /api/chefs/book - Book a chef for a specific date/event
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
    const customerId = decoded.userId;

    const body = await request.json();
    const {
      chefId,
      eventType,
      eventDate,
      eventTime,
      duration,
      guestCount,
      cuisine,
      venue,
      specialRequests,
      dietaryRestrictions,
      paymentMethod = 'cod'
    } = body;

    // Validate required fields
    if (!chefId || !eventType || !eventDate || !eventTime || !duration || !guestCount || !cuisine || !venue) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required booking details' 
        },
        { status: 400 }
      );
    }

    // Get chef details
    const chef = await Chef.findById(chefId).select('-password');
    if (!chef || !chef.isActive || !chef.chefProfile.verification.isVerified) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef not found or not available' 
        },
        { status: 404 }
      );
    }

    // Get customer details
    const customer = await User.findById(customerId).select('-password');
    if (!customer) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Customer not found' 
        },
        { status: 404 }
      );
    }

    // Check chef availability for the requested date
    const requestedDate = new Date(eventDate);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Check if chef is available on that day
    const chefSchedule = chef.chefProfile.availability.weeklySchedule.get(dayOfWeek);
    if (!chefSchedule || !chefSchedule.available) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef is not available on the selected day' 
        },
        { status: 400 }
      );
    }

    // Check for existing bookings on the same date
    const existingBooking = await ChefBooking.findOne({
      chefId,
      'bookingDetails.eventDate': {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'confirmed', 'chef_assigned', 'in_progress'] }
    });

    if (existingBooking) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chef is already booked for this date' 
        },
        { status: 409 }
      );
    }

    // Calculate pricing
    const basePrice = chef.chefProfile.priceRange.min * duration;
    let additionalCharges = {
      ingredient_cost: 0,
      travel_fee: 0,
      equipment_rental: 0,
      extra_hours: 0
    };

    // Add charges based on guest count
    if (guestCount > 10) {
      additionalCharges.extra_hours = (guestCount - 10) * 200;
    }

    // Add travel fee if venue is customer home
    if (venue.type === 'customer_home') {
      additionalCharges.travel_fee = 500;
    }

    // Add equipment rental for large events
    if (guestCount > 20) {
      additionalCharges.equipment_rental = 1000;
    }

    const totalAmount = basePrice + Object.values(additionalCharges).reduce((sum, charge) => sum + charge, 0);

    // Create booking
    const booking = new ChefBooking({
      customerId,
      chefId,
      bookingDetails: {
        eventType,
        eventDate: new Date(eventDate),
        eventTime,
        duration,
        guestCount,
        specialRequests,
        dietaryRestrictions: dietaryRestrictions || [],
        cuisine: Array.isArray(cuisine) ? cuisine : [cuisine],
        venue
      },
      pricing: {
        basePrice,
        additionalCharges,
        totalAmount,
        currency: 'INR'
      },
      status: 'pending',
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      chef: {
        id: chef._id,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        specialization: chef.chefProfile.specialization,
        rating: chef.chefProfile.rating
      },
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || ''
      },
      timeline: {
        bookedAt: new Date()
      },
      communication: {
        messages: [{
          from: 'customer',
          message: `Booking request for ${eventType} on ${eventDate}`,
          timestamp: new Date(),
          type: 'system_update'
        }]
      },
      metadata: {
        source: 'web',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    await booking.save();

    // Update chef's total events (pending bookings count)
    await Chef.findByIdAndUpdate(chefId, {
      $inc: { 'chefProfile.totalEvents': 1 }
    });

    return NextResponse.json({
      success: true,
      message: 'Chef booking request created successfully',
      data: {
        bookingId: booking._id,
        booking: {
          id: booking._id,
          status: booking.status,
          eventDate: booking.bookingDetails.eventDate,
          eventTime: booking.bookingDetails.eventTime,
          totalAmount: booking.pricing.totalAmount,
          chef: booking.chef,
          customer: booking.customer
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating chef booking:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create chef booking' 
      },
      { status: 500 }
    );
  }
}

// GET /api/chefs/book - Get user's chef bookings
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {
      $or: [
        { customerId: userId },
        { chefId: userId } // If user is a chef, show their bookings too
      ]
    };

    if (status) {
      query.status = status;
    }

    // Get bookings
    const bookings = await ChefBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChefBooking.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: bookings.length,
          totalBookings: total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching chef bookings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch chef bookings' 
      },
      { status: 500 }
    );
  }
}