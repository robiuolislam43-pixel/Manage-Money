import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // Use the standard environment variable name as per instructions
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. Make sure you added 'API_KEY' in Vercel settings.");
    return { 
      text: "আপনার এআই সহকারী সক্রিয় করতে 'API_KEY' ভেরিয়েবলটি প্রয়োজন। দয়া করে সেটিংস চেক করুন।",
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    Analyze this financial data and provide 3 smart, actionable advice in Bengali.
    
    Current Stats:
    - Total Income: ${income} BDT
    - Total Expense: ${expense} BDT
    - Balance: ${balance} BDT
    - Spending: ${topCategories || 'No records'}
    - Owe Me: ${pendingReceivable} BDT
    - I Owe: ${pendingPayable} BDT

    Search for current inflation in Bangladesh or best saving schemes for this month to add real context.
    Add a motivational quote in Bengali at the end.
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
    
    const text = response.text || "এই মুহূর্তে বিশ্লেষণ সম্ভব হচ্ছে না।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "বিস্তারিত দেখুন",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      text: "সার্ভারে সমস্যা হয়েছে। দয়া করে আপনার 'API_KEY' ঠিকভাবে সেভ করা হয়েছে কি না নিশ্চিত করুন।",
      sources: [] 
    };
  }
};