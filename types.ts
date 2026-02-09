
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: TransactionType;
}

export interface Loan {
  id: string;
  personName: string;
  phoneNumber?: string;
  amount: number;
  type: 'OWE_ME' | 'I_OWE';
  dueDate?: string;
  status: 'PENDING' | 'PAID';
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  provider: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'other';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  currency: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyTrend: { month: string; income: number; expense: number }[];
}

export interface AIInsight {
  text: string;
  sources: { title: string; uri: string }[];
}
