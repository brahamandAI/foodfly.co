import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import ChefBooking from '@/lib/backend/models/chefBooking.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

// Get chef's events
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

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query for chef bookings
    let query: any = { chefId: user._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get chef bookings with pagination
    const events = await ChefBooking.find(query)
      .sort({ 'timeline.bookedAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChefBooking.countDocuments(query);

    // Format events for chef dashboard
    const formattedEvents = events.map(booking => ({
      _id: booking._id,
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone
      },
      eventDetails: {
        type: booking.bookingDetails.eventType,
        title: `${booking.bookingDetails.eventType} for ${booking.customer.name}`,
        description: `${booking.bookingDetails.guestCount} guests • ${booking.bookingDetails.cuisine.join(', ')} cuisine`,
        date: booking.bookingDetails.eventDate,
        duration: booking.bookingDetails.duration,
        guestCount: booking.bookingDetails.guestCount,
        cuisine: booking.bookingDetails.cuisine
      },
      location: {
        address: booking.bookingDetails.venue.address || '',
        city: booking.bookingDetails.venue.city || '',
        state: booking.bookingDetails.venue.state || ''
      },
      budget: {
        min: booking.pricing.basePrice,
        max: booking.pricing.totalAmount,
        currency: booking.pricing.currency
      },
      status: booking.status,
      timeline: {
        requestedAt: booking.timeline.bookedAt,
        assignedAt: booking.timeline.bookedAt,
        respondedAt: booking.timeline.respondedAt
      },
      communication: {
        messages: booking.communication?.messages || []
      }
    }));

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching chef events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// Update event status (accept/decline)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    if (user.role !== 'chef') {
      return NextResponse.json(
        { error: 'Chef authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, action, message } = body;

    if (!eventId || !action) {
      return NextResponse.json(
        { error: 'Event ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Find the chef booking
    const booking = await ChefBooking.findOne({
      _id: eventId,
      chefId: user._id,
      status: { $in: ['pending'] }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not available for response' },
        { status: 404 }
      );
    }

    // Update booking status
    const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
    booking.status = newStatus;
    booking.timeline.respondedAt = new Date();

    // Add message to communication if provided
    if (message) {
      if (!booking.communication.messages) {
        booking.communication.messages = [];
      }
      booking.communication.messages.push({
        from: 'chef',
        message: message,
        timestamp: new Date(),
        type: 'chef_response'
      });
    }

    await booking.save();

    // Update chef's performance metrics
    if (action === 'accept') {
      await User.findByIdAndUpdate(user._id, {
        $inc: { 'chefProfile.performance.completedEvents': 1 }
      });
    }

    return NextResponse.json({
      message: `Booking ${action}ed successfully`,
      booking
    });

  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}