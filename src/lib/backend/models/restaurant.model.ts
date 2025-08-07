import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  description: string;
  cuisine: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  phone: string;
  email: string;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  rating: number;
  deliveryFee: number;
  minimumOrder: number;
  isActive: boolean;
  images: string[];
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cuisine: [{
      type: String,
      required: true,
    }],
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    openingHours: {
      type: Map,
      of: {
        open: String,
        close: String,
      },
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema); 