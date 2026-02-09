import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_LABELS } from '../constants';
import { Logo } from '../components/Logo';
import { Rocket, ArrowRight, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  // Check if email exists to toggle between Login and Signup modes
  useEffect(() => {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.includes('@')) {
      const usersDb = JSON.parse(localStorage.getItem('mm_users_db') || '{}');
      setIsNewUser(!usersDb[normalizedEmail]);
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const normalizedEmail = email.toLowerCase().trim();
    const usersDb = JSON.parse(localStorage.getItem('mm_users_db') || '{}');
    
    if (isNewUser) {
      // Sign Up Logic
      usersDb[normalizedEmail] = { password };
      localStorage.setItem('mm_users_db', JSON.stringify(usersDb));
      localStorage.setItem('currentUserEmail', normalizedEmail);
      
      // Initialize empty profile linked to email
      const profileKey = `profile_${normalizedEmail}`;
      localStorage.setItem(profileKey, JSON.stringify({
        email: normalizedEmail,
        isProfileComplete: false,
        currency: '৳'
      }));
      
      onLogin();
      navigate('/onboarding');
    } else {
      // Login Logic
      const user = usersDb[normalizedEmail];
      if (user && user.password === password) {
        localStorage.setItem('currentUserEmail', normalizedEmail);
        
        // Fetch specific profile for this email
        const profileKey = `profile_${normalizedEmail}`;
        const profileData = localStorage.getItem(profileKey);
        const profile = profileData ? JSON.parse(profileData) : {};
        
        onLogin();
        
        // Direct jump to Dashboard if profile is already done
        if (profile.isProfileComplete) {
          navigate('/');
        } else {
          navigate('/onboarding');
        }
      } else {
        setError('পাসওয়ার্ডটি সঠিক নয়! আবার চেষ্টা করুন।');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10 border border-white relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{UI_LABELS.APP_NAME}</h1>
          <div className="mt-4 flex justify-center">
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isNewUser ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              {isNewUser ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
              {isNewUser ? 'নতুন অ্যাকাউন্ট (Sign Up)' : 'লগইন (Login)'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">ইমেইল এড্রেস</label>
            <input 
              type="email"
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">পাসওয়ার্ড</label>
            <input 
              type="password"
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold animate-in shake duration-300">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-black text-lg py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 group flex items-center justify-center gap-3 active:scale-95"
          >
            {isNewUser ? <ShieldCheck size={22} /> : <Rocket size={22} />}
            <span>{isNewUser ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}</span>
            <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              আপনার সকল তথ্য সরাসরি আপনার ইমেইলের সাথে সুরক্ষিত ভাবে সেভ থাকবে।
            </p>
        </div>
      </div>
    </div>
  );
};