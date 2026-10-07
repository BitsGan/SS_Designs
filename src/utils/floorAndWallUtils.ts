import { RoomType, FlooringType, WallType, CanvasElement } from '../types';

export interface RoomStyleTheme {
  type: RoomType;
  label: string;
  icon: string;
  color2D: string;
  fillColor2D: string;
  wallColorHex: number;
  skirtingColorHex: number;
  defaultFlooring: FlooringType;
  accentColor: string;
  description: string;
}

export const ROOM_STYLE_MAP: Record<RoomType, RoomStyleTheme> = {
  living: {
    type: 'living',
    label: 'Living Room',
    icon: '🛋️',
    color2D: '#f59e0b',
    fillColor2D: 'rgba(245, 158, 11, 0.12)',
    wallColorHex: 0xfef3c7, // Warm Amber Cream
    skirtingColorHex: 0x78350f,
    defaultFlooring: 'hardwood',
    accentColor: '#f59e0b',
    description: 'Warm golden ambiance with premium oak parquet flooring and soft cream walls.',
  },
  bedroom: {
    type: 'bedroom',
    label: 'Master / Bedroom',
    icon: '🛏️',
    color2D: '#3b82f6',
    fillColor2D: 'rgba(59, 130, 246, 0.12)',
    wallColorHex: 0xe0e7ff, // Soft Indigo / Slate Blue
    skirtingColorHex: 0x1e1b4b,
    defaultFlooring: 'dark_parquet',
    accentColor: '#6366f1',
    description: 'Calming twilight indigo with rich dark walnut flooring and acoustic wall trim.',
  },
  kitchen: {
    type: 'kitchen',
    label: 'Kitchen & Bar',
    icon: '🍳',
    color2D: '#10b981',
    fillColor2D: 'rgba(16, 185, 129, 0.12)',
    wallColorHex: 0xd1fae5, // Fresh Sage / Mint
    skirtingColorHex: 0x064e3b,
    defaultFlooring: 'ceramic_tile',
    accentColor: '#10b981',
    description: 'Fresh mint aesthetic with hygienic glossy porcelain tile and splashback trim.',
  },
  dining: {
    type: 'dining',
    label: 'Dining Hall',
    icon: '🍽️',
    color2D: '#f97316',
    fillColor2D: 'rgba(249, 115, 22, 0.12)',
    wallColorHex: 0xffedd5, // Warm Terracotta Peach
    skirtingColorHex: 0x7c2d12,
    defaultFlooring: 'marble',
    accentColor: '#ea580c',
    description: 'Inviting Mediterranean terracotta tone with polished Italian Carrara marble.',
  },
  bathroom: {
    type: 'bathroom',
    label: 'Bathroom / Spa',
    icon: '🚿',
    color2D: '#06b6d4',
    fillColor2D: 'rgba(6, 182, 212, 0.15)',
    wallColorHex: 0xcffafe, // Clean Sky Aqua
    skirtingColorHex: 0x164e63,
    defaultFlooring: 'ceramic_tile',
    accentColor: '#0891b2',
    description: 'Aqua spa atmosphere with anti-slip ceramic mosaic floor and waterproof plaster.',
  },
  office: {
    type: 'office',
    label: 'Work Studio / Study',
    icon: '💼',
    color2D: '#8b5cf6',
    fillColor2D: 'rgba(139, 92, 246, 0.12)',
    wallColorHex: 0xede9fe, // Modern Executive Lavender
    skirtingColorHex: 0x4c1d95,
    defaultFlooring: 'hardwood',
    accentColor: '#8b5cf6',
    description: 'Modern executive studio with golden oak flooring and focused neutral walls.',
  },
  garage: {
    type: 'garage',
    label: 'Garage & Workshop',
    icon: '🚗',
    color2D: '#64748b',
    fillColor2D: 'rgba(100, 116, 139, 0.14)',
    wallColorHex: 0xe2e8f0, // Industrial Slate Gray
    skirtingColorHex: 0x1e293b,
    defaultFlooring: 'concrete_epoxy',
    accentColor: '#475569',
    description: 'High-durability sealed epoxy industrial concrete with heavy-duty perimeter walls.',
  },
  balcony: {
    type: 'balcony',
    label: 'Balcony & Deck',
    icon: '🌅',
    color2D: '#d97706',
    fillColor2D: 'rgba(217, 119, 6, 0.12)',
    wallColorHex: 0xfef3c7,
    skirtingColorHex: 0x78350f,
    defaultFlooring: 'stone_deck',
    accentColor: '#d97706',
    description: 'Weatherproof slate flagstones and open exterior balustrade.',
  },
  patio: {
    type: 'patio',
    label: 'Patio & Veranda',
    icon: '☕',
    color2D: '#ca8a04',
    fillColor2D: 'rgba(202, 138, 4, 0.12)',
    wallColorHex: 0xfef9c3,
    skirtingColorHex: 0x713f12,
    defaultFlooring: 'stone_deck',
    accentColor: '#ca8a04',
    description: 'Outdoor travertine stone terrace connecting interior spaces to garden.',
  },
  garden: {
    type: 'garden',
    label: 'Landscape Garden',
    icon: '🌿',
    color2D: '#22c55e',
    fillColor2D: 'rgba(34, 197, 94, 0.14)',
    wallColorHex: 0xdcfce7,
    skirtingColorHex: 0x14532d,
    defaultFlooring: 'lawn',
    accentColor: '#16a34a',
    description: 'Manicured natural grass lawn with garden beds and stepping stone paths.',
  },
  pool: {
    type: 'pool',
    label: 'Swimming Pool',
    icon: '🏊',
    color2D: '#0ea5e9',
    fillColor2D: 'rgba(14, 165, 233, 0.2)',
    wallColorHex: 0xe0f2fe,
    skirtingColorHex: 0x0369a1,
    defaultFlooring: 'pool_tile',
    accentColor: '#0284c7',
    description: 'Shimmering aquatic cyan plunge pool with non-slip coping perimeter.',
  },
  hallway: {
    type: 'hallway',
    label: 'Foyer / Hallway',
    icon: '🚪',
    color2D: '#94a3b8',
    fillColor2D: 'rgba(148, 163, 184, 0.1)',
    wallColorHex: 0xf1f5f9,
    skirtingColorHex: 0x334155,
    defaultFlooring: 'marble',
    accentColor: '#64748b',
    description: 'Seamless circulation corridor with polished marble or matching hardwood.',
  },
  closet: {
    type: 'closet',
    label: 'Walk-in Closet',
    icon: '👔',
    color2D: '#a855f7',
    fillColor2D: 'rgba(168, 85, 247, 0.1)',
    wallColorHex: 0xf3e8ff,
    skirtingColorHex: 0x581c87,
    defaultFlooring: 'carpet',
    accentColor: '#9333ea',
    description: 'Plush velvet carpet flooring with customized modular cabinetry walls.',
  },
};

