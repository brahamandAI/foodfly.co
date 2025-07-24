# 💳 FoodFly Payment Integration Guide

Complete implementation of Razorpay payment system with QR code support for FoodFly food delivery platform.

## 🌟 Features Implemented

### ✅ Payment Methods Supported
- **Credit/Debit Cards** - Visa, Mastercard, RuPay, American Express
- **Net Banking** - 50+ banks supported
- **UPI Payments** - All UPI apps (GPay, PhonePe, Paytm, etc.)
- **Digital Wallets** - Paytm, Mobikwik, FreeCharge, etc.
- **QR Code Payments** - Dynamic QR generation with real-time status
- **Cash on Delivery (COD)** - Traditional payment method

### ✅ Advanced Features
- **Real-time Payment Status** - Live QR code monitoring
- **Payment Verification** - Signature verification for security
- **Webhook Integration** - Automatic status updates
- **Payment Retry** - Failed payment recovery
- **Timeout Handling** - QR code expiration management
- **Multi-currency Support** - Ready for international expansion

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Razorpay      │
│   (Next.js)     │    │   (Next.js)     │    │   Gateway       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ PaymentModal    │◄───┤ /api/payment/   │◄───┤ Payment         │
│ QR Code Display │    │ create-order    │    │ Processing      │
│ Status Polling  │    │ qr-status       │    │ QR Generation   │
│ Error Handling  │    │ webhook         │    │ Notifications   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install razorpay
```

### 2. Environment Configuration

Create `.env.local` file:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Razorpay Dashboard Setup

1. **Create Account**: Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
2. **Get API Keys**: Go to Settings → API Keys
3. **Setup Webhooks**: Go to Settings → Webhooks
   - Webhook URL: `https://your-domain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `qr_code.credited`, `qr_code.closed`

## 📱 QR Code Payment Flow

### 1. QR Code Generation
```typescript
// API: POST /api/payment/create-order
{
  "amount": 500,
  "paymentMethod": "qr",
  "currency": "INR"
}

// Response includes QR code data
{
  "order": { ... },
  "qrCode": {
    "id": "qr_xxxxx",
    "image_url": "https://api.razorpay.com/v1/qr_codes/qr_xxxxx/qr.png",
    "payment_amount": 50000,
    "close_by": 1640995200
  }
}
```

### 2. Real-time Status Monitoring
```typescript
// Frontend polls: GET /api/payment/qr-status?qrCodeId=qr_xxxxx
// Every 3 seconds until payment completion or timeout

// Status responses:
{
  "status": "pending",    // Waiting for payment
  "status": "completed",  // Payment successful
  "status": "expired",    // QR code expired
  "status": "failed"      // Payment failed
}
```

### 3. Payment Verification
```typescript
// Automatic webhook processing at /api/payment/webhook
// Updates order status and sends notifications
```

## 🔗 API Endpoints

### Payment Creation
```http
POST /api/payment/create-order
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 500,
  "currency": "INR",
  "paymentMethod": "qr|card|upi|netbanking",
  "receipt": "order_12345",
  "notes": {
    "orderId": "order_id",
    "orderNumber": "ORD123"
  }
}
```

### QR Status Check
```http
GET /api/payment/qr-status?qrCodeId=qr_xxxxx
Authorization: Bearer <jwt-token>
```

### Payment Verification
```http
POST /api/payment
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentMethod": "qr",
  "razorpayPaymentId": "pay_xxxxx",    // For card/upi
  "razorpayOrderId": "order_xxxxx",    // For card/upi
  "razorpaySignature": "signature",    // For card/upi
  "qrCodeId": "qr_xxxxx"               // For QR payments
}
```

### Webhook Handler
```http
POST /api/payment/webhook
X-Razorpay-Signature: <signature>
Content-Type: application/json

{
  "event": "payment.captured|qr_code.credited",
  "payload": { ... }
}
```

## 🎨 Frontend Integration

### PaymentModal Component Usage

```tsx
import PaymentModal from '@/components/PaymentModal';

// In your checkout component
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [currentOrder, setCurrentOrder] = useState(null);

// After order creation
setCurrentOrder({
  id: orderId,
  orderNumber: 'ORD123',
  totalAmount: 500
});
setShowPaymentModal(true);

// Render modal
<PaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  order={currentOrder}
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>
```

### QR Code Features

