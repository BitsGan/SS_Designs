import React, { useState } from 'react';
import { RenderStyle, AppMode, CanvasElement, Layer, RoomType, FurnitureType, WallType, FlooringType } from '../types';
import { Plus, Eye, EyeOff, Layers, Armchair, Trash2, Sliders, Box, Palette, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { FurniturePalette } from './FurniturePalette';
import { WALL_TYPE_CONFIG, FLOORING_MATERIALS } from '../utils/floorAndWallUtils';

interface RightPanelProps {
  renderStyle: RenderStyle;
  onSetRenderStyle: (style: RenderStyle) => void;
  appMode: AppMode;
  rot3dX: number;
  onSetRot3dX: (val: number) => void;
  rot3dY: number;
  onSetRot3dY: (val: number) => void;
  zoom3d: number;
  onSetZoom3d: (val: number) => void;
  height3d: number;
  onSetHeight3d: (val: number) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  selectedElement: CanvasElement | null;
  onUpdateElement: (updated: Partial<CanvasElement>) => void;
  onDeleteSelected: () => void;
  onAddPresetRoom: (type: RoomType) => void;
  onAddFurniture: (type: FurnitureType) => void;
  layers: Layer[];
  activeLayer: number;
  onSetActiveLayer: (id: number) => void;
  onToggleLayerVisible: (id: number) => void;
  onAddLayer: () => void;
  elements: CanvasElement[];
}

const STYLES: { id: RenderStyle; label: string }[] = [
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'sketch', label: 'Sketch' },
  { id: 'realistic', label: 'Photo-Real' },
  { id: 'night', label: 'Night' },
  { id: 'xray', label: 'X-Ray' },
];

const ROOM_PRESETS: { type: RoomType; label: string; icon: string }[] = [
  { type: 'bedroom', label: 'Bedroom (4m × 4m)', icon: '🛏️' },
  { type: 'living', label: 'Great Room (6m × 5m)', icon: '🛋️' },
  { type: 'kitchen', label: 'Kitchen & Bar (5m × 4m)', icon: '🍳' },
  { type: 'bathroom', label: 'Master Bath (3m × 3m)', icon: '🚿' },
  { type: 'office', label: 'Work Studio (4m × 3m)', icon: '💼' },
  { type: 'garage', label: '2-Car Garage (6m × 6m)', icon: '🚗' },
  { type: 'pool', label: 'Infinity Pool (8m × 4m)', icon: '🏊' },
];

