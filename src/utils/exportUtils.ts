import { CanvasElement, ProjectMetadata, RoomType } from '../types';

export interface BOQItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface BOQReport {
  totalAreaM2: number;
  totalAreaSqFt: number;
  totalWallLinearM: number;
  roomsCount: number;
  doorsCount: number;
  windowsCount: number;
  currency: string;
  items: BOQItem[];
  grandTotal: number;
}

export interface VastuReport {
  overallScore: number; // 0 - 100
  verdict: string;
  checks: Array<{
    item: string;
    zone: string;
    idealZone: string;
    status: 'optimal' | 'acceptable' | 'warning';
    recommendation: string;
  }>;
}

// Pixel to real world scale: 20px = 1.0 meter (or 1px = 0.05m)
const PX_TO_M = 0.05;

// Calculate Bill of Quantities and cost estimations
export function calculateBOQ(elements: CanvasElement[], currency = '$', ratePerM2 = 1250): BOQReport {
  let totalAreaM2 = 0;
  let totalWallLinearM = 0;
  let doorsCount = 0;
  let windowsCount = 0;
  let roomsCount = 0;

  elements.forEach((el) => {
    if (el.type === 'room' && el.x2 !== undefined && el.y2 !== undefined) {
      roomsCount++;
      const wM = Math.abs(el.x2 - el.x1) * PX_TO_M;
      const hM = Math.abs(el.y2 - el.y1) * PX_TO_M;
      totalAreaM2 += wM * hM;
      totalWallLinearM += 2 * (wM + hM);
    } else if (el.type === 'wall' && el.x2 !== undefined && el.y2 !== undefined) {
      const lenM = Math.hypot(el.x2 - el.x1, el.y2 - el.y1) * PX_TO_M;
      totalWallLinearM += lenM;
    } else if (el.type === 'door') {
      doorsCount++;
    } else if (el.type === 'window') {
      windowsCount++;
    }
  });

  const totalAreaSqFt = totalAreaM2 * 10.7639;

  // Generate breakdown items
  const items: BOQItem[] = [
    {
      category: 'Substructure & Foundation',
      item: 'Reinforced Concrete Slab & Footings',
      quantity: Math.round(totalAreaM2 * 10) / 10,
      unit: 'm²',
      rate: 180,
      total: Math.round(totalAreaM2 * 180),
    },
    {
      category: 'Superstructure & Walls',
      item: 'Structural Brickwork / Steel Stud Wall Framing',
      quantity: Math.round(totalWallLinearM * 2.8 * 10) / 10, // 2.8m ceiling height
      unit: 'm²',
      rate: 95,
      total: Math.round(totalWallLinearM * 2.8 * 95),
    },
    {
      category: 'Fenestration',
      item: 'Solid Core Acoustic Doors & Architectural Hardware',
      quantity: Math.max(1, doorsCount),
      unit: 'sets',
      rate: 420,
      total: Math.max(1, doorsCount) * 420,
    },
    {
      category: 'Fenestration',
      item: 'Double-Glazed Low-E Thermal Windows',
      quantity: Math.max(1, windowsCount),
      unit: 'units',
      rate: 550,
      total: Math.max(1, windowsCount) * 550,
    },
    {
      category: 'Interior Finishes',
      item: 'Premium Porcelain Tile & Hardwood Flooring',
      quantity: Math.round(totalAreaM2 * 10) / 10,
      unit: 'm²',
      rate: 110,
      total: Math.round(totalAreaM2 * 110),
    },
    {
      category: 'Interior Finishes',
      item: 'Drywall, Skim Coating & Zero-VOC Architectural Paint',
      quantity: Math.round(totalWallLinearM * 2.8 * 2 * 10) / 10, // both sides
      unit: 'm²',
      rate: 38,
      total: Math.round(totalWallLinearM * 2.8 * 2 * 38),
    },
    {
      category: 'MEP Services',
      item: 'Electrical Wiring, Recessed LED Fixtures & Distribution',
      quantity: Math.round(totalAreaM2 * 10) / 10,
      unit: 'm²',
      rate: 85,
      total: Math.round(totalAreaM2 * 85),
    },
    {
      category: 'MEP Services',
      item: 'Plumbing Supply, Drainage & Sanitary Rough-Ins',
      quantity: Math.max(1, roomsCount),
      unit: 'zones',
      rate: 850,
      total: Math.max(1, roomsCount) * 850,
    },
  ];

  const grandTotal = items.reduce((sum, it) => sum + it.total, 0);

  return {
    totalAreaM2: Math.round(totalAreaM2 * 10) / 10,
    totalAreaSqFt: Math.round(totalAreaSqFt),
    totalWallLinearM: Math.round(totalWallLinearM * 10) / 10,
    roomsCount,
    doorsCount,
    windowsCount,
    currency,
    items,
    grandTotal,
  };
}

