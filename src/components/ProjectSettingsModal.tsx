import React from 'react';
import { ProjectMetadata } from '../types';
import { X, FileText, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ProjectMetadata;
  onUpdateMetadata: (meta: Partial<ProjectMetadata>) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onUpdateMetadata,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#111c33] border-b border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center text-[#4fc3f7]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bebas text-xl tracking-[1.5px] text-[#4fc3f7] leading-none">
                PROJECT INFORMATION & TITLE BLOCK
              </h2>
              <p className="text-[11px] text-slate-400 font-dm-sans mt-0.5">
                Configure certification data for exported blueprint stamps & CAD deliverables
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

        {/* Form */}
        <div className="p-6 space-y-4 font-dm-sans text-xs">
          <div>
            <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={metadata.projectName}
              onChange={(e) => onUpdateMetadata({ projectName: e.target.value })}
              className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={metadata.clientName}
                onChange={(e) => onUpdateMetadata({ clientName: e.target.value })}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
                Lead Architect
              </label>
              <input
                type="text"
                value={metadata.architectName}
                onChange={(e) => onUpdateMetadata({ architectName: e.target.value })}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
                Drawing Scale
              </label>
              <input
                type="text"
                value={metadata.scale}
                onChange={(e) => onUpdateMetadata({ scale: e.target.value })}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
                Revision
              </label>
              <input
                type="text"
                value={metadata.revision}
                onChange={(e) => onUpdateMetadata({ revision: e.target.value })}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-dm-mono text-[10px] uppercase mb-1">
                Unit System
              </label>
              <select
                value={metadata.unit}
                onChange={(e) => onUpdateMetadata({ unit: e.target.value as 'metric' | 'imperial' })}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-[#4fc3f7]"
              >
                <option value="metric">Metric (m / cm)</option>
                <option value="imperial">Imperial (ft / in)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                sound.playSuccess();
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Save Title Block Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
