'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, X, ShoppingCart, Plus, Minus, Trash2, Check } from 'lucide-react';

interface CustomNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

interface CartNotification {
  type: 'add' | 'remove' | 'update' | 'clear' | 'sync';
  itemName?: string;
  quantity?: number;
  message: string;
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);
  const [cartNotifications, setCartNotifications] = useState<CartNotification[]>([]);

  useEffect(() => {
    // Listen for custom notification events
    const handleCustomNotification = (event: CustomEvent<CustomNotification>) => {
      const notification = event.detail;
      addNotification(notification);
    };

    // Listen for authentication events
    const handleAuthSuccess = () => {
      toast.success('Successfully logged in!', {
        icon: '🎉',
        duration: 3000,
      });
    };

    const handleAuthLogout = () => {
      toast.success('Logged out successfully', {
        icon: '👋',
        duration: 2000,
      });
    };

    // Listen for cart events
    const handleCartUpdate = (event: CustomEvent) => {
      const { type, itemName, quantity, message } = event.detail;
      
      // Show appropriate toast notification
      switch (type) {
        case 'add':
          toast.success(
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-green-600" />
              <span>{message || `${itemName} added to cart`}</span>
            </div>,
            {
              duration: 2000,
              position: 'bottom-right',
            }
          );
          break;
        
        case 'remove':
          toast.success(
            <div className="flex items-center space-x-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span>{message || `${itemName} removed from cart`}</span>
            </div>,
            {
              duration: 2000,
              position: 'bottom-right',
            }
          );
          break;
        
        case 'update':
          toast.success(
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span>{message || `${itemName} quantity updated`}</span>
            </div>,
            {
              duration: 1500,
              position: 'bottom-right',
            }
          );
          break;
        
        case 'clear':
          toast.success(
            <div className="flex items-center space-x-2">
              <X className="h-4 w-4 text-gray-600" />
              <span>{message || 'Cart cleared'}</span>
            </div>,
            {
              duration: 2000,
              position: 'bottom-right',
            }
          );
          break;
        
        case 'sync':
          toast.success(
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>{message || 'Cart synced successfully'}</span>
            </div>,
            {
              duration: 1500,
              position: 'bottom-right',
            }
          );
          break;
      }
    };

    // Listen for regular cart updates
    const handleCartUpdated = () => {
      // Update cart count in header
      window.dispatchEvent(new Event('updateCartCount'));
    };

    // Listen for auth state changes to sync cart
    const handleAuthStateChange = async (event: CustomEvent) => {
      if (event.detail.isLoggedIn) {
        // User just logged in, initialize cart
        try {
          const { enhancedCartService } = await import('@/lib/api');
          await enhancedCartService.initializeCartOnLogin();
        } catch (error) {
          console.error('Error initializing cart on login:', error);
        }
      } else {
        // User logged out, clear any server-side cart references
        localStorage.removeItem('currentRestaurantId');
      }
    };

    // Listen for order events
    const handleOrderPlaced = (event: CustomEvent) => {
      const { orderId, total } = event.detail;
      toast.success(
        `Order placed successfully! Order ID: ${orderId}`,
        {
          icon: '🎉',
          duration: 5000,
        }
      );
      
      // Show persistent notification for order confirmation
      addNotification({
        id: `order-${orderId}`,
        type: 'success',
        title: 'Order Confirmed!',
        message: `Your order of ₹${total} has been placed successfully. You'll receive updates via SMS and email.`,
        persistent: true,
        action: {
          label: 'Track Order',
          onClick: () => window.location.href = `/orders`
        }
      });
    };

    // Add event listeners
    window.addEventListener('customNotification', handleCustomNotification as EventListener);
    window.addEventListener('authSuccess', handleAuthSuccess);
    window.addEventListener('authLogout', handleAuthLogout);
    window.addEventListener('cartNotification', handleCartUpdate as EventListener);
    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('orderPlaced', handleOrderPlaced as EventListener);

    return () => {
      window.removeEventListener('customNotification', handleCustomNotification as EventListener);
      window.removeEventListener('authSuccess', handleAuthSuccess);
      window.removeEventListener('authLogout', handleAuthLogout);
      window.removeEventListener('cartNotification', handleCartUpdate as EventListener);
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('orderPlaced', handleOrderPlaced as EventListener);
    };
  }, []);

  const addNotification = (notification: CustomNotification) => {
    setNotifications(prev => [...prev, notification]);
    
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      {/* Persistent Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getBgColor(notification.type)} border rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  {notification.message}
                </p>
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// Utility functions to trigger notifications
export const notificationHelpers = {
  orderPlaced: (orderId: string, total: number) => {
    window.dispatchEvent(new CustomEvent('orderPlaced', {
      detail: { orderId, total }
    }));
  },

  itemAddedToCart: (itemName: string) => {
    window.dispatchEvent(new CustomEvent('itemAddedToCart', {
      detail: { itemName }
    }));
  },

  authSuccess: () => {
    window.dispatchEvent(new CustomEvent('authSuccess'));
  },

  authLogout: () => {
    window.dispatchEvent(new CustomEvent('authLogout'));
  }
};

// Helper function to trigger cart notifications
export const triggerCartNotification = (type: CartNotification['type'], itemName?: string, quantity?: number, customMessage?: string) => {
  const message = customMessage || 
    (type === 'add' ? `${itemName} added to cart` :
     type === 'remove' ? `${itemName} removed from cart` :
     type === 'update' ? `${itemName} quantity updated` :
     type === 'clear' ? 'Cart cleared' :
     type === 'sync' ? 'Cart synced successfully' : '');

  window.dispatchEvent(new CustomEvent('cartNotification', {
    detail: { type, itemName, quantity, message }
  }));
};

export default NotificationSystem; 