import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  factors: {
    demand: Number,
    competition: Number,
    seasonality: Number,
    specialEvents: Boolean
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema); 