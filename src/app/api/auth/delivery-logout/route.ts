import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or header
    const token = request.cookies.get('delivery-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      );
    }

    // Validate and invalidate the session in database
    await SessionManager.invalidateSession(token);
    
    console.log('✅ Delivery agent session invalidated successfully');

    // Create response
    const response = NextResponse.json({
      message: 'Delivery agent logout successful',
      redirectTo: '/delivery/login'
    });

    // Clear the HTTP-only cookie
    response.cookies.set('delivery-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Immediate expiry
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Delivery agent logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed. Please try again.' },
      { status: 500 }
    );
  }
}