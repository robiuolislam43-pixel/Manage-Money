
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StatCard } from '../components/StatCard';
import { UI_LABELS } from '../constants';
import { 
  TrendingUp, TrendingDown, Wallet as WalletIcon, Plus, User, X, 
  ArrowUpRight, ArrowDownLeft, Smartphone, ChevronRight,
  TrendingUp as UpIcon, BrainCircuit, Loader2, RefreshCw, AlertCircle, ExternalLink, Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, Loan, TransactionType, Wallet, AIInsight } from '../types';
import { TransactionForm } from '../components/TransactionForm';
import { getFinancialInsights } from '../services/geminiService';
import { syncService } from '../services/syncService';

export const Dashboard: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState('ইউজার');
  const [currency, setCurrency] = useState('৳');
  
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TransactionType | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // AI States
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastAnalyzedHash = useRef<string>('');
  const aiTimeoutRef = useRef<number | null>(null);

  const loadLocalData = useCallback(() => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return;

    const profileKey = `profile_${userEmail}`;
    const savedProfile = localStorage.getItem(profileKey);
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setUserName(p.name || 'ইউজার');
      setCurrency(p.currency || '৳');
    }
    setProfilePic(localStorage.getItem(`profilePic_${userEmail}`));

    const txKey = `transactions_${userEmail}`;
    const loanKey = `loans_${userEmail}`;
    const walletKey = `wallets_${userEmail}`;

    // Load and deduplicate transactions
    const savedTxs = localStorage.getItem(txKey);
    let txs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];
    // DEDUPLICATION: Ensure no duplicate IDs
    txs = Array.from(new Map(txs.map(item => [item.id, item])).values());
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);

    // Load and deduplicate loans
    const savedLoans = localStorage.getItem(loanKey);
    let lnList: Loan[] = savedLoans ? JSON.parse(savedLoans) : [];
    lnList = Array.from(new Map(lnList.map(item => [item.id, item])).values());
    setLoans(lnList);

    const savedWallets = localStorage.getItem(walletKey);
    const walletList: Wallet[] = savedWallets ? JSON.parse(savedWallets) : [
      { id: 'w1', name: 'বিকাশ (bKash)', balance: 0, color: '#D2358D', provider: 'bkash' },
      { id: 'w2', name: 'নগদ (Nagad)', balance: 0, color: '#F7941D', provider: 'nagad' },
      { id: 'w3', name: 'রকেট (Rocket)', balance: 0, color: '#8C3494', provider: 'rocket' },
      { id: 'w4', name: 'উপায় (Upay)', balance: 0, color: '#FFCC00', provider: 'upay' }
    ];
    setWallets(walletList);

    // Sync back to Supabase only if needed
    syncService.syncAllData(userEmail, { transactions: txs, loans: lnList, wallets: walletList });
  }, []);

  const triggerAI = useCallback(async (txs: Transaction[], lnList: Loan[]) => {
    const currentSum = txs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const currentHash = `${txs.length}-${lnList.length}-${currentSum}`;
    
    if (currentHash === lastAnalyzedHash.current) return;

    setIsLoadingAI(true);
    setAiError(null);
    
    try {
      const insight = await getFinancialInsights(txs, lnList);
      setAiInsight(insight);
      lastAnalyzedHash.current = currentHash;
    } catch (error) {
      console.error("AI Error:", error);
      setAiError("আপনার তথ্য অনুযায়ী পরামর্শ তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
    const handleStorage = () => loadLocalData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadLocalData]);

  useEffect(() => {
    if (transactions.length > 0 || loans.length > 0) {
      if (aiTimeoutRef.current) window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = window.setTimeout(() => {
        triggerAI(transactions, loans);
      }, 5000);
    } else {
      setAiInsight({ text: "স্বাগতম! আপনার আয়ের ও খরচের হিসাব যোগ করা শুরু করলে আমি আপনাকে সঠিক ফিন্যান্সিয়াল পরামর্শ দিতে পারব।", sources: [] });
    }
    return () => {
      if (aiTimeoutRef.current) window.clearTimeout(aiTimeoutRef.current);
    };
  }, [transactions, loans, triggerAI]);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
  const mainBalance = totalIncome - totalExpense;
  const totalWalletBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  const chartData = useMemo(() => [
    { name: UI_LABELS.INCOME, value: totalIncome, color: '#10b981' },
    { name: UI_LABELS.EXPENSE, value: totalExpense, color: '#f43f5e' },
  ], [totalIncome, totalExpense]);

  const savingsRate = totalIncome > 0 ? ((mainBalance / totalIncome) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl shadow-indigo-100 shrink-0 transform hover:scale-105 transition-transform duration-500">
            {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <User size={36} className="text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">আসসালামু আলাইকুম, {userName}!</h1>
               <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Safe Sync</span>
               </div>
            </div>
            <p className="text-slate-500 font-medium mt-1">আপনার ফিন্যান্সিয়াল সিকিউরিটি আমাদের অগ্রাধিকার।</p>
          </div>
        </div>
        <button 
          onClick={() => setShowTypeSelector(true)} 
          className="group relative overflow-hidden bg-indigo-600 text-white px-8 py-4.5 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={22} strokeWidth={3} className="inline mr-2 group-hover:rotate-90 transition-transform duration-500" />
          <span>নতুন এন্ট্রি যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={UI_LABELS.BALANCE} value={`${currency} ${mainBalance.toLocaleString('bn-BD')}`} trend={`সঞ্চয় হার ${savingsRate}%`} trendType={Number(savingsRate) >= 20 ? 'up' : 'down'} icon={<WalletIcon className="text-indigo-600" />} colorClass="bg-indigo-50" />
        <div onClick={() => setShowWalletModal(true)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group active:scale-95 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"><Smartphone size={100} /></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">মোবাইল ব্যাংকিং</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currency} {totalWalletBalance.toLocaleString('bn-BD')}</h3>
              <p className="text-[10px] mt-2 font-black text-pink-600 flex items-center gap-1 uppercase tracking-widest">ওয়ালেট দেখুন <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /></p>
            </div>
            <div className="p-3 rounded-xl bg-pink-50 text-pink-600 group-hover:scale-110 transition-transform"><Smartphone size={24} /></div>
          </div>
        </div>
        <StatCard label={`মোট ${UI_LABELS.INCOME}`} value={`${currency} ${totalIncome.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="up" icon={<TrendingUp className="text-emerald-600" />} colorClass="bg-emerald-50" />
        <StatCard label={`মোট ${UI_LABELS.EXPENSE}`} value={`${currency} ${totalExpense.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="down" icon={<TrendingDown className="text-rose-600" />} colorClass="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800">আয় এবং ব্যয়ের তুলনা</h3>
          </div>
          <div className="w-full" style={{ height: '380px', minHeight: '380px' }}>
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#94a3b8', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} />
                  <Bar dataKey="value" radius={[16, 16, 0, 0]} barSize={80}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">চার্ট দেখানোর জন্য পর্যাপ্ত তথ্য নেই।</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-7 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800">সাম্প্রতিক লেনদেন</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all cursor-default group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'INCOME' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-slate-900 truncate">{t.category}</p>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest">{t.date}</p>
                  </div>
                </div>
                <p className={`font-black text-base ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {currency} {(Number(t.amount) || 0).toLocaleString('bn-BD')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative group pt-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/90 backdrop-blur-2xl p-8 lg:p-12 rounded-[3rem] border border-white shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl transform group-hover:rotate-6 transition-transform duration-500`}><BrainCircuit size={40} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">ম্যানেজ মানি এআই এসিস্ট্যান্ট</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLoadingAI ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
                {isLoadingAI ? 'অ্যানালাইসিস চলছে...' : 'ইনসাইটস আপ-টু-ডেট'}
              </p>
            </div>
            {!isLoadingAI && <button onClick={() => { lastAnalyzedHash.current = ''; triggerAI(transactions, loans); }} className="md:ml-auto flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl font-black transition-all group/refresh"><RefreshCw size={18} /> <span>রিফ্রেশ</span></button>}
          </div>
          <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 lg:p-12 min-h-[220px] shadow-inner relative overflow-hidden">
            {isLoadingAI ? <div className="flex flex-col items-center py-12 gap-6"><Loader2 className="animate-spin text-indigo-600" size={48} /><p className="text-slate-500 font-black animate-pulse text-sm uppercase tracking-widest">বিশ্লেষণ করা হচ্ছে...</p></div> : aiError ? <div className="flex flex-col items-center py-10 text-center gap-5"><AlertCircle className="text-rose-500" size={48} /><p className="text-slate-600 font-bold max-w-sm text-lg">{aiError}</p></div> : <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000"><p className="whitespace-pre-line text-slate-700 font-medium leading-[2] text-lg lg:text-xl">{aiInsight?.text || "আপনার বর্তমান লেনদেন পর্যবেক্ষণ করা হচ্ছে..."}</p></div>}
          </div>
        </div>
      </div>

      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-slate-900 tracking-tight">মোবাইল ওয়ালেটস</h2><button onClick={() => setShowWalletModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><X size={24} /></button></div>
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:bg-white hover:shadow-lg transition-all">
                   <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-sm transform group-hover:rotate-6 transition-transform" style={{ backgroundColor: wallet.color }}>{wallet.provider.toUpperCase()}</div><div><p className="font-black text-slate-800">{wallet.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Smart Wallet</p></div></div>
                   <div className="text-right"><p className="font-black text-lg text-slate-900">{currency} {wallet.balance.toLocaleString('bn-BD')}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-sm w-full animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-slate-900 tracking-tight">লেনদেনের ধরন</h2><button onClick={() => setShowTypeSelector(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><X size={24} /></button></div>
            <div className="grid grid-cols-1 gap-5">
              <button onClick={() => setActiveFormType('INCOME')} className="flex items-center gap-5 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] hover:bg-emerald-100 transition-all group active:scale-95"><div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-emerald-100"><TrendingUp size={28} /></div><div className="text-left"><p className="font-black text-emerald-900 text-xl tracking-tight">আয় (Income)</p></div></button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="flex items-center gap-5 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] hover:bg-rose-100 transition-all group active:scale-95"><div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-xl shadow-rose-100"><TrendingDown size={28} /></div><div className="text-left"><p className="font-black text-rose-900 text-xl tracking-tight">ব্যয় (Expense)</p></div></button>
            </div>
          </div>
        </div>
      )}

      {activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
          <div className="w-full max-w-md py-10">
            <TransactionForm type={activeFormType} onSubmit={(newTx) => {
                const userEmail = localStorage.getItem('currentUserEmail') || '';
                const savedTxs = localStorage.getItem(`transactions_${userEmail}`);
                const currentTxs = savedTxs ? JSON.parse(savedTxs) : [];
                // Check if already exists to prevent double push
                const filtered = currentTxs.filter((t: any) => t.id !== newTx.id);
                const updated = [newTx, ...filtered];
                localStorage.setItem(`transactions_${userEmail}`, JSON.stringify(updated));
                setTransactions(updated);
                setActiveFormType(null);
                setShowTypeSelector(false);
                window.dispatchEvent(new Event('storage'));
            }} onCancel={() => setActiveFormType(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
