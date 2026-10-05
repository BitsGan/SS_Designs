import React from 'react';
import { PlotConfiguration } from '../types';
import { Compass, X, MapPin, Ruler, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface PlotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotConfig: PlotConfiguration;
  onUpdate: (cfg: PlotConfiguration) => void;
  builtUpAreaM2: number;
}

export const PlotSettingsModal: React.FC<PlotSettingsModalProps> = ({
  isOpen,
  onClose,
  plotConfig,
  onUpdate,
  builtUpAreaM2,
}) => {
  if (!isOpen) return null;

  const plotAreaM2 = plotConfig.widthM * plotConfig.depthM;
  const coverageRatio = plotAreaM2 > 0 ? Math.min(100, Math.round((builtUpAreaM2 / plotAreaM2) * 100)) : 0;
  const far = plotAreaM2 > 0 ? (builtUpAreaM2 / plotAreaM2).toFixed(2) : '0.00';

  const handleChange = (key: keyof PlotConfiguration, value: any) => {
    onUpdate({ ...plotConfig, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0a0f1d] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1424] border-b border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-[#4fc3f7] flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bebas text-2xl tracking-[1.5px] text-[#4fc3f7] leading-none">
                SITE & PLOT BOUNDARY SETTINGS
              </h2>
              <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                Define plot dimensions, regulatory setbacks, road access, and true North
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

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Live Plot Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
              <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Total Plot Area</div>
              <div className="text-lg font-bold text-amber-400 font-dm-mono mt-0.5">
                {plotAreaM2} m²
              </div>
              <div className="text-[10px] text-slate-400">{Math.round(plotAreaM2 * 10.764)} sq ft</div>
            </div>

            <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
              <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Plot Coverage</div>
              <div className="text-lg font-bold text-[#4fc3f7] font-dm-mono mt-0.5">
                {coverageRatio}%
              </div>
              <div className="text-[10px] text-slate-400">{builtUpAreaM2} m² built-up</div>
            </div>

            <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
              <div className="text-[10px] font-dm-mono text-slate-400 uppercase">F.A.R. Index</div>
              <div className="text-lg font-bold text-emerald-400 font-dm-mono mt-0.5">
                {far}
              </div>
              <div className="text-[10px] text-slate-400">Floor Area Ratio</div>
            </div>
          </div>

          {/* Plot Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-dm-mono text-slate-300 uppercase">Plot Width (Frontage)</label>
              <div className="flex items-center gap-2 bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2">
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={plotConfig.widthM}
                  onChange={(e) => handleChange('widthM', Number(e.target.value) || 10)}
                  className="w-full bg-transparent text-sm text-slate-100 font-dm-mono focus:outline-none"
                />
                <span className="text-xs font-dm-mono text-slate-400">meters</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-dm-mono text-slate-300 uppercase">Plot Depth (Length)</label>
              <div className="flex items-center gap-2 bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2">
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={plotConfig.depthM}
                  onChange={(e) => handleChange('depthM', Number(e.target.value) || 10)}
                  className="w-full bg-transparent text-sm text-slate-100 font-dm-mono focus:outline-none"
                />
                <span className="text-xs font-dm-mono text-slate-400">meters</span>
              </div>
            </div>
          </div>

          {/* Road Frontage & True North */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-dm-mono text-slate-300 uppercase">Road Location</label>
              <select
                value={plotConfig.roadFrontage}
                onChange={(e) => handleChange('roadFrontage', e.target.value)}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-dm-sans focus:outline-none"
              >
                <option value="north">North Facing Road</option>
                <option value="south">South Facing Road</option>
                <option value="east">East Facing Road (Auspicious)</option>
                <option value="west">West Facing Road</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-dm-mono text-slate-300 uppercase">
                North Angle ({plotConfig.northAngleDeg}°)
              </label>
              <div className="flex items-center gap-3 bg-[#111827] border border-[#1e293b] rounded-xl px-3 py-2">
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={plotConfig.northAngleDeg}
                  onChange={(e) => handleChange('northAngleDeg', Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-[#4fc3f7]"
                />
                <span className="text-xs font-dm-mono text-[#4fc3f7] font-bold w-8 text-right">
                  {plotConfig.northAngleDeg}°
                </span>
              </div>
            </div>
          </div>

          {/* Regulatory Setbacks */}
          <div className="space-y-2">
            <label className="text-xs font-dm-mono text-slate-300 uppercase">
              Mandatory Municipal Setbacks (Meters)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Front', key: 'frontSetbackM' as const },
                { label: 'Rear', key: 'rearSetbackM' as const },
                { label: 'Left', key: 'leftSetbackM' as const },
                { label: 'Right', key: 'rightSetbackM' as const },
              ].map((sb) => (
                <div key={sb.key} className="bg-[#111827] border border-[#1e293b] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-dm-mono text-slate-400 uppercase">{sb.label}</span>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={20}
                    value={plotConfig[sb.key]}
                    onChange={(e) => handleChange(sb.key, Number(e.target.value) || 0)}
                    className="w-full text-center bg-transparent text-sm font-dm-mono font-bold text-[#4fc3f7] focus:outline-none mt-1"
                  />
                  <span className="text-[9px] text-slate-400">m</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0d1424] border-t border-[#1e3a5f] flex items-center justify-end">
          <button
            onClick={() => {
              sound.playSuccess();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#4fc3f7] hover:bg-[#38bdf8] text-slate-950 font-bold text-xs font-dm-sans cursor-pointer transition-colors shadow-md"
          >
            Apply Plot Boundary
          </button>
        </div>
      </div>
    </div>
  );
};
