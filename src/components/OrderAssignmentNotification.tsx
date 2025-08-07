'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface OrderAssignment {
  orderId: string;
  status: string;
  restaurantLocation: {
    coordinates: [number, number];
    address?: string;
  };
  customerLocation: {
    coordinates: [number, number];
    address?: string;
  };
  orderSummary: {
    totalAmount: number;
    itemCount: number;
    specialInstructions?: string;
    estimatedPreparationTime?: number;
  };
  assignedAt: string;
  timeoutAt: string;
  priority: number;
}

interface OrderAssignmentNotificationProps {
  assignment: OrderAssignment;
  onAccept: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason?: string) => Promise<void>;
  onTimeout?: (orderId: string) => void;
}

const REJECTION_REASONS = [
  'Too far from current location',
  'Currently on another delivery',
  'Vehicle issue',
  'Personal emergency',
  'Other'
];

export default function OrderAssignmentNotification({
  assignment,
  onAccept,
  onReject,
  onTimeout
}: OrderAssignmentNotificationProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const timeout = new Date(assignment.timeoutAt).getTime();
      const now = new Date().getTime();
      const difference = timeout - now;
      
      if (difference > 0) {
        setTimeLeft(Math.ceil(difference / 1000));
      } else {
        setTimeLeft(0);
        if (onTimeout) {
          onTimeout(assignment.orderId);
        }
      }
    };

    // Calculate initial time
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [assignment.timeoutAt, assignment.orderId, onTimeout]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(assignment.orderId);
      toast.success('Order accepted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept order');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const reason = rejectionReason === 'Other' ? customReason : rejectionReason;
      await onReject(assignment.orderId, reason);
      toast.success('Order rejected');
      setShowRejectModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject order');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = calculateDistance(
    assignment.restaurantLocation.coordinates[1],
    assignment.restaurantLocation.coordinates[0],
    assignment.customerLocation.coordinates[1],
    assignment.customerLocation.coordinates[0]
  );

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft <= 10;

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isExpired ? 'pointer-events-none' : ''
      }`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        
        {/* Modal */}
        <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isExpired ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}>
          {/* Header with countdown */}
          <div className={`px-6 py-4 text-white transition-colors duration-300 ${
            isExpired ? 'bg-gray-500' : isUrgent ? 'bg-red-600' : 'bg-green-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">🍔 New Order Assignment</h3>
                <p className="text-sm opacity-90">
                  {isExpired ? 'Expired' : 'Respond quickly'}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${
                  isUrgent ? 'animate-pulse' : ''
                }`}>
                  {isExpired ? '00:00' : formatTime(timeLeft)}
                </div>
                <p className="text-xs opacity-90">
                  {isExpired ? 'Time up!' : 'Time left'}
                </p>
              </div>
            </div>
            
            {/* Priority indicator */}
            {assignment.priority > 1 && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-yellow-300">⭐</span>
                <span className="text-sm font-medium">
                  Priority Order (Level {assignment.priority})
                </span>
              </div>
            )}
          </div>

          {/* Order details */}
          <div className="p-6 space-y-4">
            {/* Order summary */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">Order Value</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(assignment.orderSummary.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{assignment.orderSummary.itemCount} items</span>
                <span>Order #{assignment.orderId.slice(-6)}</span>
              </div>
              {assignment.orderSummary.estimatedPreparationTime && (
                <div className="mt-2 text-sm text-orange-600">
                  ⏱️ Prep time: {assignment.orderSummary.estimatedPreparationTime} min
                </div>
              )}
            </div>

            {/* Distance info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">📍 Delivery Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Est. time:</span>
                  <span className="font-medium">{Math.round(distance * 3)} min</span>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">🏪 Restaurant</h5>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                  {assignment.restaurantLocation.address || 'Address not available'}
                </p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">🏠 Customer</h5>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                  {assignment.customerLocation.address || 'Address not available'}
                </p>
              </div>
            </div>

            {/* Special instructions */}
            {assignment.orderSummary.specialInstructions && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                <h5 className="text-sm font-medium text-orange-800 mb-1">📝 Special Instructions</h5>
                <p className="text-sm text-orange-700">
                  {assignment.orderSummary.specialInstructions}
                </p>
              </div>
            )}

            {/* Action buttons */}
            {!isExpired && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Accepting...
                    </span>
                  ) : (
                    '✅ Accept Order'
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Reject
                </button>
              </div>
            )}

            {isExpired && (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-gray-600 font-medium">
                  ⏰ This assignment has expired
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  The order has been reassigned to another delivery partner
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for rejecting this order:
            </p>
            
            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-red-600"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                className="w-full p-3 border rounded-lg text-sm resize-none"
                rows={3}
                maxLength={100}
              />
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason || (rejectionReason === 'Other' && !customReason.trim())}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 