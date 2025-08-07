import mongoose from 'mongoose';

const deliveryRouteSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  route: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  actualTime: {
    type: Number, // in minutes
  },
  distance: {
    type: Number, // in kilometers
    required: true
  },
  trafficConditions: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  optimizationData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
deliveryRouteSchema.index({ route: '2dsphere' });

// Update timestamp on save
deliveryRouteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DeliveryRoute = mongoose.model('DeliveryRoute', deliveryRouteSchema); 