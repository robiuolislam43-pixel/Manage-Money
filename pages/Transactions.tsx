
import React, { useState, useEffect, useCallback } from 'react';
import { TransactionType, Transaction } from '../types';
import { UI_LABELS } from '../constants';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, Edit3 } from 'lucide-react';
import { TransactionForm } from '../components/TransactionForm';

interface TransactionsPageProps {
  type: TransactionType;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ type }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = useCallback(() => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return;

    const saved = localStorage.getItem(`transactions_${userEmail}`);
    let all: Transaction[] = saved ? JSON.parse(saved) : [];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(all);
  }, []);

  useEffect(() => {
    loadTransactions();
    window.addEventListener('storage', loadTransactions);
    return () => window.removeEventListener('storage', loadTransactions);
  }, [loadTransactions]);

  const list = transactions.filter(t => t.type === type && 
    (t.category.includes(searchTerm) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (data: Transaction) => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return;

    const txKey = `transactions_${userEmail}`;
    const saved = localStorage.getItem(txKey);
    const currentTxs: Transaction[] = saved ? JSON.parse(saved) : [];
    
    let updated;
    const existingIdx = currentTxs.findIndex(t => t.id === data.id);
    if (existingIdx > -1) {
      updated = [...currentTxs];
      updated[existingIdx] = data;
    } else {
      updated = [data, ...currentTxs];
    }
    
    updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(txKey, JSON.stringify(updated));
    setTransactions(updated);
    setShowForm(false);
    setEditingTx(undefined);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি এই লেনদেনটি নিশ্চিতভাবে মুছে ফেলতে চান?')) {
      const userEmail = localStorage.getItem('currentUserEmail') || '';
      const txKey = `transactions_${userEmail}`;
      
      // Fetch fresh data from storage to avoid stale state issues
      const saved = localStorage.getItem(txKey);
      const currentTxs: Transaction[] = saved ? JSON.parse(saved) : [];
      
      const updated = currentTxs.filter(t => t.id !== id);
      localStorage.setItem(txKey, JSON.stringify(updated));
      
      setTransactions(updated);
      setShowForm(false);
      setEditingTx(undefined);
      
      // Notify other parts of the app to refresh balance/UI
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {type === 'INCOME' ? UI_LABELS.INCOME : UI_LABELS.EXPENSE} এর তালিকা
          </h1>
          <p className="text-slate-500 font-medium mt-1">আপনার সকল {type === 'INCOME' ? 'আয়ের' : 'ব্যয়ের'} বিস্তারিত ইতিহাস।</p>
        </div>
        <button 
          onClick={() => { setEditingTx(undefined); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span>নতুন {type === 'INCOME' ? 'আয়' : 'ব্যয়'} যোগ</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{UI_LABELS.DATE}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{UI_LABELS.CATEGORY}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{UI_LABELS.AMOUNT}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.length > 0 ? list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{item.date}</td>
                  <td className="px-8 py-5 font-bold text-slate-900">{item.category}</td>
                  <td className={`px-8 py-5 text-lg font-black text-right ${type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {type === 'INCOME' ? '+' : '-'} {UI_LABELS.CURRENCY} {item.amount.toLocaleString('bn-BD')}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditingTx(item); setShowForm(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">কোনো ডেটা পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <TransactionForm 
            type={type} 
            initialData={editingTx} 
            onSubmit={handleSave} 
            onCancel={() => { setShowForm(false); setEditingTx(undefined); }} 
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};
