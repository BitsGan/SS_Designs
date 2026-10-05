import { CanvasElement, PlotConfiguration } from '../types';

export interface SetbackBoundaryBox {
  minX: number; // in canvas px
  maxX: number;
  minY: number;
  maxY: number;
  widthM: number;
  depthM: number;
  frontSetbackM: number;
  rearSetbackM: number;
  leftSetbackM: number;
  rightSetbackM: number;
  plotMinX: number;
  plotMaxX: number;
  plotMinY: number;
  plotMaxY: number;
}

export interface SetbackViolationReport {
  hasViolations: boolean;
  violatedCount: number;
  violations: Array<{
    elementId: string;
    label: string;
    type: string;
    overhangM: number;
    side: 'front' | 'rear' | 'left' | 'right';
  }>;
}

/**
 * Calculates plot boundaries and buildable setback envelope in Canvas coordinate space (20px = 1m).
 * Default canvas origin center is (400, 300).
 */
export function calculatePlotEnvelope(
  plot: PlotConfiguration,
  originX = 400,
  originY = 300
): SetbackBoundaryBox {
  const pxPerMeter = 20;
  const plotWidthPx = plot.widthM * pxPerMeter;
  const plotDepthPx = plot.depthM * pxPerMeter;

  const plotMinX = originX - plotWidthPx / 2;
  const plotMaxX = originX + plotWidthPx / 2;
  const plotMinY = originY - plotDepthPx / 2;
  const plotMaxY = originY + plotDepthPx / 2;

  let frontSetbackM = plot.frontSetbackM;
  let rearSetbackM = plot.rearSetbackM;
  let leftSetbackM = plot.leftSetbackM;
  let rightSetbackM = plot.rightSetbackM;

  let minX = plotMinX + leftSetbackM * pxPerMeter;
  let maxX = plotMaxX - rightSetbackM * pxPerMeter;
  let minY = plotMinY + rearSetbackM * pxPerMeter;
  let maxY = plotMaxY - frontSetbackM * pxPerMeter;

  if (plot.roadFrontage === 'east') {
    maxX = plotMaxX - frontSetbackM * pxPerMeter;
    minX = plotMinX + rearSetbackM * pxPerMeter;
    minY = plotMinY + leftSetbackM * pxPerMeter;
    maxY = plotMaxY - rightSetbackM * pxPerMeter;
  } else if (plot.roadFrontage === 'north') {
    minY = plotMinY + frontSetbackM * pxPerMeter;
    maxY = plotMaxY - rearSetbackM * pxPerMeter;
    minX = plotMinX + leftSetbackM * pxPerMeter;
    maxX = plotMaxX - rightSetbackM * pxPerMeter;
  } else if (plot.roadFrontage === 'west') {
    minX = plotMinX + frontSetbackM * pxPerMeter;
    maxX = plotMaxX - rearSetbackM * pxPerMeter;
    minY = plotMinY + rightSetbackM * pxPerMeter;
    maxY = plotMaxY - leftSetbackM * pxPerMeter;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    widthM: plot.widthM,
    depthM: plot.depthM,
    frontSetbackM,
    rearSetbackM,
    leftSetbackM,
    rightSetbackM,
    plotMinX,
    plotMaxX,
    plotMinY,
    plotMaxY,
  };
}

/**
 * Validates canvas elements against compound setback restrictions.
 * Outdoor garden elements (trees, stepping stones, garden lights, fences) are allowed in setbacks,
 * whereas permanent structural elements (rooms, walls, swimming pools) must comply.
 */
export function validateSetbacks(
  elements: CanvasElement[],
  plot: PlotConfiguration
): { elements: CanvasElement[]; report: SetbackViolationReport } {
  const envelope = calculatePlotEnvelope(plot);
  const pxPerMeter = 20;

  const outdoorAllowedTypes = [
    'plant_tree',
    'garden_light',
    'stepping_stones',
    'compound_gate',
    'fence',
  ];

  let hasViolations = false;
  const violationsList: SetbackViolationReport['violations'] = [];

  const updatedElements = elements.map((el) => {
    // Determine if element is exempt
    if (el.furnitureType && outdoorAllowedTypes.includes(el.furnitureType)) {
      return { ...el, isSetbackViolated: false, setbackViolationAmountM: undefined };
    }
    if (el.type === 'measure' || el.type === 'text') {
      return el;
    }

    const x1 = Math.min(el.x1, el.x2 !== undefined ? el.x2 : el.x1);
    const x2 = Math.max(el.x1, el.x2 !== undefined ? el.x2 : el.x1);
    const y1 = Math.min(el.y1, el.y2 !== undefined ? el.y2 : el.y1);
    const y2 = Math.max(el.y1, el.y2 !== undefined ? el.y2 : el.y1);

    let maxOverhangPx = 0;
    let violatedSide: 'front' | 'rear' | 'left' | 'right' = 'front';

    if (x1 < envelope.minX) {
      const over = envelope.minX - x1;
      if (over > maxOverhangPx) {
        maxOverhangPx = over;
        violatedSide = plot.roadFrontage === 'west' ? 'front' : 'left';
      }
    }
    if (x2 > envelope.maxX) {
      const over = x2 - envelope.maxX;
      if (over > maxOverhangPx) {
        maxOverhangPx = over;
        violatedSide = plot.roadFrontage === 'east' ? 'front' : 'right';
      }
    }
    if (y1 < envelope.minY) {
      const over = envelope.minY - y1;
      if (over > maxOverhangPx) {
        maxOverhangPx = over;
        violatedSide = plot.roadFrontage === 'north' ? 'front' : 'rear';
      }
    }
    if (y2 > envelope.maxY) {
      const over = y2 - envelope.maxY;
      if (over > maxOverhangPx) {
        maxOverhangPx = over;
        violatedSide = plot.roadFrontage === 'south' ? 'front' : 'rear';
      }
    }

    if (maxOverhangPx > 2) {
      const overhangM = Math.round((maxOverhangPx / pxPerMeter) * 10) / 10;
      hasViolations = true;
      violationsList.push({
        elementId: el.id,
        label: el.label || el.roomType || el.furnitureType || el.type,
        type: el.type,
        overhangM,
        side: violatedSide,
      });

      return {
        ...el,
        isSetbackViolated: true,
        setbackViolationAmountM: overhangM,
      };
    }

    return {
      ...el,
      isSetbackViolated: false,
      setbackViolationAmountM: undefined,
    };
  });

  return {
    elements: updatedElements,
    report: {
      hasViolations,
      violatedCount: violationsList.length,
      violations: violationsList,
    },
  };
}
