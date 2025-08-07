import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Mock menu data - in real app, this would query database
    const menuItems = {
      'north-indian': [
        {
          id: 'dal-makhani',
          name: 'Dal Makhani',
          description: 'Rich and creamy black lentils cooked with butter and spices',
          price: 180,
          category: 'North Indian',
          image: '/images/categories/North-indian.jpg',
          restaurant: 'Spice Garden',
          rating: 4.5,
          prepTime: '25 mins'
        },
        {
          id: 'shahi-paneer',
          name: 'Shahi Paneer',
          description: 'Royal cottage cheese curry in rich tomato gravy',
          price: 200,
          category: 'North Indian',
          image: '/images/categories/North-indian.jpg',
          restaurant: 'Spice Garden',
          rating: 4.3,
          prepTime: '20 mins'
        },
        {
          id: 'butter-chicken',
          name: 'Butter Chicken',
          description: 'Tender chicken in creamy tomato-based curry',
          price: 280,
          category: 'North Indian',
          image: '/images/categories/chicken.jpg',
          restaurant: 'Spice Garden',
          rating: 4.7,
          prepTime: '30 mins'
        }
      ],
      'south-indian': [
        {
          id: 'masala-dosa',
          name: 'Masala Dosa',
          description: 'Crispy rice crepe filled with spiced potato',
          price: 120,
          category: 'South Indian',
          image: '/images/categories/South-indian.jpg',
          restaurant: 'South Spice',
          rating: 4.4,
          prepTime: '20 mins'
        },
        {
          id: 'idli-sambar',
          name: 'Idli Sambar',
          description: 'Steamed rice cakes with lentil curry',
          price: 100,
          category: 'South Indian',
          image: '/images/categories/South-indian.jpg',
          restaurant: 'South Spice',
          rating: 4.2,
          prepTime: '15 mins'
        }
      ],
      'chinese': [
        {
          id: 'hakka-noodles',
          name: 'Hakka Noodles',
          description: 'Stir-fried noodles with vegetables',
          price: 160,
          category: 'Chinese',
          image: '/images/categories/Chinese.jpg',
          restaurant: 'Dragon Palace',
          rating: 4.1,
          prepTime: '25 mins'
        },
        {
          id: 'manchurian',
          name: 'Veg Manchurian',
          description: 'Deep-fried vegetable balls in tangy sauce',
          price: 140,
          category: 'Chinese',
          image: '/images/categories/Chinese.jpg',
          restaurant: 'Dragon Palace',
          rating: 4.0,
          prepTime: '20 mins'
        }
      ],
      'pizza': [
        {
          id: 'margherita-pizza',
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato, mozzarella, and basil',
          price: 320,
          category: 'Pizza',
          image: '/images/categories/pizza-2.jpeg',
          restaurant: 'Pizza Palace',
          rating: 4.5,
          prepTime: '25 mins'
        },
        {
          id: 'pepperoni-pizza',
          name: 'Pepperoni Pizza',
          description: 'Pizza topped with pepperoni and cheese',
          price: 380,
          category: 'Pizza',
          image: '/images/categories/pizza-2.jpeg',
          restaurant: 'Pizza Palace',
          rating: 4.3,
          prepTime: '25 mins'
        }
      ],
      'burgers': [
        {
          id: 'classic-burger',
          name: 'Classic Burger',
          description: 'Beef patty with lettuce, tomato, and cheese',
          price: 220,
          category: 'Burgers',
          image: '/images/categories/burger-2.jpg',
          restaurant: 'Burger Junction',
          rating: 4.2,
          prepTime: '15 mins'
        },
        {
          id: 'chicken-burger',
          name: 'Chicken Burger',
          description: 'Grilled chicken patty with fresh vegetables',
          price: 200,
          category: 'Burgers',
          image: '/images/categories/burger-2.jpg',
          restaurant: 'Burger Junction',
          rating: 4.1,
          prepTime: '15 mins'
        }
      ],
      'desserts': [
        {
          id: 'gulab-jamun',
          name: 'Gulab Jamun',
          description: 'Sweet milk balls in sugar syrup',
          price: 80,
          category: 'Desserts',
          image: '/images/categories/desserts.jpg',
          restaurant: 'Sweet Paradise',
          rating: 4.6,
          prepTime: '10 mins'
        },
        {
          id: 'ice-cream',
          name: 'Vanilla Ice Cream',
          description: 'Creamy vanilla ice cream',
          price: 60,
          category: 'Desserts',
          image: '/images/categories/desserts.jpg',
          restaurant: 'Sweet Paradise',
          rating: 4.3,
          prepTime: '5 mins'
        }
      ]
    };

    if (category) {
      const categoryItems = menuItems[category.toLowerCase() as keyof typeof menuItems] || [];
      return NextResponse.json({
        items: categoryItems,
        category: category,
        message: `Menu items for ${category} retrieved successfully`
      });
    }

    // Return all items if no category specified
    const allItems = Object.values(menuItems).flat();
    return NextResponse.json({
      items: allItems,
      message: 'All menu items retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get menu error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 