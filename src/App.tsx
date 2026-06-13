import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, CATEGORIES } from '../schemas';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : ''; 

type TransactionWithId = Transaction & { _id?: string };

export default function App() {
  const [transactions, setTransactions] = useState<TransactionWithId[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [cat, setCat] = useState<Category>('Otros');
  const [isPending, setIsPending] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); 
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/transactions`)
      .then(res => {
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        return res.json();
      })
      .then(setTransactions)
      .catch((err) => {
        console.error("Fetch error:", err);
        setStatus({ msg: "No se pudo conectar con el servidor (¿Está encendido?)", type: 'error' });
      });
  }, []);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || amount <= 0) {
      setStatus({ msg: "Completa los campos correctamente", type: 'error' });
      return;
    }

    // Combinamos la fecha seleccionada con la hora actual exacta
    const now = new Date();
    const currentTime = now.toISOString().split('T')[1]; // Obtiene "HH:mm:ss.sssZ"
    const dateToSave = `${date}T${currentTime}`;
    
    const newTx = { description: desc, amount, category: cat, type, date: dateToSave, isPending: type === 'gasto' ? isPending : false };
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });

      if (res.ok) {
        const saved = await res.json();
        setTransactions([saved, ...transactions]); 
        setDesc(''); 
        setAmount('');
        setIsPending(false);
        setStatus({ msg: "¡Guardado con éxito!", type: 'success' });
      } else {
        throw new Error();
      }
    } catch (err) {
      setStatus({ msg: "Error al conectar con el servidor", type: 'error' });
    }
  };

  const handleSettle = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${id}/pay`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setTransactions(transactions.map(t => (t._id || (t as any).id) === id ? updated : t));
        setStatus({ msg: "¡Deuda saldada!", type: 'success' });
      } else {
        throw new Error();
      }
    } catch (err) {
      setStatus({ msg: "Error al saldar la deuda", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions(transactions.filter(t => (t._id || t.id) !== id));
        setStatus({ msg: "Transacción eliminada con éxito.", type: 'success' });
      } else {
        const errorData = await res.json();
        setStatus({ msg: `Error al eliminar: ${errorData.error || res.statusText}`, type: 'error' });
      }
    } catch (err) {
      setStatus({ msg: "Error de conexión al intentar eliminar la transacción.", type: 'error' });
    }
  };

  const filteredTransactions = useMemo(() => 
    transactions.filter(t => t.date.startsWith(monthFilter)),
    [transactions, monthFilter]
  );

  const { totalIngresos, totalGastos, totalBalance, totalDeuda } = useMemo(() => {
    const ingresos = filteredTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((acc, t) => acc + t.amount, 0);
    const gastosPagados = filteredTransactions
      .filter(t => t.type === 'gasto' && !t.isPending)
      .reduce((acc, t) => acc + t.amount, 0);
    const deuda = filteredTransactions
      .filter(t => t.type === 'gasto' && t.isPending)
      .reduce((acc, t) => acc + t.amount, 0);
      
    return {
      totalIngresos: ingresos,
      totalGastos: gastosPagados,
      totalBalance: ingresos - gastosPagados, // El saldo real es ingresos menos lo que ya pagamos
      totalDeuda: deuda
    };
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>),
    [filteredTransactions]
  );

  const categoryColors: Record<string, string> = {
    'Almacen': '#FF6384',
    'Carniceria': '#E74C3C',
    'Hijos': '#9B59B6',
    'Transporte': '#36A2EB',
    'Vivienda': '#FFCE56',
    'Entretenimiento': '#4BC0C0',
    'Salud': '#9966FF',
    'Kiosco': '#FF9F40',
    'Indumentaria': '#F06292',
    'Bancos': '#1ABC9C',
    'Regaleria': '#F1C40F',
    'Otros': '#C9CBCF'
  };

  const chartData = useMemo(() => ({
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: Object.keys(expensesByCategory).map(c => categoryColors[c as keyof typeof categoryColors] || '#000'),
        borderWidth: 1,
      },
    ],
  }), [expensesByCategory]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: 'auto' }}>
      <h1>💰 Mi Control de Gastos</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#d4edda', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Ingresos</small>
          <div style={{ color: 'green', fontWeight: 'bold' }}>+${totalIngresos.toFixed(2)}</div>
        </div>
        <div style={{ background: '#f8d7da', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Gastos</small>
          <div style={{ color: 'red', fontWeight: 'bold' }}>-${totalGastos.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <small>A Pagar (Fiado)</small>
          <div style={{ color: '#856404', fontWeight: 'bold' }}>${totalDeuda.toFixed(2)}</div>
        </div>
        <div style={{ background: '#e2e3e5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Saldo Real</small>
          <div style={{ color: totalBalance >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>${totalBalance.toFixed(2)}</div>
        </div>
      </div>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <select value={type} onChange={e => setType(e.target.value as 'ingreso' | 'gasto')}>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} />
        <input 
          type="number" 
          placeholder="Monto" 
          value={amount} 
          onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
        />
        <select value={cat} onChange={e => setCat(e.target.value as Category)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {type === 'gasto' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPending} onChange={e => setIsPending(e.target.checked)} />
            ¿Saca fiado? (Pagar después)
          </label>
        )}
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Agregar {type === 'gasto' ? 'Gasto' : 'Ingreso'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '4px', textAlign: 'center', backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da', color: status.type === 'success' ? '#155724' : '#721c24' }}>
          {status.msg}
        </div>
      )}

      <hr />
      
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Resumen de:</h3>
        <input 
          type="month" 
          value={monthFilter} 
          onChange={e => setMonthFilter(e.target.value)} 
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #007bff' }}
        />
      </div>

      {Object.keys(expensesByCategory).length > 0 ? (
        <div style={{ marginBottom: '30px' }}>
          <Pie data={chartData} />
          
          <div style={{ marginTop: '20px' }}>
            <h4>Desglose por categoría:</h4>
            {Object.entries(expensesByCategory).map(([category, total]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #ccc' }}>
                <span>
                  <span style={{ color: categoryColors[category as keyof typeof categoryColors], marginRight: '10px' }}>●</span>
                  {category}
                </span>
                <span style={{ fontWeight: 'bold' }}>${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#666' }}>No hay gastos en este mes.</p>
      )}

      <hr />

      <h3>Historial del Mes</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredTransactions.map((t) => (
          <li key={t._id || (t as any).id} style={{ backgroundColor: '#f9f9f9', marginBottom: '8px', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {t.description} 
                {t.isPending && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '10px', border: '1px solid #ffeeba' }}>PENDIENTE</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t.category} • {new Date(t.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}hs
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: t.type === 'gasto' ? 'red' : 'green', fontWeight: 'bold' }}>
                {t.type === 'gasto' ? '-' : '+'}${t.amount}
              </span>
              {t.isPending && (
                <button 
                  onClick={() => handleSettle((t._id || (t as any).id)!)} 
                  style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '5px' }}
                  title="Marcar como pagado"
                >✓</button>
              )}
              <button onClick={() => handleDelete((t._id || (t as any).id)!)} style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '5px' }}>X</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
