// Test data for development and testing purposes
import { Address } from './api';

export const sampleAddresses: Address[] = [
  {
    _id: 'addr_001',
    type: 'home',
    street: '123 Main Street, Apartment 4B',
    area: 'Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    landmark: 'Near Bandra Station',
    isDefault: true
  },
  {
    _id: 'addr_002',
    type: 'work',
    street: '456 Corporate Plaza, Floor 8',
    area: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    landmark: 'Opposite Metro Station',
    isDefault: false
  },
  {
    _id: 'addr_003',
    type: 'other',
    street: '789 Friends Apartment, Block C',
    area: 'Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    landmark: 'Near Hiranandani Gardens',
    isDefault: false
  }
];

// Comprehensive menu items for testing
export const testMenuItems = {
  // North Indian
  'item_001': {
    _id: 'item_001',
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces',
    price: 349,
    image: '/images/categories/chicken.jpg',
    category: 'Main Course',
    isVeg: false,
    rating: 4.8,
    preparationTime: '25-30 mins',
    restaurant: 'rest_001'
  },
  'item_002': {
    _id: 'item_002',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy cottage cheese curry with aromatic spices',
    price: 299,
    image: '/images/categories/North-indian.jpg',
    category: 'Main Course',
    isVeg: true,
    rating: 4.6,
    preparationTime: '20-25 mins',
    restaurant: 'rest_001'
  },
  'item_003': {
    _id: 'item_003',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in creamy tomato gravy',
    price: 249,
    image: '/images/categories/North-indian.jpg',
    category: 'Main Course',
    isVeg: true,
    rating: 4.5,
    preparationTime: '20-25 mins',
    restaurant: 'rest_001'
  },
  'item_004': {
    _id: 'item_004',
    name: 'Garlic Naan',
    description: 'Soft bread with garlic and herbs',
    price: 60,
    image: '/images/categories/North-indian.jpg',
    category: 'Bread',
    isVeg: true,
    rating: 4.4,
    preparationTime: '10-15 mins',
    restaurant: 'rest_001'
  },

  // Chinese
  'item_005': {
    _id: 'item_005',
    name: 'Chicken Fried Rice',
    description: 'Wok-tossed rice with chicken and vegetables',
    price: 249,
    image: '/images/categories/Chinese.jpg',
    category: 'Rice',
    isVeg: false,
    rating: 4.3,
    preparationTime: '18-25 mins',
    restaurant: 'rest_002'
  },
  'item_006': {
    _id: 'item_006',
    name: 'Veg Hakka Noodles',
    description: 'Stir-fried noodles with fresh vegetables',
    price: 199,
    image: '/images/categories/Chinese.jpg',
    category: 'Noodles',
    isVeg: true,
    rating: 4.2,
    preparationTime: '15-20 mins',
    restaurant: 'rest_002'
  },
  'item_007': {
    _id: 'item_007',
    name: 'Honey Chilli Chicken',
    description: 'Crispy chicken in sweet and spicy sauce',
    price: 329,
    image: '/images/categories/Chinese.jpg',
    category: 'Appetizer',
    isVeg: false,
    rating: 4.5,
    preparationTime: '20-25 mins',
    restaurant: 'rest_002'
  },

  // Italian
  'item_008': {
    _id: 'item_008',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 399,
    image: '/images/categories/pizza-2.jpeg',
    category: 'Pizza',
    isVeg: true,
    rating: 4.7,
    preparationTime: '15-20 mins',
    restaurant: 'rest_003'
  },
  'item_009': {
    _id: 'item_009',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with eggs, cheese, and pancetta',
    price: 349,
    image: '/images/categories/pasta.jpg',
    category: 'Pasta',
    isVeg: false,
    rating: 4.6,
    preparationTime: '18-25 mins',
    restaurant: 'rest_003'
  },

  // South Indian
  'item_010': {
    _id: 'item_010',
    name: 'Masala Dosa',
    description: 'Crispy crepe with spiced potato filling',
    price: 149,
    image: '/images/categories/South-indian.jpg',
    category: 'Breakfast',
    isVeg: true,
    rating: 4.5,
    preparationTime: '15-20 mins',
    restaurant: 'rest_004'
  },
  'item_011': {
    _id: 'item_011',
    name: 'Idli Sambar',
    description: 'Steamed rice cakes with lentil curry',
    price: 119,
    image: '/images/categories/South-indian.jpg',
    category: 'Breakfast',
    isVeg: true,
    rating: 4.4,
    preparationTime: '12-18 mins',
    restaurant: 'rest_004'
  },

  // Fast Food
  'item_012': {
    _id: 'item_012',
    name: 'Chicken Burger',
    description: 'Juicy chicken patty with lettuce and mayo',
    price: 199,
    image: '/images/categories/burger-2.jpg',
    category: 'Burger',
    isVeg: false,
    rating: 4.3,
    preparationTime: '12-18 mins',
    restaurant: 'rest_005'
  },
  'item_013': {
    _id: 'item_013',
    name: 'French Fries',
    description: 'Crispy golden fries with seasoning',
    price: 99,
    image: '/images/categories/Fast-food.jpg',
    category: 'Sides',
    isVeg: true,
    rating: 4.2,
    preparationTime: '8-12 mins',
    restaurant: 'rest_005'
  },

  // Beverages
  'item_014': {
    _id: 'item_014',
    name: 'Mango Lassi',
    description: 'Thick and creamy yogurt drink with fresh mango',
    price: 129,
    image: '/images/categories/Bevarages.jpg',
    category: 'Beverages',
    isVeg: true,
    rating: 4.6,
    preparationTime: '5-8 mins',
    restaurant: 'rest_001'
  },
  'item_015': {
    _id: 'item_015',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 99,
    image: '/images/categories/Bevarages.jpg',
    category: 'Beverages',
    isVeg: true,
    rating: 4.4,
    preparationTime: '3-5 mins',
    restaurant: 'rest_001'
  },

  // Desserts
  'item_016': {
    _id: 'item_016',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with truffle frosting',
    price: 299,
    image: '/images/categories/desserts.jpg',
    category: 'Desserts',
    isVeg: true,
    rating: 4.7,
    preparationTime: '5-10 mins',
    restaurant: 'rest_003'
  },
  'item_017': {
    _id: 'item_017',
    name: 'Gulab Jamun',
    description: 'Traditional Indian sweet balls in sugar syrup',
    price: 149,
    image: '/images/categories/desserts.jpg',
    category: 'Desserts',
    isVeg: true,
    rating: 4.5,
    preparationTime: '5-8 mins',
    restaurant: 'rest_001'
  },

  // Menu items from category pages (name-based mapping)
  'Dal Makhani': {
    _id: 'dal_makhani',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in creamy tomato gravy',
    price: 180,
    image: '/images/categories/North-indian.jpg',
    category: 'Main Course Pure Veg',
    isVeg: true,
    rating: 4.5,
    preparationTime: '20-25 mins',
    restaurant: 'rest_001'
  },
  'Shahi Paneer': {
    _id: 'shahi_paneer',
    name: 'Shahi Paneer',
    description: 'Rich cottage cheese in royal gravy',
    price: 200,
    image: '/images/categories/North-indian.jpg',
    category: 'Main Course Pure Veg',
    isVeg: true,
    rating: 4.6,
    preparationTime: '18-22 mins',
    restaurant: 'rest_001'
  },
  'Kadhai Paneer': {
    _id: 'kadhai_paneer',
    name: 'Kadhai Paneer',
    description: 'Cottage cheese cooked in kadhai with spices',
    price: 210,
    image: '/images/categories/North-indian.jpg',
    category: 'Main Course Pure Veg',
    isVeg: true,
    rating: 4.4,
    preparationTime: '18-22 mins',
    restaurant: 'rest_001'
  },
  'Butter Naan': {
    _id: 'butter_naan',
    name: 'Butter Naan',
    description: 'Soft bread with butter',
    price: 40,
    image: '/images/categories/North-indian.jpg',
    category: 'Breads',
    isVeg: true,
    rating: 4.3,
    preparationTime: '8-12 mins',
    restaurant: 'rest_001'
  },
  'Garlic Naan': {
    _id: 'garlic_naan',
    name: 'Garlic Naan',
    description: 'Soft bread with garlic and herbs',
    price: 50,
    image: '/images/categories/North-indian.jpg',
    category: 'Breads',
    isVeg: true,
    rating: 4.4,
    preparationTime: '8-12 mins',
    restaurant: 'rest_001'
  },
  'Tandoori Roti': {
    _id: 'tandoori_roti',
    name: 'Tandoori Roti',
    description: 'Traditional Indian bread',
    price: 25,
    image: '/images/categories/North-indian.jpg',
    category: 'Breads',
    isVeg: true,
    rating: 4.2,
    preparationTime: '8-12 mins',
    restaurant: 'rest_001'
  },
  'Veg Biryani': {
    _id: 'veg_biryani',
    name: 'Veg Biryani',
    description: 'Fragrant rice with vegetables and spices',
    price: 150,
    image: '/images/categories/Mughlai.jpg',
    category: 'Biryani & Rice',
    isVeg: true,
    rating: 4.3,
    preparationTime: '25-30 mins',
    restaurant: 'rest_001'
  },
  'Chicken Biryani': {
    _id: 'chicken_biryani',
    name: 'Chicken Biryani',
    description: 'Aromatic rice with chicken and spices',
    price: 180,
    image: '/images/categories/Mughlai.jpg',
    category: 'Biryani & Rice',
    isVeg: false,
    rating: 4.5,
    preparationTime: '25-30 mins',
    restaurant: 'rest_001'
  },
  'Mutton Biryani': {
    _id: 'mutton_biryani',
    name: 'Mutton Biryani',
    description: 'Royal rice dish with tender mutton',
    price: 220,
    image: '/images/categories/Mughlai.jpg',
    category: 'Biryani & Rice',
    isVeg: false,
    rating: 4.6,
    preparationTime: '30-35 mins',
    restaurant: 'rest_001'
  },
  'Veg Noodles': {
    _id: 'veg_noodles',
    name: 'Veg Noodles',
    description: 'Stir-fried noodles with vegetables',
    price: 120,
    image: '/images/categories/Chinese.jpg',
    category: 'Noodles',
    isVeg: true,
    rating: 4.2,
    preparationTime: '15-20 mins',
    restaurant: 'rest_002'
  },
  'Chicken Noodles': {
    _id: 'chicken_noodles',
    name: 'Chicken Noodles',
    description: 'Noodles with chicken and vegetables',
    price: 150,
    image: '/images/categories/Chinese.jpg',
    category: 'Noodles',
    isVeg: false,
    rating: 4.3,
    preparationTime: '15-20 mins',
    restaurant: 'rest_002'
  },
  'Schezwan Noodles': {
    _id: 'schezwan_noodles',
    name: 'Schezwan Noodles',
    description: 'Spicy Schezwan style noodles',
    price: 140,
    image: '/images/categories/Chinese.jpg',
    category: 'Noodles',
    isVeg: true,
    rating: 4.4,
    preparationTime: '15-20 mins',
    restaurant: 'rest_002'
  }
};

