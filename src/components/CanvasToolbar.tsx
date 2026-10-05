import React from 'react';
import { Undo2, Magnet, Grid3X3 } from 'lucide-react';

interface CanvasToolbarProps {
  gridSize: number;
  onSetGridSize: (size: number) => void;
  currentColor: string;
  onSetColor: (color: string) => void;
  strokeWidth: number;
  onSetStrokeWidth: (width: number) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  showGrid: boolean;
  onToggleShowGrid: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const COLORS = [
  { hex: '#4fc3f7', label: 'Cyan' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#e2e8f0', label: 'White' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#a78bfa', label: 'Purple' },
  { hex: '#fb7185', label: 'Rose' },
];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  gridSize,
  onSetGridSize,
  currentColor,
  onSetColor,
  strokeWidth,
  onSetStrokeWidth,
  snapEnabled,
  onToggleSnap,
  showGrid,
  onToggleShowGrid,
  onUndo,
  canUndo,
}) => {
  return (
    <div className="h-9 bg-[#111827] border-b border-[#1e293b] flex items-center px-3 gap-3 shrink-0 flex-wrap text-xs select-none z-10">
      {/* Grid scale */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-dm-mono uppercase tracking-wider">Scale</span>
        <select
          value={gridSize}
          onChange={(e) => onSetGridSize(Number(e.target.value))}
          className="bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-2 py-0.5 rounded font-dm-mono focus:outline-none focus:border-[#4fc3f7] cursor-pointer"
        >
          <option value={20}>20px · 1m</option>
          <option value={40}>40px · 2m</option>
          <option value={80}>80px · 4m</option>
        </select>
      </div>

      <div className="w-[1px] h-4 bg-[#1e293b]" />

      {/* Color Palette */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-dm-mono uppercase tracking-wider">Color</span>
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => onSetColor(c.hex)}
              className={`w-5 h-5 rounded transition-transform cursor-pointer border ${
                currentColor === c.hex
                  ? 'border-2 border-[#4fc3f7] scale-110 shadow-sm'
                  : 'border-slate-700 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="w-[1px] h-4 bg-[#1e293b]" />

      {/* Stroke Width */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-dm-mono uppercase tracking-wider">W</span>
        <input
          type="number"
          min={1}
          max={12}
          value={strokeWidth}
          onChange={(e) => onSetStrokeWidth(Math.max(1, Math.min(12, Number(e.target.value))))}
          className="w-10 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-center focus:outline-none focus:border-[#4fc3f7]"
        />
      </div>

      <div className="w-[1px] h-4 bg-[#1e293b]" />

      {/* Toggles */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 text-[10px] font-dm-mono text-slate-400 hover:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={onToggleSnap}
            className="rounded border-slate-700 text-[#4fc3f7] focus:ring-0 accent-[#4fc3f7]"
          />
          <span className="flex items-center gap-0.5">
            <Magnet className="w-3 h-3 text-[#4fc3f7]" /> Snap
          </span>
        </label>

        <label className="flex items-center gap-1 text-[10px] font-dm-mono text-slate-400 hover:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={onToggleShowGrid}
            className="rounded border-slate-700 text-[#4fc3f7] focus:ring-0 accent-[#4fc3f7]"
          />
          <span className="flex items-center gap-0.5">
            <Grid3X3 className="w-3 h-3 text-slate-400" /> Grid
          </span>
        </label>
      </div>

      {/* Undo */}
      <div className="ml-auto flex items-center">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-2.5 py-1 text-[10px] font-dm-mono rounded border flex items-center gap-1 transition-all cursor-pointer ${
            canUndo
              ? 'border-[#1e3a5f] text-slate-300 hover:bg-[#1e293b] active:scale-95'
              : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
          }`}
          title="Undo last action (Ctrl+Z)"
        >
          <Undo2 className="w-3 h-3" />
          <span>Undo</span>
        </button>
      </div>
    </div>
  );
};
