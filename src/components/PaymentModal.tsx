'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  CreditCard, 
  Wallet, 
  Building2, 
  QrCode, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  ArrowLeft,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Enhanced UPI QR Code Component with better mobile handling
interface DynamicQRCodeProps {
  upiId: string;
  amount: number;
  merchantName: string;
  transactionRef: string;
}

const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({ 
  upiId, 
  amount, 
  merchantName, 
  transactionRef 
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Generate UPI payment URL
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionRef)}`;
  
  // Generate QR code with improved size for better visibility
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}&margin=10&format=png`;
  
  const copyUPIDetails = () => {
    const upiString = `UPI ID: ${upiId}\nAmount: ₹${amount}\nReference: ${transactionRef}`;
    navigator.clipboard.writeText(upiString);
    toast.success('UPI details copied to clipboard');
  };

  const handleDirectUPIPayment = () => {
    if (isMobile) {
      // Direct UPI app redirect for mobile
      window.location.href = upiUrl;
    } else {
      // Copy UPI URL for desktop
      navigator.clipboard.writeText(upiUrl);
      toast.success('UPI payment link copied! Paste in your UPI app');
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg inline-block border border-gray-100">
        <Image
          src={qrCodeUrl}
          alt={`UPI QR Code for ₹${amount}`}
          width={280}
          height={280}
          className="rounded-xl mx-auto"
          priority
        />
      </div>
      
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
          <p className="text-sm font-medium text-gray-900 mb-2">UPI Payment Details</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">UPI ID:</span> {upiId}</p>
            <p><span className="font-medium">Amount:</span> ₹{amount}</p>
            <p><span className="font-medium">Reference:</span> {transactionRef}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={copyUPIDetails}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <Copy className="h-4 w-4" />
            <span className="text-sm">Copy Details</span>
          </button>
          
          <button
            onClick={handleDirectUPIPayment}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">{isMobile ? 'Pay Now' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    currency?: string;
  };
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  description: string;
  enabled: boolean;
  type: 'card' | 'netbanking' | 'wallet' | 'upi' | 'qr' | 'cod';
  popular?: boolean;
  instantVerification?: boolean;
}

