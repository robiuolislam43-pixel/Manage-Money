
import { GoogleGenAI } from "@google/genai";
import { Transaction, Loan, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], loans: Loan[]): Promise<AIInsight> => {
  // Use gemini-3-flash-preview for the most up-to-date and robust analysis
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
    নিচের আর্থিক তথ্যের ওপর ভিত্তি করে একজন বিশেষজ্ঞ ফিন্যান্সিয়াল অ্যানালিস্ট হিসেবে ডেটাগুলো গভীর বিশ্লেষণ করো এবং একই সাথে ৩টি অত্যন্ত সুনির্দিষ্ট (Specific) ও কার্যকর পরামর্শ প্রদান করো:
    
    ১. ব্যবহারকারীর মোট আয়: ${income} টাকা
    ২. ব্যবহারকারীর মোট ব্যয়: ${expense} টাকা
    ৩. বর্তমান নিট ব্যালেন্স: ${balance} টাকা
    ৪. ব্যয়ের প্রধান ৩টি খাত: ${topCategories || 'তথ্য নেই'}
    ৫. বাজার থেকে পাওনা (Receivable): ${pendingReceivable} টাকা
    ৬. বাজারে মোট দেনা (Payable): ${pendingPayable} টাকা
    
    নির্দেশনা:
    - পরামর্শগুলো অবশ্যই ৩টি আলাদা পয়েন্টে দিবে।
    - প্রতিটি পরামর্শ অত্যন্ত ডেটা-ড্রিভেন এবং সুনির্দিষ্ট হতে হবে (যেমন: "আপনার খাদ্য খাতে ব্যয় ১৫% কমালে মাসে অতিরিক্ত ৫০০ টাকা সঞ্চয় সম্ভব")।
    - পরামর্শগুলো দেওয়ার সময় কোনো অহেতুক টেক্সট বা ভূমিকা ব্যবহার করবে না, সরাসরি পরামর্শে চলে যাবে।
    - সবশেষে একটি মাত্র উৎসাহমূলক উক্তি দিবে।
    - উত্তরটি অবশ্যই পরিষ্কার এবং প্রমিত বাংলায় দিবে।
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "তুমি একজন প্রিমিয়াম এবং প্রোফেশনাল ফিন্যান্সিয়াল অ্যাডভাইজার। ব্যবহারকারীর দেওয়া আয়-ব্যয় এবং ঋণের ডেটা বিশ্লেষণ করে অত্যন্ত প্র্যাকটিক্যাল এবং সুনির্দিষ্ট ৩টি পরামর্শ বাংলায় প্রদান করো। উত্তরটি একবারেই পূর্ণাঙ্গভাবে দিবে যাতে এটি পরে পরিবর্তন না হয়।",
        tools: [{ googleSearch: {} }],
        temperature: 0.4, // Keep temperature low for consistency and specificity
      }
    });
    
    const text = response.text || "দুঃখিত, এই মুহূর্তে আপনার আর্থিক তথ্য বিশ্লেষণ করা সম্ভব হয়নি। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "উৎস",
        uri: chunk.web.uri
      }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
