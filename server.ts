import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { TransactionSchema } from './schemas.js';
import { TransactionModel } from './Transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gastos';
mongoose.connect(MONGO_URI)
  .then(() => console.log("💾 Conectado a MongoDB"))
  .catch((err: any) => console.error("❌ Error de conexión:", err));

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
  } catch (error: any) {
    console.error("❌ Error de validación en POST /api/transactions:", error);
    res.status(400).json({ error: "Datos inválidos", details: error.message });
  }
});

// Eliminar una transacción
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await TransactionModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// Servir archivos estáticos del Frontend (React)
app.use(express.static(path.join(__dirname, '../dist')));

// Ruta "catch-all" para que React Handle las rutas del navegador
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Gastos corriendo en http://localhost:${PORT}`);
});