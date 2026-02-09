
import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  HandCoins, 
  PieChart, 
  Settings, 
  LogOut,
  PlusCircle,
  Bell
} from 'lucide-react';

export const UI_LABELS = {
  APP_NAME: 'ম্যানেজ মানি',
  DASHBOARD: 'ড্যাশবোর্ড',
  INCOME: 'আয়',
  EXPENSE: 'ব্যয়',
  TRANSFERS: 'লেনদেন',
  LOANS: 'ঋণ ও পাওনা',
  ANALYTICS: 'রিপোর্ট',
  SETTINGS: 'সেটিংস',
  LOGOUT: 'লগআউট',
  ADD_NEW: 'নতুন যোগ করুন',
  NOTIFICATIONS: 'নোটিফিকেশন',
  BALANCE: 'বর্তমান ব্যালেন্স',
  RECENT_TRANSACTIONS: 'সাম্প্রতিক লেনদেন',
  SAVE: 'সংরক্ষণ করুন',
  CANCEL: 'বাতিল করুন',
  AMOUNT: 'পরিমাণ',
  CATEGORY: 'ক্যাটাগরি',
  DATE: 'তারিখ',
  DESCRIPTION: 'বিবরণ',
  PERSON_NAME: 'ব্যক্তির নাম',
  CURRENCY: localStorage.getItem('userCurrency') || '৳'
};

export const SUPPORTED_CURRENCIES = [
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka (BDT)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'SAR', symbol: 'SR', label: 'Saudi Riyal (SAR)' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { code: 'PKR', symbol: 'Rs', label: 'Pakistani Rupee (PKR)' },
];

export const CATEGORIES = {
  INCOME: ['বেতন', 'ফ্রিল্যান্সিং', 'উপহার', 'বিনিয়োগ', 'পাওনা আদায়', 'ঋণ গ্রহণ', 'অন্যান্য'],
  EXPENSE: ['খাবার', 'বাড়ি ভাড়া', 'যাতায়াত', 'শপিং', 'চিকিৎসা', 'শিক্ষা', 'বিনোদন', 'ঋণ পরিশোধ', 'ঋণ প্রদান', 'অন্যান্য']
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: UI_LABELS.DASHBOARD, icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'income', label: UI_LABELS.INCOME, icon: <TrendingUp size={20} />, path: '/income' },
  { id: 'expense', label: UI_LABELS.EXPENSE, icon: <TrendingDown size={20} />, path: '/expense' },
  { id: 'transfers', label: UI_LABELS.TRANSFERS, icon: <ArrowRightLeft size={20} />, path: '/transfers' },
  { id: 'loans', label: UI_LABELS.LOANS, icon: <HandCoins size={20} />, path: '/loans' },
  { id: 'analytics', label: UI_LABELS.ANALYTICS, icon: <PieChart size={20} />, path: '/analytics' },
  { id: 'settings', label: UI_LABELS.SETTINGS, icon: <Settings size={20} />, path: '/settings' },
];
