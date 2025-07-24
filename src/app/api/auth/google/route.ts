import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { generateToken } from '@/lib/backend/utils/jwt';
import { OAuth2Client } from 'google-auth-library';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Required user information not provided by Google' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, update their Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture;
        user.isEmailVerified = true; // Google emails are verified
        await user.save();
      }
    } else {
      // Create new user with Google info
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        googleId,
        picture,
        password: Math.random().toString(36).substring(2, 15), // Random password for Google users
        role: 'customer',
        isEmailVerified: true, // Google emails are verified
        preferences: {
          dietary: [],
          allergies: [],
          cuisinePreferences: []
        }
      });

      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);

    // Prepare user data for response (exclude sensitive info)
    const userData = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      addresses: user.addresses
    };

    return NextResponse.json({
      success: true,
      message: user.googleId === googleId ? 'Successfully logged in with Google' : 'Account created and logged in with Google',
      token,
      user: userData
    });

  } catch (error: any) {
    console.error('Google OAuth error:', error);
    
    if (error.message?.includes('Token used too early') || error.message?.includes('Token used too late')) {
      return NextResponse.json(
        { error: 'Google token expired. Please try again.' },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('Invalid token signature')) {
      return NextResponse.json(
        { error: 'Invalid Google token. Please try again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Google authentication failed. Please try again.' },
      { status: 500 }
    );
  }
} 