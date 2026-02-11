import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

// Initialize AI according to standard instructions
// Note: process.env.API_KEY must be provided by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is not found in process.env.API_KEY");
    return { 
      text: "আপনার এআই সহকারী সক্রিয় করতে 'API_KEY' প্রয়োজন। দয়া করে ভেরসেল (Vercel) সেটিংসে ভেরিয়েবলটির নাম শুধু 'API_KEY' দিন।",
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
    Analyze this financial status for a user in Bangladesh:
    - Income: ${income} BDT
    - Expense: ${expense} BDT
    - Net Balance: ${balance} BDT
    - Top Spending: ${topCategories || 'None recorded'}
    - Debt Status: Receivable ${pendingReceivable} BDT, Payable ${pendingPayable} BDT.

    Requirement: 
    1. Give 3 short, actionable financial advice in Bengali.
    2. Reference current inflation or savings schemes in Bangladesh using Google Search.
    3. Include a short motivational quote in Bengali about money at the end.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "তথ্য বিশ্লেষণ সম্ভব হচ্ছে না।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "আরও জানুন",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    return { 
      text: "এআই সার্ভার থেকে তথ্য পেতে সমস্যা হচ্ছে। দয়া করে নিশ্চিত করুন আপনার এপিআই কি-টি (API Key) সঠিক এবং এটি 'API_KEY' নামে সেভ করা হয়েছে।",
      sources: [] 
    };
  }
};