export const RightPanel: React.FC<RightPanelProps> = ({
  renderStyle,
  onSetRenderStyle,
  appMode,
  rot3dX,
  onSetRot3dX,
  rot3dY,
  onSetRot3dY,
  zoom3d,
  onSetZoom3d,
  height3d,
  onSetHeight3d,
  autoRotate,
  onToggleAutoRotate,
  selectedElement,
  onUpdateElement,
  onDeleteSelected,
  onAddPresetRoom,
  onAddFurniture,
  layers,
  activeLayer,
  onSetActiveLayer,
  onToggleLayerVisible,
  onAddLayer,
  elements,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'furniture' | 'rooms'>('inspector');

  const getPropVal = (key: 'x' | 'y' | 'w' | 'h' | 'label') => {
    if (!selectedElement) return '—';
    if (key === 'x') return Math.round(selectedElement.x1);
    if (key === 'y') return Math.round(selectedElement.y1);
    if (key === 'w') {
      return selectedElement.x2 !== undefined
        ? Math.round(Math.abs(selectedElement.x2 - selectedElement.x1))
        : '—';
    }
    if (key === 'h') {
      return selectedElement.y2 !== undefined
        ? Math.round(Math.abs(selectedElement.y2 - selectedElement.y1))
        : '—';
    }
    if (key === 'label') {
      return selectedElement.label || selectedElement.roomType || selectedElement.type;
    }
    return '—';
  };

  const handlePropChange = (key: 'x' | 'y' | 'w' | 'h' | 'label', val: string) => {
    if (!selectedElement) return;
    const num = parseInt(val);

    if (key === 'x' && !isNaN(num)) {
      const diff = num - selectedElement.x1;
      onUpdateElement({
        x1: num,
        x2: selectedElement.x2 !== undefined ? selectedElement.x2 + diff : undefined,
      });
    } else if (key === 'y' && !isNaN(num)) {
      const diff = num - selectedElement.y1;
      onUpdateElement({
        y1: num,
        y2: selectedElement.y2 !== undefined ? selectedElement.y2 + diff : undefined,
      });
    } else if (key === 'w' && !isNaN(num) && selectedElement.x2 !== undefined) {
      onUpdateElement({ x2: selectedElement.x1 + num });
    } else if (key === 'h' && !isNaN(num) && selectedElement.y2 !== undefined) {
      onUpdateElement({ y2: selectedElement.y1 + num });
    } else if (key === 'label') {
      onUpdateElement({ label: val });
    }
  };

  return (
    <aside className="w-[230px] bg-[#111827] border-l border-[#1e293b] flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none z-20 text-slate-300 divide-y divide-[#1e293b]">
      {/* Tab Navigation in Right Panel */}
      <div className="p-1.5 bg-[#0d1424] flex gap-1 border-b border-[#1e293b] shrink-0">
        <button
          onClick={() => {
            setActiveTab('inspector');
            sound.playClick();
          }}
          className={`flex-1 py-1 text-[10px] font-dm-mono rounded cursor-pointer transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'inspector'
              ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Properties</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('furniture');
            sound.playClick();
          }}
          className={`flex-1 py-1 text-[10px] font-dm-mono rounded cursor-pointer transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'furniture'
              ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Armchair className="w-3 h-3" />
          <span>Furniture</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('rooms');
            sound.playClick();
          }}
          className={`flex-1 py-1 text-[10px] font-dm-mono rounded cursor-pointer transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'rooms'
              ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>Presets</span>
        </button>
      </div>

      {/* Tab: Furniture Catalog */}
      {activeTab === 'furniture' && (
        <FurniturePalette onAddFurniture={onAddFurniture} />
      )}

      {/* Tab: Room Presets */}
      {activeTab === 'rooms' && (
        <div className="p-3">
          <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-slate-400 mb-2 font-semibold">
            One-Click Room Presets
          </div>
          <div className="space-y-1">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.type}
                onClick={() => {
                  sound.playClick();
                  onAddPresetRoom(preset.type);
                }}
                className="w-full py-1.5 px-2.5 rounded border border-[#1e293b] hover:border-[#4fc3f7]/50 text-slate-300 hover:bg-[#1e293b] text-left text-[11px] font-dm-sans flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>{preset.icon}</span>
                <span className="truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Main Inspector */}
      {activeTab === 'inspector' && (
        <>
          {/* Render Style Section */}
          <div className="p-3">
            <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-slate-400 mb-2 font-semibold">
              Render Theme
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    sound.playClick();
                    onSetRenderStyle(st.id);
                  }}
                  className={`py-1.5 px-2 text-[10px] font-dm-sans rounded border transition-all cursor-pointer text-center ${
                    renderStyle === st.id
                      ? 'bg-[#1e3a5f] border-[#2563eb44] text-[#4fc3f7] font-semibold'
                      : 'border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3D View Controls (Visible when in 3D mode) */}
          {appMode === '3d' && (
            <div className="p-3 bg-[#0a0d16]">
              <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-amber-400 mb-2 font-semibold flex items-center justify-between">
                <span>3D Hologram Camera</span>
                <span className="text-[8px] text-slate-400 font-normal">Active</span>
              </div>

              <div className="space-y-2 text-[10px] font-dm-mono">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 w-10">ROT X</label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={rot3dX}
                    onChange={(e) => onSetRot3dX(Number(e.target.value))}
                    className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-slate-400 w-6 text-right">{rot3dX}°</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-400 w-10">ROT Y</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rot3dY}
                    onChange={(e) => onSetRot3dY(Number(e.target.value))}
                    className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-slate-400 w-6 text-right">{rot3dY}°</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-400 w-10">ZOOM</label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={zoom3d}
                    onChange={(e) => onSetZoom3d(Number(e.target.value))}
                    className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-slate-400 w-6 text-right">{zoom3d}</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-400 w-10">HEIGHT</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.1"
                    value={height3d}
                    onChange={(e) => onSetHeight3d(Number(e.target.value))}
                    className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded"
                  />
                  <span className="text-slate-400 w-6 text-right">{height3d}m</span>
                </div>

                <label className="flex items-center gap-2 text-[10px] text-slate-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={onToggleAutoRotate}
                    className="accent-amber-500 rounded"
                  />
                  <span>Auto-rotate camera</span>
                </label>
              </div>
            </div>
          )}

          {/* Properties Inspector */}
          <div className="p-3">
            <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-slate-400 mb-2 font-semibold flex items-center justify-between">
              <span>Properties</span>
              {selectedElement && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#4fc3f7] uppercase font-mono">
                    {selectedElement.type}
                  </span>
                  <button
                    onClick={() => {
                      sound.playDelete();
                      onDeleteSelected();
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Element"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-dm-sans">X Pos (px)</span>
                <input
                  type="text"
                  disabled={!selectedElement}
                  value={getPropVal('x')}
                  onChange={(e) => handlePropChange('x', e.target.value)}
                  className="w-16 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-right focus:outline-none focus:border-[#4fc3f7] disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-dm-sans">Y Pos (px)</span>
                <input
                  type="text"
                  disabled={!selectedElement}
                  value={getPropVal('y')}
                  onChange={(e) => handlePropChange('y', e.target.value)}
                  className="w-16 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-right focus:outline-none focus:border-[#4fc3f7] disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-dm-sans">Width</span>
                <input
                  type="text"
                  disabled={!selectedElement || selectedElement.x2 === undefined}
                  value={getPropVal('w')}
                  onChange={(e) => handlePropChange('w', e.target.value)}
                  className="w-16 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-right focus:outline-none focus:border-[#4fc3f7] disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-dm-sans">Height</span>
                <input
                  type="text"
                  disabled={!selectedElement || selectedElement.y2 === undefined}
                  value={getPropVal('h')}
                  onChange={(e) => handlePropChange('h', e.target.value)}
                  className="w-16 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-right focus:outline-none focus:border-[#4fc3f7] disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-dm-sans">Label</span>
                <input
                  type="text"
                  disabled={!selectedElement}
                  value={getPropVal('label')}
                  onChange={(e) => handlePropChange('label', e.target.value)}
                  className="w-24 bg-[#0d1117] border border-[#1e293b] text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-dm-mono text-right focus:outline-none focus:border-[#4fc3f7] disabled:opacity-40"
                />
              </div>

              {/* Floor Level Assignment */}
              {selectedElement && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-dm-sans">Floor Level</span>
                  <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#1e293b]">
                    {[0, 1, 2].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          sound.playClick();
                          onUpdateElement({ floorLevel: lvl });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-dm-mono rounded transition-colors cursor-pointer ${
                          (selectedElement.floorLevel || 0) === lvl
                            ? 'bg-[#1e3a5f] text-[#4fc3f7] font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        L{lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wall Specific Properties: Type, Color, Height */}
              {selectedElement && selectedElement.type === 'wall' && (
                <div className="pt-2 border-t border-[#1e293b]/60 mt-2 space-y-2">
                  <div className="text-[9px] font-dm-mono uppercase text-amber-400 font-semibold flex items-center justify-between">
                    <span>Wall Specifications</span>
                    <span className="text-[8px] text-slate-400">3D Finish</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-dm-sans">Structural Type</span>
                    <div className="grid grid-cols-2 gap-1">
                      {(Object.keys(WALL_TYPE_CONFIG) as WallType[]).map((wt) => {
                        const cfg = WALL_TYPE_CONFIG[wt];
                        const isSelected = (selectedElement.wallType || 'exterior') === wt;
                        return (
                          <button
                            key={wt}
                            onClick={() => {
                              sound.playClick();
                              onUpdateElement({ wallType: wt });
                            }}
                            className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1e3a5f] border-[#4fc3f7] text-[#4fc3f7] font-semibold'
                                : 'bg-[#0d1117] border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: cfg.colorHex }}
                            />
                            <span className="text-[10px] font-dm-sans truncate">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-dm-sans">Wall Color Tint</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.wallColor || '#ffffff'}
                        onChange={(e) => onUpdateElement({ wallColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        title="Custom wall color tint"
                      />
                      <button
                        onClick={() => onUpdateElement({ wallColor: undefined })}
                        className="text-[9px] font-dm-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Room Specific Properties: Flooring Finishes */}
              {selectedElement && (selectedElement.type === 'room' || selectedElement.type === 'pool') && (
                <div className="pt-2 border-t border-[#1e293b]/60 mt-2 space-y-2">
                  <div className="text-[9px] font-dm-mono uppercase text-cyan-400 font-semibold flex items-center justify-between">
                    <span>Flooring & Material Design</span>
                    <span className="text-[8px] text-slate-400">Separate Floors</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-dm-sans">Flooring Finish</span>
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                      {(Object.keys(FLOORING_MATERIALS) as FlooringType[]).map((ft) => {
                        const mat = FLOORING_MATERIALS[ft];
                        const isSelected = (selectedElement.flooringType || 'hardwood') === ft;
                        return (
                          <button
                            key={ft}
                            onClick={() => {
                              sound.playClick();
                              onUpdateElement({ flooringType: ft });
                            }}
                            className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1e3a5f] border-[#4fc3f7] text-[#4fc3f7] font-semibold'
                                : 'bg-[#0d1117] border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-xs">{mat.icon}</span>
                            <span className="text-[10px] font-dm-sans truncate">{mat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive State Controls */}
              {selectedElement && (
                <div className="pt-2 border-t border-[#1e293b]/60 mt-2 space-y-2">
                  <div className="text-[9px] font-dm-mono uppercase text-[#4fc3f7] font-semibold">
                    Interactive Controls
                  </div>

                  {(selectedElement.type === 'door' || selectedElement.furnitureType === 'compound_gate') && (
                    <div className="flex items-center justify-between bg-[#0a0d16] p-1.5 rounded border border-[#1e293b]">
                      <span className="text-[10px] text-slate-300 font-dm-sans">Door / Gate Leaf</span>
                      <button
                        onClick={() => {
                          const next = selectedElement.isOpen === false ? true : false;
                          if (next) sound.playDoorOpen();
                          else sound.playDoorClose();
                          onUpdateElement({ isOpen: next });
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-dm-mono cursor-pointer transition-colors ${
                          selectedElement.isOpen !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {selectedElement.isOpen !== false ? 'OPEN (85°)' : 'CLOSED'}
                      </button>
                    </div>
                  )}

                  {(selectedElement.furnitureType === 'garden_light' || selectedElement.furnitureType === 'tv_unit') && (
                    <div className="flex items-center justify-between bg-[#0a0d16] p-1.5 rounded border border-[#1e293b]">
                      <span className="text-[10px] text-slate-300 font-dm-sans">Power / Illumination</span>
                      <button
                        onClick={() => {
                          const next = selectedElement.isOn === false ? true : false;
                          sound.playLightClick();
                          onUpdateElement({ isOn: next });
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-dm-mono cursor-pointer transition-colors ${
                          selectedElement.isOn !== false
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {selectedElement.isOn !== false ? 'ON (ACTIVE)' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {(selectedElement.furnitureType === 'outdoor_bbq' || selectedElement.furnitureType === 'stove') && (
                    <div className="flex items-center justify-between bg-[#0a0d16] p-1.5 rounded border border-[#1e293b]">
                      <span className="text-[10px] text-slate-300 font-dm-sans">Flame / Grill Burner</span>
                      <button
                        onClick={() => {
                          const next = selectedElement.isOn === true ? false : true;
                          sound.playFireIgnite();
                          onUpdateElement({ isOn: next });
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-dm-mono cursor-pointer transition-colors ${
                          selectedElement.isOn === true
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {selectedElement.isOn === true ? 'BURNING 🔥' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {(selectedElement.type === 'pool' ||
                    selectedElement.furnitureType === 'garden_fountain' ||
                    selectedElement.furnitureType === 'bathtub' ||
                    selectedElement.furnitureType === 'shower') && (
                    <div className="flex items-center justify-between bg-[#0a0d16] p-1.5 rounded border border-[#1e293b]">
                      <span className="text-[10px] text-slate-300 font-dm-sans">Water Flow & Jets</span>
                      <button
                        onClick={() => {
                          const next = selectedElement.waterActive === false ? true : false;
                          sound.playWaterSplash();
                          onUpdateElement({ waterActive: next });
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-dm-mono cursor-pointer transition-colors ${
                          selectedElement.waterActive !== false
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {selectedElement.waterActive !== false ? 'FLOWING 💧' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {(selectedElement.furnitureType === 'car' || selectedElement.furnitureType === 'suv') && (
                    <div className="flex items-center justify-between bg-[#0a0d16] p-1.5 rounded border border-[#1e293b]">
                      <span className="text-[10px] text-slate-300 font-dm-sans">Headlights & Engine</span>
                      <button
                        onClick={() => {
                          const next = selectedElement.isOn === false ? true : false;
                          sound.playCarHonk();
                          onUpdateElement({ isOn: next });
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-dm-mono cursor-pointer transition-colors ${
                          selectedElement.isOn !== false
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {selectedElement.isOn !== false ? 'HEADLIGHTS ON' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {/* Setback Encroachment Warning */}
                  {selectedElement.isSetbackViolated && (
                    <div className="p-2 bg-red-950/40 border border-red-500/50 rounded text-red-300 text-[10px] font-dm-sans">
                      <div className="font-semibold flex items-center gap-1">
                        <span>⚠️ Setback Encroachment</span>
                      </div>
                      <div className="text-[9px] text-red-200/80 mt-0.5">
                        Exceeds property setback envelope by {selectedElement.setbackViolationAmountM || 0.5}m.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Layers Manager */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-slate-400 mb-2 font-semibold flex items-center justify-between">
          <span>Layers</span>
          <span className="text-[8px] text-slate-400 font-mono">{layers.length} Total</span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-36 custom-scrollbar pr-1">
          {layers.map((layer) => {
            const count = elements.filter((el) => el.layer === layer.id).length;
            const isSel = activeLayer === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => {
                  sound.playClick();
                  onSetActiveLayer(layer.id);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                  isSel
                    ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerVisible(layer.id);
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {layer.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                </button>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color || '#4fc3f7' }}
                />
                <span className="font-dm-mono text-[10px] flex-1 truncate">{layer.name}</span>
                <span className="text-[9px] text-slate-400 font-dm-mono">{count}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onAddLayer();
          }}
          className="mt-2 w-full py-1.5 border border-dashed border-[#1e293b] hover:border-slate-600 text-slate-400 hover:text-slate-300 rounded font-dm-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Layer</span>
        </button>
      </div>
    </aside>
  );
};
