import React, { useState } from 'react';
import { ResearchData } from '../types';
import { exportToDocx } from '../services/exportService';

interface ResearchResultProps {
  data: ResearchData;
  onReset: () => void;
}

const ResearchResult: React.FC<ResearchResultProps> = ({ data, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const allSources = Array.from(new Set(data.sections.flatMap(s => s.sources.map(src => JSON.stringify(src))))).map((s: string) => JSON.parse(s));

  const handleCopy = () => {
    const text = data.sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    alert('تم نسخ النص إلى الحافظة');
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await exportToDocx(data);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير الملف');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 animate-fade-in pb-24">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 print:hidden gap-4">
        <button 
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <span>←</span> بحث جديد
        </button>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium shadow-sm transition-colors"
          >
            طباعة / PDF
          </button>
           <button 
            onClick={handleExportWord}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            تصدير لملف Word
          </button>
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium shadow-sm transition-colors"
          >
            نسخ الكل
          </button>
        </div>
      </div>

      {/* Paper Container */}
      <div className="bg-white shadow-2xl rounded-sm min-h-[1000px] p-12 sm:p-16 border border-slate-200 text-justify relative print:shadow-none print:p-0">
        
        {/* Title Page Simulation */}
        <div className="text-center border-b-2 border-slate-900 pb-8 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 heading-font text-slate-900 leading-tight">
            {data.topic}
          </h1>
          <p className="text-xl text-slate-600 italic font-serif">
            بحث علمي موسع موثق من أمهات الكتب
          </p>
          <div className="mt-4 text-sm text-slate-400">
            {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {data.sections.map((section, idx) => (
            <article key={idx} className="section-block">
              <h2 className="text-2xl font-bold text-slate-800 border-r-4 border-teal-700 pr-4 mb-6 heading-font">
                {section.title}
              </h2>
              
              <div className="prose prose-xl prose-slate max-w-none font-serif leading-loose text-slate-800">
                {section.content.split('\n').map((paragraph, pIdx) => {
                  if (!paragraph.trim()) return null;
                  
                  // Regex to match citations like (Book, p. 123) or (Book, vol 1, p 123)
                  // Capture group 1 is the full citation including parens for safer splitting
                  const parts = paragraph.split(/(\([^)]+?(?:[،,]\s*(?:ج|ص|مجلد|صفحة|vol|p|pp)\.?\s*[\d]+)+\))/g);
                  
                  return (
                    <p key={pIdx} className="mb-6 indent-8">
                      {parts.map((part, partIdx) => {
                         // Check if part roughly looks like our citation format
                        const isCitation = part.startsWith('(') && part.endsWith(')') && (part.includes('ص') || part.includes('ج'));
                        return isCitation ? (
                          <sup key={partIdx} className="text-teal-700 font-bold mx-0.5 cursor-help" title={part}>
                             [مصدر]
                          </sup>
                        ) : (
                          <span key={partIdx}>{part}</span>
                        );
                      })}
                    </p>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        {/* References Section */}
        <div className="mt-16 pt-8 border-t-2 border-slate-200 break-before-page">
          <h2 className="text-3xl font-bold mb-8 text-center heading-font">قائمة المصادر المعتمدة</h2>
          <p className="text-center text-slate-500 mb-6 text-sm">
            تم الرجوع إلى الكتب والمراجع التالية أثناء إعداد هذا البحث (عبر النسخ الرقمية المتاحة):
          </p>
          {allSources.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 text-sm text-slate-600">
              {allSources.map((src: any, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-teal-600 font-bold">{i + 1}.</span>
                  <a href={src.uri} target="_blank" rel="noopener noreferrer" className="hover:text-teal-700 hover:underline">
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-center text-slate-400">تم الاعتماد على القاعدة المعرفية للكتب التراثية (دون روابط خارجية مباشرة).</p>
          )}
        </div>

      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 text-center text-slate-400 text-xs">
         تنويه: عند تحميل ملف الوورد (Word)، سيتم تحويل كافة التوثيقات في النص إلى حواشي سفلية (Footnotes) تلقائياً.
      </div>
    </div>
  );
};

export default ResearchResult;