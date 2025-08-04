import mongoose, { Document, Schema } from 'mongoose';

export interface IChefBooking extends Document {
  _id: string;
  customerId: string;
  chefId: string;
  bookingDetails: {
    eventType: 'private_dining' | 'catering' | 'cooking_class' | 'meal_prep' | 'consultation';
    eventDate: Date;
    eventTime: string;
    duration: number; // in hours
    guestCount: number;
    specialRequests?: string;
    dietaryRestrictions?: string[];
    cuisine: string[];
    venue: {
      type: 'customer_home' | 'chef_location' | 'external_venue';
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: {
          type: 'Point';
          coordinates: [number, number]; // [longitude, latitude]
        };
      };
    };
  };
  pricing: {
    basePrice: number;
    additionalCharges: {
      ingredient_cost?: number;
      travel_fee?: number;
      equipment_rental?: number;
      extra_hours?: number;
    };
    totalAmount: number;
    currency: string;
  };
  status: 'pending' | 'confirmed' | 'chef_assigned' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  payment: {
    method: 'cod' | 'online' | 'advance_partial';
    status: 'pending' | 'advance_paid' | 'completed' | 'refunded';
    transactionId?: string;
    advanceAmount?: number;
    advancePaidAt?: Date;
    paidAt?: Date;
  };
  chef: {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string[];
    rating: number;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  timeline: {
    bookedAt: Date;
    confirmedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  };
  communication: {
    messages: {
      from: 'customer' | 'chef' | 'admin';
      message: string;
      timestamp: Date;
      type: 'text' | 'system_update';
    }[];
    lastMessageAt?: Date;
  };
  feedback: {
    customer: {
      rating?: number;
      review?: string;
      submittedAt?: Date;
    };
    chef: {
      rating?: number;
      review?: string;
      submittedAt?: Date;
    };
  };
  metadata: {
    source: 'web' | 'mobile_app' | 'admin';
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  };
}

const ChefBookingSchema = new Schema<IChefBooking>({
  customerId: {
    type: String,
    required: true,
    index: true
  },
  chefId: {
    type: String,
    required: true,
    index: true
  },
  bookingDetails: {
    eventType: {
      type: String,
      enum: ['private_dining', 'catering', 'cooking_class', 'meal_prep', 'consultation'],
      required: true
    },
    eventDate: {
      type: Date,
      required: true,
      index: true
    },
    eventTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 24
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 200
    },
    specialRequests: {
      type: String,
      maxlength: 500
    },
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'keto', 'paleo']
    }],
    cuisine: [{
      type: String,
      required: true
    }],
    venue: {
      type: {
        type: String,
        enum: ['customer_home', 'chef_location', 'external_venue'],
        required: true
      },
      address: {
        street: {
          type: String,
          required: true
        },
        city: {
          type: String,
          required: true
        },
        state: {
          type: String,
          required: true
        },
        zipCode: {
          type: String,
          required: true
        },
        coordinates: {
          type: {
            type: String,
            enum: ['Point']
          },
          coordinates: {
            type: [Number]
          }
        }
      }
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    additionalCharges: {
      ingredient_cost: {
        type: Number,
        min: 0,
        default: 0
      },
      travel_fee: {
        type: Number,
        min: 0,
        default: 0
      },
      equipment_rental: {
        type: Number,
        min: 0,
        default: 0
      },
      extra_hours: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'chef_assigned', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'online', 'advance_partial'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'advance_paid', 'completed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    advanceAmount: {
      type: Number,
      min: 0
    },
    advancePaidAt: Date,
    paidAt: Date
  },
  chef: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    specialization: [{
      type: String
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  },
  customer: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  timeline: {
    bookedAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  communication: {
    messages: [{
      from: {
        type: String,
        enum: ['customer', 'chef', 'admin'],
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: 1000
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['text', 'system_update'],
        default: 'text'
      }
    }],
    lastMessageAt: Date
  },
  feedback: {
    customer: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    },
    chef: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'admin'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ChefBookingSchema.index({ customerId: 1, status: 1 });
ChefBookingSchema.index({ chefId: 1, status: 1 });
ChefBookingSchema.index({ 'bookingDetails.eventDate': 1, status: 1 });
ChefBookingSchema.index({ 'bookingDetails.venue.address.coordinates': '2dsphere' });
ChefBookingSchema.index({ createdAt: -1 });

// Compound index for admin dashboard
ChefBookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models?.ChefBooking || mongoose.model<IChefBooking>('ChefBooking', ChefBookingSchema);