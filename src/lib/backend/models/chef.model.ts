import mongoose, { Document, Schema } from 'mongoose';

export interface IChefProfile {
  specialization: string[];
  experience: number; // years
  rating: number;
  totalEvents: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  availability: {
    status: 'available' | 'busy' | 'offline';
    weeklySchedule: {
      [key: string]: {
        available: boolean;
        timeSlots: string[];
      };
    };
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
    avgResponseTime: number; // minutes
    completedEvents: number;
    cancelledEvents: number;
    lastEventCompletedAt?: Date;
  };
}

export interface IChef extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'chef';
  chefProfile: IChefProfile;
  isActive: boolean;
  joinedAt: Date;
  lastLogin?: Date;
  profilePhoto?: string;
}

const ChefProfileSchema = new Schema<IChefProfile>({
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

const ChefSchema = new Schema<IChef>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    default: 'chef',
    immutable: true
  },
  chefProfile: {
    type: ChefProfileSchema,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  profilePhoto: {
    type: String
  }
});

// Index for geospatial queries
ChefSchema.index({ 'chefProfile.location.currentLocation': '2dsphere' });

// Index for specialization searches
ChefSchema.index({ 'chefProfile.specialization': 1 });

// Index for service areas
ChefSchema.index({ 'chefProfile.location.serviceAreas': 1 });

export default mongoose.models?.Chef || mongoose.model<IChef>('Chef', ChefSchema);