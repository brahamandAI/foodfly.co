import { Cart, ICart, ICartItem } from '../models/cart.model';
import { MenuItem } from '../models/menu.model';
import { Restaurant } from '../models/restaurant.model';
import mongoose from 'mongoose';

export class CartService {
  /**
   * Get user's cart for a restaurant
   */
  static async getUserCart(userId: string, restaurantId: string): Promise<ICart | null> {
    return Cart.findOne({ user: userId, restaurant: restaurantId });
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    userId: string,
    restaurantId: string,
    menuItemId: string,
    quantity: number,
    customization?: string,
    specialInstructions?: string
  ): Promise<ICart> {
    // Validate menu item exists and get its price
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId, restaurant: restaurantId });
    
    if (!cart) {
      // Validate restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      cart = new Cart({
        user: userId,
        restaurant: restaurantId,
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItem.toString() === menuItemId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].customization = customization;
      cart.items[existingItemIndex].specialInstructions = specialInstructions;
      cart.items[existingItemIndex].price = menuItem.price * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      cart.items.push({
        menuItem: new mongoose.Types.ObjectId(menuItemId),
        quantity,
        customization,
        specialInstructions,
        price: menuItem.price * quantity
      });
    }

    return cart.save();
  }

  /**
   * Update item quantity in cart
   */
  static async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ): Promise<ICart | null> {
    const cart = await Cart.findOne({
      user: userId,
      'items._id': cartItemId
    });

    if (!cart) {
      throw new Error('Cart item not found');
    }

    const item = cart.items.find(item => item._id?.toString() === cartItemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items = cart.items.filter(item => item._id?.toString() !== cartItemId);
    } else {
      item.quantity = quantity;
      item.price = (item.menuItem as any).price * quantity; // Price per item * quantity
    }

    return cart.items.length > 0 ? cart.save() : cart.deleteOne();
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, cartItemId: string): Promise<ICart | null> {
    const cart = await Cart.findOne({
      user: userId,
      'items._id': cartItemId
    });

    if (!cart) {
      throw new Error('Cart item not found');
    }

    cart.items = cart.items.filter(item => item._id?.toString() !== cartItemId);
    return cart.items.length > 0 ? cart.save() : cart.deleteOne();
  }

  /**
   * Clear user's cart
   */
  static async clearCart(userId: string, restaurantId: string): Promise<void> {
    await Cart.deleteOne({ user: userId, restaurant: restaurantId });
  }

  /**
   * Sync cart from local storage to database
   */
  static async syncCart(
    userId: string,
    restaurantId: string,
    localCartItems: { menuItemId: string; quantity: number; customization?: string; specialInstructions?: string }[]
  ): Promise<ICart> {
    // Delete any existing cart for this user and restaurant
    await Cart.deleteOne({ user: userId, restaurant: restaurantId });

    // Create new cart with local items
    const cart = new Cart({
      user: userId,
      restaurant: restaurantId,
      items: []
    });

    // Add each item from local storage
    for (const item of localCartItems) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem) {
        cart.items.push({
          menuItem: new mongoose.Types.ObjectId(item.menuItemId),
          quantity: item.quantity,
          customization: item.customization,
          specialInstructions: item.specialInstructions,
          price: menuItem.price * item.quantity
        });
      }
    }

    return cart.save();
  }

  /**
   * Merge local cart with existing database cart
   */
  static async mergeCart(
    userId: string,
    restaurantId: string,
    localCartItems: { menuItemId: string; quantity: number; customization?: string; specialInstructions?: string }[]
  ): Promise<ICart> {
    let cart = await Cart.findOne({ user: userId, restaurant: restaurantId });
    
    if (!cart) {
      // If no existing cart, just sync the local cart
      return this.syncCart(userId, restaurantId, localCartItems);
    }

    // For each local item
    for (const localItem of localCartItems) {
      const menuItem = await MenuItem.findById(localItem.menuItemId);
      if (!menuItem) continue;

      // Check if item exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.menuItem.toString() === localItem.menuItemId
      );

      if (existingItemIndex > -1) {
        // Update existing item
        cart.items[existingItemIndex].quantity += localItem.quantity;
        cart.items[existingItemIndex].customization = localItem.customization;
        cart.items[existingItemIndex].specialInstructions = localItem.specialInstructions;
        cart.items[existingItemIndex].price = menuItem.price * cart.items[existingItemIndex].quantity;
      } else {
        // Add new item
        cart.items.push({
          menuItem: new mongoose.Types.ObjectId(localItem.menuItemId),
          quantity: localItem.quantity,
          customization: localItem.customization,
          specialInstructions: localItem.specialInstructions,
          price: menuItem.price * localItem.quantity
        });
      }
    }

    return cart.save();
  }
} 