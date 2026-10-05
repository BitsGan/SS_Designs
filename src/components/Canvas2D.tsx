import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasElement, ToolType, RenderStyle, Point, Layer, FurnitureType, PlotConfiguration } from '../types';
import { sound } from '../utils/audio';
import { ZoomIn, ZoomOut, Maximize2, RotateCw } from 'lucide-react';
import { MiniMap } from './MiniMap';
import { calculatePlotEnvelope } from '../utils/setbackUtils';

interface Canvas2DProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  currentTool: ToolType;
  currentColor: string;
  renderStyle: RenderStyle;
  gridSize: number;
  strokeWidth: number;
  snapEnabled: boolean;
  showGrid: boolean;
  selectedElementId: string | null;
  onSelectElement: (el: CanvasElement | null) => void;
  activeLayer: number;
  layers: Layer[];
  saveHistory: () => void;
  onUpdateStatusCoords: (x: number, y: number) => void;
  plotConfig?: PlotConfiguration;
  onToggleInteractiveState?: (id: string, prop?: 'isOpen' | 'isOn' | 'waterActive') => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const Canvas2D: React.FC<Canvas2DProps> = ({
  elements,
  setElements,
  currentTool,
  currentColor,
  renderStyle,
  gridSize,
  strokeWidth,
  snapEnabled,
  showGrid,
  selectedElementId,
  onSelectElement,
  activeLayer,
  layers,
  saveHistory,
  onUpdateStatusCoords,
  plotConfig,
  onToggleInteractiveState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  // Mouse interaction state
  const isDrawingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const activeHandleRef = useRef<ResizeHandle | null>(null);

  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const polyPointsRef = useRef<Point[]>([]);
  const freehandPointsRef = useRef<Point[]>([]);
  const redrawQueuedRef = useRef(false);

  // Utility to calculate snap coordinate
  const snap = useCallback(
    (val: number) => {
      return snapEnabled ? Math.round(val / gridSize) * gridSize : val;
    },
    [snapEnabled, gridSize]
  );

  // Convert client viewport coordinates to canvas world coordinates
  const getWorldPos = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0, rx: 0, ry: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const worldX = (screenX - panOffset.x) / zoomLevel;
      const worldY = (screenY - panOffset.y) / zoomLevel;

      return {
        x: snap(worldX),
        y: snap(worldY),
        rx: worldX,
        ry: worldY,
      };
    },
    [snap, panOffset, zoomLevel]
  );

  // Calculate Element Bounding Box in world coords
  const getBounds = (el: CanvasElement) => {
    if (el.type === 'text') {
      return { x: el.x1, y: el.y1 - 16, w: 100, h: 22 };
    }
    if (el.type === 'freehand' || el.type === 'poly') {
      if (!el.points || el.points.length === 0) return null;
      const xs = el.points.map((p) => p.x);
      const ys = el.points.map((p) => p.y);
      const minx = Math.min(...xs);
      const miny = Math.min(...ys);
      const maxx = Math.max(...xs);
      const maxy = Math.max(...ys);
      return { x: minx, y: miny, w: Math.max(10, maxx - minx), h: Math.max(10, maxy - miny) };
    }
    if (el.x2 !== undefined && el.y2 !== undefined) {
      const minx = Math.min(el.x1, el.x2);
      const miny = Math.min(el.y1, el.y2);
      const w = Math.abs(el.x2 - el.x1);
      const h = Math.abs(el.y2 - el.y1);
      return { x: minx, y: miny, w: Math.max(10, w), h: Math.max(10, h) };
    }
    return null;
  };

  // Get resize handles for selected element
  const getHandlePositions = (bounds: { x: number; y: number; w: number; h: number }) => {
    const { x, y, w, h } = bounds;
    return {
      nw: { x, y },
      n: { x: x + w / 2, y },
      ne: { x: x + w, y },
      e: { x: x + w, y: y + h / 2 },
      se: { x: x + w, y: y + h },
      s: { x: x + w / 2, y: y + h },
      sw: { x, y: y + h },
      w: { x, y: y + h / 2 },
    };
  };

  // Test if click hits a handle
  const hitTestHandle = (
    worldPos: Point,
    bounds: { x: number; y: number; w: number; h: number }
  ): ResizeHandle | null => {
    const handles = getHandlePositions(bounds);
    const radius = 6 / zoomLevel;
    for (const [key, pt] of Object.entries(handles)) {
      if (Math.hypot(worldPos.x - pt.x, worldPos.y - pt.y) <= radius * 1.5) {
        return key as ResizeHandle;
      }
    }
    return null;
  };

  // Draw authentic Blueprint Hatch Lines
  const drawHatchLines = (
    ctx: CanvasRenderingContext2D,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    color: string,
    alpha = 0.5,
    step = 8
  ) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    const span = Math.max(1, maxY - minY);
    for (let i = minX - span; i < maxX + span; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, minY);
      ctx.lineTo(i + span, maxY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // Draw 2D Architectural Furniture Symbols
  const drawFurnitureSymbol = (
    ctx: CanvasRenderingContext2D,
    type: FurnitureType | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(167, 139, 250, 0.12)';
    ctx.lineWidth = 1.5;

    switch (type) {
      case 'bed_king':
      case 'bed_single':
        // Bed frame + Pillows + Folded Duvet line
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Headboard
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, 4);
        // Pillows
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.strokeStyle = color;
        if (type === 'bed_king') {
          ctx.fillRect(x + 4, y + 6, (w - 12) / 2, 8);
          ctx.strokeRect(x + 4, y + 6, (w - 12) / 2, 8);
          ctx.fillRect(x + w / 2 + 2, y + 6, (w - 12) / 2, 8);
          ctx.strokeRect(x + w / 2 + 2, y + 6, (w - 12) / 2, 8);
        } else {
          ctx.fillRect(x + 4, y + 6, w - 8, 8);
          ctx.strokeRect(x + 4, y + 6, w - 8, 8);
        }
        // Duvet crease line
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h * 0.45);
        ctx.lineTo(x + w - 2, y + h * 0.45);
        ctx.stroke();
        break;

      case 'sofa_3p':
      case 'sofa_l':
      case 'armchair':
        // Sofa base + Armrests + Back cushion
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Backrest
        ctx.strokeRect(x, y, w, 5);
        // Left & Right Armrests
        ctx.strokeRect(x, y, 5, h);
        ctx.strokeRect(x + w - 5, y, 5, h);
        // Cushions
        if (type === 'sofa_3p') {
          const cw = (w - 10) / 3;
          ctx.strokeRect(x + 5, y + 5, cw, h - 5);
          ctx.strokeRect(x + 5 + cw, y + 5, cw, h - 5);
          ctx.strokeRect(x + 5 + cw * 2, y + 5, cw, h - 5);
        }
        break;

      case 'dining_6p':
      case 'dining_4p':
        // Table top
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        // Top & Bottom Chairs
        const chairsCount = type === 'dining_6p' ? 3 : 2;
        const chairW = (w - 12) / chairsCount;
        for (let i = 0; i < chairsCount; i++) {
          ctx.strokeRect(x + 6 + i * (chairW + 2), y, chairW - 2, 4);
          ctx.strokeRect(x + 6 + i * (chairW + 2), y + h - 4, chairW - 2, 4);
        }
        break;

      case 'kitchen_island':
        // Island counter + Sink basins
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Dual sink
        ctx.strokeRect(x + 6, y + 4, 14, h - 8);
        ctx.strokeRect(x + 22, y + 4, 14, h - 8);
        // Faucet dot
        ctx.beginPath();
        ctx.arc(x + 21, y + h / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bathtub':
        // Outer tub box + Oval inner basin + Drain
        ctx.strokeRect(x, y, w, h);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w - 8, y + h / 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'toilet':
        // Cistern tank + Bowl
        ctx.strokeRect(x, y, w, 5);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 5 + (h - 5) / 2, w / 2 - 2, (h - 5) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'shower':
        // Glass shower enclosure with diagonal floor drain lines
        ctx.strokeRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
        ctx.stroke();
        // Central drain
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'car':
      case 'suv':
        // Vehicle chassis, hood, windshield, wheels
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Windshields
        ctx.strokeRect(x + 3, y + h * 0.22, w - 6, h * 0.16);
        ctx.strokeRect(x + 3, y + h * 0.68, w - 6, h * 0.12);
        // Wheels
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 2, y + h * 0.15, 3, h * 0.15);
        ctx.fillRect(x + w - 1, y + h * 0.15, 3, h * 0.15);
        ctx.fillRect(x - 2, y + h * 0.7, 3, h * 0.15);
        ctx.fillRect(x + w - 1, y + h * 0.7, 3, h * 0.15);
        break;

      case 'plant_tree':
        // Tree foliage circles
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        break;

      case 'wardrobe':
        // Wardrobe closet with sliding door tracks and clothes hanger rail
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h / 2);
        ctx.lineTo(x + w - 4, y + h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.fillRect(x + w / 2 - 3, y + h / 2 - 3, 2, 6);
        ctx.fillRect(x + w / 2 + 1, y + h / 2 - 3, 2, 6);
        break;

      case 'coffee_table':
        // Rounded coffee table top with lower shelf / frame
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
        ctx.strokeRect(x + w / 2 - 4, y + h / 2 - 3, 8, 6);
        break;

      case 'tv_unit':
        // Media console cabinet + TV screen stand
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 4, y + 2, w - 8, 3);
        ctx.strokeRect(x + 4, y + 2, w - 8, 3);
        ctx.fillRect(x + w / 2 - 4, y + 5, 8, 2);
        break;

      case 'stove':
        // 4-burner cooktop with control knobs
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        const bRad = Math.min(w, h) * 0.16;
        [
          [x + w * 0.3, y + h * 0.35],
          [x + w * 0.7, y + h * 0.35],
          [x + w * 0.3, y + h * 0.72],
          [x + w * 0.7, y + h * 0.72],
        ].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, bRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx, by, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
        break;

      case 'fridge':
        // French-door double refrigerator
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(x + w / 2 - 3, y + 4, 2, h * 0.4);
        ctx.fillRect(x + w / 2 + 1, y + 4, 2, h * 0.4);
        break;

      case 'vanity':
        // Bathroom vanity with oval undermount basin & faucet
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.32, h * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 4, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'desk':
        // Executive desk + Task chair + Computer
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x + w / 2 - 6, y + 3, 12, 6);
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h + 6, 6, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'meeting_table':
        // Conference boardroom table + 6 chairs
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        ctx.strokeRect(x + w * 0.3, y + h / 2 - 2, w * 0.4, 4);
        const mChairs = 3;
        const mcW = (w - 16) / mChairs;
        for (let i = 0; i < mChairs; i++) {
          ctx.strokeRect(x + 8 + i * mcW, y, mcW - 4, 4);
          ctx.strokeRect(x + 8 + i * mcW, y + h - 4, mcW - 4, 4);
        }
        break;

      case 'sun_lounger':
        // Slatted pool lounger with headrest
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        for (let ly = y + 4; ly < y + h; ly += 5) {
          ctx.beginPath();
          ctx.moveTo(x, ly);
          ctx.lineTo(x + w, ly);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);
        break;

      case 'garden_pergola':
        // 4 Timber corner posts + Cross-hatched timber lattice rafters
        ctx.strokeStyle = '#9a3412';
        ctx.fillStyle = 'rgba(154, 52, 18, 0.15)';
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Corner posts
        const postS = 4;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, y, postS, postS);
        ctx.fillRect(x + w - postS, y, postS, postS);
        ctx.fillRect(x, y + h - postS, postS, postS);
        ctx.fillRect(x + w - postS, y + h - postS, postS, postS);
        // Cross slats
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 1;
        for (let sx = x + 8; sx < x + w; sx += 8) {
          ctx.beginPath();
          ctx.moveTo(sx, y);
          ctx.lineTo(sx, y + h);
          ctx.stroke();
        }
        break;

      case 'garden_fountain':
        // Concentric circular stone basins + Jet center
        ctx.strokeStyle = '#06b6d4';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        const fR = Math.min(w, h) / 2;
        const fCx = x + w / 2;
        const fCy = y + h / 2;
        ctx.beginPath();
        ctx.arc(fCx, fCy, fR - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner basin
        ctx.beginPath();
        ctx.arc(fCx, fCy, fR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
        ctx.stroke();
        // Jet nozzle
        ctx.beginPath();
        ctx.arc(fCx, fCy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        break;

      case 'flower_bed':
        // Organic raised mulch bed + Flower cluster blossoms
        ctx.strokeStyle = '#15803d';
        ctx.fillStyle = 'rgba(21, 128, 61, 0.3)';
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        // Flower dots
        const petals = ['#e11d48', '#f59e0b', '#a855f7', '#38bdf8'];
        for (let fx = x + 6; fx < x + w - 4; fx += 8) {
          for (let fy = y + 6; fy < y + h - 4; fy += 8) {
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fillStyle = petals[(fx + fy) % petals.length];
            ctx.fill();
          }
        }
        break;

      case 'garden_bench':
        // Slatted park bench with iron armrests
        ctx.strokeStyle = '#94a3b8';
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.strokeRect(x, y, w, h);
        for (let by = y + 4; by < y + h; by += 4) {
          ctx.beginPath();
          ctx.moveTo(x + 2, by);
          ctx.lineTo(x + w - 2, by);
          ctx.stroke();
        }
        break;

      case 'stepping_stones':
        // Organic oval stone pathway slabs
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
        const stoneStep = h / 3;
        for (let i = 0; i < 3; i++) {
          const sy = y + i * stoneStep + stoneStep / 2;
          const sx = x + w / 2 + (i % 2 === 0 ? -3 : 3);
          ctx.beginPath();
          ctx.ellipse(sx, sy, w * 0.35, stoneStep * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;

      case 'compound_gate':
        // Driveway gate with concrete piers and wrought-iron bars
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#1e293b';
        const pierWidth = 6;
        ctx.fillRect(x, y, pierWidth, h);
        ctx.strokeRect(x, y, pierWidth, h);
        ctx.fillRect(x + w - pierWidth, y, pierWidth, h);
        ctx.strokeRect(x + w - pierWidth, y, pierWidth, h);
        // Iron gate bars
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + pierWidth, y + 2, w - pierWidth * 2, h - 4);
        for (let bx = x + pierWidth + 4; bx < x + w - pierWidth; bx += 5) {
          ctx.beginPath();
          ctx.moveTo(bx, y + 2);
          ctx.lineTo(bx, y + h - 2);
          ctx.stroke();
        }
        break;

      case 'outdoor_bbq':
        // BBQ grill countertop + Charcoal grill grate
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, w, h);
        // Grill grate
        ctx.strokeRect(x + 4, y + 3, w - 8, h - 6);
        ctx.strokeStyle = '#ef4444';
        for (let gx = x + 6; gx < x + w - 4; gx += 4) {
          ctx.beginPath();
          ctx.moveTo(gx, y + 3);
          ctx.lineTo(gx, y + h - 3);
          ctx.stroke();
        }
        break;

      case 'garden_light':
        // Landscape bollard light with radial light glow
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
        // Radial rays
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(x + w / 2 + Math.cos(a) * 6, y + h / 2 + Math.sin(a) * 6);
          ctx.lineTo(x + w / 2 + Math.cos(a) * 10, y + h / 2 + Math.sin(a) * 10);
          ctx.stroke();
        }
        break;

      default:
        // Generic Furniture Block
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        break;
    }

    ctx.restore();
  };

  // Main Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Style Canvas Background
    if (renderStyle === 'blueprint') {
      ctx.fillStyle = '#0a1931';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (renderStyle === 'realistic') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (renderStyle === 'night') {
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (renderStyle === 'xray') {
      ctx.fillStyle = '#020b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (renderStyle === 'sketch') {
      ctx.fillStyle = '#181b22';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply Pan & Zoom Transformation
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw Grid
    if (showGrid) {
      ctx.save();
      const gridW = 3000;
      const gridH = 2000;
      ctx.strokeStyle =
        renderStyle === 'blueprint'
          ? 'rgba(79, 195, 247, 0.12)'
          : renderStyle === 'night'
          ? 'rgba(139, 92, 246, 0.1)'
          : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5 / zoomLevel;

      for (let x = -gridW; x <= gridW; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -gridH);
        ctx.lineTo(x, gridH);
        ctx.stroke();
      }
      for (let y = -gridH; y <= gridH; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-gridW, y);
        ctx.lineTo(gridW, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Plot Compound & Setback Boundaries
    if (plotConfig) {
      const envelope = calculatePlotEnvelope(plotConfig, 400, 300);

      ctx.save();
      // 1. Manicured Lawn Grass Turf Fill on Entire Plot
      ctx.fillStyle = renderStyle === 'realistic' ? 'rgba(21, 128, 61, 0.15)' : 'rgba(79, 195, 247, 0.03)';
      ctx.fillRect(
        envelope.plotMinX,
        envelope.plotMinY,
        envelope.plotMaxX - envelope.plotMinX,
        envelope.plotMaxY - envelope.plotMinY
      );

      // 2. Asphalt Road on Frontage Side
      const roadW = 50;
      ctx.fillStyle = '#1e293b';
      if (plotConfig.roadFrontage === 'east') {
        ctx.fillRect(envelope.plotMaxX, envelope.plotMinY - 20, roadW, envelope.plotMaxY - envelope.plotMinY + 40);
      } else if (plotConfig.roadFrontage === 'west') {
        ctx.fillRect(envelope.plotMinX - roadW, envelope.plotMinY - 20, roadW, envelope.plotMaxY - envelope.plotMinY + 40);
      } else if (plotConfig.roadFrontage === 'north') {
        ctx.fillRect(envelope.plotMinX - 20, envelope.plotMinY - roadW, envelope.plotMaxX - envelope.plotMinX + 40, roadW);
      } else if (plotConfig.roadFrontage === 'south') {
        ctx.fillRect(envelope.plotMinX - 20, envelope.plotMaxY, envelope.plotMaxX - envelope.plotMinX + 40, roadW);
      }

      // 3. Perimeter Compound Boundary Wall
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 / zoomLevel;
      ctx.strokeRect(
        envelope.plotMinX,
        envelope.plotMinY,
        envelope.plotMaxX - envelope.plotMinX,
        envelope.plotMaxY - envelope.plotMinY
      );

      // Corner Masonry Posts
      const postPx = 8;
      ctx.fillStyle = '#f59e0b';
      [
        [envelope.plotMinX - postPx / 2, envelope.plotMinY - postPx / 2],
        [envelope.plotMaxX - postPx / 2, envelope.plotMinY - postPx / 2],
        [envelope.plotMinX - postPx / 2, envelope.plotMaxY - postPx / 2],
        [envelope.plotMaxX - postPx / 2, envelope.plotMaxY - postPx / 2],
      ].forEach(([px, py]) => {
        ctx.fillRect(px, py, postPx, postPx);
      });

      // Plot Dimension Labels
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `PROPERTY BOUNDARY · ${plotConfig.widthM}m × ${plotConfig.depthM}m`,
        (envelope.plotMinX + envelope.plotMaxX) / 2,
        envelope.plotMinY - 8
      );

      // 4. Regulatory Setback Restriction Lines (Dashed Golden/Amber Envelope)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5 / zoomLevel;
      ctx.setLineDash([6 / zoomLevel, 4 / zoomLevel]);
      ctx.strokeRect(
        envelope.minX,
        envelope.minY,
        envelope.maxX - envelope.minX,
        envelope.maxY - envelope.minY
      );
      ctx.setLineDash([]);

      // Setback Distance Badges
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.font = '9px "DM Mono", monospace';
      ctx.fillText(
        `FRONT SETBACK: ${plotConfig.frontSetbackM}m`,
        plotConfig.roadFrontage === 'east' ? envelope.maxX + 45 : (envelope.minX + envelope.maxX) / 2,
        plotConfig.roadFrontage === 'east' ? (envelope.minY + envelope.maxY) / 2 : envelope.maxY + 14
      );
      ctx.fillText(
        `REAR SETBACK: ${plotConfig.rearSetbackM}m`,
        plotConfig.roadFrontage === 'east' ? envelope.minX - 45 : (envelope.minX + envelope.maxX) / 2,
        plotConfig.roadFrontage === 'east' ? (envelope.minY + envelope.maxY) / 2 : envelope.minY - 6
      );

      ctx.restore();
    }

    // Render Canvas Elements
    elements.forEach((el) => {
      const layer = layers.find((l) => l.id === el.layer);
      if (layer && layer.visible === false) return;

      const isSel = el.id === selectedElementId;
      ctx.save();

      // Wall / Line Width & Colors
      ctx.lineWidth = el.lineWidth || strokeWidth;
      ctx.strokeStyle = isSel ? '#f59e0b' : el.color || currentColor;
      ctx.fillStyle = isSel ? 'rgba(245, 158, 11, 0.15)' : 'rgba(79, 195, 247, 0.08)';

      if (el.type === 'room' && el.x2 !== undefined && el.y2 !== undefined) {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);

        // Floor fill
        ctx.fillRect(rx, ry, rw, rh);

        // Realistic floor material texture
        if (renderStyle === 'realistic') {
          if (el.roomType === 'bedroom' || el.roomType === 'living') {
            // Wood planks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.5;
            for (let px = rx; px < rx + rw; px += 10) {
              ctx.beginPath();
              ctx.moveTo(px, ry);
              ctx.lineTo(px, ry + rh);
              ctx.stroke();
            }
          } else if (el.roomType === 'bathroom' || el.roomType === 'kitchen') {
            // Tile grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 0.5;
            for (let px = rx; px < rx + rw; px += 12) {
              ctx.beginPath();
              ctx.moveTo(px, ry);
              ctx.lineTo(px, ry + rh);
              ctx.stroke();
            }
            for (let py = ry; py < ry + rh; py += 12) {
              ctx.beginPath();
              ctx.moveTo(rx, py);
              ctx.lineTo(rx + rw, py);
              ctx.stroke();
            }
          }
        }

        // Perimeter Walls
        ctx.strokeStyle = el.isSetbackViolated ? '#ef4444' : isSel ? '#f59e0b' : '#4fc3f7';
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, rw, rh);

        // Highlight Setback Encroachment
        if (el.isSetbackViolated) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(rx - 3, ry - 3, rw + 6, rh + 6);
          ctx.setLineDash([]);
          // Warning Pill
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(rx + rw / 2 - 50, ry + rh / 2 + 18, 100, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px "DM Sans", sans-serif';
          ctx.fillText(`⚠️ SETBACK +${el.setbackViolationAmountM || 0.5}m`, rx + rw / 2, ry + rh / 2 + 25);
        }

        // Blueprint Wall Hatching
        if (renderStyle === 'blueprint') {
          drawHatchLines(ctx, rx, ry, rx + rw, ry + 4, '#4fc3f7', 0.4, 6);
          drawHatchLines(ctx, rx, ry + rh - 4, rx + rw, ry + rh, '#4fc3f7', 0.4, 6);
        }

        // Room Labels & Area Calculation
        const areaM2 = Math.round((rw * 0.05) * (rh * 0.05) * 10) / 10;
        const areaSqFt = Math.round(areaM2 * 10.7639);

        ctx.fillStyle = isSel ? '#f59e0b' : '#e2e8f0';
        ctx.font = 'bold 11px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label || el.roomType?.toUpperCase() || 'ROOM', rx + rw / 2, ry + rh / 2 - 8);

        // Area badge
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '9px "DM Sans", sans-serif';
        ctx.fillText(`${areaM2} m² · ${areaSqFt} sq ft`, rx + rw / 2, ry + rh / 2 + 8);

        // Metric Dimension tags on sides
        ctx.fillStyle = 'rgba(79, 195, 247, 0.7)';
        ctx.font = '8px "DM Mono", monospace';
        ctx.fillText(`${Math.round(rw * 0.05 * 10) / 10}m`, rx + rw / 2, ry - 6);
        ctx.save();
        ctx.translate(rx - 8, ry + rh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${Math.round(rh * 0.05 * 10) / 10}m`, 0, 0);
        ctx.restore();
      } else if (el.type === 'pool' && el.x2 !== undefined && el.y2 !== undefined) {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);

        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx, ry, rw, rh);

        // Water ripple lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let y = ry + 12; y < ry + rh; y += 14) {
          ctx.beginPath();
          ctx.moveTo(rx + 8, y);
          ctx.bezierCurveTo(rx + rw * 0.3, y - 4, rx + rw * 0.7, y + 4, rx + rw - 8, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(el.label || 'SWIMMING POOL', rx + rw / 2, ry + rh / 2);
      } else if (el.type === 'wall' && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = isSel ? '#f59e0b' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.type === 'door' && el.x2 !== undefined && el.y2 !== undefined) {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const len = Math.max(12, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const perpX = -Math.sin(angle) * 4;
        const perpY = Math.cos(angle) * 4;

        ctx.save();
        ctx.translate(el.x1, el.y1);
        ctx.rotate(angle);

        // Jamb ticks at (0, 0) and (len, 0)
        ctx.strokeStyle = isSel ? '#f59e0b' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.moveTo(len, -6);
        ctx.lineTo(len, 6);
        ctx.stroke();

        // Door Leaf Slab (Open vs Closed)
        const isDoorOpen = el.isOpen !== false;
        ctx.fillStyle = isSel ? '#f59e0b' : '#b45309';
        ctx.strokeStyle = isSel ? '#fbbf24' : '#78350f';
        ctx.lineWidth = 1.5;

        if (isDoorOpen) {
          ctx.fillRect(0, -len, 4, len);
          ctx.strokeRect(0, -len, 4, len);

          // Brass Door Handle knob
          ctx.fillStyle = '#d4af37';
          ctx.beginPath();
          ctx.arc(6, -len + 6, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Dashed Quarter-Circle Swing Arc
          ctx.beginPath();
          ctx.arc(0, 0, len, -Math.PI / 2, 0, false);
          ctx.strokeStyle = isSel ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Closed Door Slab Flush with Wall
          ctx.fillRect(0, -2, len, 4);
          ctx.strokeRect(0, -2, len, 4);
          ctx.fillStyle = '#d4af37';
          ctx.beginPath();
          ctx.arc(len - 6, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (el.type === 'window' && el.x2 !== undefined && el.y2 !== undefined) {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const len = Math.max(12, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(el.x1, el.y1);
        ctx.rotate(angle);

        // Outer Window Sill & Glass Box
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(0, -4, len, 8);

        // Window Frame Sill Line
        ctx.strokeStyle = isSel ? '#f59e0b' : '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(-2, -5, len + 4, 10);

        // End Jamb Blocks
        ctx.fillStyle = isSel ? '#f59e0b' : '#64748b';
        ctx.fillRect(0, -5, 3, 10);
        ctx.fillRect(len - 3, -5, 3, 10);

        // Center Mullion
        ctx.fillRect(len / 2 - 1.5, -5, 3, 10);

        // Double Glazing Parallel Glass Lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(3, -1.5);
        ctx.lineTo(len - 3, -1.5);
        ctx.moveTo(3, 1.5);
        ctx.lineTo(len - 3, 1.5);
        ctx.stroke();

        ctx.restore();
      } else if (el.type === 'furniture' && el.x2 !== undefined && el.y2 !== undefined) {
        const fx = Math.min(el.x1, el.x2);
        const fy = Math.min(el.y1, el.y2);
        const fw = Math.abs(el.x2 - el.x1);
        const fh = Math.abs(el.y2 - el.y1);
        drawFurnitureSymbol(ctx, el.furnitureType, fx, fy, fw, fh, isSel ? '#f59e0b' : '#a78bfa');
      } else if (el.type === 'stair' && el.x2 !== undefined && el.y2 !== undefined) {
        const sx = Math.min(el.x1, el.x2);
        const sy = Math.min(el.y1, el.y2);
        const sw = Math.abs(el.x2 - el.x1);
        const sh = Math.abs(el.y2 - el.y1);
        ctx.strokeRect(sx, sy, sw, sh);

        // Tread lines
        const stepCount = 8;
        for (let i = 1; i < stepCount; i++) {
          ctx.beginPath();
          ctx.moveTo(sx, sy + (sh / stepCount) * i);
          ctx.lineTo(sx + sw, sy + (sh / stepCount) * i);
          ctx.stroke();
        }
        // UP arrow
        ctx.fillStyle = '#f59e0b';
        ctx.font = '8px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UP ▶', sx + sw / 2, sy + sh / 2);
      } else if (el.type === 'measure' && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // End ticks
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1 - 4);
        ctx.lineTo(el.x1, el.y1 + 4);
        ctx.moveTo(el.x2, el.y2 - 4);
        ctx.lineTo(el.x2, el.y2 + 4);
        ctx.stroke();

        // Distance text
        const distM = Math.round(Math.hypot(el.x2 - el.x1, el.y2 - el.y1) * 0.05 * 10) / 10;
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${distM}m`, (el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2 - 4);
      } else if (el.type === 'text' && el.label) {
        ctx.fillStyle = el.color || '#e2e8f0';
        ctx.font = '12px "DM Sans", sans-serif';
        ctx.fillText(el.label, el.x1, el.y1);
      }

      // Draw Selected Element Transform Handles
      if (isSel) {
        const bounds = getBounds(el);
        if (bounds) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1 / zoomLevel;
          ctx.setLineDash([4 / zoomLevel, 4 / zoomLevel]);
          ctx.strokeRect(bounds.x - 3, bounds.y - 3, bounds.w + 6, bounds.h + 6);
          ctx.setLineDash([]);

          // 8 Resize Handles
          const handles = getHandlePositions(bounds);
          const handleR = 4 / zoomLevel;
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1 / zoomLevel;

          Object.values(handles).forEach((pt) => {
            ctx.fillRect(pt.x - handleR, pt.y - handleR, handleR * 2, handleR * 2);
            ctx.strokeRect(pt.x - handleR, pt.y - handleR, handleR * 2, handleR * 2);
          });
        }
      }

      ctx.restore();
    });

    // Draw Dynamic Compass Rose & Scale Bar in Bottom Left
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // screen coords

    // Scale Rule (e.g. 5 meters = 100px * zoomLevel)
    const scalePx = 100 * zoomLevel;
    const scaleMeters = 5;
    const scaleX = 20;
    const scaleY = canvas.height - 24;

    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scalePx, scaleY);
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scalePx / 2, scaleY - 3);
    ctx.lineTo(scaleX + scalePx / 2, scaleY + 3);
    ctx.moveTo(scaleX + scalePx, scaleY - 4);
    ctx.lineTo(scaleX + scalePx, scaleY + 4);
    ctx.stroke();

    ctx.fillStyle = '#4fc3f7';
    ctx.font = '9px "DM Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`0`, scaleX - 2, scaleY - 6);
    ctx.fillText(`${scaleMeters / 2}m`, scaleX + scalePx / 2 - 8, scaleY - 6);
    ctx.fillText(`${scaleMeters}m (1:50)`, scaleX + scalePx - 16, scaleY - 6);

    ctx.restore();
  }, [
    elements,
    panOffset,
    zoomLevel,
    selectedElementId,
    renderStyle,
    showGrid,
    gridSize,
    strokeWidth,
    currentColor,
    layers,
  ]);

  // Request Animation Frame Redraw
  useEffect(() => {
    if (!redrawQueuedRef.current) {
      redrawQueuedRef.current = true;
      requestAnimationFrame(() => {
        render();
        redrawQueuedRef.current = false;
      });
    }
  }, [render]);

  // Resize canvas when container dimensions change
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      render();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Wheel Zoom (centered at mouse pointer)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3.5, Math.max(0.3, zoomLevel * zoomFactor));

    // Keep world coordinate under mouse stationary
    const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoomLevel);
    const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoomLevel);

    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle mouse button or Spacebar held = Pan
    if (e.button === 1 || e.spaceKey) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0) return; // Only Left Click for drawing/selecting

    const pos = getWorldPos(e.clientX, e.clientY);
    onUpdateStatusCoords(Math.round(pos.rx), Math.round(pos.ry));

    // 1. Check if clicking on a resize handle of selected element
    if (selectedElementId) {
      const selEl = elements.find((el) => el.id === selectedElementId);
      if (selEl) {
        const bounds = getBounds(selEl);
        if (bounds) {
          const handle = hitTestHandle(pos, bounds);
          if (handle) {
            activeHandleRef.current = handle;
            isDraggingRef.current = true;
            startPosRef.current = pos;
            saveHistory();
            sound.playClick();
            return;
          }
        }
      }
    }

    // 2. Select Tool: Check if clicking inside any element
    if (currentTool === 'select') {
      let found: CanvasElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        const bounds = getBounds(el);
        if (
          bounds &&
          pos.rx >= bounds.x &&
          pos.rx <= bounds.x + bounds.w &&
          pos.ry >= bounds.y &&
          pos.ry <= bounds.y + bounds.h
        ) {
          found = el;
          break;
        }
      }

      if (found) {
        onSelectElement(found);
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: pos.rx - found.x1, y: pos.ry - found.y1 };
        saveHistory();
        sound.playClick();
      } else {
        onSelectElement(null);
      }
      return;
    }

    // 3. Drawing Tools
    isDrawingRef.current = true;
    startPosRef.current = pos;
    saveHistory();
    sound.playClick();

    if (currentTool === 'freehand') {
      freehandPointsRef.current = [{ x: pos.x, y: pos.y }];
    } else if (currentTool === 'poly') {
      polyPointsRef.current.push({ x: pos.x, y: pos.y });
    } else {
      // Create new draft element
      const newEl: CanvasElement = {
        id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: currentTool,
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
        color: currentColor,
        lineWidth: strokeWidth,
        layer: activeLayer,
        label: currentTool === 'room' ? 'ROOM' : undefined,
        roomType: currentTool === 'room' ? 'bedroom' : undefined,
      };

      setElements((prev) => [...prev, newEl]);
      onSelectElement(newEl);
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Panning
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const pos = getWorldPos(e.clientX, e.clientY);
    onUpdateStatusCoords(Math.round(pos.rx), Math.round(pos.ry));

    // Resizing via Handle
    if (isDraggingRef.current && activeHandleRef.current && selectedElementId) {
      const handle = activeHandleRef.current;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          const copy = { ...el };
          if (handle.includes('w')) copy.x1 = pos.x;
          if (handle.includes('e') && copy.x2 !== undefined) copy.x2 = pos.x;
          if (handle.includes('n')) copy.y1 = pos.y;
          if (handle.includes('s') && copy.y2 !== undefined) copy.y2 = pos.y;
          return copy;
        })
      );
      return;
    }

    // Dragging Selected Element Position
    if (isDraggingRef.current && selectedElementId && currentTool === 'select') {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          const diffX = pos.x - el.x1;
          const diffY = pos.y - el.y1;
          return {
            ...el,
            x1: pos.x,
            y1: pos.y,
            x2: el.x2 !== undefined ? el.x2 + diffX : undefined,
            y2: el.y2 !== undefined ? el.y2 + diffY : undefined,
          };
        })
      );
      return;
    }

    // Active Drawing
    if (isDrawingRef.current && selectedElementId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          return { ...el, x2: pos.x, y2: pos.y };
        })
      );
    }
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
    if (isDrawingRef.current || isDraggingRef.current) {
      isDrawingRef.current = false;
      isDraggingRef.current = false;
      activeHandleRef.current = null;
      sound.playSnap();
    }
  };

  // Zoom Controls Handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, z * 1.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.3, z / 1.25));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    sound.playClick();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0b0f19]">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Floating Canvas Navigation Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#111827]/90 border border-[#1e293b] p-1 rounded-lg shadow-lg backdrop-blur select-none">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded hover:bg-[#1e3a5f] text-slate-300 hover:text-[#4fc3f7] flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded hover:bg-[#1e3a5f] text-slate-300 hover:text-[#4fc3f7] flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 h-7 rounded hover:bg-[#1e3a5f] text-slate-300 hover:text-[#4fc3f7] text-[10px] font-dm-mono flex items-center justify-center transition-colors cursor-pointer"
          title="Fit & Reset Canvas"
        >
          <Maximize2 className="w-3 h-3 mr-1" />
          <span>{Math.round(zoomLevel * 100)}%</span>
        </button>
      </div>

      {/* Live Radar MiniMap */}
      {showMiniMap && (
        <MiniMap
          elements={elements}
          viewOffset={panOffset}
          zoomLevel={zoomLevel}
          canvasWidth={canvasRef.current?.width || 800}
          canvasHeight={canvasRef.current?.height || 500}
          onNavigate={(wx, wy) => {
            const cw = canvasRef.current?.width || 800;
            const ch = canvasRef.current?.height || 500;
            setPanOffset({
              x: cw / 2 - wx * zoomLevel,
              y: ch / 2 - wy * zoomLevel,
            });
          }}
        />
      )}
    </div>
  );
};
