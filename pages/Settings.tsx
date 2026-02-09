import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Save, CheckCircle2, Camera, Trash2, ShieldCheck, Banknote, AlertTriangle, RotateCcw } from 'lucide-react';
import { UI_LABELS, SUPPORTED_CURRENCIES } from '../constants';

export const SettingsPage: React.FC = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('currentUserEmail') || '');
  const [profile, setProfile] = useState({
    name: 'ইউজার',
    email: '',
    phone: '',
    currency: '৳',
    isProfileComplete: true
  });

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('currentUserEmail') || '';
    if (email) {
      setUserEmail(email);
      const profileKey = `profile_${email}`;
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile(prev => ({ ...prev, email, isProfileComplete: true }));
      }
      setProfilePic(localStorage.getItem(`profilePic_${email}`));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const profileKey = `profile_${userEmail}`;
    
    // Always ensure isProfileComplete is true when saving from settings
    const updatedProfile = { ...profile, isProfileComplete: true };
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    
    if (profilePic) {
      localStorage.setItem(`profilePic_${userEmail}`, profilePic);
    } else {
      localStorage.removeItem(`profilePic_${userEmail}`);
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleResetData = () => {
    const isConfirmed = window.confirm("আপনি কি নিশ্চিত? এটি আপনার আয়, ব্যয় এবং লোনের সকল হিসেব মুছে ০ করে ফেলবে।");
    if (isConfirmed) {
      localStorage.removeItem(`transactions_${userEmail}`);
      localStorage.removeItem(`loans_${userEmail}`);
      localStorage.removeItem(`wallets_${userEmail}`);
      
      alert("সফলভাবে সব হিসাব পরিষ্কার করা হয়েছে।");
      window.location.reload();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{UI_LABELS.SETTINGS}</h1>
        <p className="text-slate-500 font-medium">আপনার প্রোফাইল এবং ব্যক্তিগত তথ্য ম্যানেজ করুন।</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        {saved && (
          <div className="absolute top-0 left-0 w-full bg-emerald-500 text-white py-3 flex items-center justify-center gap-2 z-10">
            <CheckCircle2 size={18} /> <span className="font-bold">সফলভাবে সংরক্ষিত!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-50">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <User size={48} className="text-indigo-200" />}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-indigo-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Camera size={24} /> <span className="text-[10px] font-black mt-1 uppercase">বদলান</span>
                </button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">ইমেইল এড্রেস (অ্যাকাউন্ট ইমেইল)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  readOnly
                  className="w-full pl-12 pr-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none text-slate-400 cursor-not-allowed font-medium" 
                  value={userEmail} 
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold ml-1 italic">* এটি পরিবর্তনযোগ্য নয় এবং সকল তথ্য এই ইমেইলে সংরক্ষিত।</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="tel" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="০১XXXXXXXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">কারেন্সি</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
                  {SUPPORTED_CURRENCIES.map(curr => <option key={curr.code} value={curr.symbol}>{curr.label} ({curr.symbol})</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <RotateCcw size={14} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98]">
            <Save size={22} /> <span>পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </form>
      </div>

      <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
        <div className="flex items-center gap-3 text-rose-600"><AlertTriangle size={24} /><h2 className="text-xl font-black uppercase tracking-tight">ডেঞ্জার জোন</h2></div>
        <p className="text-sm text-rose-600/70 font-bold ml-1 leading-relaxed">সাবধান! নিচের বাটনে ক্লিক করলে এই ইমেইলে থাকা সকল জমানো হিসাব পাকাপাকিভাবে মুছে যাবে।</p>
        <button onClick={handleResetData} className="w-full bg-white border-2 border-rose-200 text-rose-600 font-black py-4 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3">
          <RotateCcw size={20} /> সব ডেটা মুছুন
        </button>
      </div>
    </div>
  );
};