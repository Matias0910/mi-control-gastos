import React, { useState, useEffect } from 'react';
import { Transaction, Category } from './schemas';

// En producción (Render), usaremos la URL de tu backend desplegado
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mi-control-gastos-backend.onrender.com' // Reemplaza con la URL real que te de Render
  : 'http://localhost:3001';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [cat, setCat] = useState<Category>('Otros');

  // Cargar datos al iniciar
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/transactions`)
      .then(res => res.json())
      .then(setTransactions);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTx = { description: desc, amount, category: cat, type };
    
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

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const totalBalance = transactions.reduce((acc, t) => t.type === 'ingreso' ? acc + t.amount : acc - t.amount, 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto' }}>
      <h1>💰 Mi Control de Gastos</h1>
      
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <h2>Saldo Actual: <span style={{ color: totalBalance >= 0 ? 'green' : 'red' }}>${totalBalance.toFixed(2)}</span></h2>
      </div>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <select value={type} onChange={e => setType(e.target.value as 'ingreso' | 'gasto')}>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} />
        <input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        <select value={cat} onChange={e => setCat(e.target.value as Category)}>
          <option value="Comida">Comida</option>
          <option value="Transporte">Transporte</option>
          <option value="Vivienda">Vivienda</option>
          <option value="Entretenimiento">Entretenimiento</option>
          <option value="Salud">Salud</option>
          <option value="Otros">Otros</option>
        </select>
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Agregar {type === 'gasto' ? 'Gasto' : 'Ingreso'}
        </button>
      </form>

      <hr />

      <h3>Historial</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map(t => (
          <li key={t.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span>{t.description} <small style={{ color: '#666' }}>({t.category})</small></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: t.type === 'gasto' ? 'red' : 'green', fontWeight: 'bold' }}>
                {t.type === 'gasto' ? '-' : '+'}${t.amount}
              </span>
              <button onClick={() => handleDelete(t.id!)} style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '5px' }}>X</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}