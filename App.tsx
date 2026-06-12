import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../shared/schemas';

// En producción (Render), usaremos la URL de tu backend desplegado
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://tu-app-en-render.onrender.com' 
  : 'http://localhost:3001';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [cat, setCat] = useState<Category>('Otros');

  // Cargar datos al iniciar
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/transactions`)
      .then(res => res.json())
      .then(setTransactions);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTx = { description: desc, amount, category: cat, type: 'gasto' as const };
    
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    });

    if (res.ok) {
      const saved = await res.json();
      setTransactions([...transactions, saved]);
      setDesc(''); setAmount(0);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto' }}>
      <h1>💰 Mi Control de Gastos</h1>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} />
        <input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        <select value={cat} onChange={e => setCat(e.target.value as Category)}>
          <option value="Comida">Comida</option>
          <option value="Transporte">Transporte</option>
          <option value="Vivienda">Vivienda</option>
          <option value="Otros">Otros</option>
        </select>
        <button type="submit">Agregar Gasto</button>
      </form>

      <hr />

      <h3>Historial</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map(t => (
          <li key={t.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.description} <strong>({t.category})</strong></span>
            <span style={{ color: 'red' }}>-${t.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}