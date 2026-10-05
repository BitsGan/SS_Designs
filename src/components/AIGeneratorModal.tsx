import React, { useState } from 'react';
import { Sparkles, X, Wand2, Home, Compass, Layers, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { CanvasElement, PlotConfiguration } from '../types';
import { sound } from '../utils/audio';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (elements: CanvasElement[], projectName: string) => void;
  plotConfig: PlotConfiguration;
  onUpdatePlotConfig: (cfg: PlotConfiguration) => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Modern 3-Bedroom Villa with Pool',
    prompt: 'Create a modern 3-bedroom luxury villa with open-concept living room, chef kitchen, master en-suite, double garage, and an outdoor swimming pool.',
    tag: 'Popular',
    icon: '🏡',
  },
  {
    title: 'Compact 2-Bedroom Urban Apartment',
    prompt: 'Design a space-efficient 2-bedroom city apartment with master bedroom, guest room, open dining-living area, kitchenette, and balcony terrace.',
    tag: 'Compact',
    icon: '🏢',
  },
  {
    title: '4-Bedroom Executive Mansion with Courtyard',
    prompt: 'Generate an expansive 4-bedroom executive estate with private home office, formal dining, grand living room, walk-in closets, and landscaped central courtyard.',
    tag: 'Luxury',
    icon: '🏰',
  },
  {
    title: 'Minimalist Open-Concept Studio Loft',
    prompt: 'Draft a modern minimalist studio loft with combined living/sleeping zone, kitchen island, private designer bath, and expansive window wall.',
    tag: 'Studio',
    icon: '🛋',
  },
];

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  plotConfig,
  onUpdatePlotConfig,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<{
    projectName: string;
    summary: string;
    dimensions: string;
    totalAreaM2: number;
    elements: CanvasElement[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const text = (customPrompt || promptText).trim();
    if (!text) return;

    sound.playClick();
    setIsGenerating(true);
    setGeneratedResult(null);

    setGenerationStep('Analyzing spatial requirements and room zoning...');
    await new Promise((r) => setTimeout(r, 450));

    setGenerationStep('Computing 2D grid matrix, wall junctions, and door clearances...');
    await new Promise((r) => setTimeout(r, 450));

    setGenerationStep('Optimizing daylighting apertures and auto-furnishing layout...');

    try {
      const res = await fetch('/api/ai/generate-floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, plotConfig }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setGeneratedResult(data);
      sound.playSuccess();
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    sound.playSuccess();
    onApplyPlan(generatedResult.elements, generatedResult.projectName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0a0f1d] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1424] border-b border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8b5cf6] via-[#ec4899] to-[#4fc3f7] flex items-center justify-center text-white shadow-lg animate-pulse">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bebas text-2xl tracking-[1.5px] text-[#4fc3f7] leading-none">
                  AI TEXT-TO-FLOORPLAN GENERATOR
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-dm-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.7 Flash CAD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                Describe your dream layout or custom brief — ARIA generates a fully dimensioned, editable CAD floor plan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-dm-mono uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Architectural Design Brief / Prompt</span>
              <span className="text-[10px] text-slate-400 lowercase">e.g. rooms, bedrooms, pool, parking, style</span>
            </label>
            <div className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. Create a modern 3-bedroom single-story house with open kitchen, large living room, master en-suite, double garage, and swimming pool..."
                rows={3}
                className="w-full bg-[#111827] border border-[#1e3a5f] focus:border-[#4fc3f7] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none font-dm-sans transition-all"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !promptText.trim()}
                className="absolute bottom-3 right-3 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-[#4fc3f7] hover:opacity-90 disabled:opacity-40 text-white text-xs font-dm-sans font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-dm-mono uppercase tracking-wider text-slate-400">
              Or Choose an Architectural Blueprint Concept:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptText(p.prompt);
                    handleGenerate(p.prompt);
                  }}
                  disabled={isGenerating}
                  className="p-3 bg-[#111827] hover:bg-[#1a243a] border border-[#1e3a5f] hover:border-[#4fc3f7]/50 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-[#4fc3f7] flex items-center gap-1.5 font-dm-sans">
                      <span>{p.icon}</span>
                      <span>{p.title}</span>
                    </span>
                    <span className="text-[9px] font-dm-mono px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-dm-sans leading-relaxed">
                    {p.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Progress / Loading Banner */}
          {isGenerating && (
            <div className="p-4 bg-gradient-to-r from-purple-950/50 via-indigo-950/50 to-slate-900 border border-purple-500/40 rounded-xl flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-[#4fc3f7] animate-spin shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-dm-mono text-purple-200 font-semibold">
                  Generative CAD Synthesis in Progress
                </div>
                <div className="text-[11px] text-slate-400 font-dm-sans mt-0.5">
                  {generationStep}
                </div>
              </div>
            </div>
          )}

          {/* Generated Result Preview Card */}
          {generatedResult && (
            <div className="p-4 bg-gradient-to-r from-[#111c33] to-[#0a0f1d] border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-dm-mono font-bold text-emerald-300 uppercase">
                    Plan Generated Successfully
                  </span>
                </div>
                <div className="text-xs font-dm-mono text-slate-300">
                  {generatedResult.elements.length} CAD Elements · {generatedResult.totalAreaM2} m²
                </div>
              </div>

              <div className="bg-[#080d1a] p-3 rounded-lg border border-[#1e293b] space-y-1">
                <h4 className="text-xs font-bold text-[#4fc3f7] font-dm-sans">
                  {generatedResult.projectName}
                </h4>
                <p className="text-xs text-slate-300 font-dm-sans leading-relaxed">
                  {generatedResult.summary}
                </p>
                <div className="text-[10px] font-dm-mono text-amber-400 pt-1">
                  Envelope Footprint: {generatedResult.dimensions}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-dm-sans text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold text-xs font-dm-sans flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <span>Insert Floor Plan onto Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
