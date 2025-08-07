import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryLocation extends Document {
  deliveryId: string; // Unique identifier for each delivery (can be orderId or separate deliveryId)
  orderId: string;
  deliveryPersonId: string;
  customerId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string; // Reverse geocoded address for display
  timestamp: Date;
  accuracy?: number; // GPS accuracy in meters
  speed?: number; // Speed in km/h
  heading?: number; // Direction in degrees
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  isLive: boolean; // Whether this is the most recent location
  metadata?: {
    batteryLevel?: number;
    networkType?: string;
    deviceInfo?: string;
  };
}

const DeliveryLocationSchema = new Schema<IDeliveryLocation>({
  deliveryId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  deliveryPersonId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coordinates: number[]) {
          return coordinates.length === 2 && 
                 coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
                 coordinates[1] >= -90 && coordinates[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90'
      }
    }
  },
  address: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  accuracy: {
    type: Number,
    min: 0
  },
  speed: {
    type: Number,
    min: 0
  },
  heading: {
    type: Number,
    min: 0,
    max: 360
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  isLive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    networkType: String,
    deviceInfo: String
  }
}, {
  timestamps: true // This adds createdAt and updatedAt
});

// Create geospatial index for location-based queries
DeliveryLocationSchema.index({ location: '2dsphere' });

// Compound index for efficient queries
DeliveryLocationSchema.index({ deliveryId: 1, timestamp: -1 });
DeliveryLocationSchema.index({ orderId: 1, isLive: 1 });
DeliveryLocationSchema.index({ deliveryPersonId: 1, status: 1 });

// Middleware to manage isLive flag - only one location per deliveryId should be live
DeliveryLocationSchema.pre('save', async function(next) {
  if (this.isNew && this.isLive) {
    // Set all other locations for this deliveryId to not live
    await this.constructor.updateMany(
      { deliveryId: this.deliveryId, _id: { $ne: this._id } },
      { isLive: false }
    );
  }
  next();
});

// Static method to get latest location for a delivery
DeliveryLocationSchema.statics.getLatestLocation = function(deliveryId: string) {
  return this.findOne({ deliveryId, isLive: true }).sort({ timestamp: -1 });
};

// Static method to get location history for a delivery
DeliveryLocationSchema.statics.getLocationHistory = function(deliveryId: string, limit = 50) {
  return this.find({ deliveryId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('location timestamp accuracy speed heading status');
};

// Instance method to calculate distance from another point
DeliveryLocationSchema.methods.distanceTo = function(lat: number, lng: number) {
  const [myLng, myLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in km
  const dLat = (lat - myLat) * Math.PI / 180;
  const dLng = (lng - myLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(myLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

export default mongoose.models.DeliveryLocation || mongoose.model<IDeliveryLocation>('DeliveryLocation', DeliveryLocationSchema); 