import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Otros'],
    required: true 
  },
  date: { type: String, default: () => new Date().toISOString() },
  type: { type: String, enum: ['ingreso', 'gasto'], required: true }
}, {
  timestamps: true,
  toJSON: { 
    transform: (_doc, ret: any) => { 
      ret.id = ret._id; 
      delete ret._id; 
      delete ret.__v; 
    } 
  }
});

export const TransactionModel = mongoose.model('Transaction', transactionSchema);