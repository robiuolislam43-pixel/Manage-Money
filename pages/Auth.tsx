
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_LABELS } from '../constants';
import { Logo } from '../components/Logo';
import { 
  Rocket, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  CloudLightning, 
  Loader2, 
  MailCheck, 
  Sparkles,
  Zap,
  Lock,
  Globe,
  Star,
  Layers
} from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  // Intro splash timer
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleMagicAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setStatusText('ম্যাজিক চেক হচ্ছে...');

    const cleanEmail = email.trim();

    try {
      // ১. প্রথমে সরাসরি লগইন করার চেষ্টা করি
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // ২. যদি লগইন ফেইল করে কারণ অ্যাকাউন্ট নেই, তবে অটোমেটিক সাইন-আপ করি
      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          setStatusText('নতুন অ্যাকাউন্ট তৈরি হচ্ছে...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });

          if (signUpError) {
            if (signUpError.message.toLowerCase().includes('rate limit')) {
              throw new Error('অতিরিক্ত প্রচেষ্টার কারণে সাময়িকভাবে বন্ধ। ১ ঘণ্টা পর চেষ্টা করুন।');
            }
            throw signUpError;
          }

          // যদি ইমেইল কনফার্মেশন অন থাকে
          if (signUpData.user && !signUpData.session) {
            setSuccessMsg('আপনার জন্য নতুন অ্যাকাউন্ট খোলা হয়েছে! দয়া করে ইমেইল ভেরিফাই করুন।');
            setLoading(false);
            return;
          }

          // সরাসরি লগইন হলে
          if (signUpData.user && signUpData.session) {
            handleSuccessfulAuth(signUpData.user);
            return;
          }
        } else {
          throw signInError;
        }
      }

      // ৩. যদি লগইন সফল হয়
      if (signInData.user) {
        handleSuccessfulAuth(signInData.user);
      }

    } catch (err: any) {
      setError(err.message || 'অথেনটিকেশন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (user: any) => {
    const userEmail = user.email!;
    localStorage.setItem('currentUserEmail', userEmail);
    
    setStatusText('ডেটা সিঙ্ক হচ্ছে...');
    const cloudData = await syncService.pullAllData(user.id);
    
    if (cloudData && cloudData.profile) {
      await syncService.restoreToLocalStorage(userEmail, cloudData);
      onLogin();
      navigate(cloudData.profile.isProfileComplete ? '/' : '/onboarding');
    } else {
      onLogin();
      navigate('/onboarding');
    }
    setLoading(false);
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="relative">
          {/* animated orbs */}
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
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-indigo-500/50"></div>
                <p className="text-indigo-300 font-bold tracking-[0.5em] uppercase text-[10px]">Premium Finance Suite</p>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-indigo-500/50"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-12 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-700">
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-300"></div>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Powering Your Wealth</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri'] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[150px]"></div>
        <div className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] bg-fuchsia-50 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-white to-fuchsia-500 rounded-[3.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white p-10 lg:p-12 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                <Logo size="md" className="relative hover:scale-110 transition-transform cursor-pointer" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">ম্যাজিক লগইন</h2>
            <p className="text-slate-500 font-bold mt-3 text-sm">এক নিমিষেই আপনার আর্থিক দুনিয়ায় প্রবেশ করুন</p>
          </div>

          <form onSubmit={handleMagicAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Globe size={12} className="text-indigo-500" /> আপনার ইমেইল
              </label>
              <input 
                type="email" 
                required 
                className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner text-lg" 
                placeholder="me@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} className="text-fuchsia-500" /> গোপন পাসওয়ার্ড
              </label>
              <input 
                type="password" 
                required 
                className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner text-lg" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-700 text-sm font-bold animate-in slide-in-from-top duration-300">
                <MailCheck size={20} className="shrink-0 mt-0.5" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full relative group/btn overflow-hidden bg-slate-900 text-white font-black text-xl py-6 rounded-[1.5rem] transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] active:scale-[0.97] disabled:opacity-70 mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-fuchsia-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 size={28} className="animate-spin" />
                    <span>{statusText || 'প্রসেস হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Zap size={24} className="fill-current text-amber-300" />
                    <span>চলুন শুরু করি</span>
                    <ArrowRight size={22} className="group-hover/btn:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-50">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Safe Cloud</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
                <Layers size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Auto Sync</span>
              </div>
            </div>
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-8 leading-relaxed">
              অ্যাকাউন্ট না থাকলে অটোমেটিক তৈরি হবে <br/> অ্যাকাউন্ট থাকলে সরাসরি লগইন
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
