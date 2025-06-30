'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Home, 
  CheckCircle, 
  ShoppingBag, 
  Edit, 
  Plus, 
  Loader2,
  Wallet,
  Building2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '@/components/AuthGuard';

interface CartItem {
  id?: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  isVeg?: boolean;
  restaurantId?: string;
  restaurantName?: string;
  customizations?: any[];
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  restaurantId?: string;
  restaurantName?: string;
}

interface Address {
  _id?: string;
  label: 'Home' | 'Work' | 'Other' | 'Custom';
  name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  description: string;
  enabled: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: 'Home',
    name: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Wallet,
      description: 'Pay when your order arrives',
      enabled: true
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: CreditCard,
      description: 'Pay with UPI apps',
      enabled: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with your card',
      enabled: true
    }
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  useEffect(() => {
    loadCartData();
    loadAddresses();
    
    // Also check for addresses when component mounts
    const handleStorageChange = () => {
      loadAddresses();
    };
    
    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadCartData = async () => {
    try {
      // Use database cart API exclusively
      const { cartService } = require('@/lib/api');
      const cartData = await cartService.getCart();
      
      if (cartData && cartData.items && cartData.items.length > 0) {
        setCart({
          items: cartData.items,
          subtotal: cartData.subtotal || 0,
          totalItems: cartData.totalItems || 0,
          restaurantId: cartData.restaurantId,
          restaurantName: cartData.restaurantName
        });
      } else {
        router.push('/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      router.push('/cart');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      // Use database address API exclusively
      const response = await fetch('/api/users/addresses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
      
      // Set default address if available
      const defaultAddress = data.addresses?.find((addr: any) => addr.isDefault);
      if (defaultAddress && !selectedAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    }
  };

  const saveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Use database address API exclusively
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save address');
      }

      const data = await response.json();
      
      // Update addresses list
      await loadAddresses();
      
      // Select the newly added address
      if (data.address) {
        setSelectedAddress(data.address);
      }

      setShowAddressForm(false);
      setNewAddress({
        label: 'Home',
        name: '',
        phone: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      
      toast.success('Address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address';
      toast.error(errorMessage);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Use database order API exclusively
      const { orderService } = require('@/lib/api');
      
      const orderData = {
        items: cart.items.map(item => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations || []
        })),
        deliveryAddress: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          street: selectedAddress.street,
          landmark: selectedAddress.landmark || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode
        },
        paymentMethod: selectedPaymentMethod,
        specialInstructions: specialInstructions,
        totalAmount: total
      };

      console.log('Placing order with data:', orderData); // Debug log

      const response = await orderService.placeOrder(orderData);
      
      // Clear cart after successful order
      const { cartService } = require('@/lib/api');
      await cartService.clearCart();
      
      toast.success('Order placed successfully!');
      router.push(`/checkout/success?orderId=${response.orderId}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Safe calculation functions
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const subtotal = safeNumber(cart.subtotal);
  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const taxes = Math.round(subtotal * 0.05);
  const packagingFee = safeNumber(cart.totalItems) * 5;
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
            <div className="flex items-center space-x-4">
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="text-sm text-gray-600">Review and place your order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-6 w-6 text-red-600 mr-2" />
                    Delivery Address
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center text-red-600 hover:text-red-700 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add New
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
                    <p className="text-gray-600 mb-6">Add your first address to continue with checkout</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAddress?._id === address._id
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-red-300 hover:shadow-sm bg-white'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                                address.label === 'Home' ? 'bg-blue-100 text-blue-800' :
                                address.label === 'Work' ? 'bg-purple-100 text-purple-800' :
                                address.label === 'Custom' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {address.label === 'Home' ? '🏠' : 
                                 address.label === 'Work' ? '🏢' : 
                                 address.label === 'Custom' ? '⭐' : '📍'} {address.label}
                              </span>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                                  ✓ Default
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">{address.name}</p>
                              <p className="text-sm text-gray-600 flex items-center">
                                📞 {address.phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                📍 {address.street}
                                {address.landmark && `, near ${address.landmark}`}
                                <br />
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {selectedAddress?._id === address._id && (
                              <div className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improved Add Address Form */}
                {showAddressForm && (
                  <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Add New Address</h3>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                        <select
                          value={newAddress.label}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value as 'Home' | 'Work' | 'Other' | 'Custom' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                        >
                          <option value="Home">🏠 Home</option>
                          <option value="Work">🏢 Work</option>
                          <option value="Other">📍 Other</option>
                          <option value="Custom">⭐ Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={newAddress.name || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={newAddress.phone || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                        <input
                          type="text"
                          value={newAddress.pincode || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Enter pincode"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={newAddress.street || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="House/Flat/Office No, Building Name, Street"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={newAddress.landmark || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Nearby landmark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={newAddress.city || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input
                          type="text"
                          value={newAddress.state || ''}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                          placeholder="Enter state"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center bg-white p-3 rounded-md border border-gray-200">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddress.isDefault || false}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 text-sm font-medium text-gray-700">
                        Make this my default address
                      </label>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={saveAddress}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-6 w-6 text-red-600 mr-2" />
                  Payment Method
                </h2>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => method.enabled && setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <method.icon className="h-6 w-6 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <CheckCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for your order? (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 sticky top-24">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ShoppingBag className="h-6 w-6 text-red-600 mr-2" />
                    Order Summary
                  </h2>
                  
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <div className="w-12 h-12 relative flex-shrink-0">
                          <Image
                                                          src={item.image || '/images/placeholder.svg'}
                            alt={item.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600">Qty:</span>
                            <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border">
                              {safeNumber(item.quantity)}
                            </span>
                            <span className="text-xs text-gray-600">×</span>
                            <span className="text-sm font-medium text-gray-700">₹{safeNumber(item.price)}</span>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          ₹{safeNumber(item.price) * safeNumber(item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pricing Breakdown */}
                  <div className="space-y-3 text-sm border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Subtotal ({cart.totalItems} items)</span>
                      <span className="font-bold text-gray-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Delivery Fee</span>
                      <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Taxes (5%)</span>
                      <span className="font-bold text-gray-900">₹{taxes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Packaging Fee</span>
                      <span className="font-bold text-gray-900">₹{packagingFee}</span>
                    </div>
                    <div className="border-t pt-3 mt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-red-600">₹{total}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Info */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Delivery in 30-45 minutes</span>
                    </div>
                  </div>
                  
                  {/* Place Order Button */}
                  <button
                    onClick={placeOrder}
                    disabled={!selectedAddress || !selectedPaymentMethod || isProcessingOrder}
                    className="w-full mt-6 bg-red-600 text-white py-4 px-6 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingOrder ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6" />
                        <span>Place Order ₹{total}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 