export interface FlooringMaterialInfo {
  type: FlooringType;
  label: string;
  icon: string;
  colorHex: number;
  color2D: string;
  roughness: number;
  metalness: number;
  category: 'Wood' | 'Stone & Tile' | 'Industrial' | 'Soft' | 'Outdoor';
  description: string;
  isWaterproof?: boolean;
}

export const FLOORING_MATERIALS: Record<FlooringType, FlooringMaterialInfo> = {
  hardwood: {
    type: 'hardwood',
    label: 'Golden Oak Parquet',
    icon: '🪵',
    colorHex: 0xc27838,
    color2D: '#c27838',
    roughness: 0.35,
    metalness: 0.05,
    category: 'Wood',
    description: 'Classic Scandinavian golden oak herringbone parquet with satin lacquer finish.',
  },
  dark_parquet: {
    type: 'dark_parquet',
    label: 'Dark Walnut Chevron',
    icon: '🪵',
    colorHex: 0x54321d,
    color2D: '#54321d',
    roughness: 0.3,
    metalness: 0.08,
    category: 'Wood',
    description: 'Rich deep American walnut chevron wood with subtle warm luster.',
  },
  marble: {
    type: 'marble',
    label: 'Carrara White Marble',
    icon: '🏛️',
    colorHex: 0xf3f4f6,
    color2D: '#f3f4f6',
    roughness: 0.12,
    metalness: 0.15,
    category: 'Stone & Tile',
    description: 'Polished Italian Carrara white marble slabs with delicate grey veins.',
  },
  ceramic_tile: {
    type: 'ceramic_tile',
    label: 'Modern Porcelain Tile',
    icon: '🔲',
    colorHex: 0xe2e8f0,
    color2D: '#e2e8f0',
    roughness: 0.25,
    metalness: 0.04,
    category: 'Stone & Tile',
    description: 'Large-format rectified porcelain tiles with tight grout lines.',
  },
  terracotta: {
    type: 'terracotta',
    label: 'Tuscan Terracotta',
    icon: '🧱',
    colorHex: 0xc2410c,
    color2D: '#c2410c',
    roughness: 0.65,
    metalness: 0.02,
    category: 'Stone & Tile',
    description: 'Earthy hand-fired Tuscan terracotta clay pavers with warm rustic texture.',
  },
  concrete_epoxy: {
    type: 'concrete_epoxy',
    label: 'Polished Epoxy Concrete',
    icon: '🏢',
    colorHex: 0x64748b,
    color2D: '#64748b',
    roughness: 0.2,
    metalness: 0.1,
    category: 'Industrial',
    description: 'Seamless high-gloss industrial epoxy concrete with light quartz aggregate.',
  },
  stone_deck: {
    type: 'stone_deck',
    label: 'Charcoal Slate Pavers',
    icon: '🪨',
    colorHex: 0x475569,
    color2D: '#475569',
    roughness: 0.8,
    metalness: 0.05,
    category: 'Outdoor',
    description: 'Natural cleft charcoal slate flagstones for terraces and balconies.',
  },
  carpet: {
    type: 'carpet',
    label: 'Plush Velvet Carpet',
    icon: '🧶',
    colorHex: 0xd6cfc7,
    color2D: '#d6cfc7',
    roughness: 0.95,
    metalness: 0.01,
    category: 'Soft',
    description: 'Ultra-dense woven wool carpet offering maximum acoustic comfort.',
  },
  lawn: {
    type: 'lawn',
    label: 'Manicured Grass Turf',
    icon: '🌱',
    colorHex: 0x166534,
    color2D: '#166534',
    roughness: 0.9,
    metalness: 0.01,
    category: 'Outdoor',
    description: 'Lush emerald green garden lawn turf.',
  },
  pool_tile: {
    type: 'pool_tile',
    label: 'Aquamarine Mosaic Tile',
    icon: '💧',
    colorHex: 0x0891b2,
    color2D: '#0891b2',
    roughness: 0.08,
    metalness: 0.25,
    category: 'Stone & Tile',
    description: 'Iridescent glass mosaic tiles for swimming pools and water features.',
  },
};