// Vastu Shastra & Architectural Compliance Analysis
export function analyzeVastu(elements: CanvasElement[]): VastuReport {
  const rooms = elements.filter((el) => el.type === 'room');
  if (rooms.length === 0) {
    return {
      overallScore: 50,
      verdict: 'Insufficient room elements drafted to perform compliance analysis.',
      checks: [],
    };
  }

  // Calculate bounding box of the floor plan to determine zones (NW, N, NE, W, Center, E, SW, S, SE)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach((r) => {
    minX = Math.min(minX, r.x1, r.x2 ?? r.x1);
    minY = Math.min(minY, r.y1, r.y2 ?? r.y1);
    maxX = Math.max(maxX, r.x1, r.x2 ?? r.x1);
    maxY = Math.max(maxY, r.y1, r.y2 ?? r.y1);
  });

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const getZone = (cx: number, cy: number): string => {
    const rx = (cx - minX) / spanX;
    const ry = (cy - minY) / spanY;

    // Standard architectural compass: Top = North, Bottom = South, Left = West, Right = East
    // (or top-left = North-West, top-right = North-East, etc.)
    const isNorth = ry < 0.35;
    const isSouth = ry > 0.65;
    const isWest = rx < 0.35;
    const isEast = rx > 0.65;

    if (isNorth && isEast) return 'North-East (Ishanya)';
    if (isNorth && isWest) return 'North-West (Vayavya)';
    if (isSouth && isEast) return 'South-East (Agneya)';
    if (isSouth && isWest) return 'South-West (Nairutya)';
    if (isNorth) return 'North (Kubera)';
    if (isSouth) return 'South (Yama)';
    if (isEast) return 'East (Indra)';
    if (isWest) return 'West (Varuna)';
    return 'Brahmasthan (Central Zone)';
  };

  const checks: VastuReport['checks'] = [];
  let scorePoints = 0;
  let totalEvaluated = 0;

  rooms.forEach((r) => {
    const cx = (r.x1 + (r.x2 ?? r.x1)) / 2;
    const cy = (r.y1 + (r.y2 ?? r.y1)) / 2;
    const currentZone = getZone(cx, cy);
    const type = r.roomType || 'bedroom';
    const label = r.label || type.toUpperCase();

    if (type === 'bedroom') {
      totalEvaluated++;
      const isSW = currentZone.includes('South-West') || currentZone.includes('South') || currentZone.includes('West');
      if (isSW) {
        scorePoints += 100;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'South-West (Nairutya)',
          status: 'optimal',
          recommendation: 'Optimal placement for master sleeping quarters promoting stability and rest.',
        });
      } else {
        scorePoints += 60;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'South-West (Nairutya)',
          status: 'acceptable',
          recommendation: 'Position bed headboard towards South/East to optimize energy flow.',
        });
      }
    } else if (type === 'kitchen') {
      totalEvaluated++;
      const isSE = currentZone.includes('South-East') || currentZone.includes('North-West');
      if (isSE) {
        scorePoints += 100;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'South-East (Agneya / Fire)',
          status: 'optimal',
          recommendation: 'Flawless fire zone placement for stove and culinary activities.',
        });
      } else {
        scorePoints += 45;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'South-East (Agneya)',
          status: 'warning',
          recommendation: 'Ensure cooking range faces East and sink is placed in North-East corner of kitchen.',
        });
      }
    } else if (type === 'living') {
      totalEvaluated++;
      const isNE = currentZone.includes('North') || currentZone.includes('East') || currentZone.includes('Central');
      if (isNE) {
        scorePoints += 100;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North / East / Central',
          status: 'optimal',
          recommendation: 'Excellent daylight exposure and social welcoming energy.',
        });
      } else {
        scorePoints += 70;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North / East',
          status: 'acceptable',
          recommendation: 'Keep heavier furniture on South/West perimeter of living area.',
        });
      }
    } else if (type === 'bathroom') {
      totalEvaluated++;
      const isNW_W = currentZone.includes('North-West') || currentZone.includes('West') || currentZone.includes('South');
      if (isNW_W) {
        scorePoints += 100;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North-West (Vayavya) / West',
          status: 'optimal',
          recommendation: 'Compliant sanitary drainage location away from sacred North-East zone.',
        });
      } else {
        scorePoints += 30;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North-West / West',
          status: 'warning',
          recommendation: 'Avoid placing water closets directly in North-East or South-West corners.',
        });
      }
    } else if (type === 'pool') {
      totalEvaluated++;
      const isNE = currentZone.includes('North-East') || currentZone.includes('East') || currentZone.includes('North');
      if (isNE) {
        scorePoints += 100;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North-East (Water Element)',
          status: 'optimal',
          recommendation: 'Harmonious water placement enhancing vitality and positive influx.',
        });
      } else {
        scorePoints += 60;
        checks.push({
          item: `${label}`,
          zone: currentZone,
          idealZone: 'North-East / North',
          status: 'acceptable',
          recommendation: 'Water body in current zone acceptable with proper peripheral green shielding.',
        });
      }
    }
  });

  const overallScore = totalEvaluated > 0 ? Math.round(scorePoints / totalEvaluated) : 75;
  const verdict =
    overallScore >= 85
      ? 'Exceptional Architectural Harmony — Highly compliant with Vastu Shastra & IRC spatial principles.'
      : overallScore >= 65
      ? 'Good Spatial Balance — Minor refinements to zone alignments recommended for peak compliance.'
      : 'Moderate Compliance — Consider realigning wet zones (kitchen/bath) and primary suites.';

  return {
    overallScore,
    verdict,
    checks,
  };
}

