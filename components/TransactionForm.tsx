import React, { useState, useEffect } from 'react';
import { UI_LABELS, CATEGORIES } from '../constants';
import { TransactionType, Transaction } from '../types';

interface TransactionFormProps {
  type: TransactionType;
  initialData?: Transaction;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, initialData, onSubmit, onCancel }) => {
  const [currency, setCurrency] = useState('৳');
  const [formData, setFormData] = useState({
    amount: initialData?.amount.toString() || '',
    category: initialData?.category || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: initialData?.description || ''
  });

  useEffect(() => {
    const email = localStorage.getItem('currentUserEmail');
    if (email) {
      const profile = JSON.parse(localStorage.getItem(`profile_${email}`) || '{}');
      setCurrency(profile.currency || '৳');
    }
  }, []);

  const categories = type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      ...formData, 
      type, 
      id: initialData?.id || Math.random().toString(36).substr(2, 9), 
      amount: parseFloat(formData.amount) 
    });
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
        <div className={`w-3 h-8 rounded-full ${type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        {initialData ? 'লেনদেন সংশোধন' : `${type === 'INCOME' ? 'আয়' : 'ব্যয়'} যোগ করুন`}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{UI_LABELS.AMOUNT}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">{currency}</span>
            <input
              type="number"
              required
              autoFocus
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-black text-xl"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{UI_LABELS.CATEGORY}</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none"
          >
            <option value="">সিলেক্ট করুন</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{UI_LABELS.DATE}</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">{UI_LABELS.DESCRIPTION}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium min-h-[100px]"
            placeholder="কিছু বিস্তারিত লিখুন (ঐচ্ছিক)..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl text-slate-600 font-black hover:bg-slate-50 transition-all"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            {initialData ? 'আপডেট' : 'সংরক্ষণ'}
          </button>
        </div>
      </form>
    </div>
  );
};