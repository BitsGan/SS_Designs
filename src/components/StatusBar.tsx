import React from 'react';
import { ToolType } from '../types';

interface StatusBarProps {
  currentTool: ToolType;
  cursorX: number;
  cursorY: number;
  itemCount: number;
  snapEnabled: boolean;
  gestureActive: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentTool,
  cursorX,
  cursorY,
  itemCount,
  snapEnabled,
  gestureActive,
}) => {
  return (
    <footer className="h-9 bg-[#0a0f1a] flex items-center px-4 sm:px-6 gap-2.5 shrink-0 select-none text-[11px] font-dm-mono text-slate-400 z-30 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111827] text-slate-300 shadow-sm shrink-0">
        <span className="text-slate-500 font-medium">TOOL:</span>
        <span className="text-[#4fc3f7] font-semibold uppercase">{currentTool}</span>
      </div>

      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111827] text-slate-300 shadow-sm shrink-0">
        <span className="text-slate-500 font-medium">COORD:</span>
        <span>X: <strong className="text-slate-200 font-medium">{cursorX}</strong></span>
        <span>Y: <strong className="text-slate-200 font-medium">{cursorY}</strong></span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111827] text-slate-300 shadow-sm shrink-0">
        <span className="text-slate-500 font-medium">ELEMENTS:</span>
        <span className="text-amber-400 font-semibold">{itemCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111827] shadow-sm shrink-0">
        <span className="text-slate-500 font-medium">SNAP:</span>
        <div className={`w-1.5 h-1.5 rounded-full ${snapEnabled ? 'bg-[#4fc3f7]' : 'bg-slate-600'}`} />
        <span className={snapEnabled ? 'text-[#4fc3f7] font-semibold' : 'text-slate-400'}>
          {snapEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111827] shadow-sm shrink-0">
        <span className="text-slate-500 font-medium">GESTURE:</span>
        <div className={`w-1.5 h-1.5 rounded-full ${gestureActive ? 'bg-[#10b981] animate-pulse' : 'bg-slate-600'}`} />
        <span className={gestureActive ? 'text-[#10b981] font-semibold' : 'text-slate-400'}>
          {gestureActive ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 text-slate-400 text-xs font-dm-sans shrink-0 pl-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        <span className="font-medium text-slate-300">SS DESIGN STUDIO</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">Developed by SS Developments</span>
      </div>
    </footer>
  );
};
