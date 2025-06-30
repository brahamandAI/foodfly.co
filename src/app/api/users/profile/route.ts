import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication using middleware
    const user = verifyToken(request);
    
    // Find user by ID
    const dbUser = await User.findById(user._id).select('-password');
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        isEmailVerified: dbUser.isEmailVerified,
        addresses: dbUser.addresses,
        preferences: dbUser.preferences,
        healthProfile: dbUser.healthProfile,
        lastLogin: dbUser.lastLogin,
        createdAt: dbUser.createdAt
      }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication using middleware
    const user = verifyToken(request);
    
    const { name, phone, preferences, healthProfile } = await request.json();
    
    // Find and update user
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name) dbUser.name = name.trim();
    if (phone) dbUser.phone = phone.trim();
    if (preferences) dbUser.preferences = { ...dbUser.preferences, ...preferences };
    if (healthProfile) dbUser.healthProfile = { ...dbUser.healthProfile, ...healthProfile };

    await dbUser.save();
    
    // Return updated user data
    const updatedUser = await User.findById(user._id).select('-password');
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        addresses: updatedUser.addresses,
        preferences: updatedUser.preferences,
        healthProfile: updatedUser.healthProfile,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 