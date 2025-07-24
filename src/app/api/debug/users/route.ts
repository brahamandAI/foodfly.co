import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all users (without passwords) for debugging
    const users = await User.find({}).select('-password').limit(10);
    
    const userSummary = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    return NextResponse.json({
      message: 'Debug: Users in database',
      totalUsers: users.length,
      users: userSummary,
      databaseConnection: 'Connected successfully'
    });

  } catch (error: any) {
    console.error('Debug users error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        message: error.message,
        databaseConnection: 'Failed'
      },
      { status: 500 }
    );
  }
} 