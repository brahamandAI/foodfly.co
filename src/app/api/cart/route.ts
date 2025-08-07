import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import Cart from '@/lib/backend/models/cart.model';
import Notification from '@/lib/backend/models/notification.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(request);
    
    // Get user's cart from database
    let cart = await Cart.findOne({ userId: user._id });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({
        userId: user._id,
        items: [],
        subtotal: 0,
        totalItems: 0
      });
      await cart.save();
    }

    return NextResponse.json({
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      },
      message: 'Cart retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get cart error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(request);
    
    const { menuItemId, name, description, price, quantity, image, restaurantId, restaurantName, customizations } = await request.json();

    if (!menuItemId || !name || !price || !quantity || !restaurantId || !restaurantName) {
      return NextResponse.json(
        { error: 'Menu item ID, name, price, quantity, restaurant ID, and restaurant name are required' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Get or create user's cart
    let cart = await Cart.findOne({ userId: user._id });
    
    if (!cart) {
      cart = new Cart({
        userId: user._id,
        items: [],
        subtotal: 0,
        totalItems: 0
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItemId === menuItemId && 
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > 10) {
        return NextResponse.json(
          { error: 'Cannot add more than 10 items of the same type' },
          { status: 400 }
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        menuItemId,
        name,
        description: description || '',
        price,
        quantity,
        image: image || '',
        restaurantId,
        restaurantName,
        customizations: customizations || [],
        addedAt: new Date()
      });
    }

    // Save cart (pre-save hook will calculate totals)
    await cart.save();

    // Create notification for first item added
    if (cart.items.length === 1) {
      const cartNotification = new Notification({
        userId: user._id,
        type: 'cart_reminder',
        title: 'Item added to cart! 🛒',
        message: `${name} has been added to your cart from ${restaurantName}`,
        priority: 'low',
        channels: ['app'],
        data: {
          cartItemId: menuItemId,
          restaurantName,
          itemName: name
        }
      });

      await cartNotification.save();
    }

    return NextResponse.json({
      message: 'Item added to cart successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      }
    });

  } catch (error: any) {
    console.error('Add to cart error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(request);
    
    // Clear user's cart
    const cart = await Cart.findOne({ userId: user._id });
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    cart.items = [];
    await cart.save();

    return NextResponse.json({
      message: 'Cart cleared successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      }
    });

  } catch (error: any) {
    console.error('Clear cart error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 