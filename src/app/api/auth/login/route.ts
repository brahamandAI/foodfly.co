import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import Notification from '@/lib/backend/models/notification.model';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create database-persistent session (prevent chef and delivery users from using this endpoint)
    if (user.role === 'chef') {
      return NextResponse.json(
        { error: 'Chef users must use the chef login endpoint at /chef/login' },
        { status: 403 }
      );
    }

    if (user.role === 'delivery') {
      return NextResponse.json(
        { error: 'Delivery agents must use the delivery login endpoint at /delivery/login' },
        { status: 403 }
      );
    }

    const sessionData = await SessionManager.createSession(
      user._id.toString(),
      user.role as 'customer' | 'delivery' | 'admin',
      request.headers
    );

    // Create login notification (only for first login of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogin = await Notification.findOne({
      userId: user._id.toString(),
      type: 'system',
      createdAt: { $gte: today },
      'data.loginNotification': true
    });

    if (!todayLogin) {
      const loginNotification = new Notification({
        userId: user._id.toString(),
        type: 'system',
        title: 'Welcome back! 👋',
        message: `Hi ${user.name}! You're successfully logged in. Explore new restaurants and deals!`,
        priority: 'low',
        channels: ['app'],
        data: {
          loginNotification: true,
          loginTime: new Date()
        }
      });

      await loginNotification.save();
    }

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      addresses: user.addresses,
      preferences: user.preferences,
      healthProfile: user.healthProfile,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    // Create response and set cookie for middleware
    const response = NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      token: sessionData.token,
      sessionId: sessionData.sessionId
    });

    // Set HTTP-only cookie for middleware
    response.cookies.set('token', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 