import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TransactionSchema } from './schemas';
import { TransactionModel } from './models/Transaction';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gastos';
mongoose.connect(MONGO_URI)
  .then(() => console.log("💾 Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Obtener todos los movimientos
app.get('/api/transactions', async (req, res) => {
  const transactions = await TransactionModel.find().sort({ date: -1 });
  res.json(transactions);
});

// Registrar un nuevo movimiento (Gasto o Ingreso)
app.post('/api/transactions', async (req, res) => {
  try {
    const validatedData = TransactionSchema.parse(req.body);
    const newTransaction = new TransactionModel(validatedData);
    await newTransaction.save();

    console.log(`✅ Registro guardado: ${newTransaction.description} - $${newTransaction.amount}`);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ error: "Datos inválidos" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Gastos corriendo en http://localhost:${PORT}`);
});