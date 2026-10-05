import React from 'react';
import { Sun, Wind, Compass, Play, Pause, Eye, CloudSun, Flame, Snowflake, Sparkles } from 'lucide-react';
import { SolarVentilationState } from '../types';
import { sound } from '../utils/audio';

interface SolarVentilationBarProps {
  solarState: SolarVentilationState;
  onChangeSolarState: (updater: (prev: SolarVentilationState) => SolarVentilationState) => void;
  northAngleDeg: number;
}

export const SolarVentilationBar: React.FC<SolarVentilationBarProps> = ({
  solarState,
  onChangeSolarState,
  northAngleDeg,
}) => {
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  };

  // Compute calculated sun azimuth and altitude
  const getSunAngle = () => {
    const hour = solarState.timeOfDayHour;
    const progress = (hour - 6) / 12; // 0 at 6am to 1 at 6pm
    const elevation = Math.max(0, Math.sin(progress * Math.PI) * (solarState.season === 'summer' ? 72 : solarState.season === 'winter' ? 38 : 55));
    const azimuth = (progress * 180 + 90 + northAngleDeg) % 360;
    return { elevation: Math.round(elevation), azimuth: Math.round(azimuth) };
  };

  const sunData = getSunAngle();

  return (
    <div className="bg-[#0b1322] border-b border-[#1e3a5f] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-dm-sans select-none shrink-0 z-20">
      {/* Left: Solar Time Slider */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-dm-mono">
          <Sun className="w-4 h-4 animate-spin-slow" />
          <span>SOLAR STUDY:</span>
        </div>

        <div className="flex items-center gap-2 bg-[#080d17] px-3 py-1 rounded-lg border border-[#1e293b]">
          <span className="font-dm-mono text-white text-xs w-16 text-center font-bold">
            {formatTime(solarState.timeOfDayHour)}
          </span>
          <input
            type="range"
            min={6}
            max={18}
            step={0.25}
            value={solarState.timeOfDayHour}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChangeSolarState((prev) => ({ ...prev, timeOfDayHour: val }));
            }}
            className="w-28 sm:w-40 h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Calculated Elevation & Azimuth */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-dm-mono text-slate-400">
          <span>Alt: <strong className="text-amber-300">{sunData.elevation}°</strong></span>
          <span>Az: <strong className="text-[#4fc3f7]">{sunData.azimuth}°</strong></span>
        </div>
      </div>

      {/* Center: Season Selector */}
      <div className="flex items-center gap-1 bg-[#080d17] p-0.5 rounded-lg border border-[#1e293b]">
        {(['summer', 'equinox', 'winter'] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              sound.playClick();
              onChangeSolarState((prev) => ({ ...prev, season: s }));
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-dm-mono capitalize cursor-pointer transition-all ${
              solarState.season === s
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s === 'summer' && '☀️ Summer'}
            {s === 'equinox' && '⛅ Equinox'}
            {s === 'winter' && '❄️ Winter'}
          </button>
        ))}
      </div>

      {/* Right: Ventilation & Airflow Streamlines */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            onChangeSolarState((prev) => ({ ...prev, showShadows: !prev.showShadows }));
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            solarState.showShadows
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-[#080d17] border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Dynamic Raycast Shadows"
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Shadows {solarState.showShadows ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onChangeSolarState((prev) => ({ ...prev, showAirflowStreams: !prev.showAirflowStreams }));
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            solarState.showAirflowStreams
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-[#080d17] border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Wind & Cross-Ventilation Streamlines"
        >
          <Wind className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Airflow {solarState.showAirflowStreams ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
