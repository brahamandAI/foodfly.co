import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['order', 'delivery', 'payment', 'account', 'other'],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportAgent'
  },
  responses: [{
    content: String,
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'responses.responderType'
    },
    responderType: {
      type: String,
      enum: ['SupportAgent', 'Customer', 'AI']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  aiAnalysis: {
    sentiment: String,
    intent: String,
    suggestedResponse: String,
    confidence: Number
  },
  metadata: {
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

// Update timestamp on save
supportTicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema); 