// Enhanced Cart Service for FoodFly
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  isVeg?: boolean;
  restaurantId?: string;
  restaurantName?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  restaurantId?: string;
  restaurantName?: string;
}

class CartService {
  private static instance: CartService;
  private cartKey = 'foodfly_cart';
  
  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  // Get current user's cart
  getCart(): Cart {
    if (typeof window === 'undefined') {
      return { items: [], subtotal: 0, totalItems: 0 };
    }

    try {
      const cartData = localStorage.getItem(this.cartKey);
      if (!cartData) {
        return { items: [], subtotal: 0, totalItems: 0 };
      }

      const cart = JSON.parse(cartData);
      return this.calculateTotals(cart);
    } catch (error) {
      console.error('Error getting cart:', error);
      return { items: [], subtotal: 0, totalItems: 0 };
    }
  }

  // Add item to cart
  addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }): boolean {
    try {
      const cart = this.getCart();
      const quantity = item.quantity || 1;
      
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          image: item.image,
          description: item.description,
          isVeg: item.isVeg,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName
        });
      }

      // Set restaurant info if first item
      if (cart.items.length === 1) {
        cart.restaurantId = item.restaurantId;
        cart.restaurantName = item.restaurantName;
      }

      this.saveCart(cart);
      this.notifyCartUpdate();
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  }

  // Update item quantity
  updateQuantity(itemId: string, quantity: number): boolean {
    try {
      const cart = this.getCart();
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        
        this.saveCart(cart);
        this.notifyCartUpdate();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  // Remove item from cart
  removeItem(itemId: string): boolean {
    try {
      const cart = this.getCart();
      cart.items = cart.items.filter(item => item.id !== itemId);
      
      this.saveCart(cart);
      this.notifyCartUpdate();
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }

  // Clear entire cart
  clearCart(): boolean {
    try {
      localStorage.removeItem(this.cartKey);
      this.notifyCartUpdate();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // Get cart item count
  getItemCount(): number {
    const cart = this.getCart();
    return cart.totalItems;
  }

  // Get cart total
  getCartTotal(): number {
    const cart = this.getCart();
    return cart.subtotal;
  }

  // Calculate delivery fee
  getDeliveryFee(subtotal: number): number {
    return subtotal >= 299 ? 0 : 40;
  }

  // Calculate taxes
  getTaxes(subtotal: number): number {
    return Math.round(subtotal * 0.05); // 5% GST
  }

  // Calculate packaging fee
  getPackagingFee(itemCount: number): number {
    return itemCount * 5; // ₹5 per item
  }

  // Get final order total
  getOrderTotal(): { subtotal: number; deliveryFee: number; taxes: number; packagingFee: number; total: number } {
    const cart = this.getCart();
    const subtotal = cart.subtotal;
    const deliveryFee = this.getDeliveryFee(subtotal);
    const taxes = this.getTaxes(subtotal);
    const packagingFee = this.getPackagingFee(cart.totalItems);
    const total = subtotal + deliveryFee + taxes + packagingFee;

    return { subtotal, deliveryFee, taxes, packagingFee, total };
  }

  // Private methods
  private calculateTotals(cart: Cart): Cart {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return cart;
  }

  private saveCart(cart: Cart): void {
    const updatedCart = this.calculateTotals(cart);
    localStorage.setItem(this.cartKey, JSON.stringify(updatedCart));
  }

  private notifyCartUpdate(): void {
    // Notify components about cart updates
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.cartKey,
      newValue: localStorage.getItem(this.cartKey),
      oldValue: null
    }));
  }
}

// Export singleton instance
export const cartService = CartService.getInstance();

// Legacy compatibility - enhanced cart service
export const enhancedCartService = {
  addItem: (item: any) => cartService.addItem(item),
  updateQuantity: (id: string, quantity: number) => cartService.updateQuantity(id, quantity),
  removeItem: (id: string) => cartService.removeItem(id),
  getCartItems: () => cartService.getCart().items,
  clearCart: () => cartService.clearCart(),
  getCart: () => cartService.getCart(),
  addToCart: (restaurantId: string, itemId: string, quantity: number) => {
    // This is for backward compatibility
    console.warn('addToCart method is deprecated, use addItem instead');
    return true;
  }
}; 