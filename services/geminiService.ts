import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

/**
 * Manage Money - AI Service
 * 
 * গাইডলাইন অনুযায়ী process.env.API_KEY ব্যবহার করা হয়েছে।
 * index.html-এ প্রসেস পলিমার ব্যবহার করায় এখন এটি ব্রাউজারে ক্রাশ করবে না।
 */
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // এপিআই কি চেক করা হচ্ছে
  if (!process.env.API_KEY) {
    console.error("API_KEY is not defined in process.env");
    return { 
      text: "আপনার এআই সহকারী সক্রিয় করার জন্য 'API_KEY' প্রয়োজন। দয়া করে আপনার Vercel ড্যাশবোর্ডে গিয়ে Environment Variables এ 'API_KEY' নামে ভেরিয়েবলটি সেট করুন।",
      sources: [] 
    };
  }

  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const balance = income - expense;
  
  const categoriesMap = transactions.reduce((acc: Record<string, number>, t) => {
    if (t.type === 'EXPENSE') {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
    }
    return acc;
  }, {});
  
  const topCategories = Object.entries(categoriesMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ${amt} BDT`)
    .join(', ');

  const pendingReceivable = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const pendingPayable = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  
  const prompt = `
    Analyze this financial data for a user in Bangladesh:
    - Current Income: ${income} BDT
    - Current Expense: ${expense} BDT
    - Current Balance: ${balance} BDT
    - Highest Spending Categories: ${topCategories || 'Not available'}
    - Debts: ${pendingReceivable} BDT to receive, ${pendingPayable} BDT to pay.

    Tasks:
    1. Provide 3 specific financial advice in Bengali.
    2. Use Google Search to mention any latest inflation trends or high-interest bank schemes in Bangladesh.
    3. End with a powerful motivational quote in Bengali about financial freedom.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });
    
    const text = response.text || "এই মুহূর্তে তথ্য বিশ্লেষণ করা সম্ভব হচ্ছে না।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "আরও বিস্তারিত",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      text: "এআই সার্ভার থেকে তথ্য পেতে সমস্যা হচ্ছে। দয়া করে নিশ্চিত করুন আপনার এপিআই কি-টি সচল আছে এবং হোস্টিং প্ল্যাটফর্মে এর নাম 'API_KEY' হিসেবে সেট করা হয়েছে।",
      sources: [] 
    };
  }
};