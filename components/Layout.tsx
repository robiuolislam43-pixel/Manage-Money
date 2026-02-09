
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, Settings, LogOut, ChevronDown, Camera, Phone } from 'lucide-react';
import { NAV_ITEMS, UI_LABELS } from '../constants';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  const [userData, setUserData] = useState({
    name: 'ইউজার',
    email: '',
  });

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncProfile = () => {
      const userEmail = localStorage.getItem('currentUserEmail') || '';
      if (userEmail) {
        const savedProfile = localStorage.getItem(`profile_${userEmail}`);
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          setUserData({ name: p.name, email: p.email });
        } else {
          setUserData({ name: 'ইউজার', email: userEmail });
        }
        setProfilePic(localStorage.getItem(`profilePic_${userEmail}`));
      }
    };

    syncProfile();
    window.addEventListener('storage', syncProfile);
    return () => window.removeEventListener('storage', syncProfile);
  }, []);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Hind_Siliguri']">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-all duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
            <Logo size="sm" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-indigo-900 tracking-tight leading-none">{UI_LABELS.APP_NAME}</h1>
              <p className="text-[10px] text-indigo-500 font-bold mt-1">Smart Finance</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.id} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button onClick={handleLogoutClick} className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-600 rounded-2xl transition-all font-medium"><LogOut size={20} /><span>লগআউট</span></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 z-30">
          <button className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-6 border-l border-slate-200 hover:opacity-80 transition-all outline-none">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px]">{userData.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{userData.email}</p>
                </div>
                <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden border border-indigo-200 shadow-sm text-indigo-600">
                  {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : <User size={24} />}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 p-3 animate-in fade-in duration-200 z-50">
                  <div className="px-2 py-2 border-b border-slate-50 mb-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{userData.name}</p>
                    <p className="text-xs text-slate-400 truncate">{userData.email}</p>
                  </div>
                  <button onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} className="flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:bg-indigo-50 rounded-xl transition-all text-sm font-medium"><Settings size={18} /><span>সেটিংস</span></button>
                  <button onClick={handleLogoutClick} className="flex items-center gap-3 w-full px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-bold mt-1"><LogOut size={18} /><span>লগআউট</span></button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};
