
import React, { useEffect, useState, useCallback } from 'react';
import { StatCard } from '../components/StatCard';
import { UI_LABELS } from '../constants';
import { 
  TrendingUp, TrendingDown, Wallet as WalletIcon, Plus, User, X, 
  ArrowUpRight, ArrowDownLeft, Smartphone, ChevronRight, Edit3, 
  Save, Sparkles, Loader2, RefreshCw, BrainCircuit,
  Bell, Phone, CheckCircle2, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, Loan, TransactionType, Wallet, AIInsight } from '../types';
import { TransactionForm } from '../components/TransactionForm';
import { getFinancialInsights } from '../services/geminiService';

export const Dashboard: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState('ইউজার');
  const [currency, setCurrency] = useState('৳');
  
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TransactionType | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [dueToday, setDueToday] = useState<Loan[]>([]);

  const loadLocalData = useCallback(() => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return { txs: [], lnList: [], walletList: [] };

    // Load Profile
    const profileKey = `profile_${userEmail}`;
    const savedProfile = localStorage.getItem(profileKey);
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setUserName(p.name || 'ইউজার');
      setCurrency(p.currency || '৳');
    }
    setProfilePic(localStorage.getItem(`profilePic_${userEmail}`));

    // Load Financials
    const txKey = `transactions_${userEmail}`;
    const loanKey = `loans_${userEmail}`;
    const walletKey = `wallets_${userEmail}`;

    const savedTxs = localStorage.getItem(txKey);
    let txs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);

    const savedLoans = localStorage.getItem(loanKey);
    const lnList: Loan[] = savedLoans ? JSON.parse(savedLoans) : [];
    setLoans(lnList);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const due = lnList.filter(l => l.status === 'PENDING' && l.dueDate === todayStr);
    setDueToday(due);

    const savedWallets = localStorage.getItem(walletKey);
    const walletList: Wallet[] = savedWallets ? JSON.parse(savedWallets) : [
      { id: 'w1', name: 'বিকাশ (bKash)', balance: 0, color: '#D2358D', provider: 'bkash' },
      { id: 'w2', name: 'নগদ (Nagad)', balance: 0, color: '#F7941D', provider: 'nagad' },
      { id: 'w3', name: 'রকেট (Rocket)', balance: 0, color: '#8C3494', provider: 'rocket' },
      { id: 'w4', name: 'উপায় (Upay)', balance: 0, color: '#FFCC00', provider: 'upay' }
    ];
    if (!savedWallets) localStorage.setItem(walletKey, JSON.stringify(walletList));
    setWallets(walletList);
    
    return { txs, lnList, walletList };
  }, []);

  const fetchAIAdvice = useCallback(async (currentTxs: Transaction[], currentLoans: Loan[]) => {
    if (isLoadingAI) return;
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const insight = await getFinancialInsights(currentTxs, currentLoans);
      setAiInsight(insight);
    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED') {
        setAiError("এআই-এর ফ্রি ব্যবহারের সীমা অতিক্রম হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      } else if (error.message === 'KEY_REQUIRED') {
        setAiError("এআই ব্যবহারের জন্য সঠিক API Key প্রয়োজন।");
      } else {
        setAiError("দুঃখিত, পরামর্শ লোড করা সম্ভব হয়নি।");
      }
    } finally {
      setIsLoadingAI(false);
    }
  }, [isLoadingAI]);

  useEffect(() => {
    const { txs, lnList } = loadLocalData();
    if (txs.length > 0 || lnList.length > 0) {
      fetchAIAdvice(txs, lnList);
    } else {
      setAiInsight({ text: "স্বাগতম! আপনার হিসাব যোগ করা শুরু করুন, আমি আপনার লেনদেন পর্যবেক্ষণ করে চমৎকার সব পরামর্শ দেব।", sources: [] });
    }

    const handleStorage = () => {
      loadLocalData();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadLocalData, fetchAIAdvice]);

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const mainBalance = totalIncome - totalExpense;
  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const chartData = [
    { name: UI_LABELS.INCOME, value: totalIncome, color: '#10b981' },
    { name: UI_LABELS.EXPENSE, value: totalExpense, color: '#f43f5e' },
  ];

  const handleUpdateWallet = (id: string, newBalance: number) => {
    const updated = wallets.map(w => w.id === id ? { ...w, balance: newBalance } : w);
    setWallets(updated);
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    localStorage.setItem(`wallets_${userEmail}`, JSON.stringify(updated));
    setEditingWalletId(null);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    const txKey = `transactions_${userEmail}`;
    const savedTxs = localStorage.getItem(txKey);
    const currentTxs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];
    const updated = [newTx, ...currentTxs];
    localStorage.setItem(txKey, JSON.stringify(updated));
    setTransactions(updated);
    setActiveFormType(null);
    setShowTypeSelector(false);
    window.dispatchEvent(new Event('storage'));
  };

  const getProviderIcon = (provider: string) => {
    const logos: Record<string, string> = {
      bkash: 'https://freelogopng.com/images/all_img/1679248791bkash-logo-transparent.png',
      nagad: 'https://freelogopng.com/images/all_img/1679248722nagad-logo-png.png',
      rocket: 'https://freelogopng.com/images/all_img/1679249054rocket-logo-png.png',
      upay: 'https://freelogopng.com/images/all_img/1679249117upay-logo-png.png'
    };
    return (
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-sm bg-white overflow-hidden shrink-0">
        <img src={logos[provider] || ''} alt={provider} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-indigo-100 shrink-0">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">আসসালামু আলাইকুম, {userName}! 👋</h1>
            <p className="text-slate-500 font-medium mt-1">আপনার ফিন্যান্সিয়াল ড্যাশবোর্ড এখন একদম পরিষ্কার।</p>
          </div>
        </div>
        <button 
          onClick={() => setShowTypeSelector(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span>নতুন এন্ট্রি যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={UI_LABELS.BALANCE} 
          value={`${currency} ${mainBalance.toLocaleString('bn-BD')}`} 
          trend="মোট সঞ্চয়" 
          trendType={mainBalance >= 0 ? 'up' : 'down'} 
          icon={<WalletIcon className="text-indigo-600" />} 
          colorClass="bg-indigo-50" 
        />
        
        <div 
          onClick={() => setShowWalletModal(true)}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden active:scale-95"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">মোবাইল ব্যাংকিং</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {currency} {totalWalletBalance.toLocaleString('bn-BD')}
              </h3>
              <p className="text-[10px] mt-2 font-black text-pink-600 flex items-center gap-1 uppercase tracking-widest">
                ব্যালেন্স দেখুন <ChevronRight size={12} />
              </p>
            </div>
            <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
              <Smartphone size={24} />
            </div>
          </div>
        </div>

        <StatCard label={`মোট ${UI_LABELS.INCOME}`} value={`${currency} ${totalIncome.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="up" icon={<TrendingUp className="text-emerald-600" />} colorClass="bg-emerald-50" />
        <StatCard label={`মোট ${UI_LABELS.EXPENSE}`} value={`${currency} ${totalExpense.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="down" icon={<TrendingDown className="text-rose-600" />} colorClass="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800">আয় এবং ব্যয়ের তুলনা</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800">সাম্প্রতিক লেনদেন</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'INCOME' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-slate-900 truncate">{t.category}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{t.date}</p>
                  </div>
                </div>
                <p className={`font-black text-sm shrink-0 ml-2 ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-12 text-center">
                 <p className="text-slate-300 font-bold italic">কোনো লেনদেন নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative group pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white px-4 py-1 border border-slate-100 rounded-full shadow-sm z-10 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
          <BrainCircuit size={12} />
          Auto Insights
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
        <div className="relative bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl ring-4 ring-indigo-50 transition-all duration-700 ${isLoadingAI ? 'bg-slate-200 animate-pulse' : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-200'}`}>
                <Sparkles size={32} className={isLoadingAI ? 'animate-spin' : 'animate-bounce-slow'} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">স্মার্ট এআই এসিস্ট্যান্ট</h2>
                <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLoadingAI ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                  {isLoadingAI ? 'আপনার তথ্য নিয়ে গবেষণা চলছে...' : 'হিসাব পর্যবেক্ষণ করা হয়েছে'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => fetchAIAdvice(transactions, loans)}
              disabled={isLoadingAI}
              title="রিফ্রেশ করুন"
              className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-30"
            >
              <RefreshCw size={22} className={isLoadingAI ? 'animate-spin' : ''} />
            </button>
          </div>

          {isLoadingAI && !aiInsight ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 tracking-tight">আপনার জন্য সেরা পরামর্শ খোঁজা হচ্ছে</p>
                <p className="text-sm text-slate-400 font-medium">আমরা বর্তমান বাজার পরিস্থিতি সার্চ করছি</p>
              </div>
            </div>
          ) : aiError ? (
            <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                <X size={24} />
              </div>
              <div>
                <p className="text-lg tracking-tight">পরামর্শ তৈরি করা যায়নি</p>
                <p className="text-sm opacity-80">{aiError}</p>
              </div>
            </div>
          ) : aiInsight ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
              <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 shadow-inner relative overflow-hidden">
                <div className="prose prose-slate max-w-none">
                  <div className={`whitespace-pre-line text-slate-700 font-medium leading-loose text-lg transition-opacity duration-300 ${isLoadingAI ? 'opacity-50' : 'opacity-100'}`}>
                    {aiInsight.text}
                  </div>
                </div>
              </div>

              {aiInsight.sources && aiInsight.sources.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">তথ্যসূত্র (Sources):</p>
                  <div className="flex flex-wrap gap-3">
                    {aiInsight.sources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                      >
                        <ExternalLink size={12} />
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {showWalletModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white relative">
              <button onClick={() => setShowWalletModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
              <p className="text-indigo-200 font-black uppercase tracking-widest text-xs mb-1">ডিজিটাল ওয়ালেটসমূহ</p>
              <h2 className="text-3xl font-black mb-1">মোবাইল ব্যাংকিং</h2>
              <div className="flex items-center gap-2 mt-4 bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/20">
                <p className="text-xl font-black tracking-tight">{currency} {totalWalletBalance.toLocaleString('bn-BD')}</p>
              </div>
            </div>
            
            <div className="p-8 space-y-4 bg-slate-50/50 max-h-[400px] overflow-y-auto">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                    {getProviderIcon(wallet.provider)}
                    <div className="flex flex-col">
                      <h4 className="font-black text-slate-800 text-sm">{wallet.name}</h4>
                      {editingWalletId === wallet.id ? (
                        <div className="flex items-center gap-2 mt-2">
                           <input autoFocus type="number" className="w-28 px-3 py-1.5 bg-slate-50 border border-indigo-200 rounded-xl text-sm font-black outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                           <button onClick={() => handleUpdateWallet(wallet.id, parseFloat(editValue) || 0)} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"><Save size={16} /></button>
                        </div>
                      ) : (
                        <p className="text-lg font-black" style={{ color: wallet.color }}>{currency} {wallet.balance.toLocaleString('bn-BD')}</p>
                      )}
                    </div>
                  </div>
                  {editingWalletId !== wallet.id && (
                    <button onClick={() => { setEditingWalletId(wallet.id); setEditValue(wallet.balance.toString()); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={18} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-8 bg-white pt-0 mt-4">
               <button onClick={() => setShowWalletModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm w-full animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">লেনদেনের ধরন</h2>
              <button onClick={() => setShowTypeSelector(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveFormType('INCOME')} className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                <div className="text-left"><p className="font-black text-emerald-900 text-lg">আয় (Income)</p><p className="text-xs text-emerald-600 font-bold">টাকা যোগ হবে</p></div>
              </button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group">
                <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
                <div className="text-left"><p className="font-black text-rose-900 text-lg">ব্যয় (Expense)</p><p className="text-xs text-rose-600 font-bold">টাকা বিয়োগ হবে</p></div>
              </button>
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
