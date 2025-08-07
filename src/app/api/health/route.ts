import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectDB();
    
    // Get basic system info
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json({
      success: true,
      message: 'FoodFly API is healthy',
      data: systemInfo
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 