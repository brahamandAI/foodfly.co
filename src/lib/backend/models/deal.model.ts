import mongoose, { Schema } from 'mongoose';

const dealSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  savings: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  category: { type: String, required: true },
  tags: [String],
  code: String,
  minOrder: Number,
  maxDiscount: Number,
  paymentMethod: String,
  timing: String,
  isProminent: Boolean
}, { timestamps: true });

export const Deal = mongoose.model('Deal', dealSchema); 