import mongoose from 'mongoose';
import { CATEGORIES } from './schemas.js';

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: CATEGORIES,
    required: true 
  },
  date: { type: String, default: () => new Date().toISOString() },
  type: { type: String, enum: ['ingreso', 'gasto'], required: true },
  isPending: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { 
    transform: (_doc: any, ret: any) => { 
      ret.id = ret._id; 
      delete ret._id; 
      delete ret.__v; 
    } 
  }
});

export const TransactionModel = mongoose.model('Transaction', transactionSchema);