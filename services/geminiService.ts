
import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // Use gemini-3-flash-preview for high speed and stability
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const balance = income - expense;
  
  const categories = transactions.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});
  
  const topCategories = Object.entries(categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ${amt} টাকা`)
    .join(', ');

  const pendingReceivable = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const pendingPayable = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  
  const prompt = `
    নিচের আর্থিক তথ্যের ওপর ভিত্তি করে একজন বিশেষজ্ঞ হিসেবে ৩টি গভীর এবং সুনির্দিষ্ট পরামর্শ দাও। তথ্যগুলো ভালোভাবে বিশ্লেষণ করো:
    
    ১. মোট আয়: ${income} টাকা
    ২. মোট ব্যয়: ${expense} টাকা
    ৩. বর্তমান ব্যালেন্স: ${balance} টাকা
    ৪. প্রধান ব্যয়ের খাতসমূহ: ${topCategories || 'কোনো তথ্য নেই'}
    ৫. মোট পাওনা (Receivable): ${pendingReceivable} টাকা
    ৬. মোট দেনা (Payable): ${pendingPayable} টাকা
    
    পরামর্শের নিয়মাবলী:
    - পরামর্শগুলো পয়েন্ট আকারে দিবে। 
    - প্রতিটি পয়েন্ট অত্যন্ত সুনির্দিষ্ট হতে হবে (যেমন: "আপনার খাদ্য খাতে ব্যয় ২০% কমানো প্রয়োজন")।
    - উত্তরটি সরাসরি এবং কোনো গৌরচন্দ্রিকা ছাড়া দিবে। 
    - সবশেষে একটি ছোট মোটিভেশনাল উক্তি যোগ করবে।
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "তুমি একজন প্রিমিয়াম ফিন্যান্সিয়াল অ্যানালিস্ট। ব্যবহারকারীর আয়ের তুলনায় ব্যয়ের সামঞ্জস্যতা এবং লোনের অবস্থা বিশ্লেষণ করে বাংলায় সুনির্দিষ্ট পরামর্শ প্রদান করো। অহেতুক টেক্সট পরিহার করো।",
        tools: [{ googleSearch: {} }],
        temperature: 0.5, // Lower temperature for more consistent and focused responses
      }
    });
    
    const text = response.text || "দুঃখিত, এই মুহূর্তে পরামর্শ তৈরি করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "উৎস",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    throw error;
  }
};
