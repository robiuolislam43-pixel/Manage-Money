
import React, { useState, useEffect } from 'react';
import { UI_LABELS } from '../constants';
import { Loan } from '../types';
import { Phone, Trash2 } from 'lucide-react';

interface LoanFormProps {
  initialData?: Loan;
  onSubmit: (data: Partial<Loan>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({ initialData, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    personName: initialData?.personName || '',
    phoneNumber: initialData?.phoneNumber || '',
    amount: initialData?.amount.toString() || '',
    type: initialData?.type || 'OWE_ME' as 'OWE_ME' | 'I_OWE',
    dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      amount: parseFloat(formData.amount),
      status: initialData?.status || 'PENDING',
    });
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-black text-slate-900">
          {initialData ? 'লোন সংশোধন করুন' : 'নতুন লোন যোগ করুন'}
        </h2>
        {initialData && onDelete && (
          <button 
            type="button" 
            onClick={() => onDelete(initialData.id)}
            className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">ব্যক্তির নাম</label>
          <input
            type="text"
            required
            value={formData.personName}
            onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            placeholder="নাম লিখুন..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">মোবাইল নম্বর (ঐচ্ছিক)</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              placeholder="০১৭XXXXXXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">টাকার পরিমাণ</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{UI_LABELS.CURRENCY}</span>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">লেনদেনের ধরন</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'OWE_ME' })}
              className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border ${
                formData.type === 'OWE_ME' 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              আমি পাবো (পাওনা)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'I_OWE' })}
              className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border ${
                formData.type === 'I_OWE' 
                ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              আমি দেবো (দেনা)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">সম্ভাব্য তারিখ (ঐচ্ছিক)</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
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
            {initialData ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};
