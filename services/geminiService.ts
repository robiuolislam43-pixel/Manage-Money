
import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  const categories = transactions.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  const topCategories = Object.entries(categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: ${amt} টাকা`)
    .join(', ');

  const pendingReceivable = loans.filter(l => l.type === 'OWE_ME' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);
  const pendingPayable = loans.filter(l => l.type === 'I_OWE' && l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0);
  
  const prompt = `
    নিচের আর্থিক তথ্যের ভিত্তিতে একজন বিশেষজ্ঞ হিসেবে ৩টি গভীর ও কার্যকর পরামর্শ দাও। 
    প্রয়োজনে বর্তমান বাংলাদেশের অর্থনৈতিক অবস্থা (যেমন মুদ্রাস্ফীতি বা ব্যাংক রেট) বিবেচনা করে পরামর্শ দাও:
    
    ১. মোট আয়: ${income} টাকা
    ২. মোট ব্যয়: ${expense} টাকা
    ৩. বর্তমান ব্যালেন্স: ${balance} টাকা
    ৪. প্রধান ব্যয়ের খাতসমূহ: ${topCategories || 'তথ্য নেই'}
    ৫. মোট পাওনা: ${pendingReceivable} টাকা
    ৬. মোট দেনা: ${pendingPayable} টাকা
    
    পরামর্শগুলো পয়েন্ট আকারে দাও এবং শেষে একটি ইতিবাচক উক্তি যোগ করো।
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "তুমি একজন উচ্চপদস্থ পার্সোনাল ফিন্যান্স অ্যাডভাইজার। তুমি ব্যবহারকারীর ডেটা এবং রিয়েল-টাইম তথ্য (Google Search এর মাধ্যমে) ব্যবহার করে বাংলায় পেশাদার এবং কার্যকর পরামর্শ দাও। উত্তরটি সুন্দরভাবে সাজিয়ে দাও।",
        thinkingConfig: { thinkingBudget: 16384 },
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "দুঃখিত, এই মুহূর্তে কোনো পরামর্শ পাওয়া যাচ্ছে না।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "উৎস",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    const errorMsg = error.toString().toLowerCase();
    
    if (errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("exhausted")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    
    if (errorMsg.includes("api_key") || errorMsg.includes("not found")) {
      throw new Error("KEY_REQUIRED");
    }
    
    return { 
      text: "এআই সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।", 
      sources: [] 
    };
  }
};
