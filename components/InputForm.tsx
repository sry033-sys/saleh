import React, { useState } from 'react';
import { ResearchMode } from '../types';

interface InputFormProps {
  onSubmit: (topic: string, instructions: string, suggestedOutline: string, mode: ResearchMode) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [suggestedOutline, setSuggestedOutline] = useState('');
  const [mode, setMode] = useState<ResearchMode>('scientific');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic, instructions, suggestedOutline, mode);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full border border-slate-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-slate-800 heading-font">
          منصة البحث الذكي
        </h2>
        
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setMode('scientific')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              mode === 'scientific'
                ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-md transform scale-[1.02]'
                : 'border-slate-200 hover:border-teal-300 text-slate-500 hover:bg-slate-50'
            }`}
            disabled={isLoading}
          >
            <span className="text-2xl">📚</span>
            <span className="font-bold font-noto">الباحث العلمي</span>
            <span className="text-xs text-center opacity-75">أبواب، فصول، مباحث<br/>توثيق أكاديمي صارم</span>
          </button>
          
          <button
            type="button"
            onClick={() => setMode('intellectual')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              mode === 'intellectual'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-md transform scale-[1.02]'
                : 'border-slate-200 hover:border-indigo-300 text-slate-500 hover:bg-slate-50'
            }`}
            disabled={isLoading}
          >
            <span className="text-2xl">💡</span>
            <span className="font-bold font-noto">الباحث الفكري</span>
            <span className="text-xs text-center opacity-75">عناوين رئيسية وفرعية<br/>تحليل، ربط، استقراء</span>
          </button>
        </div>

        <p className="text-slate-500 text-center mb-8">
          {mode === 'scientific' 
            ? 'نظام متخصص في بناء الأبحاث الأكاديمية وفق الهيكلية الجامعية (الماجستير/الدكتوراه).'
            : 'نظام متخصص في بناء الأبحاث الفكرية والمقالات التحليلية المعمقة وفق تقسيم موضوعي.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Topic Input */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">عنوان البحث (مطلوب)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={mode === 'scientific' ? "مثال: أثر القواعد الفقهية في المعاملات المالية" : "مثال: أزمة الهوية في عصر العولمة"}
              className={`w-full p-4 pr-4 border-2 rounded-xl focus:ring-0 text-lg transition-colors placeholder:text-slate-400 ${
                mode === 'scientific' ? 'focus:border-teal-600 border-slate-200' : 'focus:border-indigo-600 border-slate-200'
              }`}
              disabled={isLoading}
              required
            />
            {topic.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={() => setTopic('')}
                className="absolute left-3 top-[3.2rem] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* User Instructions Input */}
          <div className="relative mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">
              مقترحات أو توجيهات خاصة (اختياري)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="مثال: التركيز على حقبة زمنية معينة، أو مناقشة رأي مفكر محدد..."
              className={`w-full p-4 pr-4 border-2 rounded-xl focus:ring-0 text-base transition-colors placeholder:text-slate-400 min-h-[80px] resize-y ${
                mode === 'scientific' ? 'focus:border-teal-600 border-slate-200' : 'focus:border-indigo-600 border-slate-200'
              }`}
              disabled={isLoading}
            />
          </div>

          {/* Suggested Outline Input */}
          <div className="relative mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1 flex justify-between">
              <span>خطة بحث مقترحة (اختياري)</span>
              <span className={`text-xs font-normal ${mode === 'scientific' ? 'text-teal-600' : 'text-indigo-600'}`}>إذا كتبت هنا سأبدأ البحث مباشرة</span>
            </label>
            <textarea
              value={suggestedOutline}
              onChange={(e) => setSuggestedOutline(e.target.value)}
              placeholder={mode === 'scientific' 
                ? 'أدخل عناوين الخطة (الفصل الأول: كذا...)\nالمبحث الأول: كذا...' 
                : 'أدخل العناوين الرئيسية والفرعية (عنوان في كل سطر)...'}
              className={`w-full p-4 pr-4 border-2 rounded-xl focus:ring-0 text-base transition-colors placeholder:text-slate-400 min-h-[120px] resize-y font-mono text-sm ${
                mode === 'scientific' ? 'focus:border-teal-600 border-slate-200' : 'focus:border-indigo-600 border-slate-200'
              }`}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg heading-font transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-4
              ${isLoading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : mode === 'scientific' 
                  ? 'bg-teal-700 hover:bg-teal-800 shadow-lg hover:shadow-teal-900/20' 
                  : 'bg-indigo-700 hover:bg-indigo-800 shadow-lg hover:shadow-indigo-900/20'}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري العمل...
              </span>
            ) : suggestedOutline.trim() ? 'اعتماد الخطة وبدء البحث مباشرة' : 'إعداد خطة البحث'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-center text-sm text-slate-500">
        <div className="bg-white/50 p-3 rounded-lg border border-slate-200">
          <span className="block font-bold text-slate-700 mb-1">مصدر موثوق</span>
          الأولوية للكتب والمراجع
        </div>
        <div className="bg-white/50 p-3 rounded-lg border border-slate-200">
          <span className="block font-bold text-slate-700 mb-1">توثيق دقيق</span>
          ذكر الجزء والصفحة
        </div>
        <div className="bg-white/50 p-3 rounded-lg border border-slate-200">
          <span className="block font-bold text-slate-700 mb-1">منهجية مرنة</span>
          علمي (أكاديمي) أو فكري (تحليلي)
        </div>
      </div>
    </div>
  );
};

export default InputForm;