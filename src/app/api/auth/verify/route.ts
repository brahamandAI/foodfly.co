import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/backend/middleware/auth';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication token
    let user;
    try {
      user = verifyToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get full user details from database
    const fullUser = await User.findById(user._id).select('-password');
    
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: fullUser._id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role,
      isEmailVerified: fullUser.isEmailVerified,
      picture: fullUser.picture,
      phone: fullUser.phone
    }, { status: 200 });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 