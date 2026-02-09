
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_LABELS } from '../constants';
import { Logo } from '../components/Logo';
import { Rocket, ArrowRight, AlertCircle, ShieldCheck, KeyRound, CloudLightning, Loader2, MailCheck, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { syncService } from '../services/syncService';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setStatusText('অথেনটিকেশন হচ্ছে...');

    try {
      if (isNewUser) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        
        if (signUpError) {
          // Handling Rate Limit specifically
          if (signUpError.message.toLowerCase().includes('rate limit')) {
            setError('আপনি খুব ঘন ঘন ইমেইল পাঠানোর চেষ্টা করছেন। দয়া করে অন্তত ১ ঘণ্টা পর আবার চেষ্টা করুন। এটি সিকিউরিটির জন্য করা হয়েছে।');
          } else {
            throw signUpError;
          }
          setLoading(false);
          return;
        }
        
        if (data.user && !data.session) {
          setSuccessMsg('আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। দয়া করে ইনবক্স (বা স্প্যাম) চেক করে লিঙ্কে ক্লিক করুন, তারপর লগইন করুন।');
          setIsNewUser(false);
          setLoading(false);
          return;
        }

        if (data.user && data.session) {
          localStorage.setItem('currentUserEmail', data.user.email!);
          onLogin();
          navigate('/onboarding');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (signInError) {
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            setError('আপনার ইমেইলটি এখনো কনফার্ম করা হয়নি। আপনার ইনবক্স চেক করে ভেরিফিকেশন লিঙ্কে ক্লিক করুন।');
          } else if (signInError.message.toLowerCase().includes('invalid login credentials')) {
            setError('ইমেইল অথবা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
          } else if (signInError.message.toLowerCase().includes('rate limit')) {
            setError('অতিরিক্ত প্রচেষ্টার কারণে লগইন সাময়িকভাবে বন্ধ। কিছুক্ষণ পর আবার চেষ্টা করুন।');
          } else {
            throw signInError;
          }
          setLoading(false);
          return;
        }
        
        if (data.user) {
          const userEmail = data.user.email!;
          localStorage.setItem('currentUserEmail', userEmail);
          
          setStatusText('মেঘ থেকে ডেটা ডাউনলোড হচ্ছে...');
          const cloudData = await syncService.pullAllData(data.user.id);
          
          if (cloudData && cloudData.profile) {
            await syncService.restoreToLocalStorage(userEmail, cloudData);
            onLogin();
            if (cloudData.profile.isProfileComplete) {
              navigate('/');
            } else {
              navigate('/onboarding');
            }
          } else {
            onLogin();
            navigate('/onboarding');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'অথেনটিকেশন ব্যর্থ হয়েছে। দয়া করে আপনার ইন্টারনেট চেক করুন।');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10 border border-white relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

        <div className="text-center mb-10">
          <div className="flex justify-center mb-6"><Logo size="lg" /></div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{UI_LABELS.APP_NAME}</h1>
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isNewUser ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              <CloudLightning size={14} /> {isNewUser ? 'Cloud Signup' : 'Cloud Login'}
            </span>
            <button onClick={() => { setIsNewUser(!isNewUser); setError(null); setSuccessMsg(null); }} className="text-xs font-bold text-indigo-500 hover:underline">
              {isNewUser ? 'পুরানো অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন ইউজার? সাইন-আপ করুন'}
            </button>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">ইমেইল এড্রেস</label>
            <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">পাসওয়ার্ড</label>
            <input type="password" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-bold animate-in shake duration-300 ${error.includes('rate limit') || error.includes('অপেক্ষা করুন') ? 'bg-amber-50 border border-amber-100 text-amber-700' : 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
              {error.includes('rate limit') || error.includes('অপেক্ষা করুন') ? <Clock size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold animate-in slide-in-from-top duration-300">
              <MailCheck size={18} className="shrink-0" />
              <span className="leading-tight">{successMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black text-lg py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70">
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 size={24} className="animate-spin" />
                <span>{statusText || 'অপেক্ষা করুন...'}</span>
              </div>
            ) : (
              <>
                {isNewUser ? <ShieldCheck size={22} /> : <Rocket size={22} />}
                <span>{isNewUser ? 'সাইন-আপ করুন' : 'লগইন করুন'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              আপনার ডেটা Supabase ক্লাউডে সুরক্ষিত। <br/> সাইন-আপ করার পর ইমেইল ভেরিফাই করা জরুরি।
            </p>
        </div>
      </div>
    </div>
  );
};