- **Dynamic QR Generation** - Unique QR for each order
- **Real-time Status Updates** - Live payment monitoring
- **Automatic Expiry** - 30-minute timeout with countdown
- **Multiple UPI Apps** - Works with all UPI applications
- **Retry Mechanism** - Generate new QR if expired

## 🔒 Security Features

### 1. Signature Verification
```typescript
// Webhook signature verification
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex');

if (expectedSignature !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Payment Validation
```typescript
// Payment signature verification
const body = razorpayOrderId + "|" + razorpayPaymentId;
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  .update(body)
  .digest('hex');
```

### 3. User Authorization
- JWT token verification for all payment APIs
- User-specific order validation
- Payment method restrictions based on user type

## 📊 Payment Analytics

### Order Status Tracking
```typescript
// Automatic status updates via webhooks
{
  "pending": "Order created, payment pending",
  "confirmed": "Payment successful, order confirmed",
  "failed": "Payment failed, order cancelled",
  "expired": "Payment timeout, order expired"
}
```

### Notification System
```typescript
// Automatic notifications sent on:
- Payment success ✅
- Payment failure ❌
- QR code expiry ⏰
- Order confirmation 📦
```

## 🎯 Testing Guide

### 1. Test Cards (Razorpay Test Mode)
```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 0016
```

### 2. Test UPI IDs
```
Success: success@razorpay
Failure: failure@razorpay
```

### 3. QR Code Testing
1. Generate QR code in test mode
2. Use Razorpay test UPI ID to scan
3. Verify real-time status updates

## 🚀 Production Deployment

### 1. Environment Variables
```env
# Production Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=live_secret_key
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret
```

### 2. Webhook Configuration
- Production webhook URL: `https://yourdomain.com/api/payment/webhook`
- SSL certificate required
- Signature verification enabled

### 3. Domain Verification
- Add your domain to Razorpay dashboard
- Configure CORS for payment checkout
- Set up proper error tracking

## 📈 Performance Optimizations

### 1. QR Code Caching
```typescript
// QR images cached with 30-minute TTL
// Automatic cleanup of expired QR codes
```

### 2. Payment Status Polling
```typescript
// Optimized polling strategy:
// - 3-second intervals for active payments
// - Exponential backoff for failed requests
// - Automatic cleanup on completion
```

### 3. Database Indexing
```typescript
// Optimized queries for payment lookups
db.orders.createIndex({ "payment.details.razorpayOrderId": 1 });
db.orders.createIndex({ "payment.details.qrCodeId": 1 });
```

## 🎨 UI/UX Features

### Modern Payment Interface
- **Clean Design** - Minimalist, user-friendly interface
- **Real-time Updates** - Live status indicators
- **Error Handling** - Clear error messages and retry options
- **Mobile Optimized** - Responsive design for all devices
- **Accessibility** - ARIA labels and keyboard navigation

### QR Code Experience
- **Large QR Display** - Easy scanning from mobile devices
- **Timer Countdown** - Visual expiry indicator
- **Status Indicators** - Color-coded payment status
- **Quick Retry** - One-click regeneration for expired codes

## 🐛 Troubleshooting

### Common Issues

**1. QR Code Not Generated**
```bash
# Check Razorpay credentials
# Verify QR code feature is enabled in dashboard
# Check network connectivity
```

**2. Payment Verification Failed**
```bash
# Verify webhook secret configuration
# Check signature generation algorithm
# Validate order ID mapping
```

**3. Status Not Updating**
```bash
# Check webhook URL accessibility
# Verify database connection
# Monitor webhook logs in Razorpay dashboard
```

### Debug Mode
```typescript
// Enable detailed logging
console.log('Payment Debug:', {
  orderId,
  razorpayOrderId,
  paymentMethod,
  status
});
```

## 📞 Support

### Razorpay Support
- **Documentation**: https://razorpay.com/docs/
- **Support Portal**: https://razorpay.com/support/
- **Integration Help**: https://razorpay.com/docs/payments/

### FoodFly Integration Support
- Check webhook logs in Razorpay dashboard
- Monitor application logs for payment errors
- Test payments in sandbox environment first

---

## 🎉 Implementation Complete!

Your FoodFly application now supports:
- ✅ **All Major Payment Methods**
- ✅ **QR Code Payments with Real-time Status**
- ✅ **Secure Payment Verification**
- ✅ **Automatic Webhook Processing**
- ✅ **Modern Payment Interface**
- ✅ **Comprehensive Error Handling**

**Ready for production deployment!** 🚀 