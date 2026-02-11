import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // Accessing the key from window.process.env defined in index.html
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing.");
    return { 
      text: "আপনার এআই সহকারী সক্রিয় করতে 'API_KEY' প্রয়োজন। দয়া করে নিশ্চিত করুন এটি কোডে যোগ করা হয়েছে।",
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
    Analyze this financial status for a user in Bangladesh:
    - Current Income: ${income} BDT
    - Current Expense: ${expense} BDT
    - Net Balance: ${balance} BDT
    - Highest Spending Categories: ${topCategories || 'No specific records'}
    - Loans/Receivables: ${pendingReceivable} BDT to receive, ${pendingPayable} BDT to pay.

    Tasks:
    1. Provide 3 highly specific and actionable financial advice in Bengali based on this data.
    2. Search for current inflation trends in Bangladesh or high-interest savings bank schemes available this week to mention as real-world context.
    3. Add a short, powerful motivational quote in Bengali about wealth management at the end.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.8,
      }
    });
    
    const text = response.text || "এই মুহূর্তে বিশ্লেষণ করা সম্ভব হচ্ছে না।";
    
    // Extract grounding sources for transparency
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "আরও জানুন",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      text: "এআই সার্ভার থেকে তথ্য পেতে সমস্যা হচ্ছে। দয়া করে আপনার ইন্টারনেট সংযোগ চেক করুন বা পরে চেষ্টা করুন।",
      sources: [] 
    };
  }
};