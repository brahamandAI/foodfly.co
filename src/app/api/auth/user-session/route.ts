import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or header
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { isValid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Validate session in database
    const validation = await SessionManager.validateSession(token);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { isValid: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Ensure this is NOT a chef session (regular user session)
    if (validation.user?.role === 'chef') {
      return NextResponse.json(
        { isValid: false, error: 'Chef users should use chef-session endpoint' },
        { status: 403 }
      );
    }

    console.log('✅ User session validated successfully for:', validation.user.email);

    return NextResponse.json({
      isValid: true,
      user: validation.user,
      session: validation.session
    });

  } catch (error) {
    console.error('User session validation error:', error);
    return NextResponse.json(
      { isValid: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}