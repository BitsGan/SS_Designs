import React, { useState } from 'react';
import { FURNITURE_CATALOG, FURNITURE_CATEGORIES } from '../data/furnitureCatalog';
import { FurnitureCategory, FurnitureType } from '../types';
import { sound } from '../utils/audio';

interface FurniturePaletteProps {
  onAddFurniture: (type: FurnitureType) => void;
}

export const FurniturePalette: React.FC<FurniturePaletteProps> = ({ onAddFurniture }) => {
  const [selectedCat, setSelectedCat] = useState<FurnitureCategory>('living');

  const items = FURNITURE_CATALOG.filter((f) => f.category === selectedCat);

  return (
    <div className="p-3">
      <div className="text-[9px] font-dm-mono uppercase tracking-[1.5px] text-slate-400 mb-2 font-semibold flex items-center justify-between">
        <span>Furniture & Fixtures</span>
        <span className="text-[8px] text-[#a78bfa] font-mono">Catalog</span>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1.5 mb-2">
        {FURNITURE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCat(cat.id);
              sound.playClick();
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-dm-sans whitespace-nowrap cursor-pointer transition-colors ${
              selectedCat === cat.id
                ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold border border-[#2563eb44]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{cat.icon} {cat.label}</span>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              sound.playClick();
              onAddFurniture(item.id);
            }}
            className="w-full py-1.5 px-2 rounded border border-[#1e293b] hover:border-[#a78bfa]/50 hover:bg-[#1e293b] text-slate-300 text-left text-[11px] font-dm-sans flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span>{item.icon}</span>
              <span className="truncate group-hover:text-[#4fc3f7]">{item.name}</span>
            </div>
            <span className="text-[9px] font-dm-mono text-slate-400 shrink-0">
              {item.realDimensions}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