// Generate SVG string for CAD/Vector export
export function exportToSVG(elements: CanvasElement[], metadata: ProjectMetadata): string {
  let minX = 0, minY = 0, maxX = 1200, maxY = 800;

  if (elements.length > 0) {
    minX = Math.min(...elements.map((e) => Math.min(e.x1, e.x2 ?? e.x1))) - 80;
    minY = Math.min(...elements.map((e) => Math.min(e.y1, e.y2 ?? e.y1))) - 80;
    maxX = Math.max(...elements.map((e) => Math.max(e.x1, e.x2 ?? e.x1))) + 80;
    maxY = Math.max(...elements.map((e) => Math.max(e.y1, e.y2 ?? e.y1))) + 140;
  }

  const w = Math.max(600, maxX - minX);
  const h = Math.max(400, maxY - minY);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <style>
      .bg { fill: #0b1528; }
      .grid { stroke: rgba(79,195,247,0.1); stroke-width: 0.5; }
      .room { fill: rgba(79,195,247,0.06); stroke: #4fc3f7; stroke-width: 2.5; }
      .wall { stroke: #f59e0b; stroke-width: 3.5; stroke-linecap: square; }
      .door { stroke: #f59e0b; stroke-width: 2; fill: none; }
      .window { stroke: #10b981; stroke-width: 3; }
      .furniture { stroke: #a78bfa; stroke-width: 1.5; fill: rgba(167,139,250,0.1); }
      .dim { stroke: #f59e0b; stroke-width: 1; stroke-dasharray: 4,4; }
      .text-title { font-family: 'DM Mono', monospace; font-size: 11px; fill: #4fc3f7; font-weight: bold; }
      .text-label { font-family: 'DM Sans', sans-serif; font-size: 10px; fill: #e2e8f0; }
      .text-dim { font-family: 'DM Mono', monospace; font-size: 9px; fill: #f59e0b; }
      .titleblock { fill: #0a0e17; stroke: #1e3a5f; stroke-width: 1.5; }
    </style>
  </defs>

  <rect x="${minX}" y="${minY}" width="${w}" height="${h}" class="bg" />
`;

  // Draw elements
  elements.forEach((el) => {
    if (el.type === 'room' && el.x2 !== undefined && el.y2 !== undefined) {
      const rx = Math.min(el.x1, el.x2);
      const ry = Math.min(el.y1, el.y2);
      const rw = Math.abs(el.x2 - el.x1);
      const rh = Math.abs(el.y2 - el.y1);
      svg += `  <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" class="room" />\n`;
      if (el.label) {
        svg += `  <text x="${rx + rw / 2}" y="${ry + rh / 2}" text-anchor="middle" dominant-baseline="middle" class="text-title">${el.label}</text>\n`;
      }
    } else if (el.type === 'wall' && el.x2 !== undefined && el.y2 !== undefined) {
      svg += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" class="wall" />\n`;
    } else if (el.type === 'door' && el.x2 !== undefined && el.y2 !== undefined) {
      svg += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" class="door" />\n`;
    } else if (el.type === 'window' && el.x2 !== undefined && el.y2 !== undefined) {
      svg += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" class="window" />\n`;
    } else if (el.type === 'furniture' && el.x2 !== undefined && el.y2 !== undefined) {
      const fx = Math.min(el.x1, el.x2);
      const fy = Math.min(el.y1, el.y2);
      const fw = Math.abs(el.x2 - el.x1);
      const fh = Math.abs(el.y2 - el.y1);
      svg += `  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="3" class="furniture" />\n`;
    } else if (el.type === 'measure' && el.x2 !== undefined && el.y2 !== undefined) {
      svg += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" class="dim" />\n`;
    } else if (el.type === 'text' && el.label) {
      svg += `  <text x="${el.x1}" y="${el.y1}" class="text-label">${el.label}</text>\n`;
    }
  });

  // Title Block
  const tbW = 280;
  const tbH = 65;
  const tbX = maxX - tbW - 20;
  const tbY = maxY - tbH - 20;

  svg += `
  <!-- Architect Title Block -->
  <g id="title-block">
    <rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" class="titleblock" />
    <text x="${tbX + 12}" y="${tbY + 18}" font-family="Bebas Neue, sans-serif" font-size="14" fill="#4fc3f7" letter-spacing="1.5">SS DESIGN STUDIO · SS DEVELOPMENTS</text>
    <text x="${tbX + 12}" y="${tbY + 34}" font-family="DM Sans, sans-serif" font-size="9" fill="#94a3b8">PROJECT: ${metadata.projectName.toUpperCase()}</text>
    <text x="${tbX + 12}" y="${tbY + 46}" font-family="DM Sans, sans-serif" font-size="8" fill="#64748b">SCALE: ${metadata.scale} | DATE: ${metadata.date}</text>
    <text x="${tbX + 12}" y="${tbY + 57}" font-family="DM Mono, monospace" font-size="7.5" fill="#f59e0b">ARCHITECTURAL CERTIFICATION · REV ${metadata.revision}</text>
  </g>
</svg>`;

  return svg;
}

// Export High-Res PNG with Architect Title Block Stamp
export function exportHighResPNG(
  canvas: HTMLCanvasElement,
  metadata: ProjectMetadata,
  scaleFactor = 2
): string {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width * scaleFactor;
  exportCanvas.height = canvas.height * scaleFactor;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  ctx.scale(scaleFactor, scaleFactor);

  // Draw main canvas content
  ctx.drawImage(canvas, 0, 0);

  // Render authentic Architectural Title Block at bottom right
  const tbW = 270;
  const tbH = 70;
  const tbX = canvas.width - tbW - 20;
  const tbY = canvas.height - tbH - 20;

  ctx.save();
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Inner border
  ctx.strokeStyle = 'rgba(79,195,247,0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(tbX + 4, tbY + 4, tbW - 8, tbH - 8);

  // Stamp text
  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 13px "Bebas Neue", sans-serif';
  ctx.fillText('SS DESIGN STUDIO · SS DEVELOPMENTS', tbX + 10, tbY + 18);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 9px "DM Sans", sans-serif';
  ctx.fillText(`PROJECT: ${metadata.projectName.toUpperCase()}`, tbX + 10, tbY + 32);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px "DM Mono", monospace';
  ctx.fillText(`ARCHITECT: ${metadata.architectName.toUpperCase()}`, tbX + 10, tbY + 44);
  ctx.fillText(`SCALE: ${metadata.scale}  |  DATE: ${metadata.date}  |  REV: ${metadata.revision}`, tbX + 10, tbY + 56);

  // Compass Rose / North Arrow on Title Block
  const compassX = tbX + tbW - 26;
  const compassY = tbY + 34;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - 14);
  ctx.lineTo(compassX - 6, compassY + 8);
  ctx.lineTo(compassX, compassY + 3);
  ctx.lineTo(compassX + 6, compassY + 8);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 8px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', compassX, compassY - 16);

  ctx.restore();

  return exportCanvas.toDataURL('image/png');
}
