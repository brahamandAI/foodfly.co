import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  userId: string;
  targetType: 'restaurant' | 'chef' | 'order' | 'delivery' | 'chef_booking';
  targetId: string; // ID of restaurant, chef, order, etc.
  orderId?: string; // Optional reference to related order
  chefBookingId?: string; // Optional reference to chef booking
  
  // Main review content
  rating: number; // Overall rating 1-5
  review?: string; // Text review
  title?: string; // Review title/headline
  
  // Detailed ratings breakdown
  breakdown: {
    food?: number; // Food quality rating
    service?: number; // Service quality rating
    delivery?: number; // Delivery experience rating
    value?: number; // Value for money rating
    ambiance?: number; // Restaurant ambiance (for dine-in)
    cleanliness?: number; // Hygiene/cleanliness rating
  };
  
  // Media attachments
  media: {
    images?: string[]; // Image URLs
    videos?: string[]; // Video URLs (for future use)
  };
  
  // Review context
  context: {
    orderType?: 'delivery' | 'pickup' | 'dine_in' | 'chef_service';
    visitDate?: Date; // When the service was experienced
    occasionType?: 'casual' | 'business' | 'celebration' | 'date' | 'family';
    groupSize?: number;
    isVerifiedPurchase: boolean; // Whether user actually ordered/used service
  };
  
  // User information (denormalized for performance)
  user: {
    name: string;
    profilePicture?: string;
    isVerified: boolean; // Whether user is verified
    totalReviews: number; // Total reviews by this user
    memberSince: Date;
  };
  
  // Target information (denormalized for performance)
  target: {
    name: string; // Restaurant/chef name
    type: string; // cuisine type or service type
    location?: string; // City or area
  };
  
  // Review engagement
  engagement: {
    helpfulVotes: number;
    unhelpfulVotes: number;
    reportCount: number;
    replies: {
      from: 'restaurant' | 'chef' | 'admin';
      message: string;
      timestamp: Date;
      authorName: string;
    }[];
  };
  
  // Review status and moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'hidden';
  moderation: {
    reviewedBy?: string; // Admin ID who reviewed
    reviewedAt?: Date;
    rejectionReason?: string;
    autoFlags?: string[]; // Automated moderation flags
  };
  
  // Metadata
  metadata: {
    source: 'web' | 'mobile_app' | 'email_survey';
    ipAddress?: string;
    userAgent?: string;
    language: string;
    sentiment?: 'positive' | 'neutral' | 'negative'; // AI-determined sentiment
    keywords?: string[]; // AI-extracted keywords
  };
  
  // Timestamps
  submittedAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['restaurant', 'chef', 'order', 'delivery', 'chef_booking'],
    required: true,
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    index: true
  },
  chefBookingId: {
    type: String,
    index: true
  },
  
  // Main review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  title: {
    type: String,
    maxlength: 100,
    trim: true
  },
  
  // Detailed ratings breakdown
  breakdown: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    ambiance: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Media attachments
  media: {
    images: [{
      type: String,
      validate: {
        validator: function(url: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Invalid image URL format'
      }
    }],
    videos: [{
      type: String,
      validate: {
        validator: function(url: string) {
          return /^https?:\/\/.+\.(mp4|webm|ogg)$/i.test(url);
        },
        message: 'Invalid video URL format'
      }
    }]
  },
  
  // Review context
  context: {
    orderType: {
      type: String,
      enum: ['delivery', 'pickup', 'dine_in', 'chef_service']
    },
    visitDate: {
      type: Date,
      validate: {
        validator: function(date: Date) {
          return date <= new Date();
        },
        message: 'Visit date cannot be in the future'
      }
    },
    occasionType: {
      type: String,
      enum: ['casual', 'business', 'celebration', 'date', 'family']
    },
    groupSize: {
      type: Number,
      min: 1,
      max: 50
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  
  // User information (denormalized for performance)
  user: {
    name: {
      type: String,
      required: true
    },
    profilePicture: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    totalReviews: {
      type: Number,
      default: 1,
      min: 0
    },
    memberSince: {
      type: Date,
      required: true
    }
  },
  
  // Target information (denormalized for performance)
  target: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    location: String
  },
  
  // Review engagement
  engagement: {
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0
    },
    unhelpfulVotes: {
      type: Number,
      default: 0,
      min: 0
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    },
    replies: [{
      from: {
        type: String,
        enum: ['restaurant', 'chef', 'admin'],
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: 500
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      authorName: {
        type: String,
        required: true
      }
    }]
  },
  
  // Review status and moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'hidden'],
    default: 'pending',
    index: true
  },
  moderation: {
    reviewedBy: String,
    reviewedAt: Date,
    rejectionReason: {
      type: String,
      maxlength: 200
    },
    autoFlags: [{
      type: String,
      enum: ['inappropriate_language', 'spam', 'fake_review', 'off_topic', 'personal_attack']
    }]
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'email_survey'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String,
    language: {
      type: String,
      default: 'en'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    keywords: [String]
  },
  
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ReviewSchema.index({ targetType: 1, targetId: 1, status: 1 });
ReviewSchema.index({ userId: 1, submittedAt: -1 });
ReviewSchema.index({ status: 1, submittedAt: -1 });
ReviewSchema.index({ rating: 1, submittedAt: -1 });

// Index for verified purchases
ReviewSchema.index({ 'context.isVerifiedPurchase': 1, status: 1 });

// Text search index for review content
ReviewSchema.index({ 
  title: 'text', 
  review: 'text',
  'metadata.keywords': 'text'
});

// Geospatial index if location coordinates are added in future
// ReviewSchema.index({ 'target.coordinates': '2dsphere' });

// Prevent duplicate reviews for same user-target combination
ReviewSchema.index({ 
  userId: 1, 
  targetType: 1, 
  targetId: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    targetType: { $in: ['restaurant', 'chef'] } 
  }
});

// Allow multiple reviews for orders but ensure one per order
ReviewSchema.index({
  userId: 1,
  orderId: 1
}, {
  unique: true,
  partialFilterExpression: { 
    orderId: { $exists: true },
    targetType: 'order'
  }
});

// Update the updatedAt timestamp on save
ReviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models?.Review || mongoose.model<IReview>('Review', ReviewSchema);