import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'customer' | 'chef' | 'delivery' | 'admin';
  tokenHash: string; // Hash of the JWT token for security
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceType?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface ISessionModel extends Model<ISession> {
  createSession(userId: string, userType: string, tokenHash: string, deviceInfo?: any): Promise<ISession>;
  findActiveSession(tokenHash: string): Promise<ISession | null>;
  invalidateSession(tokenHash: string): Promise<void>;
  invalidateAllUserSessions(userId: string, userType?: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  findUserSessions(userId: string, userType?: string): Promise<ISession[]>;
}

const sessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userType: {
    type: String,
    enum: ['customer', 'chef', 'delivery', 'admin'],
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deviceInfo: {
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    deviceType: {
      type: String,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
sessionSchema.index({ userId: 1, userType: 1, isActive: 1 });
sessionSchema.index({ tokenHash: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }); // For TTL cleanup

// Static methods
sessionSchema.statics.createSession = function(
  userId: string, 
  userType: string, 
  tokenHash: string, 
  deviceInfo?: any
): Promise<ISession> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return this.create({
    userId,
    userType,
    tokenHash,
    deviceInfo,
    isActive: true,
    lastActivity: new Date(),
    expiresAt,
  });
};

sessionSchema.statics.findActiveSession = function(tokenHash: string): Promise<ISession | null> {
  return this.findOne({
    tokenHash,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

sessionSchema.statics.invalidateSession = function(tokenHash: string): Promise<void> {
  return this.updateOne(
    { tokenHash },
    { 
      isActive: false,
      lastActivity: new Date(),
    }
  );
};

sessionSchema.statics.invalidateAllUserSessions = function(
  userId: string, 
  userType?: string
): Promise<void> {
  const query: any = { userId, isActive: true };
  if (userType) {
    query.userType = userType;
  }
  
  return this.updateMany(
    query,
    { 
      isActive: false,
      lastActivity: new Date(),
    }
  );
};

sessionSchema.statics.cleanupExpiredSessions = function(): Promise<void> {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, lastActivity: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  });
};

sessionSchema.statics.findUserSessions = function(
  userId: string, 
  userType?: string
): Promise<ISession[]> {
  const query: any = { userId, isActive: true };
  if (userType) {
    query.userType = userType;
  }
  
  return this.find(query)
    .sort({ lastActivity: -1 })
    .limit(10); // Limit to last 10 active sessions
};

// Instance methods
sessionSchema.methods.updateActivity = function(): Promise<ISession> {
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.extend = function(hours: number = 24): Promise<ISession> {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.lastActivity = new Date();
  return this.save();
};

// Check if model already exists to prevent overwrite error in development
export const Session = mongoose.models.Session || mongoose.model<ISession, ISessionModel>('Session', sessionSchema);