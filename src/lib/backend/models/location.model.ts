import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'home' | 'work' | 'other';
  name?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    formattedAddress?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  googlePlaceId?: string;
  metadata?: {
    accuracy?: number;
    source: 'gps' | 'manual' | 'search';
    lastUsed?: Date;
    usageCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      required: true,
      default: 'other'
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
      },
      area: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10
      },
      landmark: {
        type: String,
        trim: true,
        maxlength: 200
      },
      formattedAddress: {
        type: String,
        trim: true,
        maxlength: 500
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    googlePlaceId: {
      type: String,
      trim: true
    },
    metadata: {
      accuracy: {
        type: Number,
        min: 0,
        max: 100
      },
      source: {
        type: String,
        enum: ['gps', 'manual', 'search'],
        default: 'manual'
      },
      lastUsed: {
        type: Date,
        default: Date.now
      },
      usageCount: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
LocationSchema.index({ userId: 1, isDefault: 1 });
LocationSchema.index({ userId: 1, type: 1 });
LocationSchema.index({ userId: 1, isActive: 1 });
LocationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for full address
LocationSchema.virtual('fullAddress').get(function(this: ILocation) {
  const parts = [
    this.address.street,
    this.address.area,
    this.address.city,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Pre-save middleware to ensure only one default location per user
LocationSchema.pre('save', async function(this: ILocation, next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Location').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Pre-save middleware to update usage metadata
LocationSchema.pre('save', async function(this: ILocation, next) {
  if (this.isNew) {
    this.metadata = {
      lastUsed: new Date(),
      usageCount: 0,
      source: this.metadata?.source || 'manual',
      accuracy: this.metadata?.accuracy
    };
  }
  next();
});

// Instance methods
LocationSchema.methods.markAsUsed = function(this: ILocation) {
  this.metadata = {
    source: this.metadata?.source || 'manual',
    lastUsed: new Date(),
    usageCount: (this.metadata?.usageCount || 0) + 1,
    accuracy: this.metadata?.accuracy
  };
  return this.save();
};

LocationSchema.methods.setAsDefault = async function(this: ILocation) {
  // Remove default from other locations
  await mongoose.model('Location').updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );
  
  this.isDefault = true;
  return this.save();
};

// Static methods
LocationSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

LocationSchema.statics.findDefaultLocation = function(userId: string) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

LocationSchema.statics.findNearbyLocations = function(
  latitude: number, 
  longitude: number, 
  radiusInKm: number = 5
) {
  const radiusInRadians = radiusInKm / 6371; // Earth's radius in km
  
  return this.find({
    isActive: true,
    'coordinates.latitude': {
      $gte: latitude - radiusInRadians,
      $lte: latitude + radiusInRadians
    },
    'coordinates.longitude': {
      $gte: longitude - radiusInRadians,
      $lte: longitude + radiusInRadians
    }
  });
};

// Validation
LocationSchema.path('coordinates.latitude').validate(function(value: number) {
  return value >= -90 && value <= 90;
}, 'Latitude must be between -90 and 90 degrees');

LocationSchema.path('coordinates.longitude').validate(function(value: number) {
  return value >= -180 && value <= 180;
}, 'Longitude must be between -180 and 180 degrees');

LocationSchema.path('address.pincode').validate(function(value: string) {
  return /^\d{4,10}$/.test(value);
}, 'Pincode must be 4-10 digits');

export default mongoose.model<ILocation>('Location', LocationSchema); 