export interface WallTypeInfo {
  type: WallType;
  label: string;
  thicknessM: number;
  defaultHeightM: number;
  description: string;
  color2D: string;
  colorHex3D: number;
  copingColorHex3D: number;
  isExterior: boolean;
}

export const WALL_TYPE_CONFIG: Record<WallType, WallTypeInfo> = {
  exterior: {
    type: 'exterior',
    label: 'Exterior Building Wall',
    thicknessM: 0.22,
    defaultHeightM: 3.0,
    description: 'Thick perimeter load-bearing envelope wall with weather-resistant exterior stucco and dark coping.',
    color2D: '#f59e0b',
    colorHex3D: 0x334155, // Dark slate exterior facade
    copingColorHex3D: 0x0f172a,
    isExterior: true,
  },
  partition: {
    type: 'partition',
    label: 'Interior Partition Wall',
    thicknessM: 0.12,
    defaultHeightM: 3.0,
    description: 'Sleek interior room divider with smooth painted drywall and bottom skirting board trim.',
    color2D: '#4fc3f7',
    colorHex3D: 0xf8fafc, // Crisp off-white drywall
    copingColorHex3D: 0xe2e8f0,
    isExterior: false,
  },
  accent: {
    type: 'accent',
    label: 'Architectural Accent Wall',
    thicknessM: 0.14,
    defaultHeightM: 3.0,
    description: 'Featured statement partition with warm wood slat, stone veneer, or deep color tint.',
    color2D: '#a855f7',
    colorHex3D: 0x64748b, // Sophisticated slate accent
    copingColorHex3D: 0x334155,
    isExterior: false,
  },
  glass_curtain: {
    type: 'glass_curtain',
    label: 'Floor-to-Ceiling Glass Wall',
    thicknessM: 0.08,
    defaultHeightM: 3.0,
    description: 'Full-height architectural glass curtain wall with slim black anodized aluminum frame.',
    color2D: '#38bdf8',
    colorHex3D: 0xbfe3ff,
    copingColorHex3D: 0x18181b,
    isExterior: false,
  },
  half_wall: {
    type: 'half_wall',
    label: 'Half Wall / Divider (1.1m)',
    thicknessM: 0.16,
    defaultHeightM: 1.1,
    description: '1.1m low partition wall with timber or polished marble capping for open-concept flow.',
    color2D: '#ec4899',
    colorHex3D: 0xf1f5f9,
    copingColorHex3D: 0xc27838,
    isExterior: false,
  },
};

