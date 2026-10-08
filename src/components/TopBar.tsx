import React, { useState, useRef } from 'react';
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
  Moon,
  Compass,
  Armchair,
  Footprints,
  ChevronDown,
  Wrench,
  FolderKanban,
  SlidersHorizontal,
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
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}) => {
  const [muted, setMuted] = useState(sound.isMuted());
  const [activeDropdown, setActiveDropdown] = useState<'tools' | 'project' | 'controls' | 'export' | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const toggleMute = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleModeChange = (newMode: AppMode) => {
    sound.playClick();
    onSetMode(newMode);
  };

  const handleMouseEnter = (menu: 'tools' | 'project' | 'controls' | 'export') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const toggleDropdown = (menu: 'tools' | 'project' | 'controls' | 'export') => {
    sound.playClick();
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  };

  return (
    <header className="h-[56px] bg-[#111827] flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0 select-none z-30">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 font-bebas text-xl tracking-[2px] text-[#4fc3f7] whitespace-nowrap">
          <div className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse shadow-sm shadow-amber-500" />
          <span>SS DESIGN STUDIO</span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d1424] hover:bg-[#1e293b] text-slate-300 text-xs font-dm-sans cursor-pointer transition-colors max-w-[170px] truncate shadow-sm"
          title="Edit Project Title & Metadata"
        >
          <span className="text-[10px] text-amber-400 font-dm-mono uppercase font-bold">PROJECT:</span>
          <span className="font-medium truncate">{projectName}</span>
          <Settings className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
        </button>

        {/* AI Text-to-Floorplan Generation Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenAIGenerator();
          }}
          className="px-2.5 py-1 text-xs font-dm-sans font-semibold rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-[#4fc3f7] hover:opacity-95 text-white flex items-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          title="AI Text-to-Floorplan Generator"
        >
          <span>AI Generator</span>
        </button>
      </div>

      {/* Center 2D / 3D Mode Switcher */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <div className="flex bg-[#0a0f1d] rounded-lg p-0.5 shadow-inner">
          <button
            onClick={() => handleModeChange('blueprint')}
            className={`px-3 py-1.5 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === 'blueprint'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blueprint
          </button>
          <button
            onClick={() => handleModeChange('realistic')}
            className={`px-3 py-1.5 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === 'realistic'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realistic
          </button>
          <button
            onClick={() => handleModeChange('3d')}
            className={`px-3 py-1.5 rounded-md text-xs font-dm-mono cursor-pointer transition-colors ${
              mode === '3d'
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Hologram
          </button>
        </div>
      </div>

      {/* Right Actions & Utilities (Grouped Hubs + Pill + Export) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Hub 1: Studio Tools */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('tools')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => toggleDropdown('tools')}
            className={`px-2.5 py-1.5 text-xs font-dm-sans rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              showSolarBar || activeDropdown === 'tools'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] font-medium'
                : 'bg-[#0d1424] hover:bg-[#1e3a5f] text-slate-300 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-[#4fc3f7]" />
            <span>Studio Tools</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'tools' ? 'rotate-180 text-[#4fc3f7]' : 'text-slate-400'}`} />
          </button>

          {activeDropdown === 'tools' && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0f1d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in space-y-1">
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleSolarBar();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Sun & Wind Simulation</div>
                  <div className="text-[10px] text-slate-400">Solar shadow & air circulation</div>
                </div>
                <span className={`text-[10px] font-dm-mono px-1.5 py-0.5 rounded ${showSolarBar ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500'}`}>
                  {showSolarBar ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenPlotSettings();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Site & Plot Boundaries</div>
                  <div className="text-[10px] text-slate-400">Setbacks, dimensions & zoning</div>
                </div>
              </button>

              <button
                onClick={() => {
                  sound.playSuccess();
                  onAutoFurnish();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Armchair className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Auto-Furnish Rooms</div>
                  <div className="text-[10px] text-slate-400">Populate rooms with furniture</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hub 2: Project */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('project')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => toggleDropdown('project')}
            className={`px-2.5 py-1.5 text-xs font-dm-sans rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeDropdown === 'project'
                ? 'bg-[#1e3a5f] text-[#4fc3f7] font-medium'
                : 'bg-[#0d1424] hover:bg-[#1e3a5f] text-slate-300 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
            <span>Project</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'project' ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
          </button>

          {activeDropdown === 'project' && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0f1d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in space-y-1">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenTemplates();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#4fc3f7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Floor Plan Templates</div>
                  <div className="text-[10px] text-slate-400">Load sample villas & apartments</div>
                </div>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAnalysis();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">AI Audit & BOQ Cost</div>
                  <div className="text-[10px] text-slate-400">Spatial compliance & estimations</div>
                </div>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSettings();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Project Details</div>
                  <div className="text-[10px] text-slate-400 truncate">{projectName}</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hub 3: Input Controls (Voice & Hand Gestures) */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('controls')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => toggleDropdown('controls')}
            className={`px-2.5 py-1.5 text-xs font-dm-sans rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              voiceActive || gestureActive || activeDropdown === 'controls'
                ? 'bg-[#1e3a5f] text-emerald-300 font-medium'
                : 'bg-[#0d1424] hover:bg-[#1e3a5f] text-slate-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Controls</span>
            {(voiceActive || gestureActive) && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'controls' ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
          </button>

          {activeDropdown === 'controls' && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0f1d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in space-y-1">
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleVoice();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Mic className={`w-4 h-4 ${voiceActive ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Voice Drafting</div>
                  <div className="text-[10px] text-slate-400">Microphone speech commands</div>
                </div>
                <span className={`text-[10px] font-dm-mono px-1.5 py-0.5 rounded ${voiceActive ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-500'}`}>
                  {voiceActive ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  onToggleGesture();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <Hand className={`w-4 h-4 ${gestureActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Hand Gestures</div>
                  <div className="text-[10px] text-slate-400">Camera optical motion tracking</div>
                </div>
                <span className={`text-[10px] font-dm-mono px-1.5 py-0.5 rounded ${gestureActive ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'}`}>
                  {gestureActive ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onShowGuide();
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e293b] text-left cursor-pointer transition-colors group/item"
              >
                <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Gesture Guide</div>
                  <div className="text-[10px] text-slate-400">Index of 6 hand postures</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Pill: [ ☀️/🌙 | 🔊 | 🗑️ ] */}
        <div className="flex items-center bg-[#0d1424] rounded-lg p-0.5 shadow-sm">
          <button
            onClick={() => {
              sound.playClick();
              onToggleTheme();
            }}
            className="p-1.5 rounded-md hover:bg-[#1e293b] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <div className="w-[1px] h-3.5 bg-[#1e293b] my-auto mx-0.5" />
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-md hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={muted ? 'Unmute Drafting Sound FX' : 'Mute Drafting Sound FX'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>
          <div className="w-[1px] h-3.5 bg-[#1e293b] my-auto mx-0.5" />
          <button
            onClick={() => {
              sound.playDelete();
              onClear();
            }}
            className="p-1.5 rounded-md hover:bg-[#1e293b] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Clear All Canvas Elements"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Export Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('export')}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => toggleDropdown('export')}
            className="px-3 py-1.5 text-xs font-dm-sans font-semibold rounded-lg bg-[#4fc3f7] hover:bg-[#38bdf8] text-[#0d1117] flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {activeDropdown === 'export' && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0f1d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in space-y-1">
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  onExportPNG();
                }}
                className="w-full px-3 py-2 text-left text-xs font-dm-sans text-slate-200 hover:bg-[#1e3a5f] hover:text-[#4fc3f7] flex items-center gap-2 cursor-pointer transition-colors rounded-lg"
              >
                <Download className="w-3.5 h-3.5 text-[#4fc3f7]" />
                <span>Stamped PNG (2x)</span>
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  onExportSVG();
                }}
                className="w-full px-3 py-2 text-left text-xs font-dm-sans text-slate-200 hover:bg-[#1e3a5f] hover:text-[#4fc3f7] flex items-center gap-2 cursor-pointer transition-colors rounded-lg"
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
