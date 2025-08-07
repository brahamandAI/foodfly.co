import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import Order from '@/lib/backend/models/order.model';
import Notification from '@/lib/backend/models/notification.model';
import crypto from 'crypto';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { event, payload: eventPayload } = payload;

    console.log('Razorpay webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(eventPayload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(eventPayload.payment.entity);
        break;
        
      case 'qr_code.credited':
        await handleQRCodeCredited(eventPayload.qr_code.entity);
        break;
        
      case 'qr_code.closed':
        await handleQRCodeClosed(eventPayload.qr_code.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(eventPayload.order.entity);
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'payment.details.razorpayOrderId': payment.order_id
    });

    if (order) {
      // Update order status
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.payment.status = 'completed';
      order.payment.details.razorpayPaymentId = payment.id;
      order.payment.details.capturedAt = new Date();
      order.payment.details.paymentMethod = payment.method;
      
      await order.save();

      // Create notification
      await createPaymentNotification(
        order.customerId,
        'payment_success',
        'Payment Successful! 💳',
        `Your payment of ₹${order.totalAmount} has been processed successfully.`,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          paymentId: payment.id
        }
      );

      console.log('Payment captured for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'payment.details.razorpayOrderId': payment.order_id
    });

    if (order) {
      // Update order status
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.payment.status = 'failed';
      order.payment.details.failureReason = payment.error_description;
      order.payment.details.failedAt = new Date();
      
      await order.save();

      // Create notification
      await createPaymentNotification(
        order.customerId,
        'payment_failed',
        'Payment Failed ❌',
        `Your payment for order ${order.orderNumber} could not be processed. Please try again.`,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          failureReason: payment.error_description
        }
      );

      console.log('Payment failed for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleQRCodeCredited(qrCode: any) {
  try {
    // Find order by QR code ID
    const order = await Order.findOne({
      'payment.details.qrCodeId': qrCode.id
    });

    if (order) {
      // Update order status
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.payment.status = 'completed';
      order.payment.details.qrCodePaid = true;
      order.payment.details.creditedAt = new Date();
      
      await order.save();

      // Create notification
      await createPaymentNotification(
        order.customerId,
        'payment_success',
        'QR Payment Successful! 📱',
        `Your QR code payment of ₹${order.totalAmount} has been received.`,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          qrCodeId: qrCode.id
        }
      );

      console.log('QR code payment credited for order:', order.orderNumber);
    }
  } catch (error) {
    console.error('Error handling QR code credited:', error);
  }
}

async function handleQRCodeClosed(qrCode: any) {
  try {
    // Find order by QR code ID
    const order = await Order.findOne({
      'payment.details.qrCodeId': qrCode.id
    });

    if (order && qrCode.close_reason !== 'paid') {
      // QR code closed without payment (expired or cancelled)
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.payment.status = 'failed';
      order.payment.details.qrCodeClosed = true;
      order.payment.details.closeReason = qrCode.close_reason;
      order.payment.details.closedAt = new Date();
      
      await order.save();

      // Create notification
      await createPaymentNotification(
        order.customerId,
        'payment_failed',
        'QR Payment Expired ⏰',
        `Your QR code for order ${order.orderNumber} has expired. Please try placing the order again.`,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          closeReason: qrCode.close_reason
        }
      );

      console.log('QR code closed for order:', order.orderNumber, 'Reason:', qrCode.close_reason);
    }
  } catch (error) {
    console.error('Error handling QR code closed:', error);
  }
}

async function handleOrderPaid(razorpayOrder: any) {
  try {
    // Find order by Razorpay order ID
    const order = await Order.findOne({
      'payment.details.razorpayOrderId': razorpayOrder.id
    });

    if (order && order.paymentStatus !== 'paid') {
      // Update order status
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.payment.status = 'completed';
      order.payment.details.orderPaidAt = new Date();
      
      await order.save();

      // Create notification
      await createPaymentNotification(
        order.customerId,
        'payment_success',
        'Order Payment Confirmed! ✅',
        `Payment for your order ${order.orderNumber} has been confirmed. Your food is being prepared!`,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount
        }
      );

      console.log('Order payment confirmed:', order.orderNumber);
    }
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

async function createPaymentNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: any
) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      priority: 'high',
      channels: ['app', 'push']
    });
    
    await notification.save();
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
} 