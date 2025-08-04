import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import User from '@/lib/backend/models/user.model';
import { verifyToken } from '@/lib/backend/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    if (user.role !== 'chef') {
      return NextResponse.json(
        { error: 'Chef authentication required' },
        { status: 401 }
      );
    }

    // Get chef notifications (for now, return empty array - can be expanded later)
    const notifications = [];

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching chef notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}