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

export interface IDeliveryProfile {
  vehicleType: 'bike' | 'bicycle' | 'scooter' | 'car' | 'walking';
  vehicleNumber?: string;
  currentZone: string;
  profilePhoto?: string;
  govtIdProof?: {
    type: 'aadhar' | 'pan' | 'driving_license' | 'other';
    number: string;
    verified: boolean;
    document?: string; // URL to uploaded document
  };
  isVerified: boolean;
  isActive: boolean;
  rating?: number;
  totalDeliveries: number;
  joinedAt: Date;
  
  // Availability and assignment tracking
  availability: {
    status: 'online' | 'offline' | 'busy' | 'break';
    lastStatusUpdate: Date;
    shiftStartTime?: Date;
    shiftEndTime?: Date;
  };
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    accuracy?: number;
    lastUpdated: Date;
  };
  currentAssignments: {
    activeOrderId?: string;
    assignedOrderIds: string[]; // Orders waiting for response
    maxConcurrentOrders: number;
  };
  
  // Performance metrics
  performance: {
    acceptanceRate: number; // percentage
    avgResponseTime: number; // seconds
    avgDeliveryTime: number; // minutes
    completedDeliveries: number;
    cancelledDeliveries: number;
    lastDeliveryCompletedAt?: Date;
  };
}

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'admin' | 'user' | 'delivery' | 'chef';
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
  deliveryProfile?: IDeliveryProfile; // Only for delivery agents
  chefProfile?: {
    specialization: string[];
    experience: number;
    rating: number;
    totalEvents: number;
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    availability: {
      status: 'available' | 'busy' | 'offline';
      weeklySchedule: Map<string, {
        available: boolean;
        timeSlots: string[];
      }>;
      blackoutDates: Date[];
    };
    portfolio: {
      photos: string[];
      description: string;
      signature_dishes: string[];
    };
    location: {
      serviceAreas: string[];
      currentLocation?: {
        type: 'Point';
        coordinates: [number, number];
      };
    };
    verification: {
      isVerified: boolean;
      documents: {
        certifications: string[];
        experience_letters: string[];
        health_certificate?: string;
      };
    };
    performance: {
      acceptanceRate: number;
      avgResponseTime: number;
      completedEvents: number;
      cancelledEvents: number;
      lastEventCompletedAt?: Date;
    };
  }; // Only for chefs
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

const DeliveryProfileSchema = new Schema<IDeliveryProfile>({
  vehicleType: {
    type: String,
    enum: ['bike', 'bicycle', 'scooter', 'robo'],
    required: true
  },
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  currentZone: {
    type: String,
    required: true,
    trim: true
  },
  profilePhoto: {
    type: String,
    trim: true
  },
  govtIdProof: {
    type: {
      type: String,
      enum: ['aadhar', 'pan', 'driving_license', 'other']
    },
    number: {
      type: String,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    document: {
      type: String,
      trim: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  
  // Availability and assignment tracking
  availability: {
    status: {
      type: String,
      enum: ['online', 'offline', 'busy', 'break'],
      default: 'offline'
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now
    },
    shiftStartTime: {
      type: Date
    },
    shiftEndTime: {
      type: Date
    }
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    },
    accuracy: {
      type: Number
    },
    lastUpdated: {
      type: Date
    }
  },
  currentAssignments: {
    activeOrderId: {
      type: String
    },
    assignedOrderIds: [{
      type: String
    }],
    maxConcurrentOrders: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    }
  },
  
  // Performance metrics
  performance: {
    acceptanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    avgResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    avgDeliveryTime: {
      type: Number,
      default: 0,
      min: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    lastDeliveryCompletedAt: {
      type: Date
    }
  }
});

const ChefProfileSchema = new Schema({
  specialization: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    weeklySchedule: {
      type: Map,
      of: {
        available: Boolean,
        timeSlots: [String]
      },
      default: function() {
        const schedule = {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
          schedule[day] = {
            available: true,
            timeSlots: ['09:00-12:00', '14:00-18:00', '19:00-22:00']
          };
        });
        return schedule;
      }
    },
    blackoutDates: [{
      type: Date
    }]
  },
  portfolio: {
    photos: [{
      type: String
    }],
    description: {
      type: String,
      maxlength: 1000
    },
    signature_dishes: [{
      type: String
    }]
  },
  location: {
    serviceAreas: [{
      type: String,
      required: true
    }],
    currentLocation: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: {
      certifications: [{
        type: String
      }],
      experience_letters: [{
        type: String
      }],
      health_certificate: {
        type: String
      }
    }
  },
  performance: {
    acceptanceRate: {
      type: Number,
      default: 100
    },
    avgResponseTime: {
      type: Number,
      default: 30
    },
    completedEvents: {
      type: Number,
      default: 0
    },
    cancelledEvents: {
      type: Number,
      default: 0
    },
    lastEventCompletedAt: {
      type: Date
    }
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
    enum: ['customer', 'admin', 'user', 'delivery', 'chef'],
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
  deliveryProfile: {
    type: DeliveryProfileSchema,
    required: function() {
      return this.role === 'delivery';
    }
  },
  chefProfile: {
    type: ChefProfileSchema,
    required: function() {
      return this.role === 'chef';
    }
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