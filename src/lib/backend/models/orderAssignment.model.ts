import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderAssignment extends Document {
  orderId: string;
  customerId: string;
  restaurantId: string;
  restaurantLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  customerLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  
  // Assignment details
  assignedTo?: string; // Current delivery partner ID
  assignmentHistory: Array<{
    deliveryPartnerId: string;
    assignedAt: Date;
    status: 'assigned' | 'accepted' | 'rejected' | 'timeout';
    respondedAt?: Date;
    reason?: string;
  }>;
  
  // Current status
  status: 'pending' | 'assigned' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  priority: number; // Higher number = higher priority
  
  // Timing
  createdAt: Date;
  assignedAt?: Date;
  acceptedAt?: Date;
  timeoutAt?: Date; // When current assignment expires
  
  // Assignment constraints
  maxAssignmentAttempts: number;
  currentAttempt: number;
  
  // Order details for display
  orderSummary: {
    totalAmount: number;
    itemCount: number;
    specialInstructions?: string;
    estimatedPreparationTime?: number; // minutes
  };
  
  // Assignment metadata
  assignmentRadius: number; // km - search radius for delivery partners
  lastAssignmentCheck?: Date;
  eligibleDeliveryPartners?: string[]; // IDs of partners in range
}

const OrderAssignmentSchema = new Schema<IOrderAssignment>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  restaurantId: {
    type: String,
    required: true,
    index: true
  },
  restaurantLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  customerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  assignedTo: {
    type: String,
    index: true
  },
  assignmentHistory: [{
    deliveryPartnerId: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'rejected', 'timeout'],
      required: true
    },
    respondedAt: {
      type: Date
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'in_transit', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  assignedAt: {
    type: Date,
    index: true
  },
  acceptedAt: {
    type: Date
  },
  timeoutAt: {
    type: Date,
    index: true
  },
  
  maxAssignmentAttempts: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  currentAttempt: {
    type: Number,
    default: 0,
    min: 0
  },
  
  orderSummary: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    itemCount: {
      type: Number,
      required: true,
      min: 1
    },
    specialInstructions: {
      type: String,
      trim: true
    },
    estimatedPreparationTime: {
      type: Number,
      min: 0
    }
  },
  
  assignmentRadius: {
    type: Number,
    default: 5, // 5km default radius
    min: 1,
    max: 50
  },
  lastAssignmentCheck: {
    type: Date
  },
  eligibleDeliveryPartners: [{
    type: String
  }]
});

// Geospatial indexes for location-based queries
OrderAssignmentSchema.index({ 'restaurantLocation': '2dsphere' });
OrderAssignmentSchema.index({ 'customerLocation': '2dsphere' });

// Compound indexes for efficient queries
OrderAssignmentSchema.index({ status: 1, createdAt: -1 });
OrderAssignmentSchema.index({ assignedTo: 1, status: 1 });
OrderAssignmentSchema.index({ timeoutAt: 1 }, { sparse: true });

// Virtual for calculating assignment timeout
OrderAssignmentSchema.virtual('isTimedOut').get(function() {
  return this.timeoutAt && new Date() > this.timeoutAt;
});

// Instance methods
OrderAssignmentSchema.methods.assignToDeliveryPartner = function(deliveryPartnerId: string, timeoutSeconds: number = 30) {
  this.assignedTo = deliveryPartnerId;
  this.status = 'assigned';
  this.assignedAt = new Date();
  this.timeoutAt = new Date(Date.now() + timeoutSeconds * 1000);
  this.currentAttempt += 1;
  
  this.assignmentHistory.push({
    deliveryPartnerId,
    assignedAt: new Date(),
    status: 'assigned'
  });
  
  return this.save();
};

OrderAssignmentSchema.methods.acceptAssignment = function(deliveryPartnerId: string) {
  if (this.assignedTo !== deliveryPartnerId) {
    throw new Error('Assignment not found for this delivery partner');
  }
  
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.timeoutAt = undefined;
  
  // Update assignment history
  const currentAssignment = this.assignmentHistory[this.assignmentHistory.length - 1];
  if (currentAssignment && currentAssignment.deliveryPartnerId === deliveryPartnerId) {
    currentAssignment.status = 'accepted';
    currentAssignment.respondedAt = new Date();
  }
  
  return this.save();
};

OrderAssignmentSchema.methods.rejectAssignment = function(deliveryPartnerId: string, reason?: string) {
  if (this.assignedTo !== deliveryPartnerId) {
    throw new Error('Assignment not found for this delivery partner');
  }
  
  // Update assignment history
  const currentAssignment = this.assignmentHistory[this.assignmentHistory.length - 1];
  if (currentAssignment && currentAssignment.deliveryPartnerId === deliveryPartnerId) {
    currentAssignment.status = 'rejected';
    currentAssignment.respondedAt = new Date();
    currentAssignment.reason = reason;
  }
  
  // Reset assignment for next attempt
  this.assignedTo = undefined;
  this.status = 'pending';
  this.assignedAt = undefined;
  this.timeoutAt = undefined;
  
  return this.save();
};

OrderAssignmentSchema.methods.handleTimeout = function() {
  if (!this.isTimedOut) {
    return false;
  }
  
  // Update assignment history
  const currentAssignment = this.assignmentHistory[this.assignmentHistory.length - 1];
  if (currentAssignment && currentAssignment.status === 'assigned') {
    currentAssignment.status = 'timeout';
    currentAssignment.respondedAt = new Date();
  }
  
  // Reset assignment for next attempt
  this.assignedTo = undefined;
  this.status = 'pending';
  this.assignedAt = undefined;
  this.timeoutAt = undefined;
  
  return this.save();
};

// Static methods
OrderAssignmentSchema.statics.findTimedOutAssignments = function() {
  return this.find({
    status: 'assigned',
    timeoutAt: { $lte: new Date() }
  });
};

OrderAssignmentSchema.statics.findPendingAssignments = function() {
  return this.find({
    status: 'pending',
    currentAttempt: { $lt: this.maxAssignmentAttempts }
  }).sort({ priority: -1, createdAt: 1 });
};

const OrderAssignment = mongoose.models.OrderAssignment || mongoose.model<IOrderAssignment>('OrderAssignment', OrderAssignmentSchema);

export default OrderAssignment; 