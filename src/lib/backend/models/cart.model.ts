import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  menuItemId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image?: string;
  restaurantId: string;
  restaurantName: string;
  customizations?: string[];
  addedAt: Date;
}

export interface ICart extends Document {
  _id: string;
  userId: string;
  items: ICartItem[];
  subtotal: number;
  totalItems: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  menuItemId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Maximum 10 items of same type
  },
  image: String,
  restaurantId: {
    type: String,
    required: true
  },
  restaurantName: {
    type: String,
    required: true,
    trim: true
  },
  customizations: [String],
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new Schema<ICart>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: {
    type: [CartItemSchema],
    default: []
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate subtotal and total items before saving
CartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.lastUpdated = new Date();
  next();
});

// Remove empty carts after 30 days
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart; 