
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UI_LABELS } from '../constants';
import { ArrowUpRight, ArrowDownLeft, Plus, History, Search, FileDown, Loader2, Printer, CheckCircle2, X, ShieldCheck, DownloadCloud } from 'lucide-react';
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

  const handleDownloadPDF = async () => {
    if (!statementRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = statementRef.current;
      // High resolution capture for clear Bengali text
      const canvas = await html2canvas(element, {
        scale: 4, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800 // Ensure mobile views don't squeeze the PDF
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`ManageMoney_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">লেনদেন স্ট্যাটমেন্ট</h1>
          <p className="text-slate-500 font-medium mt-1">আপনার আয় ও ব্যয়ের পূর্ণাঙ্গ প্রমিয়াম রিপোর্ট ডাউনলোড করুন।</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading || transactions.length === 0}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <DownloadCloud size={20} />}
            <span>প্রিমিয়াম রিপোর্ট</span>
          </button>
          <button 
            onClick={() => setShowTypeSelector(true)} 
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span>নতুন লেনদেন</span>
          </button>
        </div>
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
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="সার্চ করুন..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t as any)}
              className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                filterType === t 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t === 'ALL' ? 'সব' : t === 'INCOME' ? 'আয়' : 'ব্যয়'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">তারিখ</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">ক্যাটাগরি</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">বিবরণ</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{t.date}</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{t.description || '-'}</td>
                  <td className={`px-8 py-5 text-lg font-black text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- GORGEOUS PREMIUM PDF TEMPLATE (Hidden from UI) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm' }}>
        <div ref={statementRef} className="bg-white p-16 text-slate-900 relative" style={{ fontFamily: "'Hind Siliguri', sans-serif", lineHeight: '1.6', textRendering: 'optimizeLegibility' }}>
          
          {/* Top Decorative Header */}
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-700 via-indigo-500 to-violet-600"></div>

          {/* Main Header Section */}
          <div className="flex justify-between items-start mb-16 pt-4">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
                  <ShieldCheck size={36} />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">ম্যানেজ মানি</h1>
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-2">Premium Financial Statement</p>
                </div>
              </div>
              
              <div className="space-y-1.5 border-l-4 border-indigo-500 pl-6 mt-4">
                <p className="text-sm font-black text-slate-800 uppercase tracking-wider">Account Holder</p>
                <p className="text-xl font-bold text-slate-600">{userProfile.name || 'সম্মানিত ইউজার'}</p>
                <p className="text-sm text-slate-400 font-bold">{userEmail}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 inline-block">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                 <p className="text-lg font-black text-slate-900">{new Date().toLocaleDateString('bn-BD')}</p>
                 <p className="text-[9px] text-indigo-500 font-bold mt-2 italic">Official Document #MM-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>
          </div>

          {/* Luxury Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Total Inflow</p>
               <p className="text-3xl font-black text-emerald-600 relative z-10">{currency} {totalIn.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Total Outflow</p>
               <p className="text-3xl font-black text-rose-600 relative z-10">{currency} {totalOut.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 relative z-10">Net Balance</p>
               <p className="text-3xl font-black text-white relative z-10">{currency} {netBalance.toLocaleString('bn-BD')}</p>
            </div>
          </div>

          {/* Premium Transaction Table */}
          <div className="mb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-6 border-b border-slate-100 pb-4">Transaction History Details</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Date</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Category & Narration</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {filteredList.map((t) => (
                  <tr key={t.id}>
                    <td className="py-6 px-4 align-top">
                      <p className="text-xs font-black text-slate-500">{t.date}</p>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.category}
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-1">{t.description || 'No description provided'}</p>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right align-top">
                      <p className={`text-lg font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Elegant Footer */}
          <div className="mt-20 pt-10 border-t-2 border-slate-50 flex justify-between items-end">
            <div className="max-w-[300px]">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <CheckCircle2 size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Verified Digital Statement</p>
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                This document is an electronically generated statement from Manage Money. Any unauthorized alteration or reproduction is strictly prohibited.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Authenticated By</p>
              <h4 className="text-xl font-black text-slate-900 tracking-tighter">Manage Money AI</h4>
              <p className="text-[9px] text-indigo-500 font-bold mt-1 underline">www.manage-money.app</p>
            </div>
          </div>

          {/* Subtle Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
             <ShieldCheck size={500} />
          </div>
        </div>
      </div>

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm w-full animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">লেনদেনের ধরন</h2>
              <button onClick={() => setShowTypeSelector(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveFormType('INCOME')} className="flex items-center gap-4 p-5 bg-emerald-50 text-emerald-900 rounded-2xl font-black hover:bg-emerald-100 transition-all">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100"><ArrowDownLeft size={24} /></div>
                আয় / প্রাপ্তি
              </button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="flex items-center gap-4 p-5 bg-rose-50 text-rose-900 rounded-2xl font-black hover:bg-rose-100 transition-all">
                <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-100"><ArrowUpRight size={24} /></div>
                ব্যয় / প্রদান
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <TransactionForm 
            type={activeFormType} 
            onSubmit={handleAddTransaction} 
            onCancel={() => { setActiveFormType(null); setShowTypeSelector(false); }} 
          />
        </div>
      )}
    </div>
  );
};
