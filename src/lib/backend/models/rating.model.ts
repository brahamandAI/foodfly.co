import mongoose, { Schema } from 'mongoose';

const ratingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500
  },
  foodRating: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5
  },
  serviceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  images: [{
    type: String
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpful: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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

// Update timestamp on save
ratingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for faster queries
ratingSchema.index({ restaurant: 1, createdAt: -1 });
ratingSchema.index({ user: 1, order: 1 }, { unique: true });
ratingSchema.index({ menuItem: 1, createdAt: -1 });

export const Rating = mongoose.model('Rating', ratingSchema); 