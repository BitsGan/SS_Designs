import React, { useState, useMemo, useEffect } from 'react';
import { CanvasElement, DesignAuditIssue, AIActionCommand } from '../types';
import { calculateBOQ, analyzeVastu, BOQReport, VastuReport } from '../utils/exportUtils';
import {
  X,
  Calculator,
  ShieldCheck,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Wand2,
  Maximize2,
  Box,
  Coins,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  onApplyFix?: (action: AIActionCommand) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  elements,
  onApplyFix,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'areas' | 'materials' | 'vastu'>('audit');
  const [currency, setCurrency] = useState<string>('$');
  const [costGrade, setCostGrade] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');
  const [copied, setCopied] = useState<boolean>(false);
  const [auditIssues, setAuditIssues] = useState<DesignAuditIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Rate multipliers based on currency and grade
  const currencyMultiplier = currency === '₹' ? 85 : currency === '€' ? 0.92 : currency === '£' ? 0.78 : 1;
  const gradeMultiplier = costGrade === 'basic' ? 0.75 : costGrade === 'premium' ? 1.45 : 1.0;

  const boqReport: BOQReport = useMemo(
    () => calculateBOQ(elements, currency, 1250 * gradeMultiplier * currencyMultiplier),
    [elements, currency, gradeMultiplier, currencyMultiplier]
  );
  const vastuReport: VastuReport = useMemo(() => analyzeVastu(elements), [elements]);

  // Compute detailed room area schedule
  const roomSchedules = useMemo(() => {
    const rooms = elements.filter((e) => e.type === 'room' && e.x2 !== undefined && e.y2 !== undefined);
    return rooms.map((r) => {
      const wM = Math.abs(r.x2! - r.x1) * 0.05;
      const hM = Math.abs(r.y2! - r.y1) * 0.05;
      const areaM2 = Math.round(wM * hM * 10) / 10;
      const areaSqFt = Math.round(areaM2 * 10.7639);
      const perimeterM = Math.round(2 * (wM + hM) * 10) / 10;
      return {
        id: r.id,
        label: r.label || (r.roomType || 'ROOM').toUpperCase(),
        roomType: r.roomType || 'bedroom',
        widthM: Math.round(wM * 10) / 10,
        heightM: Math.round(hM * 10) / 10,
        areaM2,
        areaSqFt,
        perimeterM,
      };
    });
  }, [elements]);

  const totalCarpetAreaM2 = useMemo(() => {
    return Math.round(roomSchedules.reduce((sum, r) => sum + r.areaM2, 0) * 10) / 10;
  }, [roomSchedules]);

  const totalBuiltUpAreaM2 = useMemo(() => {
    return Math.round(totalCarpetAreaM2 * 1.18 * 10) / 10; // includes 18% wall thickness
  }, [totalCarpetAreaM2]);

  // Run AI Design Audit
  useEffect(() => {
    if (!isOpen) return;

    const runAudit = async () => {
      setIsAuditing(true);
      try {
        const res = await fetch('/api/ai/design-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvasState: {
              rooms: roomSchedules,
              totalAreaM2: totalCarpetAreaM2,
              unit: unitMode,
            },
            elements,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.issues)) {
            setAuditIssues(data.issues);
          }
        }
      } catch (err) {
        console.warn('Audit fetch error:', err);
      } finally {
        setIsAuditing(false);
      }
    };

    runAudit();
  }, [isOpen, elements, roomSchedules, totalCarpetAreaM2, unitMode]);

  // Material Takeoff Breakdown Calculations
  const materialTakeoff = useMemo(() => {
    const wallAreaM2 = boqReport.totalWallLinearM * 2.8; // 2.8m wall height
    const bricksCount = Math.round(wallAreaM2 * 55); // ~55 bricks per m2 for 230mm wall
    const cementBags = Math.round(totalBuiltUpAreaM2 * 3.8); // ~3.8 bags per m2 of built up
    const steelTonnes = Math.round((totalBuiltUpAreaM2 * 0.038) * 10) / 10; // ~38 kg steel per m2
    const concreteCubicM = Math.round(totalBuiltUpAreaM2 * 0.28 * 10) / 10;
    const paintLiters = Math.round(wallAreaM2 * 2 * 0.22); // 2 coats
    const flooringM2 = totalCarpetAreaM2;

    return {
      bricksCount,
      cementBags,
      steelTonnes,
      concreteCubicM,
      paintLiters,
      flooringM2,
      wallAreaM2: Math.round(wallAreaM2 * 10) / 10,
    };
  }, [boqReport.totalWallLinearM, totalBuiltUpAreaM2, totalCarpetAreaM2]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const lines = [
      `SS DESIGN STUDIO · ARCHITECTURAL TAKEOFF & AUDIT REPORT`,
      `Built-up Area: ${totalBuiltUpAreaM2} m² (${Math.round(totalBuiltUpAreaM2 * 10.764)} sq ft)`,
      `Carpet Area: ${totalCarpetAreaM2} m² (${Math.round(totalCarpetAreaM2 * 10.764)} sq ft)`,
      `Total Structural Wall Span: ${boqReport.totalWallLinearM} linear meters`,
      `Estimated Cost (${costGrade.toUpperCase()} Grade): ${currency}${boqReport.grandTotal.toLocaleString()}`,
      `------------------------------------------------------------`,
      `MATERIAL QUANTITIES:`,
      `• Estimated Bricks: ${materialTakeoff.bricksCount.toLocaleString()} units`,
      `• Cement: ${materialTakeoff.cementBags.toLocaleString()} bags (50kg)`,
      `• Structural Steel: ${materialTakeoff.steelTonnes} Metric Tonnes`,
      `• Ready-Mix Concrete: ${materialTakeoff.concreteCubicM} m³`,
      `• Flooring Tiles: ${materialTakeoff.flooringM2} m²`,
      `• Architectural Paint: ${materialTakeoff.paintLiters} Liters`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ['Room / Item Description', 'Length (m)', 'Width (m)', 'Area (m²)', 'Area (sq ft)'],
      ...roomSchedules.map((r) => [
        `"${r.label}"`,
        r.heightM,
        r.widthM,
        r.areaM2,
        r.areaSqFt,
      ]),
      ['', '', '', '', ''],
      ['Category', 'Item Takeoff Description', 'Quantity', 'Unit', `Rate (${currency})`, `Total (${currency})`],
      ...boqReport.items.map((it) => [
        `"${it.category}"`,
        `"${it.item}"`,
        it.quantity,
        `"${it.unit}"`,
        it.rate,
        it.total,
      ]),
      ['', '', '', '', 'GRAND TOTAL', boqReport.grandTotal],
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ss-design-studio-architectural-analysis.csv';
    link.click();
    sound.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0a0f1d] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0d1424] border-b border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#4fc3f7] flex items-center justify-center text-slate-900 shadow-md">
              <Calculator className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bebas text-2xl tracking-[1.5px] text-[#4fc3f7] leading-none">
                  ARCHITECTURAL INTELLIGENCE & ESTIMATION
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-dm-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Audit Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                AI spatial analysis, automated area schedule, material takeoff BOQ, and Vastu compliance
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

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-[#080d17] border-b border-[#1e293b] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setActiveTab('audit');
                sound.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-purple-950/60 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Design Audit</span>
              {auditIssues.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {auditIssues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('areas');
                sound.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'areas'
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold border border-[#4fc3f7]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Area Calculation</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('materials');
                sound.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold border border-[#4fc3f7]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Cost & Materials (BOQ)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('vastu');
                sound.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-dm-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'vastu'
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] font-semibold border border-[#4fc3f7]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vastu & Solar</span>
            </button>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1 text-[11px] font-dm-sans rounded bg-[#1e293b] hover:bg-[#2563eb] text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-2.5 py-1 text-[11px] font-dm-sans rounded bg-[#1e3a5f] hover:bg-[#2563eb] text-[#4fc3f7] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* TAB 1: AI DESIGN AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-950/40 via-[#0d1424] to-indigo-950/40 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-dm-sans">
                      AI Spatial Flow & Ergonomics Audit
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-dm-sans">
                      Auditing {roomSchedules.length} rooms for door collisions, circulation bottlenecks, cross-ventilation, and privacy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsAuditing(true);
                      sound.playClick();
                      fetch('/api/ai/design-audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          canvasState: {
                            rooms: roomSchedules,
                            totalAreaM2: totalCarpetAreaM2,
                            unit: unitMode,
                          },
                          elements,
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          if (Array.isArray(data.issues)) {
                            setAuditIssues(data.issues);
                          }
                        })
                        .catch((err) => console.warn('Re-audit error:', err))
                        .finally(() => setIsAuditing(false));
                    }}
                    disabled={isAuditing}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-dm-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                    <span>{isAuditing ? 'Auditing...' : 'Re-Audit'}</span>
                  </button>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-dm-mono text-slate-400 uppercase">Audit Status</span>
                    <div className="text-sm font-bold text-emerald-400 font-dm-mono">
                      {isAuditing ? 'Analyzing...' : auditIssues.length === 0 ? 'Optimal Layout' : `${auditIssues.length} Findings`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Findings List */}
              {isAuditing ? (
                <div className="p-8 bg-[#111827] border border-purple-500/30 rounded-xl flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 font-dm-sans">
                      Analyzing Architectural Spatial Geometry...
                    </h4>
                    <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                      Verifying circulation corridors, cross-ventilation fenestration, room adjacency buffers, and furniture clearances.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditIssues.map((issue, idx) => (
                    <div
                      key={issue.id || idx}
                      className="p-4 bg-[#111827] border border-[#1e293b] hover:border-[#4fc3f7]/40 rounded-xl space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {issue.severity === 'high' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-dm-mono font-bold bg-red-950 border border-red-500/40 text-red-300 uppercase">
                              High Priority
                            </span>
                          ) : issue.severity === 'moderate' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-dm-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 uppercase">
                              Moderate
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-dm-mono font-bold bg-blue-950 border border-blue-500/40 text-blue-300 uppercase">
                              Design Tip
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-slate-200 font-dm-sans">
                            {issue.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-dm-mono text-slate-400 uppercase">
                          {issue.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-dm-sans leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-3 text-xs font-dm-sans bg-[#080d17] p-2.5 rounded-lg border border-[#1e293b]">
                        <div className="flex items-start gap-1.5 text-slate-400">
                          <span className="text-[#4fc3f7] font-bold">💡 Solution:</span>
                          <span>{issue.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATIC AREA SCHEDULE */}
          {activeTab === 'areas' && (
            <div className="space-y-5">
              {/* Summary Area Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-xl">
                  <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Total Carpet Area</div>
                  <div className="text-lg font-bold text-[#4fc3f7] font-dm-mono mt-0.5">
                    {unitMode === 'metric' ? `${totalCarpetAreaM2} m²` : `${Math.round(totalCarpetAreaM2 * 10.764)} sq ft`}
                  </div>
                  <div className="text-[10px] text-slate-400">Net usable floor area</div>
                </div>

                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-xl">
                  <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Gross Built-Up Area</div>
                  <div className="text-lg font-bold text-emerald-400 font-dm-mono mt-0.5">
                    {unitMode === 'metric' ? `${totalBuiltUpAreaM2} m²` : `${Math.round(totalBuiltUpAreaM2 * 10.764)} sq ft`}
                  </div>
                  <div className="text-[10px] text-slate-400">Plinth / Slab envelope</div>
                </div>

                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-xl">
                  <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Structural Wall Span</div>
                  <div className="text-lg font-bold text-amber-400 font-dm-mono mt-0.5">
                    {boqReport.totalWallLinearM} m
                  </div>
                  <div className="text-[10px] text-slate-400">Linear wall perimeter</div>
                </div>

                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-xl">
                  <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Spaces Drafted</div>
                  <div className="text-lg font-bold text-purple-400 font-dm-mono mt-0.5">
                    {roomSchedules.length} Rooms
                  </div>
                  <div className="text-[10px] text-slate-400">{boqReport.doorsCount} Doors · {boqReport.windowsCount} Windows</div>
                </div>
              </div>

              {/* Interactive Unit Toggle */}
              <div className="flex items-center justify-between bg-[#111827] px-4 py-2 rounded-xl border border-[#1e293b]">
                <span className="text-xs font-dm-mono text-slate-300 uppercase font-semibold">
                  Room Dimension & Area Schedule
                </span>
                <div className="flex items-center gap-1 bg-[#080d17] p-0.5 rounded-lg border border-[#1e293b] text-xs font-dm-mono">
                  <button
                    onClick={() => setUnitMode('metric')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      unitMode === 'metric' ? 'bg-[#2563eb] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Metric (m / m²)
                  </button>
                  <button
                    onClick={() => setUnitMode('imperial')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      unitMode === 'imperial' ? 'bg-[#2563eb] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Imperial (ft / sq ft)
                  </button>
                </div>
              </div>

              {/* Room Schedule Table */}
              <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-dm-sans">
                  <thead className="bg-[#080d17] text-slate-400 font-dm-mono text-[10px] uppercase border-b border-[#1e293b]">
                    <tr>
                      <th className="py-2.5 px-4">Room Label</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Dimensions (W × L)</th>
                      <th className="py-2.5 px-4 text-right">Carpet Area</th>
                      <th className="py-2.5 px-4 text-right">% of Floor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                    {roomSchedules.map((r, i) => {
                      const sharePct = totalCarpetAreaM2 > 0 ? Math.round((r.areaM2 / totalCarpetAreaM2) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-[#1e293b]/30">
                          <td className="py-2 px-4 font-semibold text-slate-100">{r.label}</td>
                          <td className="py-2 px-4 text-slate-400 uppercase text-[10px] font-dm-mono">{r.roomType}</td>
                          <td className="py-2 px-4 text-right font-dm-mono text-slate-300">
                            {unitMode === 'metric'
                              ? `${r.widthM}m × ${r.heightM}m`
                              : `${(r.widthM * 3.281).toFixed(1)}ft × ${(r.heightM * 3.281).toFixed(1)}ft`}
                          </td>
                          <td className="py-2 px-4 text-right font-dm-mono font-bold text-[#4fc3f7]">
                            {unitMode === 'metric' ? `${r.areaM2} m²` : `${r.areaSqFt} sq ft`}
                          </td>
                          <td className="py-2 px-4 text-right font-dm-mono text-slate-400">
                            {sharePct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MATERIAL TAKEOFF & BOQ */}
          {activeTab === 'materials' && (
            <div className="space-y-5">
              {/* Construction Grade & Currency Bar */}
              <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1e293b] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-dm-mono text-slate-400 uppercase">Construction Grade:</span>
                  <div className="flex bg-[#080d17] p-0.5 rounded-lg border border-[#1e293b] text-xs font-dm-mono">
                    {(['basic', 'standard', 'premium'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setCostGrade(g)}
                        className={`px-3 py-1 rounded-md capitalize cursor-pointer transition-all ${
                          costGrade === g
                            ? 'bg-[#2563eb] text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-dm-mono text-slate-400 uppercase">Currency:</span>
                  <div className="flex bg-[#080d17] p-0.5 rounded-lg border border-[#1e293b] text-xs font-dm-mono">
                    {['$', '₹', '€', '£'].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          currency === curr ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exact Material Quantity Estimation Grid */}
              <div className="space-y-2">
                <span className="text-xs font-dm-mono font-semibold uppercase text-slate-300">
                  Estimated Structural Material Takeoff
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Masonry Red Bricks / AAC</div>
                    <div className="text-base font-bold text-amber-400 font-dm-mono mt-0.5">
                      {materialTakeoff.bricksCount.toLocaleString()} units
                    </div>
                    <div className="text-[10px] text-slate-400">Based on {materialTakeoff.wallAreaM2}m² wall surface</div>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">OPC / PPC Cement</div>
                    <div className="text-base font-bold text-[#4fc3f7] font-dm-mono mt-0.5">
                      {materialTakeoff.cementBags.toLocaleString()} bags
                    </div>
                    <div className="text-[10px] text-slate-400">50kg standard bags</div>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Structural TMT Steel</div>
                    <div className="text-base font-bold text-emerald-400 font-dm-mono mt-0.5">
                      {materialTakeoff.steelTonnes} Tonnes
                    </div>
                    <div className="text-[10px] text-slate-400">Reinforced slab & columns</div>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Ready-Mix Concrete (M25)</div>
                    <div className="text-base font-bold text-purple-400 font-dm-mono mt-0.5">
                      {materialTakeoff.concreteCubicM} m³
                    </div>
                    <div className="text-[10px] text-slate-400">Foundation & roof slabs</div>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Flooring & Tiles</div>
                    <div className="text-base font-bold text-blue-400 font-dm-mono mt-0.5">
                      {materialTakeoff.flooringM2} m²
                    </div>
                    <div className="text-[10px] text-slate-400">Interior flooring surface</div>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-3 rounded-xl">
                    <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Architectural Paint</div>
                    <div className="text-base font-bold text-pink-400 font-dm-mono mt-0.5">
                      {materialTakeoff.paintLiters.toLocaleString()} Liters
                    </div>
                    <div className="text-[10px] text-slate-400">Interior 2-coat primer + topcoat</div>
                  </div>
                </div>
              </div>

              {/* BOQ Cost Breakdown */}
              <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-dm-sans">
                  <thead className="bg-[#080d17] text-slate-400 font-dm-mono text-[10px] uppercase border-b border-[#1e293b]">
                    <tr>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Takeoff Item</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                    {boqReport.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/30">
                        <td className="py-2 px-4 text-slate-400 font-medium">{it.category}</td>
                        <td className="py-2 px-4 text-slate-200">{it.item}</td>
                        <td className="py-2 px-4 text-right font-dm-mono">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 px-4 text-right font-dm-mono font-semibold text-[#4fc3f7]">
                          {currency}{it.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0d1424] border-t-2 border-[#1e3a5f] font-dm-mono">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right font-semibold text-slate-300">
                        ESTIMATED TOTAL ({costGrade.toUpperCase()} GRADE):
                      </td>
                      <td className="py-3 px-4 text-right text-base font-bold text-emerald-400">
                        {currency}{boqReport.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VASTU & SOLAR HARMONY */}
          {activeTab === 'vastu' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-[#111c33] via-[#0d1424] to-[#111c33] border border-[#1e3a5f] p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke={vastuReport.overallScore >= 80 ? '#10b981' : vastuReport.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="6"
                        strokeDasharray={213}
                        strokeDashoffset={213 - (213 * vastuReport.overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-bebas text-2xl text-white">{vastuReport.overallScore}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-dm-mono uppercase tracking-wider text-amber-400 font-semibold">
                      Spatial & Directional Harmony Score
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 mt-0.5 font-dm-sans">
                      {vastuReport.overallScore >= 80 ? 'Harmonious Energy Flow' : 'Balanced Layout'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md font-dm-sans">
                      {vastuReport.verdict}
                    </p>
                  </div>
                </div>

                <div className="bg-[#080d17] px-4 py-3 rounded-xl border border-[#1e293b] text-center shrink-0">
                  <div className="text-[10px] font-dm-mono text-slate-400 uppercase">Zones Analyzed</div>
                  <div className="text-xl font-bold text-[#4fc3f7] font-dm-mono mt-0.5">
                    {vastuReport.checks.length} Rooms
                  </div>
                </div>
              </div>

              {/* Checks list */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-dm-mono font-semibold uppercase text-slate-300 px-1">
                  Directional Zone Checks & Guidance
                </h4>

                {vastuReport.checks.map((chk, i) => (
                  <div
                    key={i}
                    className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-xl flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {chk.status === 'optimal' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : chk.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200 font-dm-sans">
                          {chk.item}
                        </span>
                        <span className="text-[10px] font-dm-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Zone: {chk.zone}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-dm-sans leading-relaxed">
                        {chk.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
