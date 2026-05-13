import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Users, 
  Type, 
  MessageSquare, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  AlertCircle,
  BarChart3,
  Link as LinkIcon,
  ChevronRight,
  RefreshCw,
  Rocket
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Types ---
interface SEOInputs {
  primaryKeyword: string;
  topic: string;
  audience: string;
  wordCount: number;
  tone: string;
  secondaryKeywords: string;
}

interface GeneratedArticle {
  seoTitle: string;
  metaDescription: string;
  article: string;
  keywordUsage: string;
  internalLinks: string[];
}

// --- Constants ---
const DEFAULT_INPUTS: SEOInputs = {
  primaryKeyword: '',
  topic: '',
  audience: '',
  wordCount: 1200,
  tone: 'Conversational',
  secondaryKeywords: '',
};

const SYSTEM_INSTRUCTION = `You are an expert SEO content writer. Your job is to produce well-researched, human-sounding, search-optimized content that ranks on Google and actually gets read. You write blog posts, articles, product descriptions, and web copy. Every output is structured for SEO, edited for readability, and free of AI filler.

HOW YOU WRITE
Structure every article like this:
[SEO Title] — include primary keyword, under 60 characters
[Meta Description] — 140–155 characters, include keyword, end with a soft CTA

H1: Article Title (same as or close to SEO title)

Introduction (150–200 words)
- Hook: start with a question, surprising stat, or relatable problem
- Briefly state what the article covers
- Do NOT write "In this article, we will..." — be direct

H2: First Main Section
H3: Subsection (if needed)

[Continue with 3–5 H2 sections covering the topic thoroughly]

H2: Conclusion (or FAQ if relevant)
- Summarize key points in 2–3 sentences
- End with a clear next step or CTA

[Meta Description — label it clearly at the end]

WRITING RULES
Do:
- Use the primary keyword in: H1, first 100 words, at least 2 H2s, conclusion
- Use secondary keywords naturally — never force them
- Write short paragraphs (2–4 sentences max)
- Use active voice with real human actors ("farmers benefit from..." not "benefits can be obtained by...")
- Be specific — use numbers, examples, named places, named processes
- Vary sentence length — mix short punchy sentences with longer ones

Never do:
- Start with "In today's fast-paced world..." or any generic opener
- Use phrases like "delve into," "it's important to note," "in conclusion," "game-changer," "leverage," "unlock," "revolutionize"
- Write fluff paragraphs that restate what was already said
- Use more than one exclamation point per article
- Pad word count with summaries of summaries

KEYWORD DENSITY TARGET
- Primary keyword: 1–2% density (roughly once every 100–150 words)
- Never repeat the exact keyword more than once in a single paragraph
- Use natural variations

OUTPUT FORMAT
Return your response ONLY in the following JSON format:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "article": "Markdown content starting from H1...",
  "keywordUsage": "Summary of where keyword appears...",
  "internalLinks": ["topic 1", "topic 2", "topic 3"]
}

Tone Guide:
- Conversational: Write like a knowledgeable friend, not a textbook
- Professional: Formal but not stiff — no slang, complete sentences
- Authoritative: Confident claims, backed by specifics, no hedging
- Friendly: Warm, second-person ("you"), light humor is fine`;

