import React, { useState } from 'react';
import { generateOutline, generateSectionContent } from './services/geminiService';
import InputForm from './components/InputForm';
import OutlineEditor from './components/OutlineEditor';
import ResearchResult from './components/ResearchResult';
import { AppState, OutlineItem, ResearchData, ResearchMode } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState<ResearchMode>('scientific');
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Core function to execute the research loop
  const performResearch = async (
    currentTopic: string, 
    currentOutline: OutlineItem[], 
    currentInstructions: string,
    currentMode: ResearchMode
  ) => {
    setState(AppState.GENERATING_RESEARCH);
    setOutline(currentOutline);
    setProgress({ current: 0, total: currentOutline.length });

    // Filter duplicates based on title before starting
    const uniqueOutline = currentOutline.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.title.trim() === item.title.trim()
      ))
    );

    const sections = [];

    // Generate sections sequentially
    for (let i = 0; i < uniqueOutline.length; i++) {
      const item = uniqueOutline[i];
      setProgress({ current: i + 1, total: uniqueOutline.length });
      
      // Delay explicitly between requests to prevent Rate Limit (429)
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 2500));
      
      const section = await generateSectionContent(currentTopic, item.title, currentInstructions, currentMode);
      sections.push(section);
    }

    setResearchData({
      topic: currentTopic,
      outline: uniqueOutline,
      sections,
      mode: currentMode
    });
    setState(AppState.COMPLETED);
  };

  // Step 1: Handle Input Submission
  const handleTopicSubmit = async (inputTopic: string, inputInstructions: string, suggestedOutline: string, inputMode: ResearchMode) => {
    setTopic(inputTopic);
    setInstructions(inputInstructions);
    setMode(inputMode);

    // If user provided a suggested outline, skip generation and start research immediately
    if (suggestedOutline.trim()) {
      const parsedOutline: OutlineItem[] = suggestedOutline
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => ({
          id: `custom-${index}`,
          title: line
        }));

      if (parsedOutline.length > 0) {
        // Direct jump to research
        await performResearch(inputTopic, parsedOutline, inputInstructions, inputMode);
        return;
      }
    }

    // Normal flow: Generate Outline first
    setState(AppState.GENERATING_OUTLINE);
    try {
      const generatedOutline = await generateOutline(inputTopic, inputInstructions, inputMode);
      setOutline(generatedOutline);
      setState(AppState.OUTLINE_REVIEW);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء توليد الخطة. تأكد من مفتاح API وحاول مرة أخرى.');
      setState(AppState.IDLE);
    }
  };

  // Step 2: Confirm Outline (Normal Flow)
  const handleOutlineConfirm = async (finalOutline: OutlineItem[]) => {
    await performResearch(topic, finalOutline, instructions, mode);
  };

  const handleReset = () => {
    setTopic('');
    setInstructions('');
    setOutline([]);
    setResearchData(null);
    setState(AppState.IDLE);
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans ${mode === 'intellectual' ? 'selection:bg-indigo-100 selection:text-indigo-900' : 'selection:bg-teal-100 selection:text-teal-900'}`}>
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className={`text-white p-2 rounded-lg ${mode === 'scientific' ? 'bg-teal-700' : 'bg-indigo-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className={`font-bold text-xl heading-font ${mode === 'scientific' ? 'text-teal-900' : 'text-indigo-900'}`}>
                {mode === 'scientific' ? 'الباحث العلمي' : 'الباحث الفكري'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              Beta v1.3 | Gemini Pro Powered
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10">
        {state === AppState.IDLE || state === AppState.GENERATING_OUTLINE ? (
          <InputForm 
            onSubmit={handleTopicSubmit} 
            isLoading={state === AppState.GENERATING_OUTLINE || state === AppState.GENERATING_RESEARCH} 
          />
        ) : state === AppState.OUTLINE_REVIEW || state === AppState.GENERATING_RESEARCH ? (
          <>
            {state === AppState.GENERATING_RESEARCH && (
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>جاري كتابة البحث...</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${mode === 'scientific' ? 'bg-teal-600' : 'bg-indigo-600'}`}
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-slate-500 text-sm animate-pulse">
                     يتم الآن البحث في المصادر وكتابة {mode === 'scientific' ? 'المبحث' : 'القسم'}: {outline[progress.current]?.title || '...'}
                  </p>
                </div>
              </div>
            )}
            
            {state === AppState.OUTLINE_REVIEW || (state === AppState.GENERATING_RESEARCH && outline.length > 0 && !instructions.includes('skip_review')) ? (
                 <OutlineEditor 
                  initialOutline={outline} 
                  onConfirm={handleOutlineConfirm}
                  onCancel={handleReset}
                  isGenerating={state === AppState.GENERATING_RESEARCH}
                />
            ) : null}
          </>
        ) : state === AppState.COMPLETED && researchData ? (
          <ResearchResult data={researchData} onReset={handleReset} />
        ) : null}
      </main>

    </div>
  );
};

export default App;