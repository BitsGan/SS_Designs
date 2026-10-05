import React, { useState } from 'react';
import { AppMode } from '../types';
import { sound } from '../utils/audio';
import {
  Download,
  Trash2,
  HelpCircle,
  Hand,
  Volume2,
  VolumeX,
  Building2,
  Calculator,
  Settings,
  FileCode2,
  Sparkles,
  Wand2,
  Mic,
  Sun,
  Compass,
  Armchair,
  Footprints,
} from 'lucide-react';

interface TopBarProps {
  mode: AppMode;
  onSetMode: (mode: AppMode) => void;
  gestureActive: boolean;
  onToggleGesture: () => void;
  onShowGuide: () => void;
  onClear: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onOpenTemplates: () => void;
  onOpenAnalysis: () => void;
  onOpenSettings: () => void;
  onOpenAIGenerator: () => void;
  onToggleVoice: () => void;
  voiceActive: boolean;
  onOpenPlotSettings: () => void;
  onAutoFurnish: () => void;
  onToggleSolarBar: () => void;
  showSolarBar: boolean;
  projectName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onSetMode,
  gestureActive,
  onToggleGesture,
  onShowGuide,
  onClear,
  onExportPNG,
  onExportSVG,
  onOpenTemplates,
  onOpenAnalysis,
  onOpenSettings,
  onOpenAIGenerator,
  onToggleVoice,
  voiceActive,
  onOpenPlotSettings,
  onAutoFurnish,
  onToggleSolarBar,
  showSolarBar,
  projectName,
}) => {
  const [muted, setMuted] = useState(sound.isMuted());
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleMute = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleModeChange = (newMode: AppMode) => {
    sound.playClick();
    onSetMode(newMode);
  };

  return (
    <header className="h-[52px] bg-[#111827] border-b border-[#1e3a5f] flex items-center justify-between px-3 gap-2 shrink-0 select-none z-30">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 font-bebas text-xl tracking-[2px] text-[#4fc3f7] whitespace-nowrap">
          <div className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse shadow-sm shadow-amber-500" />
          <span>SS DESIGN STUDIO</span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1424] hover:bg-[#1e293b] border border-[#1e3a5f] text-slate-300 text-xs font-dm-sans cursor-pointer transition-colors max-w-[160px] truncate"
          title="Edit Project Title & Metadata"
        >
          <span className="text-[10px] text-amber-400 font-dm-mono uppercase">PROJECT:</span>
          <span className="font-medium truncate">{projectName}</span>
          <Settings className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
        </button>

        {/* AI Text-to-Floorplan Generation Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenAIGenerator();
          }}
          className="px-2.5 py-1.5 text-xs font-dm-sans font-semibold rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-[#4fc3f7] hover:opacity-95 text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          title="AI Text-to-Floorplan Generator"
        >
          <Wand2 className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">AI Generator</span>
        </button>
      </div>

      {/* Center 2D / 3D Mode Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex bg-[#0a0f1d] rounded-lg p-0.5 border border-[#1e3a5f]">
          <button
            onClick={() => handleModeChange('blueprint')}
            className={`px-3 py-1 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === 'blueprint'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blueprint
          </button>
          <button
            onClick={() => handleModeChange('realistic')}
            className={`px-3 py-1 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === 'realistic'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realistic
          </button>
          <button
            onClick={() => handleModeChange('3d')}
            className={`px-3 py-1 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === '3d'
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Hologram
          </button>
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Solar & Wind Study Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleSolarBar();
          }}
          className={`px-2 py-1.5 text-xs font-dm-sans rounded border transition-all flex items-center gap-1 cursor-pointer ${
            showSolarBar
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
              : 'bg-[#0d1424] hover:bg-[#1e3a5f] border-[#1e3a5f] text-slate-300'
          }`}
          title="Toggle Sunlight & Ventilation Simulation Bar"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Sun & Wind</span>
        </button>

        {/* Site & Plot Configuration */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenPlotSettings();
          }}
          className="px-2 py-1.5 text-xs font-dm-sans rounded bg-[#0d1424] hover:bg-[#1e3a5f] border border-[#1e3a5f] text-slate-300 hover:text-[#4fc3f7] flex items-center gap-1 cursor-pointer transition-colors"
          title="Site Boundaries, Plot Area & Setbacks"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Site & Plot</span>
        </button>

        {/* Smart 1-Click Auto-Furnish */}
        <button
          onClick={() => {
            sound.playSuccess();
            onAutoFurnish();
          }}
          className="px-2 py-1.5 text-xs font-dm-sans rounded bg-[#0d1424] hover:bg-[#1e3a5f] border border-[#1e3a5f] text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
          title="Smart Auto-Furnish All Rooms"
        >
          <Armchair className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">Auto-Furnish</span>
        </button>

        {/* Templates Gallery Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenTemplates();
          }}
          className="px-2 py-1.5 text-xs font-dm-sans font-medium rounded bg-[#0d1424] hover:bg-[#1e3a5f] border border-[#1e3a5f] text-[#4fc3f7] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* AI Audit & BOQ Cost Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenAnalysis();
          }}
          className="px-2.5 py-1.5 text-xs font-dm-sans font-medium rounded bg-[#0d1424] hover:bg-[#1e3a5f] border border-[#1e3a5f] text-emerald-400 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Audit & BOQ</span>
        </button>

        {/* Voice Architecture Control Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleVoice();
          }}
          className={`px-2.5 py-1.5 text-xs font-dm-sans font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
            voiceActive
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md animate-pulse'
              : 'bg-[#1e293b] hover:bg-slate-700 text-slate-300'
          }`}
          title="Voice-Controlled Architectural Drafting"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{voiceActive ? 'Voice ON' : 'Voice'}</span>
        </button>

        {/* Hand Gesture Control Toggle */}
        <button
          onClick={onToggleGesture}
          className={`px-2.5 py-1.5 text-xs font-dm-sans font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
            gestureActive
              ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-md'
              : 'bg-[#1e293b] hover:bg-slate-700 text-slate-300'
          }`}
          title="Camera-based Hand Gesture Drafting Control"
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{gestureActive ? 'Hand ON' : 'Gesture'}</span>
        </button>

        {gestureActive && (
          <button
            onClick={onShowGuide}
            className="p-1.5 text-xs rounded border border-[#1e3a5f] text-purple-300 hover:bg-[#1e293b] cursor-pointer"
            title="Hand Gesture Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded border border-[#1e3a5f] text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] cursor-pointer transition-colors"
          title={muted ? 'Unmute Drafting Sound FX' : 'Mute Drafting Sound FX'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
        </button>

        {/* Clear Button */}
        <button
          onClick={() => {
            sound.playDelete();
            onClear();
          }}
          className="p-1.5 rounded border border-[#1e3a5f] text-slate-400 hover:text-red-400 hover:bg-[#1e293b] cursor-pointer transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-3 py-1.5 text-xs font-dm-sans font-semibold rounded bg-[#4fc3f7] hover:bg-[#38bdf8] text-[#0d1117] flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0f172a] border border-[#1e3a5f] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPNG();
                }}
                className="w-full px-3 py-2 text-left text-xs font-dm-sans text-slate-200 hover:bg-[#1e3a5f] hover:text-[#4fc3f7] flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#4fc3f7]" />
                <span>Stamped PNG (2x)</span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExportSVG();
                }}
                className="w-full px-3 py-2 text-left text-xs font-dm-sans text-slate-200 hover:bg-[#1e3a5f] hover:text-[#4fc3f7] flex items-center gap-2 cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Vector SVG (CAD)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
