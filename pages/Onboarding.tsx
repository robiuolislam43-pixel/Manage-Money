
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, CheckCircle2, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { UI_LABELS } from '../constants';
import { syncService } from '../services/syncService';
import { supabase } from '../services/supabase';

export const OnboardingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('currentUserEmail') || '';

  useEffect(() => {
    if (!userEmail) navigate('/login');
    
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const cloudData = await syncService.pullAllData(session.user.id);
        if (cloudData?.profile?.isProfileComplete) {
          await syncService.restoreToLocalStorage(userEmail, cloudData);
          navigate('/');
        }
      }
    };
    checkProfile();
  }, [userEmail, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const profileData = {
        name: name.trim(),
        phone: phone.trim(),
        email: userEmail,
        currency: '৳',
        isProfileComplete: true
      };
      
      // Save locally
      localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profileData));
      localStorage.setItem('userCurrency', '৳');
      
      // Save to Cloud
      await syncService.upsertProfile(session.user.id, profileData);
      
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("তথ্য সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
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
                  <Loader2 size={24} className="animate-spin" />
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
