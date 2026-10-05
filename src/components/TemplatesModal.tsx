import React, { useState } from 'react';
import { TEMPLATES } from '../data/templates';
import { TemplateProject } from '../types';
import { X, Layers, Check, Sparkles, Building2, Home, Compass } from 'lucide-react';
import { sound } from '../utils/audio';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateProject) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Luxury', 'Residential', 'Commercial', 'Compact'];
  const filtered =
    activeCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleApply = (tpl: TemplateProject) => {
    sound.playSuccess();
    onSelectTemplate(tpl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#111c33] border-b border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#4fc3f7] flex items-center justify-center text-slate-900 shadow-md">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-bebas text-2xl tracking-[1.5px] text-[#4fc3f7] leading-none">
                ARCHITECTURAL TEMPLATES LIBRARY
              </h2>
              <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                Load fully-dimensioned, professional architectural plans designed to code
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

        {/* Category Tabs */}
        <div className="px-6 py-2.5 bg-[#0d1424] border-b border-[#1e293b] flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                sound.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-dm-mono cursor-pointer transition-all ${
                activeCategory === cat
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold border border-[#4fc3f7]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#111827] border border-[#1e293b] hover:border-[#4fc3f7]/60 rounded-xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-[#2563eb]/10"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-dm-mono uppercase tracking-wider text-[#f59e0b] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {tpl.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-[#4fc3f7] transition-colors mt-1.5 font-dm-sans">
                      {tpl.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-dm-mono text-[#10b981] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                    {tpl.area}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 font-dm-sans">
                  {tpl.description}
                </p>

                {/* Specs Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-dm-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    📐 {tpl.dimensions}
                  </span>
                  <span className="text-[10px] font-dm-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    🚪 {tpl.roomsCount} Rooms
                  </span>
                  {tpl.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-dm-sans px-2 py-0.5 rounded bg-[#1e293b] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleApply(tpl)}
                className="w-full py-2 px-3 rounded-lg bg-[#1e3a5f] hover:bg-[#2563eb] text-[#4fc3f7] hover:text-white text-xs font-semibold font-dm-sans flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Template to Canvas</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
