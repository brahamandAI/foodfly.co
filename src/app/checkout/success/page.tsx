'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, MapPin, Phone, Receipt, ArrowRight, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    name: string;
    phone: string;
    address: {
      street: string;
      city: string;
      area: string;
    };
  };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  estimatedDeliveryTime: string;
  status: string;
  items: Array<{
    menuItem: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    loadOrder();
  }, [orderId, router]);

  useEffect(() => {
    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const loadOrder = async () => {
    try {
      // Fetch specific order from database API
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      const foundOrder = data.order;
      
      if (foundOrder) {
        // Transform the order data to match the expected format
        setOrder({
          _id: foundOrder._id,
          orderNumber: foundOrder.orderNumber,
          restaurant: {
            name: foundOrder.restaurant?.name || 'FoodFly Kitchen',
            phone: foundOrder.restaurant?.phone || '+91 9876543210',
            address: {
              street: 'Main Street',
              city: 'Your City',
              area: 'Food District'
            }
          },
          totalAmount: foundOrder.totalAmount,
          paymentMethod: foundOrder.paymentMethod,
          paymentStatus: foundOrder.paymentStatus,
          deliveryAddress: foundOrder.deliveryAddress,
          estimatedDeliveryTime: foundOrder.estimatedDeliveryTime,
          status: foundOrder.status,
          items: foundOrder.items.map((item: any) => ({
            menuItem: {
              name: item.name,
              price: item.price
            },
            quantity: item.quantity
          }))
        });
      } else {
        toast.error('Order not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEstimatedDeliveryTime = () => {
    if (!order) return '';
    const estimatedTime = new Date(order.estimatedDeliveryTime);
    const now = new Date();
    const diffMinutes = Math.ceil((estimatedTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Arriving soon';
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <Link href="/" className="text-red-600 hover:text-red-700">
              Go to Home
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Order Placed Successfully!</h1>
              <p className="text-xl opacity-90">
                Thank you for your order. We're preparing your delicious meal!
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
              <p className="text-lg font-semibold mb-2">Order Number</p>
              <p className="text-2xl font-bold tracking-wider">{order.orderNumber}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              {/* Delivery Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-6 w-6 text-red-600 mr-2" />
                  Delivery Information
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}, 
                      {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Restaurant Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-6 w-6 text-red-600 mr-2" />
                  Restaurant Details
                </h2>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.restaurant.name}</p>
                  <p className="text-sm text-gray-600">{order.restaurant.phone}</p>
                  <p className="text-sm text-gray-600">
                    {order.restaurant.address.street}, {order.restaurant.address.area}, {order.restaurant.address.city}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="h-6 w-6 text-red-600 mr-2" />
                  Payment Details
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium capitalize ${
                      order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Amount</span>
                    <span className="text-red-600">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary & Status */}
            <div className="space-y-6">
              {/* Delivery Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-6 w-6 text-red-600 mr-2" />
                  Delivery Status
                </h2>
                
                <div className="text-center">
                  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full inline-block font-semibold mb-4">
                    Order Confirmed
                  </div>
                  
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {getEstimatedDeliveryTime()}
                  </p>
                  <p className="text-gray-600 mb-4">Estimated delivery time</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      🍳 Your order is being prepared by our chef. 
                      You'll receive updates as your order progresses!
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
                
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₹{item.menuItem.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
                
                <div className="space-y-3">
                  <Link
                    href="/orders"
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Receipt className="h-5 w-5" />
                    <span>Track Your Order</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  
                  <Link
                    href="/menu"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Order More Food</span>
                  </Link>
                  
                  <Link
                    href="/"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Home className="h-5 w-5" />
                    <span>Back to Home</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Redirect Notice */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-blue-800">
                You'll be automatically redirected to order tracking in {countdown} seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}