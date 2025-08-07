import mongoose, { Document, Schema } from 'mongoose';

export interface IChefEventRequest extends Document {
  _id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  chef?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    type: 'birthday' | 'anniversary' | 'wedding' | 'corporate' | 'family_gathering' | 'other';
    title: string;
    description: string;
    date: Date;
    duration: number; // hours
    guestCount: number;
    cuisine: string[];
    specialRequests?: string;
    dietaryRestrictions?: string[];
  };
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    venue_type: 'home' | 'outdoor' | 'banquet_hall' | 'office' | 'other';
  };
  budget: {
    min: number;
    max: number;
    currency: string;
    isFlexible: boolean;
  };
  status: 'pending' | 'chef_assigned' | 'accepted' | 'declined' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  timeline: {
    requestedAt: Date;
    assignedAt?: Date;
    respondedAt?: Date;
    confirmedAt?: Date;
    startTime?: Date;
    completedAt?: Date;
  };
  communication: {
    messages: {
      sender: 'customer' | 'chef';
      message: string;
      timestamp: Date;
      read: boolean;
    }[];
    lastMessageAt?: Date;
  };
  payment: {
    amount?: number;
    method?: 'cash' | 'online' | 'card';
    status: 'pending' | 'paid' | 'refunded';
    transactionId?: string;
  };
  rating?: {
    customerRating?: {
      stars: number;
      comment?: string;
      ratedAt: Date;
    };
    chefRating?: {
      stars: number;
      comment?: string;
      ratedAt: Date;
    };
  };
  cancellation?: {
    reason: string;
    cancelledBy: 'customer' | 'chef' | 'admin';
    cancelledAt: Date;
    refundStatus?: 'pending' | 'processed' | 'not_applicable';
  };
}

const ChefEventRequestSchema = new Schema<IChefEventRequest>({
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
  chef: {
    id: {
      type: String
    },
    name: {
      type: String
    },
    email: {
      type: String
    },
    phone: {
      type: String
    }
  },
  eventDetails: {
    type: {
      type: String,
      enum: ['birthday', 'anniversary', 'wedding', 'corporate', 'family_gathering', 'other'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    date: {
      type: Date,
      required: true
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
      min: 1
    },
    cuisine: [{
      type: String,
      required: true
    }],
    specialRequests: {
      type: String,
      maxlength: 1000
    },
    dietaryRestrictions: [{
      type: String
    }]
  },
  location: {
    address: {
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
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    },
    venue_type: {
      type: String,
      enum: ['home', 'outdoor', 'banquet_hall', 'office', 'other'],
      required: true
    }
  },
  budget: {
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
    },
    isFlexible: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'chef_assigned', 'accepted', 'declined', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  timeline: {
    requestedAt: {
      type: Date,
      default: Date.now
    },
    assignedAt: {
      type: Date
    },
    respondedAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    startTime: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  communication: {
    messages: [{
      sender: {
        type: String,
        enum: ['customer', 'chef'],
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
      read: {
        type: Boolean,
        default: false
      }
    }],
    lastMessageAt: {
      type: Date
    }
  },
  payment: {
    amount: {
      type: Number
    },
    method: {
      type: String,
      enum: ['cash', 'online', 'card']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String
    }
  },
  rating: {
    customerRating: {
      stars: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      ratedAt: {
        type: Date
      }
    },
    chefRating: {
      stars: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      ratedAt: {
        type: Date
      }
    }
  },
  cancellation: {
    reason: {
      type: String,
      maxlength: 500
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'chef', 'admin']
    },
    cancelledAt: {
      type: Date
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'not_applicable']
    }
  }
});

// Indexes for efficient queries
ChefEventRequestSchema.index({ 'customer.id': 1 });
ChefEventRequestSchema.index({ 'chef.id': 1 });
ChefEventRequestSchema.index({ status: 1 });
ChefEventRequestSchema.index({ 'eventDetails.date': 1 });
ChefEventRequestSchema.index({ 'location.city': 1 });
ChefEventRequestSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.models?.ChefEventRequest || mongoose.model<IChefEventRequest>('ChefEventRequest', ChefEventRequestSchema);