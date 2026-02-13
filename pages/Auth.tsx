
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  MailCheck, 
  Zap,
  Lock,
  Globe,
  UserPlus,
  LogIn
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { syncService } from '../services/syncService';

interface AuthPageProps {
  onLogin: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP';

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim();

    try {
      if (authMode === 'LOGIN') {
        setStatusText('লগইন হচ্ছে...');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('ভুল ইমেইল অথবা পাসওয়ার্ড। আবার চেষ্টা করুন।');
          }
          throw signInError;
        }

        if (data.user) {
          await handleSuccessfulAuth(data.user);
        }
      } else {
        setStatusText('একাউন্ট তৈরি হচ্ছে...');
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('এই ইমেইলটি দিয়ে অলরেডি একাউন্ট খোলা আছে। দয়া করে লগইন ট্যাব ব্যবহার করুন।');
          }
          throw signUpError;
        }

        if (data.user) {
          if (!data.session) {
            setSuccessMsg('আপনার একাউন্ট তৈরি হয়েছে। দয়া করে ইমেইল ইনবক্স চেক করুন।');
            setLoading(false);
          } else {
            await handleSuccessfulAuth(data.user);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'অথেনটিকেশন ব্যর্থ হয়েছে।');
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (user: any) => {
    const userEmail = user.email!;
    localStorage.setItem('currentUserEmail', userEmail);
    
    setStatusText('প্রোফাইল যাচাই করা হচ্ছে...');
    try {
      // Fetch all data from cloud to see if profile exists
      const cloudData = await syncService.pullAllData(user.id);
      
      if (cloudData && cloudData.profile && cloudData.profile.isProfileComplete) {
        // Profile already exists in DB, restore it locally and go to dashboard
        await syncService.restoreToLocalStorage(userEmail, cloudData);
        onLogin();
        navigate('/', { replace: true });
      } else {
        // No profile found, check local storage as backup
        const localProfile = localStorage.getItem(`profile_${userEmail}`);
        if (localProfile) {
          const p = JSON.parse(localProfile);
          if (p.isProfileComplete) {
            onLogin();
            navigate('/', { replace: true });
            return;
          }
        }
        // Truly a new user or missing profile, go to onboarding
        onLogin();
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      console.error("Auth sync error:", err);
      onLogin();
      navigate('/onboarding', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="relative">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-fuchsia-600/30 rounded-full blur-[120px] animate-pulse delay-700"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-10 relative animate-in zoom-in spin-in-12 duration-1000">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <Logo size="lg" className="relative scale-[2] drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <h1 className="text-6xl font-black text-white tracking-tighter">
                ম্যানেজ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-fuchsia-400">মানি</span>
              </h1>
              <p className="text-indigo-300 font-bold tracking-[0.5em] uppercase text-[10px]">Premium Finance Suite</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri'] relative overflow-hidden">
      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-white to-fuchsia-500 rounded-[3.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white p-8 lg:p-10 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="md" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">স্বাগতম!</h2>
            <p className="text-slate-500 font-bold mt-2 text-sm">আপনার আর্থিক হিসাবের নিরাপদ ঠিকানা</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setAuthMode('LOGIN'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${authMode === 'LOGIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LogIn size={18} /> লগইন
            </button>
            <button 
              onClick={() => { setAuthMode('SIGNUP'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${authMode === 'SIGNUP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserPlus size={18} /> নতুন একাউন্ট
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Globe size={12} className="text-indigo-500" /> ইমেইল এড্রেস
              </label>
              <input 
                type="email" 
                required 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 text-lg" 
                placeholder="example@mail.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} className="text-fuchsia-500" /> পাসওয়ার্ড
              </label>
              <input 
                type="password" 
                required 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 text-lg" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold animate-in slide-in-from-top duration-300">
                <MailCheck size={18} className="shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-900 text-white font-black text-lg py-5 rounded-2xl transition-all shadow-xl active:scale-[0.97] disabled:opacity-70 mt-4 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>{statusText}</span>
                </>
              ) : (
                <>
                  <Zap size={20} className="fill-amber-300 text-amber-300" />
                  <span>{authMode === 'LOGIN' ? 'লগইন করুন' : 'যাত্রা শুরু করুন'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Safe Cloud</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Zap size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Fast Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
