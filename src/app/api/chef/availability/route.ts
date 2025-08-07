import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

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
    const { status } = body;

    if (!status || !['available', 'busy', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (available, busy, offline)' },
        { status: 400 }
      );
    }

    // Update chef availability in User model
    const chef = await User.findById(user._id);
    if (!chef || chef.role !== 'chef') {
      return NextResponse.json(
        { error: 'Chef not found' },
        { status: 404 }
      );
    }

    chef.chefProfile.availability.status = status;
    await chef.save();

    return NextResponse.json({ 
      message: 'Availability updated successfully',
      status: status 
    });
  } catch (error) {
    console.error('Error updating chef availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}