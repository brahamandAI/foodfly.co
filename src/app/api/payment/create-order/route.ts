import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Mock Razorpay order creation
    // In a real app, you would use the Razorpay SDK here
    const razorpayOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: {
        userId: user._id,
        userEmail: user.email
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    return NextResponse.json({
      message: 'Razorpay order created successfully',
      order: razorpayOrder,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID // Send the public key to frontend
    });

  } catch (error: any) {
    console.error('Create Razorpay order error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
} 