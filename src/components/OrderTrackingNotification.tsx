'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Phone, 
  Navigation,
  Star,
  X
} from 'lucide-react';

interface OrderTrackingNotificationProps {
  orderId: string;
  onClose?: () => void;
}

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleType: string;
  vehicleNumber: string;
  photo?: string;
  estimatedArrival: number; // minutes
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

interface OrderStatus {
  status: 'assigned' | 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered';
  timestamp: string;
  message: string;
}

export default function OrderTrackingNotification({ orderId, onClose }: OrderTrackingNotificationProps) {
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('assigned');
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(30);

  useEffect(() => {
    // Simulate delivery partner assignment
    setTimeout(() => {
      const mockDeliveryPartner: DeliveryPartner = {
        id: 'DP001',
        name: 'Rajesh Kumar',
        phone: '+91 9876543210',
        rating: 4.8,
        vehicleType: 'bike',
        vehicleNumber: 'DL01AB1234',
        estimatedArrival: 25,
        currentLocation: {
          lat: 28.6139,
          lng: 77.2090
        }
      };

      setDeliveryPartner(mockDeliveryPartner);
      setOrderStatus([
        {
          status: 'assigned',
          timestamp: new Date().toISOString(),
          message: `${mockDeliveryPartner.name} has been assigned to your order`
        }
      ]);
      setCurrentStatus('assigned');
      
      // Show notification
      toast.success(`🚚 ${mockDeliveryPartner.name} is assigned to deliver your order!`, {
        duration: 5000,
        icon: '🚚'
      });
    }, 2000);

    // Simulate status updates
    setTimeout(() => {
      setCurrentStatus('accepted');
      setOrderStatus(prev => [...prev, {
        status: 'accepted',
        timestamp: new Date().toISOString(),
        message: 'Your delivery partner has accepted the order and is heading to the restaurant'
      }]);
      toast.success('📱 Order accepted by delivery partner!');
    }, 5000);

    setTimeout(() => {
      setCurrentStatus('picked_up');
      setOrderStatus(prev => [...prev, {
        status: 'picked_up',
        timestamp: new Date().toISOString(),
        message: 'Your order has been picked up from the restaurant'
      }]);
      toast.success('📦 Order picked up! On the way to you!');
      setEstimatedTime(15);
    }, 15000);

    setTimeout(() => {
      setCurrentStatus('out_for_delivery');
      setOrderStatus(prev => [...prev, {
        status: 'out_for_delivery',
        timestamp: new Date().toISOString(),
        message: 'Your order is out for delivery'
      }]);
      toast.success('🛵 Your order is on the way!');
      setEstimatedTime(8);
    }, 25000);

  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'accepted': return 'bg-yellow-500';
      case 'picked_up': return 'bg-orange-500';
      case 'out_for_delivery': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Truck className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Navigation className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const vehicleIcons = {
    bike: '🏍️',
    scooter: '🛵',
    bicycle: '🚲',
    car: '🚗'
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const trackDelivery = () => {
    if (deliveryPartner?.currentLocation) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${deliveryPartner.currentLocation.lat},${deliveryPartner.currentLocation.lng}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (!deliveryPartner) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm z-50 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Notification */}
      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm z-50 transform transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 flex items-center">
            <Truck className="h-5 w-5 text-blue-500 mr-2" />
            Order Tracking
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Delivery Partner Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {deliveryPartner.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 flex items-center">
              {deliveryPartner.name}
              <div className="flex items-center ml-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-gray-600 ml-1">{deliveryPartner.rating}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              <span className="mr-2">
                {vehicleIcons[deliveryPartner.vehicleType as keyof typeof vehicleIcons]}
              </span>
              {deliveryPartner.vehicleNumber}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full ${getStatusColor(currentStatus)} flex items-center justify-center text-white`}>
                {getStatusIcon(currentStatus)}
              </div>
              <span className="font-medium text-gray-900 capitalize">
                {currentStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              ETA: {estimatedTime} min
            </div>
          </div>
          {orderStatus.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {orderStatus[orderStatus.length - 1].message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${deliveryPartner.phone}`}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-center font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Phone className="h-4 w-4" />
            <span>Call</span>
          </a>
          <button
            onClick={trackDelivery}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-center font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <MapPin className="h-4 w-4" />
            <span>Track</span>
          </button>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {/* Detailed Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Tracking</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Order ID */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono font-bold text-gray-900">#{orderId}</p>
              </div>

              {/* Delivery Partner Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Partner</h3>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {deliveryPartner.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center">
                      {deliveryPartner.name}
                      <div className="flex items-center ml-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-gray-600 ml-1">{deliveryPartner.rating}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{deliveryPartner.phone}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <span className="mr-2">
                        {vehicleIcons[deliveryPartner.vehicleType as keyof typeof vehicleIcons]}
                      </span>
                      {deliveryPartner.vehicleType.charAt(0).toUpperCase() + deliveryPartner.vehicleType.slice(1)} • {deliveryPartner.vehicleNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Status</h3>
                <div className="space-y-4">
                  {orderStatus.map((status, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(status.status)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getStatusIcon(status.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 capitalize">
                            {status.status.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTime(status.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{status.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${deliveryPartner.phone}`}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl text-center font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call Partner</span>
                </a>
                <button
                  onClick={trackDelivery}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl text-center font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Track Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}