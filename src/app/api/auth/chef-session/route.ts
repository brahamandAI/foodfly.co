import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { SessionManager } from '@/lib/backend/utils/sessionManager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or header
    const token = request.cookies.get('chef-token')?.value || 
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

    // Ensure this is a chef session
    if (validation.user?.role !== 'chef') {
      return NextResponse.json(
        { isValid: false, error: 'Not a chef session' },
        { status: 403 }
      );
    }

    console.log('✅ Chef session validated successfully for:', validation.user.email);

    return NextResponse.json({
      isValid: true,
      user: validation.user,
      session: validation.session
    });

  } catch (error) {
    console.error('Chef session validation error:', error);
    return NextResponse.json(
      { isValid: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { action } = await request.json();
    
    // Get token from cookie or header
    const token = request.cookies.get('chef-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'extend':
        const extended = await SessionManager.extendSession(token, 24);
        if (extended) {
          return NextResponse.json({ message: 'Session extended successfully' });
        } else {
          return NextResponse.json(
            { error: 'Failed to extend session' },
            { status: 400 }
          );
        }

      case 'invalidate':
        await SessionManager.invalidateSession(token);
        return NextResponse.json({ message: 'Session invalidated successfully' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Chef session action error:', error);
    return NextResponse.json(
      { error: 'Session action failed' },
      { status: 500 }
    );
  }
}