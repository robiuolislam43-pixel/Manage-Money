
import { supabase } from './supabase';

export const syncService = {
  // ১. সকল ডেটা Supabase থেকে নিয়ে আসা এবং ফ্রন্টএন্ড ফরমেটে রূপান্তর
  async pullAllData(userId: string) {
    try {
      const [
        { data: profile },
        { data: transactions },
        { data: loans },
        { data: wallets }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('loans').select('*').eq('user_id', userId),
        supabase.from('wallets').select('*').eq('user_id', userId)
      ]);

      return {
        profile: profile ? {
          ...profile,
          isProfileComplete: profile.is_profile_complete
        } : null,
        transactions: transactions || [],
        loans: (loans || []).map(l => ({
          ...l,
          personName: l.person_name,
          phoneNumber: l.phone_number,
          dueDate: l.due_date
        })),
        wallets: wallets || []
      };
    } catch (error) {
      console.error("Supabase Pull Error:", error);
      return null;
    }
  },

  // ২. ক্লাউড থেকে পাওয়া ডেটা LocalStorage-এ সেট করা
  async restoreToLocalStorage(email: string, cloudData: any) {
    if (!cloudData) return;

    if (cloudData.profile) {
      localStorage.setItem(`profile_${email}`, JSON.stringify(cloudData.profile));
      localStorage.setItem('userCurrency', cloudData.profile.currency || '৳');
    }
    
    if (cloudData.transactions && cloudData.transactions.length > 0) {
      localStorage.setItem(`transactions_${email}`, JSON.stringify(cloudData.transactions));
    }
    
    if (cloudData.loans && cloudData.loans.length > 0) {
      localStorage.setItem(`loans_${email}`, JSON.stringify(cloudData.loans));
    }
    
    if (cloudData.wallets && cloudData.wallets.length > 0) {
      localStorage.setItem(`wallets_${email}`, JSON.stringify(cloudData.wallets));
    }

    // Trigger storage event to update UI
    window.dispatchEvent(new Event('storage'));
  },

  // ৩. প্রোফাইল আপডেট বা তৈরি
  async upsertProfile(userId: string, profileData: any) {
    const dbData = {
      id: userId,
      name: profileData.name,
      phone: profileData.phone,
      currency: profileData.currency,
      is_profile_complete: profileData.isProfileComplete,
      updated_at: new Date()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(dbData);
    if (error) console.error("Profile Upsert Error:", error);
  },

  // ৪. ট্রানজেকশন সেভ করা
  async saveTransaction(userId: string, tx: any) {
    const { error } = await supabase
      .from('transactions')
      .upsert({
        id: tx.id,
        user_id: userId,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        description: tx.description,
        type: tx.type
      });
    if (error) console.error("Transaction Sync Error:", error);
  },

  // ৫. লোন সেভ করা
  async saveLoan(userId: string, loan: any) {
    const { error } = await supabase
      .from('loans')
      .upsert({
        id: loan.id,
        user_id: userId,
        person_name: loan.personName,
        phone_number: loan.phoneNumber,
        amount: loan.amount,
        type: loan.type,
        due_date: loan.dueDate,
        status: loan.status
      });
    if (error) console.error("Loan Sync Error:", error);
  },

  // ৬. ওয়ালেট সেভ করা
  async saveWallet(userId: string, wallet: any) {
    const { error } = await supabase
      .from('wallets')
      .upsert({
        id: wallet.id,
        user_id: userId,
        name: wallet.name,
        balance: wallet.balance,
        color: wallet.color,
        provider: wallet.provider
      });
    if (error) console.error("Wallet Sync Error:", error);
  },

  // ৭. সকল ডেটা সিঙ্ক করা
  async syncAllData(userId: string, data: { transactions: any[], loans: any[], wallets: any[] }) {
    try {
      let targetId = userId;
      if (!userId.includes('-')) { 
         const { data: sessionData } = await supabase.auth.getSession();
         if (sessionData.session?.user.id) {
           targetId = sessionData.session.user.id;
         }
      }

      const syncs = [
        ...data.transactions.map(tx => this.saveTransaction(targetId, tx)),
        ...data.loans.map(loan => this.saveLoan(targetId, loan)),
        ...data.wallets.map(wallet => this.saveWallet(targetId, wallet))
      ];
      await Promise.all(syncs);
    } catch (error) {
      console.error("Sync All Data Error:", error);
    }
  },

  async requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  }
};
