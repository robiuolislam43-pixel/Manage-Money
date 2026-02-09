import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const [currency, setCurrency] = useState('৳');

  useEffect(() => {
    const syncCurrency = () => {
      const email = localStorage.getItem('currentUserEmail');
      if (email) {
        const profile = JSON.parse(localStorage.getItem(`profile_${email}`) || '{}');
        setCurrency(profile.currency || '৳');
      }
    };
    syncCurrency();
    window.addEventListener('storage', syncCurrency);
    return () => window.removeEventListener('storage', syncCurrency);
  }, []);

  const containerSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };
  
  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 40
  };

  const rounding = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-[2rem]'
  };

  return (
    <div className={`relative flex items-center justify-center ${containerSizes[size]} ${className}`}>
      <div className={`absolute inset-0 bg-indigo-600 ${rounding[size]} rotate-6 opacity-10 animate-pulse`}></div>
      <div className={`absolute inset-0 bg-indigo-500 ${rounding[size]} -rotate-3 opacity-20`}></div>
      
      <div className={`relative ${containerSizes[size]} bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-400 ${rounding[size]} flex items-center justify-center text-white shadow-xl shadow-indigo-200 border border-white/20`}>
        <div className="absolute inset-0 bg-white/10 opacity-50"></div>
        
        <div className="relative z-10 flex items-center justify-center">
          <Coins size={iconSizes[size]} strokeWidth={2.5} className="drop-shadow-md" />
          
          <div className={`absolute -bottom-1 -right-1 bg-amber-400 text-indigo-900 font-bold rounded-full border-2 border-white flex items-center justify-center
            ${size === 'lg' ? 'w-8 h-8 text-lg' : size === 'md' ? 'w-5 h-5 text-[10px]' : 'w-4 h-4 text-[8px]'}
          `}>
            {currency}
          </div>
        </div>
      </div>
    </div>
  );
};