import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

/**
 * Manage Money - AI Service
 * 
 * জেমিনি এপিআই রুলস অনুযায়ী process.env.API_KEY ব্যবহার করা হয়েছে।
 * এপিআই কি-টি সরাসরি initialization এ ব্যবহার করা হয়েছে যা সিস্টেম রুল।
 */

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // ১. এপিআই কি চেক করা হচ্ছে - সরাসরি process.env.API_KEY থেকে
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API_KEY is missing in process.env. Check Vercel Settings.");
    return { 
      text: "আপনার এআই অ্যাসিস্ট্যান্ট সক্রিয় করতে Vercel-এ 'API_KEY' নামে এনভায়রনমেন্ট ভেরিয়েবল যোগ করুন।",
      sources: [] 
    };
  }

  // ২. ডাইনামিকালি এআই ক্লায়েন্ট তৈরি
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      text: "এআই সার্ভার থেকে তথ্য পেতে সমস্যা হচ্ছে। দয়া করে নিশ্চিত করুন আপনার Vercel ড্যাশবোর্ডে 'API_KEY' নামে সঠিক কি সেট করা হয়েছে।",
      sources: [] 
    };
  }
};