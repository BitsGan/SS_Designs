import React from 'react';
import { ToolType } from '../types';
import { sound } from '../utils/audio';
import {
  MousePointer,
  Square,
  Minus,
  DoorOpen,
  AppWindow,
  Circle,
  ArrowRight,
  Hexagon,
  PenTool,
  MoveHorizontal,
  Type as TypeIcon,
  AlignJustify,
  Armchair,
  SquareStack,
  Waves,
  Spline,
} from 'lucide-react';

interface SidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolDef {
  id: ToolType;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select Object', shortLabel: 'SEL', shortcut: 'S', icon: MousePointer },
  { id: 'room', label: 'Draft Room', shortLabel: 'ROOM', shortcut: 'R', icon: Square },
  { id: 'wall', label: 'Structural Wall', shortLabel: 'WALL', shortcut: 'W', icon: Minus },
  { id: 'door', label: 'Door Opening', shortLabel: 'DOOR', shortcut: 'D', icon: DoorOpen },
  { id: 'window', label: 'Window Glazing', shortLabel: 'WIN', shortcut: '', icon: AppWindow },
  { id: 'furniture', label: 'Furniture & Fixtures', shortLabel: 'FURN', shortcut: 'F', icon: Armchair },
  { id: 'measure', label: 'Dimension / Metric', shortLabel: 'DIM', shortcut: 'M', icon: MoveHorizontal },
  { id: 'circle', label: 'Circle / Column', shortLabel: 'CIRC', shortcut: 'C', icon: Circle },
  { id: 'arrow', label: 'Flow Arrow', shortLabel: 'ARROW', shortcut: 'A', icon: ArrowRight },
  { id: 'poly', label: 'Polygon Room', shortLabel: 'POLY', shortcut: 'P', icon: Hexagon },
  { id: 'arc', label: 'Curved Arc', shortLabel: 'ARC', shortcut: '', icon: Spline },
  { id: 'freehand', label: 'Freehand Sketch', shortLabel: 'FREE', shortcut: '', icon: PenTool },
  { id: 'text', label: 'Text Annotation', shortLabel: 'TEXT', shortcut: 'T', icon: TypeIcon },
  { id: 'stair', label: 'Staircase Flight', shortLabel: 'STAIR', shortcut: '', icon: AlignJustify },
  { id: 'column', label: 'Support Pillar', shortLabel: 'COL', shortcut: '', icon: SquareStack },
  { id: 'pool', label: 'Pool / Water Feature', shortLabel: 'POOL', shortcut: '', icon: Waves },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, onSelectTool }) => {
  const handleClick = (id: ToolType) => {
    sound.playClick();
    onSelectTool(id);
  };

  return (
    <aside className="w-[56px] bg-[#111827] border-r border-[#1e293b] flex flex-col items-center py-2 gap-1 shrink-0 overflow-y-auto custom-scrollbar select-none z-20">
      {TOOLS.map((tool, index) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <React.Fragment key={tool.id}>
            {/* Tool separator after certain groups */}
            {(index === 1 || index === 6 || index === 12) && (
              <div className="w-6 h-[1px] bg-[#1e293b] my-0.5" />
            )}

            <button
              onClick={() => handleClick(tool.id)}
              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] border border-[#2563eb44] shadow-sm'
                  : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
              }`}
              title={`${tool.label} ${tool.shortcut ? `[${tool.shortcut}]` : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[7.5px] font-dm-mono mt-0.5 tracking-tight font-medium opacity-80 leading-none">
                {tool.shortLabel}
              </span>

              {/* Tooltip on hover */}
              <div className="absolute left-[58px] bg-[#0f172a] text-slate-200 text-[10px] font-dm-mono px-2 py-1 rounded shadow-lg border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {tool.label} {tool.shortcut && <span className="text-amber-400 font-bold ml-1">[{tool.shortcut}]</span>}
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </aside>
  );
};
