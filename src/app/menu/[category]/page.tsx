"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import { toast } from 'react-hot-toast';

const playfair = Playfair_Display({ subsets: ['latin'] });
const cormorant = Cormorant_Garamond({ weight: ['400', '600'], subsets: ['latin'] });

// Slug to display name mapping
const slugToDisplayName: Record<string, string> = {
  'north-indian': 'North Indian',
  'chinese': 'Chinese',
  'oriental': 'Oriental',
  'italian': 'Italian',
  'european': 'European',
  'south-indian': 'South Indian',
  'mughlai': 'Mughlai',
  'fast-food': 'Fast Food',
  'beverages': 'Beverages',
  'desserts': 'Desserts',
  'non-veg-starters': 'Non Veg Starters',
  'main-course-chicken': 'Main Course Chicken',
  'main-course-mutton': 'Main Course Mutton',
  'veg-starters': 'Veg Starters',
  'main-course-pure-veg': 'Main Course Pure Veg',
  'breads': 'Breads',
  'biryani-rice': 'Biryani & Rice',
  'noodles': 'Noodles',
};

// Dummy data for demonstration
const foodItems: Record<string, { name: string; price: number }[]> = {
  'North Indian': [
    { name: 'Butter Chicken', price: 280 },
    { name: 'Paneer Tikka Masala', price: 250 },
    { name: 'Dal Makhani', price: 180 },
    { name: 'Naan', price: 40 },
  ],
  'Chinese': [
    { name: 'Veg Manchurian', price: 140 },
    { name: 'Chilli Paneer', price: 150 },
    { name: 'Chicken Manchurian', price: 180 },
    { name: 'Fried Rice', price: 120 },
  ],
  'Oriental': [
    { name: 'Sushi Roll', price: 200 },
    { name: 'Teriyaki Chicken', price: 220 },
    { name: 'Miso Soup', price: 80 },
    { name: 'Tempura', price: 160 },
  ],
  'Italian': [
    { name: 'Margherita Pizza', price: 250 },
    { name: 'Pasta Carbonara', price: 180 },
    { name: 'Bruschetta', price: 120 },
    { name: 'Tiramisu', price: 150 },
  ],
  'European': [
    { name: 'Grilled Salmon', price: 350 },
    { name: 'Beef Steak', price: 400 },
    { name: 'Caesar Salad', price: 180 },
    { name: 'French Fries', price: 100 },
  ],
  'South Indian': [
    { name: 'Masala Dosa', price: 120 },
    { name: 'Idli Sambar', price: 80 },
    { name: 'Vada', price: 60 },
    { name: 'Coconut Chutney', price: 30 },
  ],
  'Mughlai': [
    { name: 'Chicken Biryani', price: 280 },
    { name: 'Mutton Rogan Josh', price: 320 },
    { name: 'Shahi Paneer', price: 200 },
    { name: 'Naan', price: 40 },
  ],
  'Fast Food': [
    { name: 'Burger', price: 150 },
    { name: 'French Fries', price: 100 },
    { name: 'Chicken Wings', price: 200 },
    { name: 'Pizza Slice', price: 120 },
  ],
  'Beverages': [
    { name: 'Mix Berries Shake', price: 325 },
    { name: 'Cold Coffee', price: 295 },
    { name: 'Various Ice Teas', price: 299 },
    { name: 'Fresh Juice', price: 150 },
  ],
  'Desserts': [
    { name: 'Chocolate Cake', price: 180 },
    { name: 'Ice Cream', price: 120 },
    { name: 'Gulab Jamun', price: 80 },
    { name: 'Rasmalai', price: 100 },
  ],
  'Non Veg Starters': [
    { name: 'Tandoori Chicken', price: 280 },
    { name: 'Afgani Chicken', price: 270 },
    { name: 'Chicken Fry', price: 250 },
    { name: 'Chicken Tikka', price: 130 },
  ],
  'Main Course Chicken': [
    { name: 'Butter Chicken (Boneless)', price: 230 },
    { name: 'Chicken Rara', price: 250 },
    { name: 'Kadai Chicken', price: 220 },
  ],
  'Main Course Mutton': [
    { name: 'Mutton Rogan Josh', price: 230 },
    { name: 'Mutton Rara', price: 270 },
    { name: 'Mutton Masala', price: 230 },
  ],
  'Veg Starters': [
    { name: 'Soya Malai Chap', price: 100 },
    { name: 'Paneer Tikka', price: 130 },
    { name: 'Veg Hara Bhara Kabab', price: 110 },
  ],
  'Main Course Pure Veg': [
    { name: 'Dal Makhani', price: 180 },
    { name: 'Shahi Paneer', price: 200 },
    { name: 'Kadhai Paneer', price: 210 },
  ],
  'Breads': [
    { name: 'Butter Naan', price: 40 },
    { name: 'Garlic Naan', price: 50 },
    { name: 'Tandoori Roti', price: 25 },
  ],
  'Biryani & Rice': [
    { name: 'Veg Biryani', price: 150 },
    { name: 'Chicken Biryani', price: 180 },
    { name: 'Mutton Biryani', price: 220 },
  ],
  'Noodles': [
    { name: 'Veg Noodles', price: 120 },
    { name: 'Chicken Noodles', price: 150 },
    { name: 'Schezwan Noodles', price: 140 },
  ],
};

