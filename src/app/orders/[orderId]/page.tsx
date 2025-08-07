'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Star, 
  Package, 
  Truck, 
  CheckCircle, 
  Phone, 
  Receipt, 
  AlertCircle, 
  Calendar,
  Repeat,
  Eye,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface OrderItem {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
    description?: string;
    category?: string;
  };
  quantity: number;
  price: number;
  customization?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    _id: string;
    name: string;
    image: string;
    phone: string;
    address: {
      street: string;
      city: string;
      area: string;
    };
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryFee: number;
  tax: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  deliveryAddress: {
    name: string;
    phone: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  estimatedDeliveryTime: string;
  placedAt: string;
  deliveredAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  cancelledAt?: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const statusConfig = {
    pending: { 
      label: 'Order Placed', 
      icon: Clock, 
      color: 'text-yellow-600 bg-yellow-100 border-yellow-200', 
      description: 'Waiting for confirmation',
      step: 1
    },
    confirmed: { 
      label: 'Confirmed', 
      icon: CheckCircle, 
      color: 'text-blue-600 bg-blue-100 border-blue-200', 
      description: 'Restaurant confirmed',
      step: 2
    },
    preparing: { 
      label: 'Preparing', 
      icon: Package, 
      color: 'text-orange-600 bg-orange-100 border-orange-200', 
      description: 'Your food is being prepared',
      step: 3
    },
    ready: { 
      label: 'Ready', 
      icon: CheckCircle, 
      color: 'text-green-600 bg-green-100 border-green-200', 
      description: 'Your order is ready',
      step: 4
    },
    out_for_delivery: { 
      label: 'Out for Delivery', 
      icon: Truck, 
      color: 'text-purple-600 bg-purple-100 border-purple-200', 
      description: 'Your food is on the way',
      step: 5
    },
    delivered: { 
      label: 'Delivered', 
      icon: CheckCircle, 
      color: 'text-green-600 bg-green-100 border-green-200', 
      description: 'Order completed successfully',
      step: 6
    },
    cancelled: { 
      label: 'Cancelled', 
      icon: AlertCircle, 
      color: 'text-red-600 bg-red-100 border-red-200', 
      description: 'Order has been cancelled',
      step: 0
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    
    try {
      // Add items to cart
      const { unifiedCartService } = await import('@/lib/api');
      
      for (const item of order.items) {
        await unifiedCartService.addToCart({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
          customization: item.customization
        });
      }
      
      toast.success('Items added to cart!');
      router.push('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to add items to cart');
    }
  };

  const handleReviewSubmit = async () => {
    if (!order || rating === 0) return;
    
    try {
      const response = await fetch(`/api/reviews/order/${order._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          review,
          restaurantId: order.restaurant._id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setRating(0);
      setReview('');
      fetchOrderDetails(); // Refresh to show the review
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedTime = (estimatedDeliveryTime: string) => {
    const estimated = new Date(estimatedDeliveryTime);
    const now = new Date();
    const diffMs = estimated.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins <= 0) return 'Delivered';
    if (diffMins < 60) return `${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const statusInfo = statusConfig[order.status];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                  <p className="text-gray-600">Order #{order.orderNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReorder}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Repeat className="h-4 w-4" />
                  <span>Reorder</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                    <statusInfo.icon className="h-4 w-4 mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order Placed</span>
                    <span className="text-sm text-gray-900">{formatDate(order.placedAt)} at {formatTime(order.placedAt)}</span>
                  </div>
                  
                  {order.deliveredAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Delivered</span>
                      <span className="text-sm text-gray-900">{formatDate(order.deliveredAt)} at {formatTime(order.deliveredAt)}</span>
                    </div>
                  )}
                  
                  {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estimated Delivery</span>
                      <span className="text-sm text-green-600 font-medium">{getEstimatedTime(order.estimatedDeliveryTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Ordered</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 relative flex-shrink-0">
                        <Image
                          src={item.menuItem.image || '/images/placeholder.svg'}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                        {item.menuItem.isVeg && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.menuItem.name}</h3>
                        {item.menuItem.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.menuItem.description}</p>
                        )}
                        {item.customization && (
                          <p className="text-sm text-gray-500 mt-1">Customization: {item.customization}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="text-lg font-semibold text-gray-900">₹{item.price}</span>
                        </div>
                        <p className="text-sm text-gray-500">₹{item.menuItem.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Details</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={order.restaurant.image || '/images/placeholder.svg'}
                      alt={order.restaurant.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{order.restaurant.name}</h3>
                    <p className="text-sm text-gray-600">{order.restaurant.address.street}</p>
                    <p className="text-sm text-gray-600">{order.restaurant.address.area}, {order.restaurant.address.city}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <a href={`tel:${order.restaurant.phone}`} className="flex items-center text-sm text-red-600 hover:text-red-700">
                        <Phone className="h-4 w-4 mr-1" />
                        {order.restaurant.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              {order.status === 'delivered' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Your Experience</h2>
                  
                  {order.rating ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 ${
                              star <= order.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600">({order.rating}/5)</span>
                      </div>
                      {order.review && (
                        <p className="text-gray-700 italic">"{order.review}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`h-8 w-8 ${
                              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            <Star className="h-full w-full" />
                          </button>
                        ))}
                        <span className="text-sm text-gray-600">({rating}/5)</span>
                      </div>
                      
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience (optional)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                        rows={3}
                      />
                      
                      <button
                        onClick={handleReviewSubmit}
                        disabled={rating === 0}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹{order.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{order.tax}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-semibold">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                  <p className="text-gray-600">{order.deliveryAddress.street}</p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-gray-600">Landmark: {order.deliveryAddress.landmark}</p>
                  )}
                  <p className="text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </p>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {order.deliveryAddress.phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 