import { GoogleGenAI } from "@google/genai";
import { OutlineItem, ResearchSection, ResearchMode } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Dynamic System Instruction based on Mode
const getSystemInstruction = (mode: ResearchMode) => {
  const hierarchyRule = mode === 'scientific'
    ? `2. **الترتيب الهرمي (إلزامي):**
       - التزم بالترتيب التنازلي: باب > فصل > مبحث > مطلب > مسألة.
       - لا تخلط المراتب (لا تضع مبحثاً تحت باب مباشرة).`
    : `2. **الهيكلة الفكرية (إلزامي):**
       - التزم بنظام: عناوين رئيسية (محاور) > عناوين فرعية (أفكار).
       - تجنب المصطلحات الفقهية الصارمة (مثل باب/مبحث) واستخدم لغة فكرية معاصرة وتحليلية.`;

  return `
أنت باحث متخصص ومحترف، تتميز بالأمانة العلمية المطلقة والدقة المنهجية وسعة الاطلاع.
مهمتك: كتابة أبحاث ${mode === 'scientific' ? 'علمية أكاديمية' : 'فكرية تحليلية'} موسعة باللغة العربية معتمداً على المصادر الحقيقية فقط.

*** القواعد المنهجية الصارمة ***:

1. **أولوية المستخدم:**
   - مقترحات وتوجيهات الباحث (المستخدم) هي الأهم. نفذها حرفياً وقدمها على أي اقتراح منك.

${hierarchyRule}

3. **المصادر والمراجع (Arabic & English):**
   - المصادر العربية: (المكتبة الشاملة، كتب جوجل، موقع ketabonline.com).
   - **المصادر الأجنبية:** إذا كان الموضوع يحتاج إلى مراجع أجنبية (مثل المواضيع الطبية، التقنية، أو القضايا الغربية)، **يجب** الرجوع للمصادر الإنجليزية المعتبرة (Books, Academic Journals).
   - ممنوع النقل من المدونات أو المنتديات.

4. **بروتوكول التوثيق:**
   - **للمصادر العربية:** (اسم الكتاب، المجلد/الصفحة).
   - **للمصادر الأجنبية:** أبقِ عنوان المصدر لغته الأصلية ولا تترجمه أبداً في الحاشية.
     - صحيح: (John Smith, Physics of the Future, p. 45).
     - خطأ: (جون سميث، فيزياء المستقبل، ص 45).
   - **النقل بالمعنى:** ابدأ بـ "ينظر:" للمصادر العربية، أو "See:" للمصادر الأجنبية.
   - **مكان التوثيق:** نهاية الفقرة مباشرة.

5. **الأمانة العلمية:**
   - لا تخترع مصادر أو أرقام صفحات. إذا لم تجد المعلومة، لا تذكرها.
`;
};

// Helper function to handle API calls with fallback strategy
async function generateWithFallback(
  primaryModel: string, 
  prompt: string, 
  config: any,
  fallbackModel: string = 'gemini-2.5-flash'
) {
  try {
    return await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: config
    });
  } catch (error: any) {
    console.warn(`Primary model ${primaryModel} failed. Checking for fallback conditions...`, error);

    // Check for Rate Limit (429), Resource Exhausted, or Server Errors (500/Unknown)
    const shouldFallback = 
      error.code === 429 || 
      error.status === 'RESOURCE_EXHAUSTED' || 
      (error.message && (error.message.includes('429') || error.message.includes('quota'))) ||
      error.code === 500 ||
      error.code === 503 ||
      error.status === 'UNKNOWN' ||
      error.status === 'INTERNAL' ||
      (error.message && error.message.includes('Rpc failed'));

    if (shouldFallback) {
      console.warn(`Error detected (${error.status || error.code}). Falling back to ${fallbackModel}...`);
      
      const newConfig = { ...config };

      // Handle specific Search Grounding Quota limit
      if (error.message && (error.message.includes('search_grounding_request') || error.message.includes('quota'))) {
         console.warn("Disabling Google Search tool due to Grounding Quota limits. Relying on internal knowledge base.");
         delete newConfig.tools;
      }
      
      // Remove thinking config for fallback to ensure stability and speed
      if (newConfig.thinkingConfig) {
        delete newConfig.thinkingConfig;
      }
      
      // Fallback request
      return await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config: newConfig
      });
    }
    // Re-throw other errors (like 400 Bad Request if it's a prompt issue)
    throw error;
  }
}

