import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // The SDK will use the API key provided via process.env.API_KEY
  // This is the standard way to handle secrets securely on Vercel or similar platforms.
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
    আর্থিক তথ্য বিশ্লেষণ করে ৩টি স্মার্ট এবং অ্যাকশনেবল পরামর্শ বাংলায় দিন।
    
    পরিসংখ্যান:
    - মোট আয়: ${income} BDT
    - মোট ব্যয়: ${expense} BDT
    - বর্তমান ব্যালেন্স: ${balance} BDT
    - প্রধান খরচের খাতসমূহ: ${topCategories || 'উল্লেখ নেই'}
    - পাওনা টাকা: ${pendingReceivable} টাকা
    - দেনা টাকা: ${pendingPayable} টাকা

    গুগল সার্চ ব্যবহার করে বাংলাদেশের বর্তমান মুদ্রাস্ফীতি, সঞ্চয় স্কিমের রেট বা এই মাসের প্রাসঙ্গিক অর্থনৈতিক খবরের ভিত্তিতে পরামর্শ দিন। 
    শেষে একটি অনুপ্রেরণামূলক উক্তি যোগ করুন।
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
    
    // Using the direct .text property as per guidelines
    const text = response.text || "দুঃখিত, এই মুহূর্তে পরামর্শ জেনারেট করা সম্ভব হয়নি।";
    
    // Extract grounding sources from Google Search
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
      text: "আর্থিক পরামর্শ লোড করতে সমস্যা হয়েছে। দয়া করে আপনার Vercel Environment Variables এ API_KEY সঠিক আছে কি না নিশ্চিত করুন।",
      sources: [] 
    };
  }
};