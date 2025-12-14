import React, { useState } from 'react';
import { OutlineItem } from '../types';

interface OutlineEditorProps {
  initialOutline: OutlineItem[];
  onConfirm: (finalOutline: OutlineItem[]) => void;
  onCancel: () => void;
  isGenerating: boolean;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ 
  initialOutline, 
  onConfirm, 
  onCancel,
  isGenerating 
}) => {
  const [items, setItems] = useState<OutlineItem[]>(initialOutline);
  const [newItemTitle, setNewItemTitle] = useState('');

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    if (newItemTitle.trim()) {
      setItems([...items, { id: `new-${Date.now()}`, title: newItemTitle }]);
      setNewItemTitle('');
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 heading-font">مراجعة خطة البحث</h2>
          <span className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-medium">
            {items.length} مباحث
          </span>
        </div>

        <div className="p-6">
          <p className="mb-6 text-slate-600">
            قام الذكاء الاصطناعي باقتراح العناوين التالية. يمكنك التعديل أو الحذف أو الإضافة قبل البدء بكتابة المحتوى لضمان الدقة.
          </p>

          <div className="space-y-3 mb-8">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:border-teal-400 transition-colors">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-sm">
                  {index + 1}
                </span>
                <span className="flex-grow font-medium text-slate-800">{item.title}</span>
                
                <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20"
                    title="تحريك لأعلى"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20"
                    title="تحريك لأسفل"
                  >
                    ▼
                  </button>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded px-2"
                    title="حذف"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="أضف عنواناً جديداً..."
              className="flex-grow p-3 border border-slate-300 rounded-lg focus:border-teal-500 focus:ring-0"
              disabled={isGenerating}
            />
            <button
              onClick={handleAdd}
              disabled={!newItemTitle.trim() || isGenerating}
              className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 disabled:opacity-50"
            >
              إضافة
            </button>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
              disabled={isGenerating}
            >
              إلغاء والعودة
            </button>
            <button
              onClick={() => onConfirm(items)}
              disabled={items.length === 0 || isGenerating}
              className={`flex-grow py-3 rounded-xl text-white font-bold text-lg heading-font shadow-lg flex justify-center items-center gap-2
                ${isGenerating 
                  ? 'bg-teal-800 cursor-wait opacity-80' 
                  : 'bg-teal-700 hover:bg-teal-800'}`}
            >
              {isGenerating ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                   جاري كتابة الأبحاث...
                 </>
              ) : 'اعتماد الخطة وبدء الكتابة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutlineEditor;