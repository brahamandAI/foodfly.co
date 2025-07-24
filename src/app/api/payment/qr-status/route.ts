import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import Razorpay from 'razorpay';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    const { searchParams } = new URL(request.url);
    const qrCodeId = searchParams.get('qrCodeId');

    if (!qrCodeId) {
      return NextResponse.json(
        { error: 'QR code ID is required' },
        { status: 400 }
      );
    }

    // Validate Razorpay credentials
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 500 }
      );
    }

    try {
      // Fetch QR code status from Razorpay
      const qrCode = await razorpay.qrCode.fetch(qrCodeId);
      
      // Determine payment status
      let status = 'pending';
      let message = 'Payment pending';
      
      if (qrCode.status === 'closed' && qrCode.close_reason === 'paid') {
        status = 'completed';
        message = 'Payment completed successfully';
      } else if (qrCode.status === 'closed' && qrCode.close_reason === 'on_demand') {
        status = 'expired';
        message = 'QR code expired';
      } else if (qrCode.status === 'active') {
        status = 'pending';
        message = 'Waiting for payment';
      } else {
        status = 'failed';
        message = 'Payment failed or QR code invalid';
      }

      return NextResponse.json({
        qrCodeId: qrCode.id,
        status,
        message,
        qrCodeStatus: qrCode.status,
        closeReason: qrCode.close_reason,
        paymentAmount: qrCode.payment_amount,
        createdAt: qrCode.created_at,
        closeBy: qrCode.close_by,
        closedAt: qrCode.closed_at,
        description: qrCode.description,
        name: qrCode.name
      });

    } catch (qrError: any) {
      console.error('QR code status check error:', qrError);
      
      if (qrError.statusCode === 404) {
        return NextResponse.json(
          { error: 'QR code not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to check QR code status',
          message: qrError.error?.description || qrError.message
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('QR status check error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 