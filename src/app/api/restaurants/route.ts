import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all restaurants
    // In a real app, this would query the database
    const restaurants = [
      {
        id: '1',
        name: 'Spice Garden',
        cuisine: 'Indian',
        rating: 4.5,
        deliveryTime: '30-45 mins',
        deliveryFee: 40,
        image: '/images/restaurants/cafe.jpg',
        location: 'Downtown',
        isOpen: true,
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
          }
        ]
      },
      {
        id: '2',
        name: 'Pizza Palace',
        cuisine: 'Italian',
        rating: 4.2,
        deliveryTime: '25-35 mins',
        deliveryFee: 35,
        image: '/images/restaurants/panache.jpg',
        location: 'City Center',
        isOpen: true,
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
      {
        id: '3',
        name: 'Burger Junction',
        cuisine: 'American',
        rating: 4.0,
        deliveryTime: '20-30 mins',
        deliveryFee: 30,
        image: '/images/restaurants/symposium.jpg',
        location: 'Mall Road',
        isOpen: true,
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
    ];

    return NextResponse.json({
      restaurants,
      message: 'Restaurants retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get restaurants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 