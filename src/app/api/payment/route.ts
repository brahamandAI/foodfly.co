import { verifyToken } from '@/lib/backend/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import Cart from '@/lib/backend/models/cart.model';
import Razorpay from 'razorpay';
import crypto from 'crypto';

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
    
    const { 
      orderId, 
      paymentMethod, 
      paymentDetails,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      qrCodeId
    } = await request.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Order ID and payment method are required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.customerId.toString() !== user._id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Process payment based on method
    let paymentStatus = 'pending';
    let transactionId = '';
    let verificationResult = null;

    switch (paymentMethod) {
      case 'cod':
        paymentStatus = 'pending';
        transactionId = `COD_${Date.now()}`;
        break;

      case 'static-qr':
        // Handle static QR code payment (manual confirmation)
        if (paymentDetails.manualConfirmation) {
          paymentStatus = 'completed';
          transactionId = `STATIC_QR_${Date.now()}`;
          verificationResult = {
            method: 'static_qr',
            amount: paymentDetails.amount,
            timestamp: paymentDetails.timestamp,
            manualConfirmation: true
          };
        } else {
          return NextResponse.json(
            { error: 'Manual payment confirmation required for static QR' },
            { status: 400 }
          );
        }
        break;

      case 'qr':
      case 'upi':
        // Handle QR code payment verification
        if (qrCodeId) {
          try {
            // Fetch QR code status from Razorpay
            const qrCode = await razorpay.qrCode.fetch(qrCodeId);
            
            // Check if QR code has been paid
            if (qrCode.status === 'closed' && qrCode.close_reason === 'paid') {
              paymentStatus = 'completed';
              transactionId = `QR_${qrCodeId}_${Date.now()}`;
              verificationResult = {
                qrCodeId: qrCode.id,
                status: qrCode.status,
                closeReason: qrCode.close_reason,
                paymentAmount: qrCode.payment_amount
              };
            } else if (qrCode.status === 'active') {
              // QR code is still active, payment not completed
              return NextResponse.json(
                { 
                  error: 'QR code payment not completed yet', 
                  qrStatus: qrCode.status,
                  message: 'Please complete the payment using the QR code'
                },
                { status: 400 }
              );
            } else {
              // QR code is closed but not paid or expired
              paymentStatus = 'failed';
              return NextResponse.json(
                { 
                  error: 'QR code payment failed or expired', 
                  qrStatus: qrCode.status,
                  closeReason: qrCode.close_reason 
                },
                { status: 400 }
              );
            }
          } catch (qrError) {
            console.error('QR code verification error:', qrError);
            return NextResponse.json(
              { error: 'Failed to verify QR code payment' },
              { status: 500 }
            );
          }
        } else {
          // Direct UPI payment without QR code
          paymentStatus = 'completed';
          transactionId = paymentDetails?.upiTransactionId || `UPI_${Date.now()}`;
          verificationResult = {
            method: 'direct_upi',
            transactionId: transactionId
          };
        }
        break;
      
      case 'card':
      case 'netbanking':
      case 'wallet':
      case 'online':
        // Handle Razorpay payment verification
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
          try {
            // Verify payment signature
            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
              .update(body.toString())
              .digest('hex');

            if (expectedSignature === razorpaySignature) {
              // Fetch payment details from Razorpay
              const payment = await razorpay.payments.fetch(razorpayPaymentId);
              
              if (payment.status === 'captured' || payment.status === 'authorized') {
                paymentStatus = 'completed';
                transactionId = razorpayPaymentId;
                verificationResult = {
                  paymentId: payment.id,
                  orderId: payment.order_id,
                  amount: payment.amount,
                  currency: payment.currency,
                  status: payment.status,
                  method: payment.method,
                  bank: payment.bank,
                  wallet: payment.wallet,
                  vpa: payment.vpa,
                  email: payment.email,
                  contact: payment.contact,
                  fee: payment.fee,
                  tax: payment.tax,
                  created_at: payment.created_at
                };
              } else {
                paymentStatus = 'failed';
                return NextResponse.json(
                  { error: 'Payment verification failed', paymentStatus: payment.status },
                  { status: 400 }
                );
              }
            } else {
              return NextResponse.json(
                { error: 'Payment signature verification failed' },
                { status: 400 }
              );
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            return NextResponse.json(
              { error: 'Payment verification failed' },
              { status: 500 }
            );
          }
        } else {
          // Fallback for manual payment confirmation
          paymentStatus = 'completed';
          transactionId = paymentDetails?.transactionId || `TXN_${Date.now()}`;
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid payment method' },
          { status: 400 }
        );
    }

    // Update order with payment information
    const paymentData = {
      method: paymentMethod,
      status: paymentStatus,
      transactionId,
      amount: order.totalAmount,
      currency: 'INR',
      processedAt: new Date(),
      details: {
        ...paymentDetails,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        qrCodeId,
        verificationResult
      }
    };

    // Update order status based on payment
    if (paymentStatus === 'completed') {
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
    } else if (paymentStatus === 'failed') {
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
    } else {
      order.paymentStatus = 'pending';
    }

    // Save payment information to order
    order.paymentMethod = paymentMethod;
    order.payment = paymentData;
    
    await order.save();

    // Clear user's cart after successful payment
    if (paymentStatus === 'completed' || paymentMethod === 'cod') {
      await Cart.findOneAndUpdate(
        { userId: user._id },
        { $set: { items: [] } }
      );
    }

    // Prepare response
    const response = {
      message: paymentStatus === 'completed' ? 'Payment completed successfully' : 'Payment processed',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        payment: paymentData
      },
      paymentVerification: verificationResult
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Payment processing error:', error);
    
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
      { error: 'Payment processing failed', message: error.message },
      { status: 500 }
    );
  }
} 