// Helper to determine active flooring for an element
export function resolveElementFlooring(el: CanvasElement): FlooringType {
  if (el.flooringType) return el.flooringType;
  if (el.type === 'pool') return 'pool_tile';
  if (el.roomType && ROOM_STYLE_MAP[el.roomType]) {
    return ROOM_STYLE_MAP[el.roomType].defaultFlooring;
  }
  return 'hardwood';
}

// Helper to resolve wall type for an element
export function resolveElementWallType(el: CanvasElement): WallType {
  if (el.wallType) return el.wallType;
  if (el.type === 'wall') {
    // Default to exterior if not specified or layer 0
    return el.lineWidth && el.lineWidth >= 3 ? 'exterior' : 'partition';
  }
  return 'partition';
}

// Calculate Flooring Area Takeoff Breakdown across all rooms
export function calculateFlooringSchedule(elements: CanvasElement[], scaleToMeters = 0.05) {
  const breakdown: Record<FlooringType, { areaM2: number; roomCount: number; rooms: string[] }> = {
    hardwood: { areaM2: 0, roomCount: 0, rooms: [] },
    dark_parquet: { areaM2: 0, roomCount: 0, rooms: [] },
    marble: { areaM2: 0, roomCount: 0, rooms: [] },
    ceramic_tile: { areaM2: 0, roomCount: 0, rooms: [] },
    terracotta: { areaM2: 0, roomCount: 0, rooms: [] },
    concrete_epoxy: { areaM2: 0, roomCount: 0, rooms: [] },
    stone_deck: { areaM2: 0, roomCount: 0, rooms: [] },
    carpet: { areaM2: 0, roomCount: 0, rooms: [] },
    lawn: { areaM2: 0, roomCount: 0, rooms: [] },
    pool_tile: { areaM2: 0, roomCount: 0, rooms: [] },
  };

  elements.forEach((el) => {
    if ((el.type === 'room' || el.type === 'pool') && el.x2 !== undefined && el.y2 !== undefined) {
      const wM = Math.abs(el.x2 - el.x1) * scaleToMeters;
      const hM = Math.abs(el.y2 - el.y1) * scaleToMeters;
      const area = wM * hM;
      const fType = resolveElementFlooring(el);
      const roomLabel = el.label || (el.roomType ? ROOM_STYLE_MAP[el.roomType]?.label : 'Room') || 'Room';

      if (breakdown[fType]) {
        breakdown[fType].areaM2 += area;
        breakdown[fType].roomCount += 1;
        breakdown[fType].rooms.push(roomLabel);
      }
    }
  });

  return breakdown;
}
