'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin, Tag, Plus, Minus, ArrowLeft, Filter, Heart, Leaf } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DishOffering {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  preparationTime: string;
  customizations?: {
    name: string;
    options: { name: string; price: number }[];
  }[];
  restaurant: {
    _id: string;
    name: string;
    cuisine: string[];
    rating: number;
    deliveryTime: string;
    deliveryFee: number;
    minimumOrder: number;
    image: string;
    address: {
      area: string;
      city: string;
    };
    offers?: string[];
  };
}

export default function DishPage() {
  const params = useParams();
  const dishName = params?.name as string;
  const decodedDishName = decodeURIComponent(dishName || '');

  const [dishOfferings, setDishOfferings] = useState<DishOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'deliveryTime'>('price');
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});
  const [cartMessage, setCartMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  useEffect(() => {
    if (decodedDishName) {
      fetchDishOfferings();
    }
  }, [decodedDishName]);

  const fetchDishOfferings = async () => {
    try {
      // Mock data for testing - in production, this would fetch from API
      const mockOfferings = getMockDishOfferings(decodedDishName);
      setDishOfferings(mockOfferings);
    } catch (error) {
      console.error('Error fetching dish offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockDishOfferings = (dishName: string): DishOffering[] => {
    // This would be replaced with actual API call
    const allDishes = [
      // Pizza offerings
      {
        dishName: 'Pizza',
        categories: ['Pizza', 'Italian'],
        variants: [
          {
            _id: 'item_001_rest_001',
            name: 'Margherita Pizza',
            description: 'Classic pizza with fresh tomatoes, mozzarella cheese, and basil',
            price: 299,
            originalPrice: 349,
            image: '/images/categories/pizza-2.jpeg',
            category: 'Pizza',
            isVeg: true,
            rating: 4.4,
            preparationTime: '15-20 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Pizza Palace',
              cuisine: ['Italian', 'Fast Food'],
              rating: 4.5,
              deliveryTime: '25-30 mins',
              deliveryFee: 40,
              minimumOrder: 200,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Bandra', city: 'Mumbai' },
              offers: ['20% OFF on orders above ₹500']
            }
          },
          {
            _id: 'item_001_rest_002',
            name: 'Margherita Pizza',
            description: 'Authentic Neapolitan style pizza with buffalo mozzarella',
            price: 359,
            image: '/images/categories/pizza-2.jpeg',
            category: 'Pizza',
            isVeg: true,
            rating: 4.6,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Italian Corner',
              cuisine: ['Italian', 'Continental'],
              rating: 4.3,
              deliveryTime: '20-25 mins',
              deliveryFee: 30,
              minimumOrder: 250,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Powai', city: 'Mumbai' },
              offers: ['Free garlic bread with pizza']
            }
          },
          {
            _id: 'item_001_rest_003',
            name: 'Margherita Pizza',
            description: 'Wood-fired pizza with organic tomatoes and fresh basil',
            price: 449,
            image: '/images/categories/pizza-2.jpeg',
            category: 'Pizza',
            isVeg: true,
            rating: 4.8,
            preparationTime: '12-18 mins',
            restaurant: {
              _id: 'rest_003',
              name: 'Artisan Pizzeria',
              cuisine: ['Italian', 'Gourmet'],
              rating: 4.7,
              deliveryTime: '30-40 mins',
              deliveryFee: 50,
              minimumOrder: 300,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Premium ingredients guarantee']
            }
          }
        ]
      },
      // Burger offerings
      {
        dishName: 'Burger',
        categories: ['Burger', 'American', 'Fast Food'],
        variants: [
          {
            _id: 'item_004_rest_001',
            name: 'Classic Beef Burger',
            description: 'Juicy beef patty with lettuce, tomato, and special sauce',
            price: 249,
            originalPrice: 299,
            image: '/images/categories/burger-2.jpg',
            category: 'Burger',
            isVeg: false,
            rating: 4.5,
            preparationTime: '15-20 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Burger Junction',
              cuisine: ['American', 'Fast Food'],
              rating: 4.3,
              deliveryTime: '20-25 mins',
              deliveryFee: 30,
              minimumOrder: 150,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Powai', city: 'Mumbai' },
              offers: ['Buy 1 Get 1 Free on Burgers']
            }
          },
          {
            _id: 'item_004_rest_002',
            name: 'Classic Beef Burger',
            description: 'Premium Angus beef with artisanal bun and gourmet toppings',
            price: 399,
            image: '/images/categories/burger-2.jpg',
            category: 'Burger',
            isVeg: false,
            rating: 4.7,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Gourmet Burgers Co.',
              cuisine: ['American', 'Gourmet'],
              rating: 4.6,
              deliveryTime: '25-35 mins',
              deliveryFee: 45,
              minimumOrder: 200,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Bandra', city: 'Mumbai' },
              offers: ['Premium beef sourced locally']
            }
          }
        ]
      },
      // Chinese offerings
      {
        dishName: 'Chinese',
        categories: ['Chinese', 'Asian', 'Fried Rice', 'Noodles'],
        variants: [
          {
            _id: 'item_011_rest_001',
            name: 'Chicken Fried Rice',
            description: 'Wok-tossed rice with chicken and vegetables in soy sauce',
            price: 249,
            originalPrice: 299,
            image: '/images/categories/Chinese.jpg',
            category: 'Rice',
            isVeg: false,
            rating: 4.3,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Spice Garden',
              cuisine: ['Indian', 'North Indian'],
              rating: 4.7,
              deliveryTime: '30-40 mins',
              deliveryFee: 50,
              minimumOrder: 300,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Free Dessert on orders above ₹600']
            }
          },
          {
            _id: 'item_008_rest_002',
            name: 'Paneer Makhani',
            description: 'Traditional cottage cheese in tomato and cashew gravy',
            price: 249,
            image: '/images/categories/North-indian.jpg',
            category: 'Main Course',
            isVeg: true,
            rating: 4.3,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Punjabi Dhaba',
              cuisine: ['Indian', 'North Indian', 'Punjabi'],
              rating: 4.2,
              deliveryTime: '25-35 mins',
              deliveryFee: 35,
              minimumOrder: 200,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Goregaon', city: 'Mumbai' },
              offers: ['Authentic village style cooking']
            }
          }
        ]
      },
      // Chicken Fried Rice offerings
      {
        dishName: 'Chicken Fried Rice',
        variants: [
          {
            _id: 'item_011_rest_001',
            name: 'Chicken Fried Rice',
            description: 'Wok-tossed rice with chicken and vegetables in soy sauce',
            price: 249,
            originalPrice: 299,
            image: '/images/categories/Chinese.jpg',
            category: 'Rice',
            isVeg: false,
            rating: 4.3,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Dragon Palace',
              cuisine: ['Chinese', 'Asian'],
              rating: 4.4,
              deliveryTime: '25-35 mins',
              deliveryFee: 45,
              minimumOrder: 250,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Malad', city: 'Mumbai' },
              offers: ['30% OFF on Chinese Combos']
            }
          },
          {
            _id: 'item_011_rest_002',
            name: 'Chicken Fried Rice',
            description: 'Authentic Chinese style fried rice with tender chicken pieces',
            price: 199,
            image: '/images/categories/Chinese.jpg',
            category: 'Rice',
            isVeg: false,
            rating: 4.1,
            preparationTime: '15-20 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Chinese Corner',
              cuisine: ['Chinese', 'Fast Food'],
              rating: 4.0,
              deliveryTime: '20-30 mins',
              deliveryFee: 30,
              minimumOrder: 150,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Borivali', city: 'Mumbai' },
              offers: ['Quick delivery promise']
            }
          },
          {
            _id: 'item_011_rest_003',
            name: 'Chicken Fried Rice',
            description: 'Premium quality rice with marinated chicken and exotic vegetables',
            price: 329,
            image: '/images/categories/Chinese.jpg',
            category: 'Rice',
            isVeg: false,
            rating: 4.6,
            preparationTime: '22-28 mins',
            restaurant: {
              _id: 'rest_003',
              name: 'Golden Dragon',
              cuisine: ['Chinese', 'Thai', 'Asian Fusion'],
              rating: 4.5,
              deliveryTime: '30-40 mins',
              deliveryFee: 55,
              minimumOrder: 350,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Worli', city: 'Mumbai' },
              offers: ['Premium Asian cuisine']
            }
          }
        ]
      },
      // Chocolate Truffle Cake offerings
      {
        dishName: 'Chocolate Truffle Cake',
        variants: [
          {
            _id: 'item_014_rest_001',
            name: 'Chocolate Truffle Cake',
            description: 'Rich chocolate cake with truffle frosting and chocolate shavings',
            price: 399,
            originalPrice: 449,
            image: '/images/categories/desserts.jpg',
            category: 'Cake',
            isVeg: true,
            rating: 4.7,
            preparationTime: '10-15 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Dessert Heaven',
              cuisine: ['Desserts', 'Bakery'],
              rating: 4.6,
              deliveryTime: '15-25 mins',
              deliveryFee: 25,
              minimumOrder: 100,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Juhu', city: 'Mumbai' },
              offers: ['Buy 2 Get 1 Free on Cakes']
            }
          },
          {
            _id: 'item_014_rest_002',
            name: 'Chocolate Truffle Cake',
            description: 'Decadent chocolate cake with multiple layers of truffle cream',
            price: 359,
            image: '/images/categories/desserts.jpg',
            category: 'Cake',
            isVeg: true,
            rating: 4.5,
            preparationTime: '12-18 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Sweet Treats',
              cuisine: ['Desserts', 'Bakery', 'Confectionery'],
              rating: 4.4,
              deliveryTime: '20-30 mins',
              deliveryFee: 35,
              minimumOrder: 150,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Vile Parle', city: 'Mumbai' },
              offers: ['Fresh baked daily']
            }
          }
        ]
      },
      // Butter Chicken offerings
      {
        dishName: 'Butter Chicken',
        variants: [
          {
            _id: 'item_007_rest_001',
            name: 'Butter Chicken',
            description: 'Creamy tomato-based curry with tender chicken pieces',
            price: 349,
            originalPrice: 399,
            image: '/images/categories/chicken.jpg',
            category: 'Main Course',
            isVeg: false,
            rating: 4.8,
            preparationTime: '25-30 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Spice Garden',
              cuisine: ['Indian', 'North Indian'],
              rating: 4.7,
              deliveryTime: '30-40 mins',
              deliveryFee: 50,
              minimumOrder: 300,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Free Dessert on orders above ₹600']
            }
          },
          {
            _id: 'item_007_rest_002',
            name: 'Butter Chicken',
            description: 'Rich and creamy chicken curry with authentic spices',
            price: 299,
            image: '/images/categories/chicken.jpg',
            category: 'Main Course',
            isVeg: false,
            rating: 4.5,
            preparationTime: '20-25 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Punjab Kitchen',
              cuisine: ['Indian', 'North Indian', 'Punjabi'],
              rating: 4.4,
              deliveryTime: '25-35 mins',
              deliveryFee: 40,
              minimumOrder: 250,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Malad', city: 'Mumbai' },
              offers: ['Authentic Punjabi flavors']
            }
          },
          {
            _id: 'item_007_rest_003',
            name: 'Butter Chicken',
            description: 'Premium chicken cooked in rich cashew and tomato gravy',
            price: 429,
            image: '/images/categories/chicken.jpg',
            category: 'Main Course',
            isVeg: false,
            rating: 4.9,
            preparationTime: '30-35 mins',
            restaurant: {
              _id: 'rest_003',
              name: 'Royal Indian Cuisine',
              cuisine: ['Indian', 'Mughlai', 'Fine Dining'],
              rating: 4.8,
              deliveryTime: '35-45 mins',
              deliveryFee: 60,
              minimumOrder: 400,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Juhu', city: 'Mumbai' },
              offers: ['Royal dining experience']
            }
          }
        ]
      },
      // North Indian offerings
      {
        dishName: 'North Indian',
        categories: ['North Indian', 'Indian', 'Curry'],
        variants: [
          {
            _id: 'item_008_rest_001',
            name: 'Paneer Butter Masala',
            description: 'Rich and creamy cottage cheese curry with aromatic spices',
            price: 299,
            originalPrice: 349,
            image: '/images/categories/North-indian.jpg',
            category: 'Main Course',
            isVeg: true,
            rating: 4.6,
            preparationTime: '20-25 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Spice Garden',
              cuisine: ['Indian', 'North Indian'],
              rating: 4.7,
              deliveryTime: '30-40 mins',
              deliveryFee: 50,
              minimumOrder: 300,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Free Dessert on orders above ₹600']
            }
          },
          {
            _id: 'item_007_rest_001',
            name: 'Butter Chicken',
            description: 'Creamy tomato-based curry with tender chicken pieces',
            price: 349,
            originalPrice: 399,
            image: '/images/categories/chicken.jpg',
            category: 'Main Course',
            isVeg: false,
            rating: 4.8,
            preparationTime: '25-30 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Spice Garden',
              cuisine: ['Indian', 'North Indian'],
              rating: 4.7,
              deliveryTime: '30-40 mins',
              deliveryFee: 50,
              minimumOrder: 300,
              image: '/images/restaurent/symposium.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Free Dessert on orders above ₹600']
            }
          }
        ]
      },
      // South Indian offerings
      {
        dishName: 'South Indian',
        categories: ['South Indian', 'Indian', 'Dosa', 'Idli'],
        variants: [
          {
            _id: 'item_015_rest_001',
            name: 'Masala Dosa',
            description: 'Crispy crepe with spiced potato filling and coconut chutney',
            price: 149,
            originalPrice: 179,
            image: '/images/categories/South-indian.jpg',
            category: 'Breakfast',
            isVeg: true,
            rating: 4.5,
            preparationTime: '15-20 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'South Delight',
              cuisine: ['South Indian', 'Indian'],
              rating: 4.6,
              deliveryTime: '20-30 mins',
              deliveryFee: 35,
              minimumOrder: 100,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Thane', city: 'Mumbai' },
              offers: ['Authentic South Indian taste']
            }
          },
          {
            _id: 'item_015_rest_002',
            name: 'Idli Sambar',
            description: 'Steamed rice cakes with lentil curry and coconut chutney',
            price: 119,
            image: '/images/categories/South-indian.jpg',
            category: 'Breakfast',
            isVeg: true,
            rating: 4.4,
            preparationTime: '12-18 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Chennai Express',
              cuisine: ['South Indian', 'Tamil'],
              rating: 4.3,
              deliveryTime: '18-25 mins',
              deliveryFee: 25,
              minimumOrder: 80,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Dadar', city: 'Mumbai' },
              offers: ['Traditional recipes']
            }
          }
        ]
      },
      // Italian offerings
      {
        dishName: 'Italian',
        categories: ['Italian', 'Pasta', 'Continental'],
        variants: [
          {
            _id: 'item_016_rest_001',
            name: 'Spaghetti Carbonara',
            description: 'Classic Italian pasta with eggs, cheese, and pancetta',
            price: 349,
            originalPrice: 399,
            image: '/images/categories/Italian.jpg',
            category: 'Pasta',
            isVeg: false,
            rating: 4.7,
            preparationTime: '20-25 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Bella Italia',
              cuisine: ['Italian', 'Continental'],
              rating: 4.8,
              deliveryTime: '25-35 mins',
              deliveryFee: 45,
              minimumOrder: 300,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Bandra', city: 'Mumbai' },
              offers: ['Authentic Italian flavors']
            }
          },
          {
            _id: 'item_016_rest_002',
            name: 'Penne Arrabbiata',
            description: 'Spicy tomato-based pasta with garlic and red chili',
            price: 299,
            image: '/images/categories/Italian.jpg',
            category: 'Pasta',
            isVeg: true,
            rating: 4.5,
            preparationTime: '18-25 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Pasta Point',
              cuisine: ['Italian', 'Fast Food'],
              rating: 4.2,
              deliveryTime: '20-30 mins',
              deliveryFee: 30,
              minimumOrder: 200,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Powai', city: 'Mumbai' },
              offers: ['Fresh pasta daily']
            }
          }
        ]
      },
      // Desserts offerings
      {
        dishName: 'Desserts',
        categories: ['Desserts', 'Sweets', 'Cake'],
        variants: [
          {
            _id: 'item_014_rest_001',
            name: 'Chocolate Truffle Cake',
            description: 'Rich chocolate cake with truffle frosting and chocolate shavings',
            price: 399,
            originalPrice: 449,
            image: '/images/categories/desserts.jpg',
            category: 'Cake',
            isVeg: true,
            rating: 4.7,
            preparationTime: '10-15 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Dessert Heaven',
              cuisine: ['Desserts', 'Bakery'],
              rating: 4.6,
              deliveryTime: '15-25 mins',
              deliveryFee: 25,
              minimumOrder: 100,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Juhu', city: 'Mumbai' },
              offers: ['Buy 2 Get 1 Free on Cakes']
            }
          },
          {
            _id: 'item_014_rest_002',
            name: 'Gulab Jamun',
            description: 'Traditional Indian sweet balls in sugar syrup',
            price: 149,
            image: '/images/categories/desserts.jpg',
            category: 'Indian Sweets',
            isVeg: true,
            rating: 4.5,
            preparationTime: '5-10 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Sweet Treats',
              cuisine: ['Desserts', 'Indian Sweets'],
              rating: 4.4,
              deliveryTime: '20-30 mins',
              deliveryFee: 35,
              minimumOrder: 150,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Vile Parle', city: 'Mumbai' },
              offers: ['Fresh sweets daily']
            }
          }
        ]
      },
      // Beverages offerings
      {
        dishName: 'Beverages',
        categories: ['Beverages', 'Drinks', 'Juice'],
        variants: [
          {
            _id: 'item_017_rest_001',
            name: 'Fresh Orange Juice',
            description: 'Freshly squeezed orange juice with no added sugar',
            price: 99,
            originalPrice: 129,
            image: '/images/categories/Bevarages.jpg',
            category: 'Juice',
            isVeg: true,
            rating: 4.4,
            preparationTime: '5-10 mins',
            restaurant: {
              _id: 'rest_001',
              name: 'Juice Junction',
              cuisine: ['Beverages', 'Healthy'],
              rating: 4.3,
              deliveryTime: '15-20 mins',
              deliveryFee: 20,
              minimumOrder: 50,
              image: '/images/restaurent/cafe.jpg',
              address: { area: 'Andheri', city: 'Mumbai' },
              offers: ['Fresh juices daily']
            }
          },
          {
            _id: 'item_017_rest_002',
            name: 'Mango Lassi',
            description: 'Thick and creamy yogurt drink with fresh mango',
            price: 129,
            image: '/images/categories/Bevarages.jpg',
            category: 'Lassi',
            isVeg: true,
            rating: 4.6,
            preparationTime: '8-12 mins',
            restaurant: {
              _id: 'rest_002',
              name: 'Lassi Point',
              cuisine: ['Beverages', 'Indian'],
              rating: 4.5,
              deliveryTime: '12-18 mins',
              deliveryFee: 25,
              minimumOrder: 80,
              image: '/images/restaurent/panache.jpg',
              address: { area: 'Malad', city: 'Mumbai' },
              offers: ['Traditional lassi recipes']
            }
          }
        ]
      }
    ];

    // Find dish by exact name match or category match
    const foundDish = allDishes.find(dish => 
      dish.dishName.toLowerCase() === dishName.toLowerCase() ||
      (dish.categories && dish.categories.some(category => category.toLowerCase() === dishName.toLowerCase()))
    );

    return foundDish ? foundDish.variants : [];
  };

  const sortedOfferings = [...dishOfferings].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'deliveryTime':
        return parseInt(a.restaurant.deliveryTime) - parseInt(b.restaurant.deliveryTime);
      default:
        return 0;
    }
  });

  const showCartMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setCartMessage({ message, type });
    setTimeout(() => setCartMessage(null), 3000);
  };

  const addToCart = async (item: DishOffering, quantity: number = 1) => {
    try {
      // Use database cart API exclusively
      const { cartService } = require('@/lib/api');
      
      const basePrice = item.price;
      const sizePrice = 0; // Assuming no size customization
      const customizationPrice = item.customizations?.reduce((sum, custom) => sum + (custom.options.find(o => o.name === 'Regular')?.price || 0), 0) || 0;
      const totalPrice = basePrice + sizePrice + customizationPrice;
      
      await cartService.addToCart(
        item._id,
        item.name,
        item.description || '',
        totalPrice,
        quantity,
        item.image || '',
        item.restaurant._id,
        item.restaurant.name,
        item.customizations
      );
      
      // Update cart count in header
      window.dispatchEvent(new Event('cartUpdated'));
      
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
      
      showCartMessage(`${item.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      alert(errorMessage);
    }
  };

  const handleAddToCart = async (item: DishOffering) => {
    await addToCart(item);
  };

  const incrementItem = (item: DishOffering) => {
    addToCart(item, 1);
  };

  const decrementItem = (item: DishOffering) => {
    addToCart(item, -1);
  };

  const removeFromCart = (itemId: string) => {
    // Implementation needed
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dish offerings...</p>
        </div>
      </div>
    );
  }

  if (dishOfferings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dish not found</h1>
          <p className="text-gray-600 mb-6">We couldn't find any restaurants offering "{decodedDishName}"</p>
          <Link href="/" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cart Message */}
      {cartMessage && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          cartMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {cartMessage.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{decodedDishName}</h1>
                <p className="text-gray-600">{dishOfferings.length} restaurants offering this dish</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="price">Sort by Price</option>
                <option value="rating">Sort by Rating</option>
                <option value="deliveryTime">Sort by Delivery Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dish Offerings */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {sortedOfferings.map((offering) => (
            <div key={offering._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Dish Image */}
                  <div className="w-full md:w-48 h-48 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={offering.image}
                      alt={offering.name}
                      fill
                      className="object-cover"
                    />
                    {offering.isVeg && (
                      <div className="absolute top-2 left-2 bg-green-100 p-1 rounded">
                        <Leaf className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Dish Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{offering.name}</h3>
                        <p className="text-gray-600 mb-2">{offering.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{offering.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{offering.preparationTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-800">₹{offering.price}</span>
                          {offering.originalPrice && (
                            <span className="text-lg text-gray-500 line-through">₹{offering.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart */}
                      <div className="flex flex-col items-end space-y-3">
                        {cartItems[offering._id] ? (
                          <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-2">
                            <button
                              onClick={() => decrementItem(offering)}
                              className="w-8 h-8 rounded-full border border-red-600 text-red-600 flex items-center justify-center hover:bg-red-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{cartItems[offering._id]}</span>
                            <button
                              onClick={() => incrementItem(offering)}
                              className="w-8 h-8 rounded-full border border-red-600 text-red-600 flex items-center justify-center hover:bg-red-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(offering)}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Restaurant Info */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/restaurant/${offering.restaurant._id}`}
                          className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        >
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                            <Image
                              src={offering.restaurant.image}
                              alt={offering.restaurant.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{offering.restaurant.name}</h4>
                            <p className="text-sm text-gray-600">{offering.restaurant.cuisine.join(', ')}</p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{offering.restaurant.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{offering.restaurant.deliveryTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Tag className="h-3 w-3" />
                                <span>₹{offering.restaurant.deliveryFee} delivery</span>
                              </div>
                            </div>
                          </div>
                        </Link>

                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {offering.restaurant.address.area}
                          </div>
                          {offering.restaurant.offers && offering.restaurant.offers.length > 0 && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              {offering.restaurant.offers[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 