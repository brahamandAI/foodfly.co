import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find chef by email (CHEF LOGIN ONLY - NO REGULAR USERS)
    console.log('🍳 Chef login attempt for:', email.toLowerCase());
    
    // First check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists && userExists.role !== 'chef') {
      return NextResponse.json(
        { 
          error: `This email is registered as a ${userExists.role}. Please use the regular login or upgrade your account to chef.`,
          userRole: userExists.role,
          redirectTo: userExists.role === 'customer' ? '/login' : '/login'
        },
        { status: 403 }
      );
    }
    
    // Find ONLY chef users
    const chef = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'chef' // STRICTLY CHEF ROLE ONLY
    }).select('+password');

    if (!chef) {
      return NextResponse.json(
        { error: 'Chef account not found. Please register as a chef first.' },
        { status: 401 }
      );
    }

    // Verify this is actually a chef with chef profile
    if (!chef.chefProfile) {
      return NextResponse.json(
        { error: 'Invalid chef account. Please contact support.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await chef.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    chef.lastLogin = new Date();
    await chef.save();

    // Create database-persistent session
    const sessionData = await SessionManager.createSession(
      chef._id.toString(),
      'chef',
      request.headers
    );

    // Return ONLY chef data (NO USER DATA MIXING)
    const chefResponse = {
      _id: chef._id,
      name: chef.name,
      email: chef.email,
      phone: chef.phone,
      role: 'chef', // EXPLICITLY SET AS CHEF
      chefProfile: chef.chefProfile,
      isEmailVerified: chef.isEmailVerified,
      lastLogin: chef.lastLogin,
      picture: chef.picture,
      userType: 'chef' // Clear identification
    };

    console.log('✅ Chef login successful for:', chef.email);

    // Create response with chef data
    const response = NextResponse.json({
      message: 'Chef login successful',
      chef: chefResponse,
      token: sessionData.token,
      sessionId: sessionData.sessionId,
      userType: 'chef',
      redirectTo: '/chef/dashboard'
    });

    // Set HTTP-only cookie for middleware to read (chef-specific)
    response.cookies.set('chef-token', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Chef login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}