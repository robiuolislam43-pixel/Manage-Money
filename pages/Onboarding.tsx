
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { UI_LABELS } from '../constants';

export const OnboardingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('currentUserEmail') || '';

  useEffect(() => {
    // If somehow landed here without email, go to login
    if (!userEmail) navigate('/login');
    
    // If profile already complete, go to dashboard
    const profileKey = `profile_${userEmail}`;
    const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    if (profile.isProfileComplete) navigate('/');
  }, [userEmail, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const profileKey = `profile_${userEmail}`;
    const profileData = {
      name: name.trim(),
      phone: phone.trim(),
      email: userEmail,
      currency: '৳',
      isProfileComplete: true
    };
    
    // Save to storage
    localStorage.setItem(profileKey, JSON.stringify(profileData));
    
    // Add a slight delay for better UX
    setTimeout(() => {
      setIsLoading(false);
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner">
            <Sparkles size={40} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">অভিনন্দন! 🎉</h1>
          <p className="text-slate-500 font-bold text-lg">আপনার প্রোফাইলটি সম্পূর্ণ করুন</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">আপনার পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                  placeholder="আপনার নাম লিখুন..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="tel"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                  placeholder="০১XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-black text-lg py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>সেভ হচ্ছে...</span>
                </div>
              ) : (
                <>
                  <span>যাত্রা শুরু করুন</span>
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center items-center gap-4 text-slate-400 font-bold text-sm">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
            ))}
          </div>
          <span>হাজারো ইউজার আমাদের সাথে আছেন</span>
        </div>
      </div>
    </div>
  );
};
