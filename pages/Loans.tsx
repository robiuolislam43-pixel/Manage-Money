
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loan, Transaction } from '../types';
import { UI_LABELS } from '../constants';
import { Plus, User, Calendar, CheckCircle, Clock, Trash2, Search, FileDown, Loader2, Phone, Edit3, CheckCircle2, AlertCircle, ShieldCheck, DownloadCloud, Landmark, Shield } from 'lucide-react';
import { LoanForm } from '../components/LoanForm';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const LoansPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  const loanReportRef = useRef<HTMLDivElement>(null);

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
      setShowForm(false);
      setEditingLoan(undefined);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDownloadPDF = async () => {
    if (!loanReportRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = loanReportRef.current;
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.scrollHeight, // Fix for content clipping
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
      pdf.save(`Loan_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error generating PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const currency = localStorage.getItem('userCurrency') || '৳';
  const paoana = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);
  const dena = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);
  const userProfile = JSON.parse(localStorage.getItem(`profile_${userEmail}`) || '{}');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{UI_LABELS.LOANS}</h1>
          <p className="text-slate-500 font-medium mt-1">কার কাছে কত পাবেন বা কত দেবেন তার পূর্ণ হিসাব।</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading || loans.length === 0}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <DownloadCloud size={20} />}
            <span>লোন রিপোর্ট</span>
          </button>
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

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 px-2">ঋণ ও পাওনার তালিকা</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loans.length > 0 ? loans.map((loan) => (
            <div key={loan.id} className={`bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all ${loan.status === 'PAID' ? 'opacity-60' : ''}`}>
               <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${loan.type === 'OWE_ME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><User size={24} /></div>
                  <div className="cursor-pointer" onClick={() => { setEditingLoan(loan); setShowForm(true); }}>
                    <h4 className={`font-black text-lg ${loan.status === 'PAID' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{loan.personName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loan.dueDate || 'তারিখ নেই'}</p>
                    {loan.phoneNumber && <p className="text-[10px] text-indigo-500 font-bold mt-1 flex items-center gap-1"><Phone size={10} /> {loan.phoneNumber}</p>}
                  </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <p className={`text-xl font-black ${loan.type === 'OWE_ME' ? 'text-emerald-600' : 'text-rose-600'}`}>{currency} {loan.amount.toLocaleString('bn-BD')}</p>
                  <div className="flex gap-2">
                     <button onClick={() => toggleStatus(loan.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${loan.status === 'PAID' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                       {loan.status === 'PAID' ? 'PAID' : 'MARK PAID'}
                     </button>
                     <button onClick={() => deleteLoan(loan.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">কোনো ঋণের হিসাব পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', top: 0, left: '-100vw', width: '210mm', opacity: 0, pointerEvents: 'none', zIndex: -1000 }}>
        <div ref={loanReportRef} className="bg-white p-20 text-slate-900 relative" style={{ fontFamily: "'Hind Siliguri', sans-serif", width: '210mm' }}>
          
          <div className="absolute top-0 left-0 w-full h-6 bg-indigo-900"></div>
          
          <div className="flex justify-between items-start mb-16 pt-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                <Landmark size={40} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ম্যানেজ মানি</h1>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1">Official Loan Registry</p>
              </div>
            </div>

            <div className="text-right">
              <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[2.5rem] inline-block">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Report Date</p>
                 <p className="text-xl font-black text-slate-900">{new Date().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-12 rounded-[3.5rem] mb-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
             <div className="grid grid-cols-2 gap-10 relative z-10">
                <div className="border-l-4 border-amber-400 pl-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lending Profile</p>
                  <h3 className="text-2xl font-black text-white">{userProfile.name || 'সম্মানিত গ্রাহক'}</h3>
                  <p className="text-sm text-slate-400 font-bold mt-1">{userEmail}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Report Summary</p>
                   <p className="text-xs text-white/50 font-bold">Total entries: {loans.length}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-16">
            <div className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[3rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 relative z-10">Total Receivable (পাওনা)</p>
              <p className="text-4xl font-black text-emerald-900 relative z-10">{currency} {paoana.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] relative overflow-hidden">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 relative z-10">Total Payable (দেনা)</p>
              <p className="text-4xl font-black text-rose-900 relative z-10">{currency} {dena.toLocaleString('bn-BD')}</p>
            </div>
          </div>

          <div className="mb-20">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 border-b-2 border-slate-50 pb-4">Detailed Loan Registry</h4>
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border-2 border-white shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${loan.type === 'OWE_ME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {loan.type === 'OWE_ME' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-xl mb-1">{loan.personName}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{loan.type === 'OWE_ME' ? 'পাওনা (Asset)' : 'দেনা (Liability)'} • {loan.dueDate || 'No Due Date'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${loan.type === 'OWE_ME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currency} {loan.amount.toLocaleString('bn-BD')}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-2 px-4 py-1.5 rounded-full inline-block ${loan.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                      {loan.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-32 pt-12 border-t-2 border-slate-100 flex justify-between items-center opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={24} className="text-amber-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest max-w-[250px] leading-relaxed">
                Authentic Digital Ledger Powered by Manage Money AI Financial Suite
              </p>
            </div>
            <p className="text-[10px] font-black text-slate-300">© {new Date().getFullYear()} MM. All Rights Reserved.</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <LoanForm 
            initialData={editingLoan} 
            onSubmit={handleSave} 
            onCancel={() => { setShowForm(false); setEditingLoan(undefined); }} 
            onDelete={deleteLoan}
          />
        </div>
      )}
    </div>
  );
};
