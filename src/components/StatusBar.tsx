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
    <footer className="h-[22px] bg-[#0a0f1a] border-t border-[#1e293b] flex items-center px-3.5 gap-3.5 shrink-0 select-none text-[9px] font-dm-mono text-slate-500 z-30">
      <div className="flex items-center gap-1">
        <span>TOOL:</span>
        <span className="text-slate-300 font-semibold uppercase">{currentTool}</span>
      </div>

      <div className="flex items-center gap-1">
        <span>X:</span>
        <span className="text-slate-300">{cursorX}</span>
        <span>Y:</span>
        <span className="text-slate-300">{cursorY}</span>
      </div>

      <div className="flex items-center gap-1">
        <span>ITEMS:</span>
        <span className="text-slate-300">{itemCount}</span>
      </div>

      <div className="flex items-center gap-1">
        <span>SNAP:</span>
        <span className={snapEnabled ? 'text-[#4fc3f7] font-semibold' : 'text-slate-400'}>
          {snapEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span>GESTURE:</span>
        <span className={gestureActive ? 'text-[#10b981] font-semibold animate-pulse' : 'text-slate-400'}>
          {gestureActive ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="ml-auto text-slate-400 font-normal">
        SS DESIGN STUDIO · by SS Developments
      </div>
    </footer>
  );
};
