
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UI_LABELS } from '../constants';
import { ArrowUpRight, ArrowDownLeft, Plus, History, Search, FileDown, Loader2, Printer, CheckCircle2, X, ShieldCheck, DownloadCloud, Sparkles, Gem, Landmark, Shield, Edit3, Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { TransactionForm } from '../components/TransactionForm';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const TransfersPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TransactionType | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const statementRef = useRef<HTMLDivElement>(null);

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

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি এই লেনদেনটি নিশ্চিতভাবে মুছে ফেলতে চান?')) {
      const saved = localStorage.getItem(txKey);
      const currentTxs: Transaction[] = saved ? JSON.parse(saved) : [];
      
      const updated = currentTxs.filter(t => t.id !== id);
      localStorage.setItem(txKey, JSON.stringify(updated));
      
      setTransactions(updated);
      setEditingTx(undefined);
      setActiveFormType(null);
      setShowTypeSelector(false);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setActiveFormType(tx.type);
  };

  const handleSave = (data: Transaction) => {
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
    setActiveFormType(null);
    setEditingTx(undefined);
    setShowTypeSelector(false);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDownloadPDF = async () => {
    if (!statementRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = statementRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`MM_Statement_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("দুঃখিত, PDF তৈরি করা সম্ভব হয়নি।");
    } finally {
      setIsDownloading(false);
    }
  };

  const currency = localStorage.getItem('userCurrency') || '৳';
  const totalIn = filteredList.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = filteredList.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIn - totalOut;

  const userProfile = JSON.parse(localStorage.getItem(`profile_${userEmail}`) || '{}');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             লেনদেন স্ট্যাটমেন্ট <Gem className="text-amber-500" />
          </h1>
          <p className="text-slate-500 font-medium mt-2">আপনার আয় ও ব্যয়ের পূর্ণাঙ্গ প্রমিয়াম রিপোর্ট ম্যানেজ করুন।</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading || transactions.length === 0}
            className="group relative overflow-hidden flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[1.5rem] font-black hover:bg-black transition-all disabled:opacity-50 shadow-2xl shadow-slate-200"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {isDownloading ? <Loader2 size={24} className="animate-spin" /> : <DownloadCloud size={24} />}
            <span className="relative">প্রিমিয়াম রিপোর্ট</span>
          </button>
          <button 
            onClick={() => { setEditingTx(undefined); setShowTypeSelector(true); }} 
            className="bg-indigo-600 text-white px-8 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
            <span>নতুন লেনদেন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2.5rem] flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em] mb-3">মোট জমা</p>
            <h2 className="text-4xl font-black text-emerald-900">{currency} {totalIn.toLocaleString('bn-BD')}</h2>
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl relative z-10">
            <ArrowDownLeft size={36} />
          </div>
        </div>
        
        <div className="bg-rose-50 border border-rose-100 p-10 rounded-[2.5rem] flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-rose-700 font-black text-[10px] uppercase tracking-[0.2em] mb-3">মোট খরচ</p>
            <h2 className="text-4xl font-black text-rose-900">{currency} {totalOut.toLocaleString('bn-BD')}</h2>
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-xl relative z-10">
            <ArrowUpRight size={36} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input 
            type="text" 
            placeholder="বিবরণ বা ক্যাটাগরি দিয়ে খুঁজুন..." 
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-lg" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t as any)}
              className={`px-8 py-5 rounded-3xl font-black text-sm transition-all ${
                filterType === t 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t === 'ALL' ? 'সব' : t === 'INCOME' ? 'আয়' : 'ব্যয়'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">তারিখ</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">খাত ও বিবরণ</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">পরিমাণ</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-10 py-7 text-sm font-bold text-slate-500">{t.date}</td>
                  <td className="px-10 py-7">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-block w-fit px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.category}
                      </span>
                      <p className="text-base font-black text-slate-800">{t.description || 'বিবরণ নেই'}</p>
                    </div>
                  </td>
                  <td className={`px-10 py-7 text-xl font-black text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}
                  </td>
                  <td className="px-10 py-7 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEdit(t)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ position: 'fixed', top: 0, left: '-100vw', width: '210mm', opacity: 0, pointerEvents: 'none', zIndex: -1000 }}>
        <div ref={statementRef} className="bg-white p-20 text-slate-900 relative" style={{ fontFamily: "'Hind Siliguri', sans-serif", width: '210mm' }}>
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-indigo-950 via-indigo-800 to-indigo-900"></div>
          <div className="absolute top-8 left-0 w-full h-1 bg-amber-400"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-12"><Landmark size={600} /></div>
          <div className="flex justify-between items-start mb-20 relative z-10 pt-10">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-indigo-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative">
                <div className="absolute inset-0 bg-amber-400/10 rounded-[2.5rem] animate-pulse"></div>
                <Landmark size={48} className="text-amber-400" />
              </div>
              <div><h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">ম্যানেজ মানি</h1><p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mt-1 flex items-center gap-2"><Shield size={12} className="fill-current" /> Verified Financial Statement</p></div>
            </div>
            <div className="text-right"><div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[3rem] inline-block shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p><p className="text-2xl font-black text-slate-900">{new Date().toLocaleDateString('bn-BD')}</p><p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-[0.2em]">REF: MM-{Date.now().toString().slice(-8)}</p></div></div>
          </div>
          <div className="bg-indigo-950 p-12 rounded-[4rem] mb-16 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/10 transition-colors"></div>
             <div className="grid grid-cols-2 gap-12 relative z-10">
                <div className="border-l-4 border-amber-400 pl-8">
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em] mb-4">Account Holder</p>
                  <h3 className="text-3xl font-black text-white mb-2">{userProfile.name || 'সম্মানিত গ্রাহক'}</h3>
                  <p className="text-sm text-indigo-200 font-bold opacity-70">{userEmail}</p>
                </div>
                <div className="text-right flex flex-col justify-center">
                   <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em] mb-4">Net Current Value</p>
                   <h3 className="text-5xl font-black text-amber-400">{currency} {netBalance.toLocaleString('bn-BD')}</h3>
                </div>
             </div>
          </div>
          <div className="mb-20 relative z-10">
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.4em] mb-10 border-b-2 border-slate-50 pb-6">Detailed Activity Logs</h4>
            <table className="w-full">
              <thead><tr className="text-left"><th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value Date</th><th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrative</th><th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th></tr></thead>
              <tbody className="divide-y-2 divide-slate-50">
                {filteredList.map((t) => (
                  <tr key={t.id}><td className="py-8 px-4 text-sm font-black text-slate-400">{t.date}</td><td className="py-8 px-4"><p className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">{t.category}</p><p className="text-lg font-black text-slate-800">{t.description || 'Entry'}</p></td><td className={`py-8 px-4 text-2xl font-black text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-4 bg-amber-400"></div>
        </div>
      </div>

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 max-w-sm w-full animate-in zoom-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">লেনদেনের ধরন</h2>
              <button onClick={() => setShowTypeSelector(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveFormType('INCOME')} className="flex items-center gap-5 p-6 bg-emerald-50 text-emerald-900 rounded-3xl font-black hover:bg-emerald-100 transition-all group">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 group-hover:scale-110 transition-transform"><ArrowDownLeft size={32} /></div>
                আয় / প্রাপ্তি
              </button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="flex items-center gap-5 p-6 bg-rose-50 text-rose-900 rounded-3xl font-black hover:bg-rose-100 transition-all group">
                <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-200 group-hover:scale-110 transition-transform"><ArrowUpRight size={32} /></div>
                ব্যয় / প্রদান
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <TransactionForm 
            type={activeFormType} 
            initialData={editingTx}
            onSubmit={handleSave} 
            onCancel={() => { setActiveFormType(null); setShowTypeSelector(false); setEditingTx(undefined); }} 
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};
