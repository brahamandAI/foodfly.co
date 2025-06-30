'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, Package, Truck, MapPin, Phone, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface OrderTrackingProps {
  orderId: string;
  onClose?: () => void;
  initialOrder?: any;
}

interface OrderStatus {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: string;
  message?: string;
}

interface TrackingInfo {
  orderNumber: string;
  status: string;
  statusHistory: OrderStatus[];
  estimatedDeliveryTime: number;
  remainingTime: number;
  restaurant: {
    name: string;
    phone: string;
    address: {
      street: string;
      city: string;
      area: string;
    };
  };
  deliveryBoy?: {
    name: string;
    phone: string;
  };
  otp?: string;
}

export default function OrderTracking({ orderId, onClose, initialOrder }: OrderTrackingProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [order, setOrder] = useState(initialOrder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Your order has been received' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Restaurant confirmed your order' },
    { key: 'preparing', label: 'Preparing', icon: Package, description: 'Your food is being prepared' },
    { key: 'ready', label: 'Ready', icon: CheckCircle, description: 'Order is ready for pickup' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Order is on the way' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Order delivered successfully' }
  ];

  useEffect(() => {
    fetchTrackingInfo();
    
    // Start polling for active orders
    if (order?.status && ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [orderId]);

  const fetchTrackingInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [trackingData, orderData] = await Promise.all([
        orderApi.trackOrder(orderId),
        orderApi.getOrderById(orderId)
      ]);
      
      setTrackingInfo(trackingData);
      setOrder(orderData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      setError('Failed to load tracking information');
      toast.error('Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return; // Already polling
    
    setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const updatedOrder = await orderApi.pollOrderStatus(orderId);
        
        // Check if status changed
        if (order && updatedOrder.status !== order.status) {
          setOrder(updatedOrder);
          
          // Show status update notification
          const statusStep = statusSteps.find(step => step.key === updatedOrder.status);
          if (statusStep) {
            toast.success(`Order ${statusStep.label}! ${statusStep.description}`);
          }
          
          // Refresh tracking info
          fetchTrackingInfo();
          
          // Stop polling if order is completed
          if (['delivered', 'cancelled'].includes(updatedOrder.status)) {
            stopPolling();
          }
        } else {
          // Update remaining time
          setOrder(updatedOrder);
        }
        
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('Error polling order status:', error);
      }
    }, 30000); // Poll every 30 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const getStatusStepIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const getCurrentStepIndex = () => {
    if (!order?.status) return 0;
    return getStatusStepIndex(order.status);
  };

  const formatTime = (minutes: number) => {
    if (minutes <= 0) return 'Any moment now';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    fetchTrackingInfo();
  };

  const handleCancelOrder = async () => {
    try {
      await orderApi.cancelOrder(orderId, 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      fetchTrackingInfo();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Tracking</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trackingInfo || !order) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600">Unable to find tracking information for this order.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Order #{trackingInfo.orderNumber}</h2>
            <p className="text-red-100 mt-1">
              {trackingInfo.restaurant.name}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors ${
                isPolling ? 'animate-spin' : ''
              }`}
              title="Refresh tracking"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Delivery Time Info */}
        {isActive && (
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-100">Estimated Delivery</p>
                <p className="text-lg font-semibold">
                  {order.remainingTime > 0 ? formatTime(order.remainingTime) : 'Arriving soon'}
                </p>
              </div>
              {trackingInfo.otp && (
                <div className="text-right">
                  <p className="text-sm text-red-100">Delivery OTP</p>
                  <p className="text-2xl font-bold">{trackingInfo.otp}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivered Status */}
        {isDelivered && (
          <div className="mt-4 bg-green-500 bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-200" />
              <div>
                <p className="font-semibold">Order Delivered Successfully!</p>
                <p className="text-sm text-green-100">
                  Delivered at {formatTimestamp(order.deliveredAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled Status */}
        {isCancelled && (
          <div className="mt-4 bg-red-500 bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-red-200" />
              <div>
                <p className="font-semibold">Order Cancelled</p>
                <p className="text-sm text-red-100">
                  Cancelled at {formatTimestamp(order.cancelledAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
        
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex && !isCancelled;
            const isCurrent = index === currentStepIndex && !isCancelled;
            const statusEntry = trackingInfo.statusHistory.find(entry => entry.status === step.key);
            
            return (
              <div key={step.key} className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {statusEntry && (
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(statusEntry.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                  {statusEntry?.message && (
                    <p className="text-sm text-blue-600 mt-1">{statusEntry.message}</p>
                  )}
                </div>

                {/* Connector Line */}
                {index < statusSteps.length - 1 && (
                  <div className={`absolute left-11 mt-10 w-0.5 h-8 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ marginTop: '2.5rem' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Restaurant & Delivery Info */}
      <div className="border-t bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Restaurant Info */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Restaurant Details</h4>
            <div className="space-y-2">
              <p className="font-medium">{trackingInfo.restaurant.name}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {trackingInfo.restaurant.address.street}, {trackingInfo.restaurant.address.area}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{trackingInfo.restaurant.phone}</span>
              </div>
            </div>
          </div>

          {/* Delivery Boy Info */}
          {trackingInfo.deliveryBoy && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Delivery Partner</h4>
              <div className="space-y-2">
                <p className="font-medium">{trackingInfo.deliveryBoy.name}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{trackingInfo.deliveryBoy.phone}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isPolling && (
              <span className="ml-2 text-blue-600">• Live tracking active</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {order.status === 'pending' && (
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel Order
              </button>
            )}
            
            {isDelivered && !order.rating && (
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Rate Order</span>
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 