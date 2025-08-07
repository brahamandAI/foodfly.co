import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/backend/database';
import { verifyToken } from '@/lib/backend/middleware/auth';
import Cart from '@/lib/backend/models/cart.model';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(request);
    const { itemId } = params;
    const { quantity } = await request.json();

    if (!quantity || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: user._id });
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Find and update the item
    const itemIndex = cart.items.findIndex(item => item.menuItemId === itemId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return NextResponse.json({
      message: 'Cart item updated successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      }
    });

  } catch (error: any) {
    console.error('Update cart item error:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(request);
    const { itemId } = params;

    // Get user's cart
    const cart = await Cart.findOne({ userId: user._id });
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Remove the item
    cart.items = cart.items.filter(item => item.menuItemId !== itemId);
    await cart.save();

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      }
    });

  } catch (error: any) {
    console.error('Remove cart item error:', error);
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
