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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = verifyToken(request);
    
    const { amount, currency = 'INR', receipt, notes, paymentMethod = 'card' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Validate Razorpay credentials
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        key_id: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: !!process.env.RAZORPAY_KEY_SECRET
      });
      return NextResponse.json(
        { error: 'Razorpay credentials not configured. Please add RAZORPAY_KEY_SECRET to your .env.local file.' },
        { status: 500 }
      );
    }

    // Log environment info for debugging
    const isLiveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_');
    console.log('Razorpay Environment:', {
      isLive: isLiveKey,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 12) + '...',
      amount: amount,
      currency: currency
    });

    // Warning for live keys in development
    if (isLiveKey && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ WARNING: Using LIVE Razorpay keys in development mode!');
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create receipt if not provided (max 40 chars for Razorpay)
    const orderReceipt = receipt || `ord_${Date.now().toString().slice(-10)}_${user._id.slice(-8)}`;

    // Prepare order options
    const orderOptions = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: orderReceipt,
      payment_capture: 1, // Auto capture payment
      notes: {
        userId: user._id,
        userEmail: user.email,
        paymentMethod,
        orderType: 'food_delivery',
        platform: 'web',
        ...notes
      }
    };

    console.log('Creating Razorpay order with options:', orderOptions);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(orderOptions);
    console.log('Razorpay order created successfully:', razorpayOrder);

    // Prepare response based on payment method
    let response: any = {
      message: 'Razorpay order created successfully',
      order: razorpayOrder,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      orderId: razorpayOrder.id
    };

    console.log('Razorpay order response prepared:', {
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: currency.toUpperCase()
    });

    // If QR code payment is requested, generate QR code
    if (paymentMethod === 'qr' || paymentMethod === 'upi') {
      try {
        // Create QR code for the order
        const qrCodeData = await razorpay.qrCode.create({
          type: 'upi_qr',
          name: `FoodFly Order Payment`,
          usage: 'single_use',
          fixed_amount: true,
          payment_amount: amountInPaise,
          description: `Payment for order ${orderReceipt}`,
          customer_id: user._id,
          close_by: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
          notes: {
            orderId: razorpayOrder.id,
            userId: user._id,
            userEmail: user.email
          }
        });

        response = {
          ...response,
          qrCode: {
            id: qrCodeData.id,
            entity: qrCodeData.entity,
            created_at: qrCodeData.created_at,
            name: qrCodeData.name,
            usage: qrCodeData.usage,
            type: qrCodeData.type,
            image_url: qrCodeData.image_url,
            payment_amount: qrCodeData.payment_amount,
            status: qrCodeData.status,
            description: qrCodeData.description,
            fixed_amount: qrCodeData.fixed_amount,
            notes: qrCodeData.notes,
            customer_id: qrCodeData.customer_id,
            close_by: qrCodeData.close_by,
            closed_at: qrCodeData.closed_at,
            close_reason: qrCodeData.close_reason
          }
        };
      } catch (qrError) {
        console.warn('QR Code creation failed, falling back to regular payment:', qrError);
        // Continue with regular payment if QR creation fails
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Create Razorpay order error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Handle Razorpay specific errors
    if (error.statusCode) {
      return NextResponse.json(
        { 
          error: 'Razorpay error', 
          message: error.error?.description || error.message,
          code: error.error?.code
        },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment order', message: error.message },
      { status: 500 }
    );
  }
} 