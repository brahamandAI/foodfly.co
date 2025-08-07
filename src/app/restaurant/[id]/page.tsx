'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin, Tag, Plus, Minus, ArrowLeft, Heart, Share2, Filter } from 'lucide-react';
import { cartApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
  image: string;
  address: {
    street: string;
    city: string;
    area: string;
  };
  phone: string;
  description: string;
  isActive: boolean;
  offers?: string[];
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  isAvailable: boolean;
  isPopular?: boolean;
  dietary: string[];
}

export default function RestaurantPage() {
  const params = useParams();
  const restaurantId = params?.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});
  const [isAddingToCart, setIsAddingToCart] = useState<{[key: string]: boolean}>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartMessage, setCartMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantData();
      checkAuthAndLoadCart();
    }
  }, [restaurantId]);

  useEffect(() => {
    // Load cart data for all users (including guests)
    loadCartData();
  }, [isLoggedIn]);

  const checkAuthAndLoadCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      // Load cart from localStorage for non-logged-in users
      const savedCart = localStorage.getItem('testCart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }
      return;
    }

    setIsLoggedIn(true);
    try {
      const cart = await cartApi.getCart(restaurantId);
      if (cart) {
        const cartItemsMap = cart.items.reduce((acc, item) => {
          acc[item.menuItem._id] = item.quantity;
          return acc;
        }, {} as {[key: string]: number});
        setCartItems(cartItemsMap);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    }
  };

  const fetchRestaurantData = async () => {
    try {
      // For testing purposes, always use mock data with full menu items
      console.log('Loading mock restaurant data for testing...');
      const mockData = getMockRestaurantData(restaurantId);
      setRestaurant(mockData.restaurant);
      setMenuItems(mockData.menuItems);
      setCategories(['all', ...mockData.categories]);
      
      // Uncomment below lines when backend is ready
      // const restaurantResponse = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/restaurants/${restaurantId}`
      // );
      // if (restaurantResponse.ok) {
      //   const restaurantData = await restaurantResponse.json();
      //   setRestaurant(restaurantData);
      // }
      // const menuResponse = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/menu/${restaurantId}`
      // );
      // if (menuResponse.ok) {
      //   const menuData = await menuResponse.json();
      //   setMenuItems(menuData.items || []);
      //   setCategories(['all', ...(menuData.categories || [])]);
      // }

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      const mockData = getMockRestaurantData(restaurantId);
      setRestaurant(mockData.restaurant);
      setMenuItems(mockData.menuItems);
      setCategories(['all', ...mockData.categories]);
    } finally {
      setIsLoading(false);
    }
  };

  const showCartMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setCartMessage({ message, type });
    setTimeout(() => setCartMessage(null), 3000);
  };

  const updateCartInStorage = (updatedCart: {[key: string]: number}) => {
    // Remove localStorage usage - use database exclusively
    setCartItems(updatedCart);
    // Dispatch cart update event for header to refresh
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const incrementItem = async (menuItem: MenuItem) => {
    const currentQuantity = cartItems[menuItem._id] || 0;
    
    // Prevent multiple rapid clicks
    if (isAddingToCart[menuItem._id]) return;
    
    try {
      // OPTIMISTIC UPDATE - Single state update to prevent shaking
      const newQuantity = currentQuantity + 1;
      setCartItems(prev => ({ ...prev, [menuItem._id]: newQuantity }));
      
      // Background API call without triggering events that cause reloads
      if (currentQuantity === 0) {
        await addToCart(menuItem, 1);
      } else {
        const { unifiedCartService } = require('@/lib/api');
        await unifiedCartService.updateItemQuantity(menuItem._id, newQuantity);
      }
      
    } catch (error) {
      // ROLLBACK on error
      const originalQuantity = cartItems[menuItem._id] || 0;
      setCartItems(prev => ({ ...prev, [menuItem._id]: Math.max(0, originalQuantity - 1) }));
      
      console.error('Error incrementing item:', error);
      toast.error('Failed to update item');
    }
  };

  const decrementItem = async (menuItem: MenuItem) => {
    const currentQuantity = cartItems[menuItem._id] || 0;
    if (currentQuantity <= 0) return;
    
    // Prevent multiple rapid clicks
    if (isAddingToCart[menuItem._id]) return;
    
    try {
      if (currentQuantity <= 1) {
        // Remove item completely
        setCartItems(prev => {
          const updated = { ...prev };
          delete updated[menuItem._id];
          return updated;
        });
        
        const { unifiedCartService } = require('@/lib/api');
        await unifiedCartService.removeFromCart(menuItem._id);
      } else {
        // Decrease quantity
        const newQuantity = currentQuantity - 1;
        setCartItems(prev => ({ ...prev, [menuItem._id]: newQuantity }));
        
        const { unifiedCartService } = require('@/lib/api');
        await unifiedCartService.updateItemQuantity(menuItem._id, newQuantity);
      }
      
    } catch (error) {
      // ROLLBACK on error
      const originalQuantity = cartItems[menuItem._id] || 0;
      setCartItems(prev => ({ ...prev, [menuItem._id]: originalQuantity + 1 }));
      
      console.error('Error decrementing item:', error);
      toast.error('Failed to update item');
    }
  };

  const addToCart = async (menuItem: MenuItem, quantity: number = 1) => {
    setIsAddingToCart(prev => ({ ...prev, [menuItem._id]: true }));

    try {
      const { unifiedCartService } = require('@/lib/api');
      
      await unifiedCartService.addToCart(
        menuItem._id,
        menuItem.name,
        menuItem.description || '',
        menuItem.price,
        quantity,
        menuItem.image || '',
        restaurantId,
        restaurant?.name || 'Restaurant',
        []
      );
      
      toast.success(`${menuItem.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAddingToCart(prev => {
        const updated = { ...prev };
        delete updated[menuItem._id];
        return updated;
      });
    }
  };

  const loadCartData = async () => {
    try {
      // Use unified cart service that works for both guests and authenticated users
      const { unifiedCartService } = require('@/lib/api');
      const cartData = await unifiedCartService.getCart();
      
      if (cartData && cartData.items) {
        const cartItemsMap = cartData.items.reduce((acc, item) => {
          acc[item.menuItemId] = item.quantity;
          return acc;
        }, {} as {[key: string]: number});
        setCartItems(cartItemsMap);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Don't show error toast during initial load
    }
  };

  const getCartTotal = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const quantity = cartItems[itemId];
      const item = getAllMenuItems().find(item => item._id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
  };

  const getAllMenuItems = () => {
    const mockData = getMockRestaurantData(restaurantId);
    return mockData.menuItems;
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Mock data function to get restaurant and menu data based on ID
  const getMockRestaurantData = (id: string) => {
    const mockRestaurants = {
      'rest_001': {
        restaurant: {
          _id: id,
          name: 'Pizza Palace',
          cuisine: ['Italian', 'Fast Food'],
          rating: 4.5,
          deliveryTime: '25-30 mins',
          minimumOrder: 200,
          deliveryFee: 40,
          image: '/images/restaurent/cafe.jpg',
          address: { street: '123 Main St', city: 'Mumbai', area: 'Bandra' },
          phone: '+91 9876543210',
          description: 'Authentic Italian cuisine with the best pizzas in town',
          isActive: true,
          offers: ['20% OFF on orders above ₹500']
        },
        menuItems: [
          {
            _id: 'item_001',
            name: 'Margherita Pizza',
            description: 'Classic pizza with fresh tomatoes, mozzarella cheese, and basil',
            price: 299,
            image: '/images/categories/pizza-2.jpeg',
            category: 'Pizza',
            isVeg: true,
            rating: 4.4,
            isAvailable: true,
            isPopular: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_002',
            name: 'Chicken Supreme Pizza',
            description: 'Loaded with chicken, peppers, onions, and cheese',
            price: 449,
            image: '/images/categories/pizza-2.jpeg',
            category: 'Pizza',
            isVeg: false,
            rating: 4.6,
            isAvailable: true,
            dietary: ['Non-Vegetarian']
          },
          {
            _id: 'item_003',
            name: 'Garlic Bread',
            description: 'Crispy bread with garlic butter and herbs',
            price: 149,
            image: '/images/categories/Italian.jpg',
            category: 'Appetizer',
            isVeg: true,
            rating: 4.2,
            isAvailable: true,
            dietary: ['Vegetarian']
          }
        ],
        categories: ['Pizza', 'Appetizer']
      },
      'rest_002': {
        restaurant: {
          _id: id,
          name: 'Burger Junction',
          cuisine: ['American', 'Fast Food'],
          rating: 4.3,
          deliveryTime: '20-25 mins',
          minimumOrder: 150,
          deliveryFee: 30,
          image: '/images/restaurent/panache.jpg',
          address: { street: '456 Park Ave', city: 'Mumbai', area: 'Powai' },
          phone: '+91 9876543211',
          description: 'Best burgers and fast food in town',
          isActive: true,
          offers: ['Buy 1 Get 1 Free on Burgers']
        },
        menuItems: [
          {
            _id: 'item_004',
            name: 'Classic Beef Burger',
            description: 'Juicy beef patty with lettuce, tomato, and special sauce',
            price: 249,
            image: '/images/categories/burger-2.jpg',
            category: 'Burger',
            isVeg: false,
            rating: 4.5,
            isAvailable: true,
            isPopular: true,
            dietary: ['Non-Vegetarian']
          },
          {
            _id: 'item_005',
            name: 'Veggie Delight Burger',
            description: 'Crispy veggie patty with fresh vegetables and mayo',
            price: 199,
            image: '/images/categories/burger-2.jpg',
            category: 'Burger',
            isVeg: true,
            rating: 4.1,
            isAvailable: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_006',
            name: 'Loaded Fries',
            description: 'Crispy fries topped with cheese, herbs, and sauces',
            price: 129,
            image: '/images/categories/Fast-food.jpg',
            category: 'Sides',
            isVeg: true,
            rating: 4.3,
            isAvailable: true,
            dietary: ['Vegetarian']
          }
        ],
        categories: ['Burger', 'Sides']
      },
      'rest_003': {
        restaurant: {
          _id: id,
          name: 'Spice Garden',
          cuisine: ['Indian', 'North Indian'],
          rating: 4.7,
          deliveryTime: '30-40 mins',
          minimumOrder: 300,
          deliveryFee: 50,
          image: '/images/restaurent/symposium.jpg',
          address: { street: '789 Spice St', city: 'Mumbai', area: 'Andheri' },
          phone: '+91 9876543212',
          description: 'Authentic Indian cuisine with rich flavors and spices',
          isActive: true,
          offers: ['Free Dessert on orders above ₹600']
        },
        menuItems: [
          {
            _id: 'item_007',
            name: 'Butter Chicken',
            description: 'Creamy tomato-based curry with tender chicken pieces',
            price: 349,
            image: '/images/categories/chicken.jpg',
            category: 'Main Course',
            isVeg: false,
            rating: 4.8,
            isAvailable: true,
            isPopular: true,
            dietary: ['Non-Vegetarian']
          },
          {
            _id: 'item_008',
            name: 'Paneer Makhani',
            description: 'Rich and creamy cottage cheese curry',
            price: 299,
            image: '/images/categories/North-indian.jpg',
            category: 'Main Course',
            isVeg: true,
            rating: 4.6,
            isAvailable: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_009',
            name: 'Garlic Naan',
            description: 'Soft bread with garlic and butter',
            price: 79,
            image: '/images/categories/North-indian.jpg',
            category: 'Bread',
            isVeg: true,
            rating: 4.4,
            isAvailable: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_010',
            name: 'Basmati Rice',
            description: 'Fragrant long-grain rice',
            price: 99,
            image: '/images/categories/North-indian.jpg',
            category: 'Rice',
            isVeg: true,
            rating: 4.2,
            isAvailable: true,
            dietary: ['Vegetarian']
          }
        ],
        categories: ['Main Course', 'Bread', 'Rice']
      },
      'rest_004': {
        restaurant: {
          _id: id,
          name: 'Dragon Palace',
          cuisine: ['Chinese', 'Asian'],
          rating: 4.4,
          deliveryTime: '25-35 mins',
          minimumOrder: 250,
          deliveryFee: 45,
          image: '/images/restaurent/cafe.jpg',
          address: { street: '321 Dragon St', city: 'Mumbai', area: 'Malad' },
          phone: '+91 9876543213',
          description: 'Authentic Chinese cuisine with traditional flavors',
          isActive: true,
          offers: ['30% OFF on Chinese Combos']
        },
        menuItems: [
          {
            _id: 'item_011',
            name: 'Chicken Fried Rice',
            description: 'Wok-tossed rice with chicken and vegetables',
            price: 249,
            image: '/images/categories/Chinese.jpg',
            category: 'Rice',
            isVeg: false,
            rating: 4.3,
            isAvailable: true,
            isPopular: true,
            dietary: ['Non-Vegetarian']
          },
          {
            _id: 'item_012',
            name: 'Veg Hakka Noodles',
            description: 'Stir-fried noodles with fresh vegetables',
            price: 199,
            image: '/images/categories/Chinese.jpg',
            category: 'Noodles',
            isVeg: true,
            rating: 4.2,
            isAvailable: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_013',
            name: 'Honey Chilli Chicken',
            description: 'Crispy chicken in sweet and spicy sauce',
            price: 329,
            image: '/images/categories/Chinese.jpg',
            category: 'Appetizer',
            isVeg: false,
            rating: 4.5,
            isAvailable: true,
            dietary: ['Non-Vegetarian']
          }
        ],
        categories: ['Rice', 'Noodles', 'Appetizer']
      },
      'rest_005': {
        restaurant: {
          _id: id,
          name: 'Dessert Heaven',
          cuisine: ['Desserts', 'Bakery'],
          rating: 4.6,
          deliveryTime: '15-25 mins',
          minimumOrder: 100,
          deliveryFee: 25,
          image: '/images/restaurent/panache.jpg',
          address: { street: '654 Sweet St', city: 'Mumbai', area: 'Juhu' },
          phone: '+91 9876543214',
          description: 'Sweet treats and desserts to satisfy your cravings',
          isActive: true,
          offers: ['Buy 2 Get 1 Free on Cakes']
        },
        menuItems: [
          {
            _id: 'item_014',
            name: 'Chocolate Truffle Cake',
            description: 'Rich chocolate cake with truffle frosting',
            price: 399,
            image: '/images/categories/desserts.jpg',
            category: 'Cake',
            isVeg: true,
            rating: 4.7,
            isAvailable: true,
            isPopular: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_015',
            name: 'Vanilla Milkshake',
            description: 'Creamy vanilla shake with ice cream',
            price: 149,
            image: '/images/categories/shakes.jpg',
            category: 'Beverage',
            isVeg: true,
            rating: 4.4,
            isAvailable: true,
            dietary: ['Vegetarian']
          },
          {
            _id: 'item_016',
            name: 'Chocolate Brownie',
            description: 'Warm chocolate brownie with vanilla ice cream',
            price: 179,
            image: '/images/categories/desserts.jpg',
            category: 'Dessert',
            isVeg: true,
            rating: 4.5,
            isAvailable: true,
            dietary: ['Vegetarian']
          }
        ],
        categories: ['Cake', 'Beverage', 'Dessert']
      }
    };

    // Return the specific restaurant data or default to the first one
    return mockRestaurants[id as keyof typeof mockRestaurants] || mockRestaurants['rest_001'];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Restaurant not found</h2>
          <Link href="/" className="text-red-600 hover:text-red-700">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-64 md:h-80">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            href="/"
            className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition-all ${
                isFavorite ? 'bg-red-600 text-white' : 'bg-white bg-opacity-90 hover:bg-opacity-100'
              }`}
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-lg opacity-90 mb-2">{restaurant.cuisine.join(', ')}</p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{restaurant.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{restaurant.address.area}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Restaurant Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">₹{restaurant.minimumOrder}</div>
                  <div className="text-sm text-gray-600">Minimum Order</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">₹{restaurant.deliveryFee}</div>
                  <div className="text-sm text-gray-600">Delivery Fee</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{restaurant.deliveryTime}</div>
                  <div className="text-sm text-gray-600">Delivery Time</div>
                </div>
              </div>

              {restaurant.offers && restaurant.offers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-red-600" />
                    Available Offers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.offers.map((offer, index) => (
                      <span
                        key={index}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {offer}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center space-x-4 overflow-x-auto">
                <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {filteredMenuItems.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {item.isPopular && (
                        <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          Popular
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{item.name}</h3>
                            <span className={`w-3 h-3 rounded-full ${
                              item.isVeg ? 'bg-green-600' : 'bg-red-600'
                            }`}></span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{item.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{item.dietary.join(', ')}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-800 mb-2">₹{item.price}</div>
                          {item.isAvailable ? (
                            <div className="flex items-center space-x-2">
                              {cartItems[item._id] > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => decrementItem(item)}
                                    className="w-8 h-8 rounded-full border border-red-600 text-red-600 flex items-center justify-center hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium text-red-600">{cartItems[item._id]}</span>
                                  <button
                                    onClick={() => incrementItem(item)}
                                    className="w-8 h-8 rounded-full border border-red-600 text-red-600 flex items-center justify-center hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-red-600 font-medium">Not Available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Restaurant Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="text-gray-800">{restaurant.address.street}, {restaurant.address.area}, {restaurant.address.city}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="text-gray-800">{restaurant.phone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Cuisines:</span>
                  <p className="text-gray-800">{restaurant.cuisine.join(', ')}</p>
                </div>
              </div>

              {Object.keys(cartItems).length > 0 && (
                <Link
                  href="/cart"
                  className="w-full mt-6 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors text-center block"
                >
                  View Cart ({getCartItemsCount()} items)
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {cartMessage && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          cartMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              {cartMessage.type === 'success' ? '✓' : '!'}
            </div>
            <span>{cartMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
} 