export default function CategoryMenuPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = slugToDisplayName[categorySlug] || categorySlug.replace(/-/g, ' ');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<Record<string, { name: string; price: number; quantity: number }>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(!!(token && user && loggedIn));
    };

    checkAuth();
    
    // Listen for auth changes
    const handleAuthChange = () => checkAuth();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const toggleFavorite = (idx: number) => {
    setFavorites((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const updateQuantity = (itemName: string, change: number) => {
    // Allow quantity updates for all users (including guests)
    const currentQty = quantities[itemName] || 0;
    const newQty = Math.max(0, currentQty + change);
    setQuantities((prev) => ({
      ...prev,
      [itemName]: newQty,
    }));
    
    // Remove from cart if quantity becomes 0
    if (newQty === 0) {
      setCartItems((prev) => {
        const newCart = { ...prev };
        delete newCart[itemName];
        return newCart;
      });
    }
  };

  const addToCart = async (item: { name: string; price: number }) => {
    try {
      // Use unified cart service that works for both guests and authenticated users
      const { unifiedCartService } = require('@/lib/api');
      
      const currentQty = quantities[item.name] || 1;
      
      await unifiedCartService.addToCart(
        item.name.toLowerCase().replace(/\s+/g, '_') + '_menu',
        item.name,
        `Delicious ${item.name}`,
        Number(item.price) || 0,
        currentQty, // Use the selected quantity
        '/images/placeholder.svg',
        'foodfly_kitchen',
        'FoodFly Kitchen',
        [] // customizations
      );
      
      // Update cart state
      setCartItems((prev) => ({
        ...prev,
        [item.name]: { ...item, quantity: currentQty }
      }));
      
      // Update cart count in header
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success(`${currentQty} ${item.name}(s) added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      toast.error(errorMessage);
    }
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalCartValue = () => {
    return Object.values(cartItems).reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const items = foodItems[category] || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Cart Summary - Fixed at top */}
      {getTotalCartItems() > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-6 h-6 text-red-500" />
              <span className="text-white font-semibold">
                {getTotalCartItems()} items in cart
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-red-400 font-bold text-lg">
                ₹{getTotalCartValue()}
              </span>
              <Link 
                href="/cart" 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold transition-colors"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={`relative h-[200px] bg-black ${getTotalCartItems() > 0 ? 'mt-16' : ''}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Link href="/menu" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Categories
            </Link>
            <h1 className={`${cormorant.className} text-4xl md:text-5xl font-semibold mb-4 tracking-wider uppercase`}>
              <span className="text-red-500">Menu</span>
            </h1>
            <h2 className={`${playfair.className} text-2xl text-white`}>{category}</h2>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {items.map((item, idx) => {
            const currentQty = quantities[item.name] || 0;
            const isInCart = cartItems[item.name];
            
            return (
              <div key={idx} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      aria-label={favorites[idx] ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={() => toggleFavorite(idx)}
                      className="focus:outline-none"
                    >
                      <Heart className={`w-6 h-6 ${favorites[idx] ? 'fill-red-500 text-red-500' : 'text-gray-400'} transition`} />
                    </button>
                    <span className="text-lg text-white font-semibold">{item.name}</span>
                  </div>
                  <span className="text-red-400 font-bold text-lg">₹{item.price}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.name, -1)}
                      className="w-8 h-8 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center transition-colors"
                      disabled={currentQty === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-semibold min-w-[2rem] text-center">
                      {currentQty}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.name, 1)}
                      className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => addToCart(item)}
                    disabled={currentQty === 0}
                    className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                      currentQty === 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isInCart
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isInCart ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 