import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IVoiceSession extends Document {
  user: mongoose.Types.ObjectId;
  sessionId: string;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    healthRecommendations?: any;
    actions?: any[];
  }>;
  step: 'initial' | 'restaurant_selection' | 'menu_browsing' | 'quantity_selection' | 'confirmation' | 'complete';
  pendingOrder?: {
    restaurantId?: string;
    items?: Array<{
      menuItemId: string;
      quantity: number;
      customization?: string;
    }>;
    deliveryAddress?: any;
  };
  context: any;
  lastIntent?: string;
  healthProfile?: mongoose.Types.ObjectId;
  orderDetails?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  
  // Instance methods
  addMessage(role: 'user' | 'assistant', content: string, healthRecommendations?: any, actions?: any[]): Promise<IVoiceSession>;
  updateStep(step: string): Promise<IVoiceSession>;
  updatePendingOrder(orderData: any): Promise<IVoiceSession>;
  markComplete(): Promise<IVoiceSession>;
  extend(): Promise<IVoiceSession>;
}

export interface IVoiceSessionModel extends Model<IVoiceSession> {
  findActiveSession(sessionId: string): Promise<IVoiceSession | null>;
  findUserSessions(userId: string, limit?: number): Promise<IVoiceSession[]>;
  createSession(userId: string, sessionId: string, healthProfileId?: string): Promise<IVoiceSession>;
}

const voiceSessionSchema = new Schema<IVoiceSession>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  conversation: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    healthRecommendations: {
      type: Schema.Types.Mixed,
      default: null,
    },
    actions: [{
      type: Schema.Types.Mixed,
    }],
  }],
  step: {
    type: String,
    enum: ['initial', 'restaurant_selection', 'menu_browsing', 'quantity_selection', 'confirmation', 'complete'],
    default: 'initial',
  },
  pendingOrder: {
    restaurantId: {
      type: String,
    },
    items: [{
      menuItemId: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      customization: {
        type: String,
      },
    }],
    deliveryAddress: {
      type: Schema.Types.Mixed,
    },
  },
  context: {
    type: Schema.Types.Mixed,
    default: {},
  },
  lastIntent: {
    type: String,
  },
  healthProfile: {
    type: Schema.Types.ObjectId,
    ref: 'HealthProfile',
  },
  orderDetails: {
    type: Schema.Types.Mixed,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

// Index for efficient querying
voiceSessionSchema.index({ user: 1, isActive: 1 });
voiceSessionSchema.index({ sessionId: 1, isActive: 1 });
voiceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
voiceSessionSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string, healthRecommendations?: any, actions?: any[]) {
  this.conversation.push({
    role,
    content,
    timestamp: new Date(),
    healthRecommendations,
    actions,
  });
  this.updatedAt = new Date();
  return this.save();
};

voiceSessionSchema.methods.updateStep = function(step: string) {
  this.step = step;
  this.updatedAt = new Date();
  return this.save();
};

voiceSessionSchema.methods.updatePendingOrder = function(orderData: any) {
  this.pendingOrder = { ...this.pendingOrder, ...orderData };
  this.updatedAt = new Date();
  return this.save();
};

voiceSessionSchema.methods.markComplete = function() {
  this.step = 'complete';
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

voiceSessionSchema.methods.extend = function() {
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend by 24 hours
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
voiceSessionSchema.statics.findActiveSession = function(sessionId: string) {
  return this.findOne({ sessionId, isActive: true });
};

voiceSessionSchema.statics.findUserSessions = function(userId: string, limit: number = 10) {
  return this.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('healthProfile', 'dietaryPreferences allergies fitnessGoals');
};

voiceSessionSchema.statics.createSession = function(userId: string, sessionId: string, healthProfileId?: string) {
  return this.create({
    user: userId,
    sessionId,
    healthProfile: healthProfileId,
    conversation: [],
    context: {},
    isActive: true,
  });
};

export const VoiceSession = mongoose.model<IVoiceSession, IVoiceSessionModel>('VoiceSession', voiceSessionSchema); 