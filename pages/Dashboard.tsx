
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { UI_LABELS } from '../constants';
import { 
  TrendingUp, TrendingDown, Wallet as WalletIcon, Plus, User, X, 
  ArrowUpRight, ArrowDownLeft, Smartphone, ChevronRight, Edit3, 
  Save, Sparkles, Loader2, RefreshCw, BrainCircuit,
  Bell, Phone, CheckCircle2, ExternalLink, CloudCheck
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

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const loadLocalData = useCallback(() => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return { txs: [], lnList: [], walletList: [] };

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

    const savedTxs = localStorage.getItem(txKey);
    let txs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);

    const savedLoans = localStorage.getItem(loanKey);
    const lnList: Loan[] = savedLoans ? JSON.parse(savedLoans) : [];
    setLoans(lnList);

    const savedWallets = localStorage.getItem(walletKey);
    const walletList: Wallet[] = savedWallets ? JSON.parse(savedWallets) : [
      { id: 'w1', name: 'বিকাশ (bKash)', balance: 0, color: '#D2358D', provider: 'bkash' },
      { id: 'w2', name: 'নগদ (Nagad)', balance: 0, color: '#F7941D', provider: 'nagad' },
      { id: 'w3', name: 'রকেট (Rocket)', balance: 0, color: '#8C3494', provider: 'rocket' },
      { id: 'w4', name: 'উপায় (Upay)', balance: 0, color: '#FFCC00', provider: 'upay' }
    ];
    setWallets(walletList);

    syncService.syncAllData(userEmail, { transactions: txs, loans: lnList, wallets: walletList });
    
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
      setAiError("পরামর্শ লোড করা সম্ভব হয়নি।");
    } finally {
      setIsLoadingAI(false);
    }
  }, [isLoadingAI]);

  useEffect(() => {
    const { txs, lnList } = loadLocalData();
    if (txs.length > 0 || lnList.length > 0) {
      fetchAIAdvice(txs, lnList);
    } else {
      setAiInsight({ text: "স্বাগতম! আপনার হিসাব যোগ করা শুরু করুন, আমি চমৎকার সব পরামর্শ দেব।", sources: [] });
    }

    const handleStorage = () => loadLocalData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadLocalData, fetchAIAdvice]);

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
  const mainBalance = totalIncome - totalExpense;
  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Memoize chart data for better performance
  const chartData = useMemo(() => [
    { name: UI_LABELS.INCOME, value: totalIncome, color: '#10b981' },
    { name: UI_LABELS.EXPENSE, value: totalExpense, color: '#f43f5e' },
  ], [totalIncome, totalExpense]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-indigo-100 shrink-0">
            {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <User size={36} className="text-indigo-600" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">আসসালামু আলাইকুম, {userName}!</h1>
               <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Synced</span>
               </div>
            </div>
            <p className="text-slate-500 font-medium mt-1">আপনার ফিন্যান্সিয়াল ডেটা ক্লাউডে সুরক্ষিত আছে।</p>
          </div>
        </div>
        <button onClick={() => setShowTypeSelector(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <Plus size={22} strokeWidth={3} className="inline mr-2" />
          <span>নতুন এন্ট্রি যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={UI_LABELS.BALANCE} value={`${currency} ${mainBalance.toLocaleString('bn-BD')}`} trend="মোট সঞ্চয়" trendType={mainBalance >= 0 ? 'up' : 'down'} icon={<WalletIcon className="text-indigo-600" />} colorClass="bg-indigo-50" />
        <div onClick={() => setShowWalletModal(true)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">মোবাইল ব্যাংকিং</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currency} {totalWalletBalance.toLocaleString('bn-BD')}</h3>
              <p className="text-[10px] mt-2 font-black text-pink-600 flex items-center gap-1 uppercase tracking-widest">ব্যালেন্স দেখুন <ChevronRight size={12} /></p>
            </div>
            <div className="p-3 rounded-xl bg-pink-50 text-pink-600"><Smartphone size={24} /></div>
          </div>
        </div>
        <StatCard label={`মোট ${UI_LABELS.INCOME}`} value={`${currency} ${totalIncome.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="up" icon={<TrendingUp className="text-emerald-600" />} colorClass="bg-emerald-50" />
        <StatCard label={`মোট ${UI_LABELS.EXPENSE}`} value={`${currency} ${totalExpense.toLocaleString('bn-BD')}`} trend="সকল সময়" trendType="down" icon={<TrendingDown className="text-rose-600" />} colorClass="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm min-h-[400px]">
          <h3 className="text-xl font-black text-slate-800 mb-8">আয় এবং ব্যয়ের তুলনা</h3>
          <div className="h-[300px] w-full relative">
            {/* Added key to force re-render when data changes, and isAnimationActive={false} for instant feedback */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} key={`chart-${transactions.length}`}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80} isAnimationActive={false}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {transactions.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                <p className="text-slate-400 font-bold italic">চার্ট দেখানোর জন্য পর্যাপ্ত তথ্য নেই</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-50"><h3 className="font-black text-lg text-slate-800">সাম্প্রতিক লেনদেন</h3></div>
          <div className="divide-y divide-slate-50">
            {transactions.length > 0 ? transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'INCOME' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-slate-900 truncate">{t.category}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{t.date}</p>
                  </div>
                </div>
                <p className={`font-black text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {currency} {t.amount.toLocaleString('bn-BD')}
                </p>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">কোনো লেনদেন নেই</div>
            )}
          </div>
        </div>
      </div>

      <div className="relative group pt-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-15"></div>
        <div className="relative bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-2xl">
          <div className="flex items-center gap-5 mb-8">
            <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-xl`}>
              <BrainCircuit size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">স্মার্ট এআই এসিস্ট্যান্ট</h2>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ডেটা অ্যানালাইসিস কমপ্লিট
              </p>
            </div>
          </div>
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8">
            {isLoadingAI ? (
               <div className="flex flex-col items-center py-10 gap-4">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <p className="text-slate-500 font-bold animate-pulse text-sm">আপনার জন্য চমৎকার পরামর্শ তৈরি করছি...</p>
               </div>
            ) : (
              <>
                <p className="whitespace-pre-line text-slate-700 font-medium leading-loose text-lg">
                  {aiInsight?.text || "আপনার লেনদেন পর্যবেক্ষণ করা হচ্ছে..."}
                </p>
                {aiInsight?.sources && aiInsight.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">তথ্যসূত্র ও বিস্তারিত:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiInsight.sources.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm group/link"
                        >
                          <ExternalLink size={12} className="group-hover/link:scale-110 transition-transform" />
                          <span className="truncate max-w-[150px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showTypeSelector && !activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm w-full animate-in zoom-in">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-slate-900">লেনদেনের ধরন</h2><button onClick={() => setShowTypeSelector(false)} className="text-slate-400"><X size={24} /></button></div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveFormType('INCOME')} className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                <div className="text-left"><p className="font-black text-emerald-900 text-lg">আয় (Income)</p></div>
              </button>
              <button onClick={() => setActiveFormType('EXPENSE')} className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group">
                <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
                <div className="text-left"><p className="font-black text-rose-900 text-lg">ব্যয় (Expense)</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFormType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <TransactionForm type={activeFormType} onSubmit={(newTx) => {
              const userEmail = localStorage.getItem('currentUserEmail') || '';
              const savedTxs = localStorage.getItem(`transactions_${userEmail}`);
              const currentTxs = savedTxs ? JSON.parse(savedTxs) : [];
              const updated = [newTx, ...currentTxs];
              localStorage.setItem(`transactions_${userEmail}`, JSON.stringify(updated));
              setTransactions(updated);
              setActiveFormType(null);
              setShowTypeSelector(false);
              window.dispatchEvent(new Event('storage'));
          }} onCancel={() => setActiveFormType(null)} />
        </div>
      )}
    </div>
  );
};