export const generateOutline = async (topic: string, instructions: string = '', mode: ResearchMode = 'scientific'): Promise<OutlineItem[]> => {
  let instructionText = "";
  if (instructions.trim()) {
    instructionText = `
    \n\nتنبيه هام جداً - توجيهات المستخدم لها الأولوية القصوى:
    "${instructions}"
    عليك بناء الخطة بناءً على هذه التوجيهات حرفياً.
    `;
  }

  // Determine specific prompts based on mode
  const structuralRequirements = mode === 'scientific' 
    ? `
      1. **التسلسل الهرمي:** التزم بالتسلسل: باب > فصل > مبحث > مطلب > مسألة.
      2. **قاعدة التفصيل (مهم جداً):** 
         - لا تضع "عنوان الباب" أو "عنوان الفصل" كعنصر مستقل للكتابة إذا كنت ستذكر تحته مباحث ومطالب.
         - بدلاً من ذلك، اذكر "المباحث" أو "المطالب" مباشرة، واجعل عنوانها يشمل الفصل.
         - مثال صحيح (بدون تكرار): "الفصل الأول: المياه - المبحث الأول: أقسام المياه".
      `
    : `
      1. **التسلسل الفكري:** التزم بالتسلسل: عنوان رئيسي (محور) > عنوان فرعي (فكرة).
      2. **أسلوب العناوين:** استخدم عناوين فكرية جذابة ومعبرة عن المضمون (مثل: "إشكاليات الحداثة"، "مفهوم الحرية في الفلسفة المعاصرة").
      3. **قاعدة التفصيل:** اذكر العناوين الفرعية الدقيقة التي سيتم الكتابة عنها مباشرة لتجنب التكرار.
      `;

  const prompt = `
  قم بإعداد خطة بحث ${mode === 'scientific' ? 'علمية أكاديمية' : 'فكرية تحليلية'} موسعة وشاملة جداً لموضوع: "${topic}".
  ${instructionText}

  المتطلبات المنهجية الصارمة (منع التكرار):
  ${structuralRequirements}
  
  3. **الهدف:** أريد قائمة بعناوين المواضيع الدقيقة التي سيتم كتابة المحتوى عنها، بحيث لا يتداخل موضوع مع آخر. كل عنصر في القائمة يجب أن يكون موضوعاً فريداً للكتابة.

  4. **المخرجات:** JSON حصراً على شكل مصفوفة: [ { "title": "عنوان القسم كاملاً" }, ... ]
  `;

  try {
    const response = await generateWithFallback(
      "gemini-3-pro-preview",
      prompt,
      {
        systemInstruction: getSystemInstruction(mode),
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      }
    );

    let jsonText = response.text;
    if (!jsonText) throw new Error("لم يتم استلام رد من النموذج");
    
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(jsonText);
    return parsed.map((item: any, index: number) => ({
      id: `section-${index}`,
      title: item.title
    }));

  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
};

export const generateSectionContent = async (
  topic: string, 
  sectionTitle: string,
  instructions: string = '',
  mode: ResearchMode = 'scientific'
): Promise<ResearchSection> => {
  let instructionText = "";
  if (instructions.trim()) {
    instructionText = `
    \n\nتوجيهات المستخدم الخاصة (أولوية قصوى):
    "${instructions}"
    `;
  }

  const prompt = `
  اكتب محتوى ${mode === 'scientific' ? 'علمياً موسعاً' : 'فكرياً تحليلياً معمقاً'} للجزئية: "${sectionTitle}" ضمن بحث بعنوان "${topic}".
  ${instructionText}

  تعليمات الكتابة والتوثيق (دقيقة جداً):
  1. **التركيز الدقيق:** هذا القسم هو جزء دقيق من البحث. **لا تكتب مقدمات عامة مكررة** عن كامل الموضوع. ادخل في صلب الموضوع التفصيلي ("${sectionTitle}") مباشرة وبالتفصيل الممل.
  ${mode === 'intellectual' ? '- ركز على التحليل، الربط بين الأفكار، والاستقراء، وليس مجرد السرد.' : ''}
  
  2. **المصادر:**
     - ابحث في (المكتبة الشاملة، كتب جوجل، ketabonline.com).
     - **هام:** إذا كان الموضوع يحتاج لمصادر أجنبية (إنجليزي/فرنسي..)، ابحث عنها واستخدمها.
  
  3. **صيغة التوثيق:** 
     - العربي: (ينظر: اسم المصدر، ج/ص) أو (اسم المصدر، ج/ص).
     - الإنجليزي: (See: Author, Book Title, p. X) أو (Author, Title, p. X).
     - **تحذير:** لا تترجم اسم المصدر الأجنبي أبداً في الحاشية. أبقه بلغته الأصلية.

  4. **مكان التوثيق:** الصق التوثيق بنهاية الجملة أو الفقرة مباشرة. **لا تضعه في سطر جديد**.
  5. **الأمانة:** لا تخترع أرقام صفحات.

  الهدف: مادة غزيرة، موثقة بدقة، ومرتبة.
  `;

  try {
    const response = await generateWithFallback(
      "gemini-3-pro-preview",
      prompt,
      {
        systemInstruction: getSystemInstruction(mode),
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    );

    const content = response.text || "تعذر توليد المحتوى.";
    
    // Extract sources for the "References" section logic (User Interface only)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter(c => c.web?.uri && c.web?.title)
      .map(c => ({
        title: c.web!.title!,
        uri: c.web!.uri!
      }));

    // Improved Regex to capture citations (Arabic & English)
    const citationRegex = /\((?:ينظر:|See:|Cf\.?:?\s*)?[^)]+?(?:[،,]\s*(?:ج|ص|مجلد|صفحة|vol|p|pp|pg|no)\.?\s*[\d]+)+\)/gi;
    const foundCitations = content.match(citationRegex) || [];

    return {
      title: sectionTitle,
      content,
      citations: foundCitations,
      sources: sources
    };

  } catch (error) {
    console.error(`Error generating section ${sectionTitle}:`, error);
    return {
      title: sectionTitle,
      content: "حدث خطأ أثناء توليد هذا القسم. يرجى المحاولة لاحقاً.",
      citations: [],
      sources: []
    };
  }
};