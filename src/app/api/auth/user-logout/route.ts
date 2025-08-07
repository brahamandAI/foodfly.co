import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or header
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      );
    }

    // Validate and invalidate the session in database
    await SessionManager.invalidateSession(token);
    
    console.log('✅ User session invalidated successfully');

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful',
      redirectTo: '/login'
    });

    // Clear the HTTP-only cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Immediate expiry
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('User logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed. Please try again.' },
      { status: 500 }
    );
  }
}