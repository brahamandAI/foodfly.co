import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import Notification from '@/lib/backend/models/notification.model';
import { generateToken } from '@/lib/backend/utils/jwt';

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

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);

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

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 