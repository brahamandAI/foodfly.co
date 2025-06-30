'use client';

import React, { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Clock, MapPin, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  isVeg?: boolean;
  restaurantId?: string;
  restaurantName?: string;
  menuItemId: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  restaurantId?: string;
  restaurantName?: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      
      // Use database cart API exclusively
      const { cartService } = require('@/lib/api');
      const cartData = await cartService.getCart();
      
      if (cartData && cartData.items) {
        setCart({
          items: cartData.items,
          subtotal: cartData.subtotal || 0,
          totalItems: cartData.totalItems || 0
        });
      } else {
        setCart({ items: [], subtotal: 0, totalItems: 0 });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart({ items: [], subtotal: 0, totalItems: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));

    try {
      // Use startTransition to prevent UI jank
      startTransition(() => {
        setCart(prevCart => ({
          ...prevCart,
          items: prevCart.items.map(item =>
            item.menuItemId === itemId
              ? { ...item, quantity: newQuantity }
              : item
          ),
          subtotal: prevCart.items.reduce((sum, item) =>
            sum + (item.menuItemId === itemId ? item.price * newQuantity : item.price * item.quantity), 0
          ),
          totalItems: prevCart.items.reduce((sum, item) =>
            sum + (item.menuItemId === itemId ? newQuantity : item.quantity), 0
          )
        }));
      });

      // Background API call
      const { cartService } = require('@/lib/api');
      await cartService.updateItemQuantity(itemId, newQuantity);
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      // ROLLBACK - reload cart on error
      await loadCart();
      alert('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));

    try {
      // Use startTransition to prevent UI jank
      startTransition(() => {
        setCart(prevCart => {
          const remainingItems = prevCart.items.filter(item => item.menuItemId !== itemId);
          return {
            ...prevCart,
            items: remainingItems,
            subtotal: remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            totalItems: remainingItems.reduce((sum, item) => sum + item.quantity, 0)
          };
        });
      });

      // Background API call
      const { cartService } = require('@/lib/api');
      await cartService.removeFromCart(itemId);
      
    } catch (error) {
      console.error('Error removing item:', error);
      // ROLLBACK - reload cart on error
      await loadCart();
      alert('Failed to remove item');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      // Use database cart API exclusively
      const { cartService } = require('@/lib/api');
      await cartService.clearCart();
      await loadCart(); // Reload cart from database
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
      alert(errorMessage);
    }
  };

  // Safe calculation functions to prevent NaN
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const getDeliveryFee = (subtotal: number) => safeNumber(subtotal) >= 299 ? 0 : 40;
  const getTaxes = (subtotal: number) => Math.round(safeNumber(subtotal) * 0.05);
  const getPackagingFee = (itemCount: number) => safeNumber(itemCount) * 5;

  const subtotal = safeNumber(cart.subtotal);
  const deliveryFee = getDeliveryFee(subtotal);
  const taxes = getTaxes(subtotal);
  const packagingFee = getPackagingFee(cart.totalItems);
  const total = subtotal + deliveryFee + taxes + packagingFee;

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
                  <p className="text-sm text-gray-600">Review your items before checkout</p>
                </div>
              </div>
              {cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Add some delicious items to get started!</p>
              <Link
                href="/menu"
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Items from {cart.restaurantName || 'FoodFly Kitchen'}
                      </h2>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>30-45 mins delivery</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {cart.items.map((item, index) => (
                        <div key={`${item.menuItemId}-${index}`} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-2xl">🍽️</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-gray-900 font-semibold text-lg">{item.name}</h3>
                              {item.description && (
                                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                              )}
                              <p className="text-red-600 font-bold text-lg mt-2">₹{item.price}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                disabled={updatingItems[item.menuItemId] || item.quantity <= 1}
                                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-gray-900 font-bold text-lg min-w-[2rem] text-center bg-white px-3 py-2 rounded border border-gray-200">
                                {updatingItems[item.menuItemId] ? '...' : item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                disabled={updatingItems[item.menuItemId] || item.quantity >= 10}
                                className="w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.menuItemId)}
                              disabled={updatingItems[item.menuItemId]}
                              className="w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary - Enhanced */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 sticky top-24">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      Order Summary
                    </h2>
                    
                    <div className="space-y-4 text-base">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-800 font-medium">Subtotal ({safeNumber(cart.totalItems)} items)</span>
                        <span className="font-bold text-gray-900">₹{subtotal}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-800 font-medium">Delivery Fee</span>
                        <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-800 font-medium">Taxes & Fees (5%)</span>
                        <span className="font-bold text-gray-900">₹{taxes}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-800 font-medium">Packaging Fee</span>
                        <span className="font-bold text-gray-900">₹{packagingFee}</span>
                      </div>
                      
                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-red-600">₹{total}</span>
                        </div>
                      </div>
                    </div>
                    
                    {subtotal < 299 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">
                          💡 Add ₹{299 - subtotal} more for free delivery!
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Delivery in 30-45 minutes</span>
                      </div>
                      
                      <Link
                        href="/checkout"
                        className="w-full bg-red-600 text-white py-4 px-6 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-semibold text-lg shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle className="h-6 w-6" />
                        <span>Proceed to Checkout</span>
                      </Link>
                      
                      <Link
                        href="/menu"
                        className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add More Items</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 