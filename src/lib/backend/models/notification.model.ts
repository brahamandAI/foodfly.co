import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: string;
  type: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'order_out_for_delivery' | 'order_delivered' | 'order_cancelled' | 'payment_success' | 'payment_failed' | 'profile_updated' | 'address_added' | 'cart_reminder' | 'promotional' | 'system';
  title: string;
  message: string;
  data?: {
    orderId?: string;
    orderNumber?: string;
    restaurantName?: string;
    amount?: number;
    [key: string]: any;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('app' | 'email' | 'sms' | 'push')[];
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'order_confirmed',
      'order_preparing', 
      'order_ready',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      'payment_success',
      'payment_failed',
      'profile_updated',
      'address_added',
      'cart_reminder',
      'promotional',
      'system'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['app', 'email', 'sms', 'push']
  }],
  sentAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

// Update readAt when isRead is set to true
NotificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification; 