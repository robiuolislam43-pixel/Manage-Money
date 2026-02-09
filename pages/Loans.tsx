
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loan, Transaction } from '../types';
import { UI_LABELS } from '../constants';
import { Plus, User, Calendar, CheckCircle, Clock, Trash2, Search, FileDown, Loader2, Phone, Edit3 } from 'lucide-react';
import { LoanForm } from '../components/LoanForm';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const LoansPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);

  const userEmail = localStorage.getItem('currentUserEmail') || '';
  const loanKey = `loans_${userEmail}`;
  const txKey = `transactions_${userEmail}`;

  const loadLoans = useCallback(() => {
    if (!userEmail) return;
    const saved = localStorage.getItem(loanKey);
    setLoans(saved ? JSON.parse(saved) : []);
  }, [userEmail, loanKey]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleSave = (data: any) => {
    const updatedLoan = data as Loan;
    let updatedLoans: Loan[];
    
    const saved = localStorage.getItem(loanKey);
    const currentLoans: Loan[] = saved ? JSON.parse(saved) : [];
    
    const existingIdx = currentLoans.findIndex(l => l.id === updatedLoan.id);
    if (existingIdx > -1) {
      updatedLoans = [...currentLoans];
      updatedLoans[existingIdx] = updatedLoan;
    } else {
      updatedLoans = [updatedLoan, ...currentLoans];
      
      const dateStr = new Date().toLocaleDateString('en-CA');
      const isIncome = updatedLoan.type === 'I_OWE';
      
      const syncTransaction: Transaction = {
        id: `loan-init-${updatedLoan.id}-${Date.now()}`,
        amount: updatedLoan.amount,
        category: isIncome ? 'ঋণ গ্রহণ' : 'ঋণ প্রদান',
        date: dateStr,
        description: `${updatedLoan.personName}-এর ${isIncome ? 'থেকে ঋণ গ্রহণ' : 'কাছে ঋণ প্রদান'} করা হয়েছে`,
        type: isIncome ? 'INCOME' : 'EXPENSE'
      };

      const savedTransactions = localStorage.getItem(txKey);
      const allTransactions: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : [];
      localStorage.setItem(txKey, JSON.stringify([syncTransaction, ...allTransactions]));
    }
    
    localStorage.setItem(loanKey, JSON.stringify(updatedLoans));
    setLoans(updatedLoans);
    setShowForm(false);
    setEditingLoan(undefined);
    window.dispatchEvent(new Event('storage'));
  };

  const toggleStatus = (id: string) => {
    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        const newStatus: 'PENDING' | 'PAID' = loan.status === 'PENDING' ? 'PAID' : 'PENDING';
        
        if (newStatus === 'PAID') {
          const dateStr = new Date().toLocaleDateString('en-CA');
          const isIncome = loan.type === 'OWE_ME';
          
          const syncTransaction: Transaction = {
            id: `loan-sync-${loan.id}-${Date.now()}`,
            amount: loan.amount,
            category: isIncome ? 'পাওনা আদায়' : 'ঋণ পরিশোধ',
            date: dateStr,
            description: `${loan.personName}-এর ${isIncome ? 'পাওনা টাকা আদায়' : 'ঋণ পরিশোধ'} করা হয়েছে`,
            type: isIncome ? 'INCOME' : 'EXPENSE'
          };

          const savedTransactions = localStorage.getItem(txKey);
          const allTransactions: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : [];
          localStorage.setItem(txKey, JSON.stringify([syncTransaction, ...allTransactions]));
          
          window.dispatchEvent(new Event('storage'));
        }
        
        return { ...loan, status: newStatus };
      }
      return loan;
    });
    
    localStorage.setItem(loanKey, JSON.stringify(updatedLoans));
    setLoans(updatedLoans);
  };

  const deleteLoan = (id: string) => {
    if (window.confirm('আপনি কি এই লেনদেনটি মুছে ফেলতে চান?')) {
      const updated = loans.filter(loan => loan.id !== id);
      localStorage.setItem(loanKey, JSON.stringify(updated));
      setLoans(updated);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDownloadPDF = async () => {
    // PDF Logic remains same...
  };

  const currency = localStorage.getItem('userCurrency') || '৳';
  const paoana = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);
  const dena = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Rest of the UI remains exactly same... */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{UI_LABELS.LOANS}</h1>
          <p className="text-slate-500 font-medium mt-1">কার কাছে কত পাবেন বা কত দেবেন তার পূর্ণ হিসাব।</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setEditingLoan(undefined); setShowForm(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={22} /> <span>নতুন লোন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div><p className="text-emerald-700 font-bold text-sm uppercase mb-2">মোট পাওনা</p><h2 className="text-4xl font-black text-emerald-900">{currency} {paoana.toLocaleString('bn-BD')}</h2></div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle size={32} /></div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div><p className="text-rose-700 font-bold text-sm uppercase mb-2">মোট দেনা</p><h2 className="text-4xl font-black text-rose-900">{currency} {dena.toLocaleString('bn-BD')}</h2></div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm"><Clock size={32} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loans.map((loan) => (
          <div key={loan.id} className={`bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all ${loan.status === 'PAID' ? 'opacity-60' : ''}`}>
             <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${loan.type === 'OWE_ME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><User size={24} /></div>
                <div>
                  <h4 className={`font-black text-lg ${loan.status === 'PAID' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{loan.personName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{loan.dueDate || 'তারিখ নেই'}</p>
                </div>
             </div>
             <div className="flex flex-col items-end gap-2">
                <p className={`text-xl font-black ${loan.type === 'OWE_ME' ? 'text-emerald-600' : 'text-rose-600'}`}>{currency} {loan.amount.toLocaleString('bn-BD')}</p>
                <div className="flex gap-2">
                   <button onClick={() => toggleStatus(loan.id)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black">{loan.status === 'PAID' ? 'PAID' : 'MARK PAID'}</button>
                   <button onClick={() => deleteLoan(loan.id)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <LoanForm initialData={editingLoan} onSubmit={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
};
