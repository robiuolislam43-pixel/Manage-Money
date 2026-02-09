
import React, { useState, useEffect, useCallback } from 'react';
import { UI_LABELS } from '../constants';
import { ArrowUpRight, ArrowDownLeft, Plus, History, Search } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { TransactionForm } from '../components/TransactionForm';

export const TransfersPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TransactionType | null>(null);

  const userEmail = localStorage.getItem('currentUserEmail') || '';
  const txKey = `transactions_${userEmail}`;

  const loadAllTransactions = useCallback(() => {
    if (!userEmail) return;
    const saved = localStorage.getItem(txKey);
    let all: Transaction[] = saved ? JSON.parse(saved) : [];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(all);
  }, [userEmail, txKey]);

  useEffect(() => {
    loadAllTransactions();
    window.addEventListener('storage', loadAllTransactions);
    return () => window.removeEventListener('storage', loadAllTransactions);
  }, [loadAllTransactions]);

  const filteredList = transactions.filter(t => {
    const matchesSearch = t.category.includes(searchTerm) || (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' ? true : t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddTransaction = (newTx: Transaction) => {
    const saved = localStorage.getItem(txKey);
    const currentTxs: Transaction[] = saved ? JSON.parse(saved) : [];
    const updated = [newTx, ...currentTxs];
    localStorage.setItem(txKey, JSON.stringify(updated));
    setTransactions(updated);
    setActiveFormType(null);
    setShowTypeSelector(false);
    window.dispatchEvent(new Event('storage'));
  };

  const currency = localStorage.getItem('userCurrency') || '৳';
  const totalIn = filteredList.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = filteredList.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">লেনদেন স্ট্যাটমেন্ট</h1><p className="text-slate-500 font-medium mt-1">আপনার আয়ের পূর্ণাঙ্গ ইতিহাস।</p></div>
        <button onClick={() => setShowTypeSelector(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl">নতুন লেনদেন যোগ</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div><p className="text-emerald-700 font-bold text-sm uppercase mb-2">মোট জমা</p><h2 className="text-4xl font-black text-emerald-900">{currency} {totalIn.toLocaleString('bn-BD')}</h2></div>
          <ArrowDownLeft size={32} className="text-emerald-600" />
        </div>
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div><p className="text-rose-700 font-bold text-sm uppercase mb-2">মোট খরচ</p><h2 className="text-4xl font-black text-rose-900">{currency} {totalOut.toLocaleString('bn-BD')}</h2></div>
          <ArrowUpRight size={32} className="text-rose-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="সার্চ করুন..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {filteredList.map((t) => (
            <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{t.type === 'INCOME' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}</div>
                <div><p className="font-black text-lg text-slate-900">{t.category}</p><p className="text-sm font-bold text-slate-400">{t.date}</p></div>
              </div>
              <p className={`font-black text-xl ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}</p>
            </div>
          ))}
        </div>
      </div>

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-slate-900">লেনদেনের ধরন</h2><button onClick={() => setShowTypeSelector(false)} className="text-slate-400">বন্ধ</button></div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveFormType('INCOME')} className="p-5 bg-emerald-50 text-emerald-900 rounded-2xl font-black">আয় / প্রাপ্তি</button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="p-5 bg-rose-50 text-rose-900 rounded-2xl font-black">ব্যয় / প্রদান</button>
            </div>
          </div>
        </div>
      )}

      {activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <TransactionForm type={activeFormType} onSubmit={handleAddTransaction} onCancel={() => setActiveFormType(null)} />
        </div>
      )}
    </div>
  );
};
