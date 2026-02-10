import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // Use gemini-3-flash-preview for high-performance financial reasoning
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
    .map(([cat, amt]) => `${cat}: ${amt} টাকা`)
    .join(', ');

  const pendingReceivable = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const pendingPayable = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  
  const prompt = `
    Analyze the following financial profile as a world-class wealth strategist and provide 3 ultra-specific, data-driven recommendations in Bengali.

    Data Snapshot:
    - Current Liquid Income: ${income} BDT
    - Actual Expenses: ${expense} BDT
    - Net Savings: ${balance} BDT
    - Dominant Expense Sectors: ${topCategories || 'Insufficient historical data'}
    - Uncollected Debt (Receivable): ${pendingReceivable} BDT
    - Outstanding Liability (Payable): ${pendingPayable} BDT

    Critical Instructions:
    1. Your tone must be elite, professional, and results-oriented.
    2. Respond with exactly 3 bulleted paragraphs in clear Bengali.
    3. Use Search grounding to reference current economic conditions in Bangladesh (inflation, banking interest rates, or investment trends) to make your advice actionable in today's context.
    4. Focus on 'Smart Saving' and 'Liability Management'.
    5. End with a one-sentence powerful Bengali quote about financial freedom.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are 'Manage Money AI', a sophisticated financial consultant. You analyze user cashflow and market trends to provide elite wealth-building strategies.",
        tools: [{ googleSearch: {} }],
        temperature: 0.4,
      }
    });
    
    const text = response.text || "দুঃখিত, এই মুহূর্তে আপনার আর্থিক তথ্য বিশ্লেষণ করা সম্ভব হয়নি।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "আর্থিক রেফারেন্স",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    return { 
      text: "আপনার ফিন্যান্সিয়াল ডেটা লোড হচ্ছে অথবা এআই প্রসেসিংয়ে সাময়িকভাবে সমস্যা হচ্ছে। দয়া করে নিশ্চিত করুন আপনার ট্রানজেকশন হিসেব সঠিক আছে।",
      sources: [] 
    };
  }
};