interface QRCodeData {
  id: string;
  image_url: string;
  payment_amount: number;
  status: string;
  description: string;
  close_by: number;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  order, 
  onSuccess, 
  onError,
  onCancel 
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [qrStatus, setQrStatus] = useState<'pending' | 'completed' | 'expired' | 'failed'>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<'method' | 'payment' | 'processing'>('method');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      name: 'UPI (Recommended)',
      icon: Zap,
      description: 'Google Pay, PhonePe, Paytm & more',
      enabled: true,
      type: 'upi',
      popular: true,
      instantVerification: true
    },
    {
      id: 'static-qr',
      name: 'UPI QR Code',
      icon: QrCode,
      description: 'Scan & pay with any UPI app',
      enabled: true,
      type: 'qr',
      instantVerification: false
    },
    {
      id: 'card',
      name: 'Card Payment',
      icon: CreditCard,
      description: 'Debit/Credit cards accepted',
      enabled: true,
      type: 'card',
      instantVerification: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building2,
      description: 'All major banks supported',
      enabled: true,
      type: 'netbanking',
      instantVerification: true
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Wallet,
      description: 'Pay when order arrives',
      enabled: true,
      type: 'cod',
      instantVerification: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      console.log('PaymentModal opened, loading Razorpay script...');
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
      };
      script.onerror = (error) => {
        console.error('Failed to load Razorpay script:', error);
      };
      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch (error) {
          console.warn('Script already removed:', error);
        }
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (qrCodeData && qrStatus === 'pending') {
      // Calculate time left
      const now = Math.floor(Date.now() / 1000);
      const remaining = qrCodeData.close_by - now;
      setTimeLeft(Math.max(0, remaining));

      // Start polling for QR status
      const interval = setInterval(async () => {
        await checkQRStatus();
      }, 3000); // Check every 3 seconds

      setPollingInterval(interval);

      // Countdown timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setQrStatus('expired');
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(timer);
      };
    }
  }, [qrCodeData, qrStatus]);

  const createRazorpayOrder = async (paymentMethod: string) => {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          currency: order.currency || 'INR',
          receipt: `pay_${order.id.slice(-12)}_${Date.now().toString().slice(-8)}`,
          paymentMethod,
          notes: {
            orderId: order.id,
            orderNumber: order.orderNumber
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment order');
      }

      const data = await response.json();
      setRazorpayOrder(data);

      if (data.qrCode) {
        setQrCodeData(data.qrCode);
        setQrStatus('pending');
      }

      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const checkQRStatus = async () => {
    if (!qrCodeData) return;

    try {
      const response = await fetch(`/api/payment/qr-status?qrCodeId=${qrCodeData.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'completed') {
          setQrStatus('completed');
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
          
          // Verify payment on backend
          await processPayment('qr', {
            qrCodeId: qrCodeData.id
          });
        } else if (data.status === 'expired' || data.status === 'failed') {
          setQrStatus(data.status);
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        }
      }
    } catch (error) {
      console.error('Error checking QR status:', error);
    }
  };

  const processPayment = async (method: string, paymentDetails: any = {}) => {
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: method,
          paymentDetails,
          ...paymentDetails
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      const result = await response.json();
      onSuccess(result);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      if (selectedMethod === 'cod') {
        // Handle Cash on Delivery
        await processPayment('cod');
        return;
      }

      if (selectedMethod === 'static-qr') {
        // Static QR code is handled by the UI - no additional processing needed
        setCurrentStep('payment');
        setIsProcessing(false);
        return;
      }

      // Handle Razorpay payment methods (UPI, Card, Net Banking, etc.)
      const orderData = await createRazorpayOrder(selectedMethod);
      
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      // Get user info for prefill
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FoodFly',
        description: `Payment for Order ${order.orderNumber}`,
        order_id: orderData.orderId,
        
        // Prefill customer details
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        
        // Order notes
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount
        },
        
        // Theme customization
        theme: {
          color: '#DC2626'
        },
        
        // Enable all payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: false
        },
        
        // Payment success handler
        handler: async (response: any) => {
          console.log('Payment successful:', response);
          await processPayment(selectedMethod, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          });
        },
        
        // Modal options
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user');
            setIsProcessing(false);
            setCurrentStep('method');
            // DO NOT call onClose() here - this would clear the cart unnecessarily
            // Just reset the internal state
          },
          confirm_close: true,
          escape: true,
          backdrop: true
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        setCurrentStep('method');
        onError(`Payment failed: ${response.error.description}`);
      });

      paymentObject.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to initiate payment');
      setCurrentStep('method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    console.log('Payment cancelled by user - preserving cart');
    // IMPORTANT: Do not clear cart on cancellation
    // Just close the modal and preserve cart state
    setCurrentStep('method');
    setIsProcessing(false);
    setQrCodeData(null);
    setQrStatus('pending');
    
    // Use onCancel if provided, otherwise fallback to onClose
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  console.log('PaymentModal rendering with:', { isOpen, order });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            {currentStep !== 'method' && (
              <button
                onClick={() => setCurrentStep('method')}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                disabled={isProcessing}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-600" />
                <span>Secure Payment</span>
              </h2>
              <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Enhanced Amount Display */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              ₹{order.totalAmount}
            </p>
            <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>256-bit SSL encrypted</span>
            </div>
          </div>
        </div>

        {/* Dynamic QR Code Display */}
        {currentStep === 'payment' && selectedMethod === 'qr' && qrCodeData && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scan QR Code to Pay
              </h3>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg inline-block">
                <Image
                  src={qrCodeData.image_url}
                  alt="Dynamic QR Code"
                  width={250}
                  height={250}
                  className="rounded-xl"
                />
              </div>
              
              {qrStatus === 'pending' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Expires in {formatTime(timeLeft)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Payment will be verified automatically
                  </p>
                  <button
                    onClick={checkQRStatus}
                    className="flex items-center justify-center space-x-2 mx-auto px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Check Status</span>
                  </button>
                </div>
              )}

              {qrStatus === 'completed' && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Payment Successful!</span>
                </div>
              )}

              {qrStatus === 'expired' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">QR Code Expired</span>
                  </div>
                  <button
                    onClick={() => {
                      setQrCodeData(null);
                      setQrStatus('pending');
                      setCurrentStep('method');
                    }}
                    className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Static UPI QR Code Display */}
        {currentStep === 'payment' && selectedMethod === 'static-qr' && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-gray-900">
                Pay ₹{order.totalAmount} via UPI
              </h3>
              
              <DynamicQRCode 
                upiId="foodfly@paytm" // Replace with your actual UPI ID
                amount={order.totalAmount}
                merchantName="FoodFly"
                transactionRef={`FOODFLY_${order.id}_${Date.now()}`}
              />
              
              {/* Enhanced Payment Instructions */}
              <div className="bg-white rounded-xl p-4 text-left border border-blue-200">
                <h4 className="font-semibold text-sm mb-3 text-center">🔥 Quick Payment Steps</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    <span>Open your UPI app (GPay, PhonePe, Paytm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                    <span>Scan the QR code or use direct payment button</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                    <span>Verify amount: ₹{order.totalAmount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                    <span>Complete payment & click "I have paid"</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  // Handle manual payment confirmation
                  if (confirm(`Have you completed the payment of ₹${order.totalAmount}?`)) {
                    processPayment('static-qr', {
                      manualConfirmation: true,
                      amount: order.totalAmount,
                      timestamp: new Date().toISOString(),
                      upiTransactionId: `UPI_${Date.now()}`
                    });
                  }
                }}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>I have paid ₹{order.totalAmount}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Payment Methods */}
        {currentStep === 'method' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Choose your preferred payment method
            </h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedMethod === method.id
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
                  } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.enabled && setSelectedMethod(method.id)}
                >
                  {method.popular && (
                    <div className="absolute -top-2 right-4">
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        selectedMethod === method.id ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <method.icon className={`h-6 w-6 ${
                          selectedMethod === method.id ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        {method.instantVerification && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Zap className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Instant verification</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          {currentStep === 'method' ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !selectedMethod}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center space-x-2 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {selectedMethod === 'cod' ? 'Confirm Order' : `Pay ₹${order.totalAmount}`}
                  </span>
                )}
              </button>
            </div>
          ) : currentStep === 'payment' ? (
            <button
              onClick={handleCancel}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Payment Methods</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
} 