// Helper function to get menu item by ID
export const getMenuItemById = (itemId: string) => {
  return testMenuItems[itemId as keyof typeof testMenuItems] || null;
};

// Helper function to get menu items by category
export const getMenuItemsByCategory = (category: string) => {
  return Object.values(testMenuItems).filter(item => 
    item.category.toLowerCase().includes(category.toLowerCase())
  );
};

// Initialize test data in localStorage if not present
export const initializeTestData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Initialize addresses if none exist
    const existingAddresses = localStorage.getItem('addresses');
    if (!existingAddresses) {
      localStorage.setItem('addresses', JSON.stringify(sampleAddresses));
    }
    
    // Initialize menu items for testing
    localStorage.setItem('testMenuItems', JSON.stringify(testMenuItems));
    
    // Only initialize user data if there's no existing authentication
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    const existingIsLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Don't override existing authentication
    if (!existingToken && !existingUser && !existingIsLoggedIn) {
      // Only set test user data if explicitly in development mode
      if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
        const testUser = {
          _id: 'user_test_001',
          name: 'Test User',
          email: 'test@foodfly.com',
          phone: '+91 9876543210',
          createdAt: new Date().toISOString()
        };
        // Don't auto-login - let user choose to authenticate
        localStorage.setItem('testUser', JSON.stringify(testUser));
      }
    }
    
    // Initialize default location if none exists
    const existingLocation = localStorage.getItem('defaultLocation');
    if (!existingLocation) {
      const defaultLocation = {
        _id: 'default',
        type: 'current',
        name: 'Current Location',
        fullAddress: 'Mumbai, Maharashtra',
        isDefault: true
      };
      localStorage.setItem('defaultLocation', JSON.stringify(defaultLocation));
    }
    
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
};

export const clearTestData = () => {
  if (typeof window === 'undefined') return;
  
  // Remove old unused cart systems
  localStorage.removeItem('cart');
  localStorage.removeItem('testCart');
  localStorage.removeItem('guestCart');
  
  // Remove other test data
  localStorage.removeItem('addresses');
  localStorage.removeItem('orders');
  localStorage.removeItem('testUser');
  localStorage.removeItem('defaultLocation');
  localStorage.removeItem('userLocations');
  localStorage.removeItem('testMenuItems');
};

// Function to enable test authentication (for development)
export const enableTestAuth = () => {
  if (typeof window === 'undefined') return;
  
  const testUser = localStorage.getItem('testUser');
  if (testUser) {
    localStorage.setItem('user', testUser);
    localStorage.setItem('token', 'test_token_' + Date.now());
    localStorage.setItem('isLoggedIn', 'true');
    
    // Trigger storage event for real-time updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'isLoggedIn',
      newValue: 'true',
      oldValue: null
    }));
    
    return true;
  }
  return false;
};

export default {
  sampleAddresses,
  testMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,
  initializeTestData,
  clearTestData,
  enableTestAuth
}; 