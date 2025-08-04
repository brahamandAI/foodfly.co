import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

// Create a new chef service request
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const body = await request.json();
    const {
      eventDetails,
      location,
      budget,
      preferredChefId
    } = body;

    // Validate required fields
    if (!eventDetails || !location || !budget) {
      return NextResponse.json(
        { error: 'Event details, location, and budget are required' },
        { status: 400 }
      );
    }

    // Get user details
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate event date (must be in future)
    const eventDate = new Date(eventDetails.date);
    if (eventDate <= new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    // For now, return success without actually creating booking
    // This will be implemented with proper ChefBooking model
    const bookingId = new Date().getTime().toString();
    
    return NextResponse.json({
      message: 'Chef service request created successfully',
      bookingId: bookingId,
      status: 'pending',
      eventDetails: {
        type: eventDetails.type,
        title: eventDetails.title,
        date: eventDate,
        guestCount: eventDetails.guestCount,
        cuisine: eventDetails.cuisine
      },
      location: location,
      budget: budget
    });

  } catch (error) {
    console.error('Error creating chef request:', error);
    return NextResponse.json(
      { error: 'Failed to create chef service request' },
      { status: 500 }
    );
  }
}

// Get user's chef requests
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    // For now, return empty array - will be implemented with proper ChefBooking model
    return NextResponse.json({
      requests: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    });

  } catch (error) {
    console.error('Error fetching chef requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chef requests' },
      { status: 500 }
    );
  }
}

// Helper function to find available chefs
async function findAvailableChefs(city: string, cuisines: string[], eventDate: Date) {
  try {
    const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    const chefs = await User.find({
      role: 'chef',
      'chefProfile.verification.isVerified': true,
      'chefProfile.location.serviceAreas': { $in: [city] },
      'chefProfile.specialization': { $in: cuisines },
      'chefProfile.availability.status': { $in: ['available'] },
      [`chefProfile.availability.weeklySchedule.${dayOfWeek}.available`]: true
    }).sort({
      'chefProfile.rating': -1,
      'chefProfile.performance.acceptanceRate': -1
    });

    return chefs;
  } catch (error) {
    console.error('Error finding available chefs:', error);
    return [];
  }
}