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

    // Find delivery agent by email (DELIVERY LOGIN ONLY - NO OTHER USERS)
    console.log('🚚 Delivery agent login attempt for:', email.toLowerCase());
    
    // First check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists && userExists.role !== 'delivery') {
      return NextResponse.json(
        { 
          error: `This email is registered as a ${userExists.role}. Please use the appropriate login page.`,
          userRole: userExists.role,
          redirectTo: userExists.role === 'customer' ? '/login' : userExists.role === 'chef' ? '/chef/login' : '/login'
        },
        { status: 403 }
      );
    }
    
    // Find ONLY delivery agents
    const deliveryAgent = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'delivery' // STRICTLY DELIVERY ROLE ONLY
    }).select('+password');

    if (!deliveryAgent) {
      return NextResponse.json(
        { error: 'Delivery agent account not found. Please register as a delivery agent first.' },
        { status: 401 }
      );
    }

    // Verify this is actually a delivery agent with delivery profile
    if (!deliveryAgent.deliveryProfile) {
      return NextResponse.json(
        { error: 'Invalid delivery agent account. Please contact support.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await deliveryAgent.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    deliveryAgent.lastLogin = new Date();
    await deliveryAgent.save();

    // Create database-persistent session
    const sessionData = await SessionManager.createSession(
      deliveryAgent._id.toString(),
      'delivery',
      request.headers
    );

    // Return ONLY delivery agent data (NO USER DATA MIXING)
    const deliveryResponse = {
      _id: deliveryAgent._id,
      name: deliveryAgent.name,
      email: deliveryAgent.email,
      phone: deliveryAgent.phone,
      role: 'delivery', // EXPLICITLY SET AS DELIVERY
      deliveryProfile: deliveryAgent.deliveryProfile,
      isEmailVerified: deliveryAgent.isEmailVerified,
      lastLogin: deliveryAgent.lastLogin,
      picture: deliveryAgent.picture,
      userType: 'delivery' // Clear identification
    };

    console.log('✅ Delivery agent login successful for:', deliveryAgent.email);

    // Create response with delivery agent data
    const response = NextResponse.json({
      message: 'Delivery agent login successful',
      delivery: deliveryResponse,
      token: sessionData.token,
      sessionId: sessionData.sessionId,
      userType: 'delivery',
      redirectTo: '/delivery/dashboard'
    });

    // Set HTTP-only cookie for middleware to read (delivery-specific)
    response.cookies.set('delivery-token', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Delivery agent login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}