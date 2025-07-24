import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  _id?: string;
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt?: Date;
}

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'admin' | 'user';
  isEmailVerified: boolean;
  googleId?: string;
  picture?: string;
  addresses: IAddress[];
  preferences: {
    dietary: string[];
    allergies: string[];
    cuisinePreferences: string[];
  };
  healthProfile: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    healthGoals: string[];
  };
  orderHistory: string[]; // Order IDs
  favoriteRestaurants: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>({
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be 6 digits']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'user'],
    default: 'customer'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values to not conflict with unique constraint
  },
  picture: {
    type: String
  },
  addresses: [AddressSchema],
  preferences: {
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'halal', 'kosher']
    }],
    allergies: [String],
    cuisinePreferences: [String]
  },
  healthProfile: {
    age: {
      type: Number,
      min: [13, 'Age must be at least 13'],
      max: [120, 'Age must be less than 120']
    },
    weight: {
      type: Number,
      min: [20, 'Weight must be at least 20 kg']
    },
    height: {
      type: Number,
      min: [50, 'Height must be at least 50 cm']
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active']
    },
    healthGoals: [String]
  },
  orderHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  favoriteRestaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  lastLogin: Date
}, {
  timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure only one default address per user
UserSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }
  }
  next();
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 