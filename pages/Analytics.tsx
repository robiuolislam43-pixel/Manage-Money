import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { UI_LABELS } from '../constants';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Calendar, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AnalyticsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<'ALL' | 'MONTH'>('ALL');
  const currency = localStorage.getItem('userCurrency') || '৳';

  useEffect(() => {
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    if (!userEmail) return;
    const saved = localStorage.getItem(`transactions_${userEmail}`);
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    if (timeRange === 'ALL') return transactions;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter(t => new Date(t.date) >= startOfMonth);
  }, [transactions, timeRange]);

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE');
    const map: Record<string, number> = {};
    expenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyTrendData = useMemo(() => {
    const months: Record<string, { month: string, income: number, expense: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { month: key, income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') months[key].income += Number(t.amount);
      else months[key].expense += Number(t.amount);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ফিন্যান্সিয়াল অ্যানালিটিকস</h1>
          <p className="text-slate-500 font-medium mt-1">আপনার ব্যয়ের ধরন এবং সঞ্চয়ের প্রবণতা বিশ্লেষণ করুন।</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setTimeRange('ALL')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${timeRange === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            সব সময়
          </button>
          <button 
            onClick={() => setTimeRange('MONTH')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${timeRange === 'MONTH' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            এই মাস
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-2">সঞ্চয় হার (Savings Rate)</p>
          <h2 className="text-5xl font-black">{savingsRate}%</h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-full bg-indigo-400/30 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, Number(savingsRate)))}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">গড় মাসিক আয়</p>
            <h2 className="text-3xl font-black text-emerald-600">{currency} {(totalIncome / (timeRange === 'ALL' ? (monthlyTrendData.length || 1) : 1)).toLocaleString('bn-BD')}</h2>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><TrendingUp size={28} /></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">গড় মাসিক ব্যয়</p>
            <h2 className="text-3xl font-black text-rose-600">{currency} {(totalExpense / (timeRange === 'ALL' ? (monthlyTrendData.length || 1) : 1)).toLocaleString('bn-BD')}</h2>
          </div>
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600"><TrendingDown size={28} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><PieIcon size={20} /></div>
            <h3 className="text-xl font-black text-slate-800">ব্যয়ের ক্যাটাগরি বিশ্লেষণ</h3>
          </div>
          <div className="h-[350px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold">পর্যাপ্ত তথ্য নেই</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-sm font-bold text-slate-600 truncate">{c.name}: {currency}{c.value.toLocaleString('bn-BD')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart3 size={20} /></div>
            <h3 className="text-xl font-black text-slate-800">আয় বনাম ব্যয় (মাসিক ট্রেন্ড)</h3>
          </div>
          <div className="h-[350px] w-full">
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <ReTooltip />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold">পর্যাপ্ত তথ্য নেই</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};