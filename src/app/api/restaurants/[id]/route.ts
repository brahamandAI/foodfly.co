import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const restaurantId = params.id;
    
    // Mock restaurant data - in real app, this would query database
    const restaurants = {
      '1': {
        id: '1',
        name: 'Spice Garden',
        cuisine: 'Indian',
        rating: 4.5,
        deliveryTime: '30-45 mins',
        deliveryFee: 40,
        image: '/images/restaurants/cafe.jpg',
        location: 'Downtown',
        isOpen: true,
        description: 'Authentic Indian cuisine with traditional flavors',
        address: '123 Main Street, Downtown',
        phone: '+1234567890',
        menu: [
          {
            id: 'chicken-biryani',
            name: 'Chicken Biryani',
            description: 'Aromatic basmati rice with tender chicken',
            price: 250,
            category: 'Main Course',
            image: '/images/categories/chicken.jpg'
          },
          {
            id: 'dal-makhani',
            name: 'Dal Makhani',
            description: 'Rich and creamy black lentils',
            price: 180,
            category: 'Main Course',
            image: '/images/categories/North-indian.jpg'
          },
          {
            id: 'shahi-paneer',
            name: 'Shahi Paneer',
            description: 'Royal cottage cheese curry',
            price: 200,
            category: 'Main Course',
            image: '/images/categories/North-indian.jpg'
          }
        ]
      },
      '2': {
        id: '2',
        name: 'Pizza Palace',
        cuisine: 'Italian',
        rating: 4.2,
        deliveryTime: '25-35 mins',
        deliveryFee: 35,
        image: '/images/restaurants/panache.jpg',
        location: 'City Center',
        isOpen: true,
        description: 'Authentic Italian pizzas and pasta',
        address: '456 Pizza Street, City Center',
        phone: '+1234567891',
        menu: [
          {
            id: 'margherita-pizza',
            name: 'Margherita Pizza',
            description: 'Classic pizza with tomato, mozzarella, and basil',
            price: 320,
            category: 'Pizza',
            image: '/images/categories/pizza-2.jpeg'
          },
          {
            id: 'pasta-alfredo',
            name: 'Pasta Alfredo',
            description: 'Creamy white sauce pasta',
            price: 280,
            category: 'Pasta',
            image: '/images/categories/pasta.jpg'
          }
        ]
      },
      '3': {
        id: '3',
        name: 'Burger Junction',
        cuisine: 'American',
        rating: 4.0,
        deliveryTime: '20-30 mins',
        deliveryFee: 30,
        image: '/images/restaurants/symposium.jpg',
        location: 'Mall Road',
        isOpen: true,
        description: 'Fresh burgers and sandwiches',
        address: '789 Burger Lane, Mall Road',
        phone: '+1234567892',
        menu: [
          {
            id: 'classic-burger',
            name: 'Classic Burger',
            description: 'Beef patty with lettuce, tomato, and cheese',
            price: 220,
            category: 'Burgers',
            image: '/images/categories/burger-2.jpg'
          },
          {
            id: 'chicken-sandwich',
            name: 'Chicken Sandwich',
            description: 'Grilled chicken with mayo and vegetables',
            price: 180,
            category: 'Sandwiches',
            image: '/images/categories/sandwhich.jpg'
          }
        ]
      }
    };

    const restaurant = restaurants[restaurantId as keyof typeof restaurants];
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      restaurant,
      message: 'Restaurant retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get restaurant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 