export default function App() {
  const [inputs, setInputs] = useState<SEOInputs>(DEFAULT_INPUTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedArticle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: name === 'wordCount' ? parseInt(value) || 0 : value }));
  };

  const generateArticle = async () => {
    if (!inputs.primaryKeyword || !inputs.topic) {
      setError('Primary keyword and topic are required.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // process.env.GEMINI_API_KEY is mapped in vite.config.ts, but we also support VITE_GEMINI_API_KEY
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `Write an SEO article with these details:
      Primary Keyword: ${inputs.primaryKeyword}
      Topic: ${inputs.topic}
      Target Audience: ${inputs.audience || 'General'}
      Word Count: ${inputs.wordCount}
      Tone: ${inputs.tone}
      Secondary Keywords: ${inputs.secondaryKeywords || 'None'}
      
      Respond only with the JSON object.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || '{}';
      const data = JSON.parse(text);
      setResult(data as GeneratedArticle);
    } catch (err) {
      console.error(err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const content = `SEO Title: ${result.seoTitle}\nMeta Description: ${result.metaDescription}\n\n${result.article}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadArticle = () => {
    if (!result) return;
    const content = `Title: ${result.seoTitle}\nMeta: ${result.metaDescription}\n\n${result.article}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inputs.primaryKeyword.replace(/\s+/g, '_')}_article.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-indigo-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SEO<span className="text-indigo-600">Forge</span></h1>
        </div>
        <div className="flex items-center gap-4">
           {result && (
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm text-slate-600 font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button 
                onClick={downloadArticle}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm text-slate-600 font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
           )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col p-6 gap-6 shrink-0 overflow-y-auto">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 
              Strategic Inputs
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Keyword</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    name="primaryKeyword"
                    placeholder="e.g. organic rice farming"
                    value={inputs.primaryKeyword}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Topic / Title</label>
                <div className="relative">
                  <Type className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    name="topic"
                    rows={3}
                    placeholder="What is this article about?"
                    value={inputs.topic}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="audience"
                    placeholder="e.g. Small farmers in Luzon"
                    value={inputs.audience}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Word Count</label>
                  <input
                    type="number"
                    name="wordCount"
                    value={inputs.wordCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Writing Tone</label>
                  <div className="relative">
                    <select
                      name="tone"
                      value={inputs.tone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none"
                    >
                      <option>Conversational</option>
                      <option>Professional</option>
                      <option>Authoritative</option>
                      <option>Friendly</option>
                      <option>Conversational + Authoritative</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Secondary Keywords (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    name="secondaryKeywords"
                    rows={2}
                    placeholder="e.g. palay production, sustainable farming"
                    value={inputs.secondaryKeywords}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={generateArticle}
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 text-white" />
                    Generate SEO Article
                  </>
                )}
              </button>

              {(result || inputs !== DEFAULT_INPUTS) && (
                <button
                  onClick={() => {
                    setInputs(DEFAULT_INPUTS);
                    setResult(null);
                    setError(null);
                  }}
                  disabled={isGenerating}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Fields
                </button>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md flex gap-2 text-red-600 text-xs items-start">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
            
            <div className="mt-auto p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
               <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Expert Tip
               </h3>
               <p className="text-xs text-slate-600 leading-relaxed">
                 For best results, include specific regional details in your topic description. This helps the AI bypass generic content blocks.
               </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-slate-50 p-8 overflow-hidden flex flex-col">
          <div className="max-w-4xl w-full mx-auto bg-white border border-slate-200 shadow-sm rounded-xl flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Your Content Engine Awaits</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  Configure your primary keywords and audience on the left to generate human-sounding, high-ranking SEO content.
                </p>
                <div className="pt-6 grid grid-cols-2 gap-4 text-left">
                  <div className="flex gap-2 items-start text-slate-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5" />
                    <span className="text-xs font-medium">Automatic Keyword Density</span>
                  </div>
                  <div className="flex gap-2 items-start text-slate-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5" />
                    <span className="text-xs font-medium">No Generic AI Fillers</span>
                  </div>
                  <div className="flex gap-2 items-start text-slate-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5" />
                    <span className="text-xs font-medium">Structured H1-H3 Tags</span>
                  </div>
                  <div className="flex gap-2 items-start text-slate-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5" />
                    <span className="text-xs font-medium">Meta Documentation</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center overflow-hidden"
              >
                <div className="relative w-24 h-24 mb-6">
                   <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse" />
                   <RefreshCw className="absolute inset-0 m-auto w-10 h-10 text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Crafting your content...</h3>
                <div className="space-y-2 text-slate-500 text-sm max-w-xs mx-auto">
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >Analyzing search intent...</motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                  >Optimizing keyword density...</motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4 }}
                  >Humanizing narrative flow...</motion.p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth"
              >
                {/* Meta Panel */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 flex justify-between items-center">
                    SEO Meta Data
                    <span className="text-slate-500 lowercase opacity-60">
                      Words: {result.article.trim().split(/\s+/).length} &bull; Title: {result.seoTitle.length}/60 &bull; Desc: {result.metaDescription.length}/155 chars
                    </span>
                  </div>
                  <div className="text-sm mb-1"><span className="font-bold text-slate-900">Title:</span> {result.seoTitle}</div>
                  <div className="text-sm text-slate-700 leading-relaxed"><span className="font-bold text-slate-900">Description:</span> {result.metaDescription}</div>
                </div>

                {/* Main Article */}
                <article className="prose prose-slate max-w-none prose-h1:text-4xl prose-h1:font-extrabold prose-h1:text-slate-900 prose-h1:leading-tight prose-h1:mb-6 prose-h1:underline prose-h1:decoration-indigo-200 prose-h1:decoration-4 prose-h1:underline-offset-4 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-800 prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-indigo-600">
                  <ReactMarkdown>{result.article}</ReactMarkdown>
                </article>

                {/* Footer Analytics */}
                <div className="border-t border-slate-100 mt-12 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Keyword Usage Analysis
                     </h3>
                     <p className="text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                       {result.keywordUsage}
                     </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-indigo-500" /> Internal Link Ops
                     </h3>
                     <div className="space-y-2">
                        {result.internalLinks.map((link, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg text-sm font-medium text-slate-700 border border-slate-200 shadow-sm flex items-center gap-2">
                             <ChevronRight className="w-4 h-4 text-indigo-500" />
                             {link}
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
