export type ToolType =
  | 'select'
  | 'room'
  | 'wall'
  | 'door'
  | 'window'
  | 'circle'
  | 'arrow'
  | 'poly'
  | 'arc'
  | 'freehand'
  | 'measure'
  | 'text'
  | 'stair'
  | 'furniture'
  | 'column'
  | 'pool';

export type RenderStyle =
  | 'blueprint'
  | 'wireframe'
  | 'sketch'
  | 'realistic'
  | 'night'
  | 'xray';

export type AppMode = 'blueprint' | 'realistic' | '3d';

export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'garage'
  | 'office'
  | 'pool'
  | 'dining'
  | 'balcony'
  | 'hallway'
  | 'closet'
  | 'patio'
  | 'garden';

export type FurnitureCategory =
  | 'bedroom'
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'outdoor'
  | 'vehicle';

export type FurnitureType =
  | 'bed_king'
  | 'bed_single'
  | 'wardrobe'
  | 'sofa_3p'
  | 'sofa_l'
  | 'armchair'
  | 'coffee_table'
  | 'tv_unit'
  | 'dining_6p'
  | 'dining_4p'
  | 'kitchen_island'
  | 'stove'
  | 'fridge'
  | 'bathtub'
  | 'toilet'
  | 'shower'
  | 'vanity'
  | 'desk'
  | 'meeting_table'
  | 'car'
  | 'suv'
  | 'plant_tree'
  | 'sun_lounger'
  | 'garden_pergola'
  | 'garden_bench'
  | 'garden_fountain'
  | 'flower_bed'
  | 'stepping_stones'
  | 'compound_gate'
  | 'garden_light'
  | 'outdoor_bbq';

export type LightMode3D = 'hologram' | 'daylight' | 'sunset' | 'night';
export type CameraMode3D = 'orbit' | 'walkthrough';
export type RoofMode3D = 'open' | 'flat' | 'pitched';

export type WallType = 'exterior' | 'partition' | 'accent' | 'glass_curtain' | 'half_wall';
export type FlooringType =
  | 'hardwood'
  | 'dark_parquet'
  | 'marble'
  | 'ceramic_tile'
  | 'terracotta'
  | 'concrete_epoxy'
  | 'stone_deck'
  | 'carpet'
  | 'lawn'
  | 'pool_tile';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ToolType;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  color: string;
  lineWidth?: number;
  layer: number;
  label?: string;
  roomType?: RoomType;
  furnitureType?: FurnitureType;
  rotation?: number; // In degrees (0, 90, 180, 270 etc)
  points?: Point[];
  closed?: boolean;
  fontSize?: number;
  flipH?: boolean;
  flipV?: boolean;
  // Wall & Flooring Structure variations
  wallType?: WallType;
  flooringType?: FlooringType;
  wallColor?: string;
  floorLevel?: number; // 0: Ground Floor, 1: First Floor, 2: Upper / Roof
  wallHeightM?: number;
  // Interactive object states
  isOpen?: boolean;
  isOn?: boolean;
  waterActive?: boolean;
  colorVariation?: string;
  // Setback violation caching
  isSetbackViolated?: boolean;
  setbackViolationAmountM?: number;
}

export interface Layer {
  id: number;
  name: string;
  color: string;
  visible?: boolean;
  locked?: boolean;
}

export interface ProjectMetadata {
  projectName: string;
  clientName: string;
  architectName: string;
  location: string;
  scale: string;
  unit: 'metric' | 'imperial';
  date: string;
  revision: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CanvasSnapshot {
  elementCount: number;
  currentTool: ToolType;
  renderStyle: RenderStyle;
  appMode: AppMode;
  gridSize: number;
  unit: 'metric' | 'imperial';
  rooms: Array<{
    label: string;
    type?: string;
    w: number;
    h: number;
    areaM2: number;
    layer: number;
  }>;
  totalAreaM2: number;
  walls: number;
  doors: number;
  windows: number;
  furniture: number;
  layers: string[];
  selectedElement: {
    type: string;
    label?: string;
  } | null;
}

export interface PlotConfiguration {
  widthM: number;
  depthM: number;
  frontSetbackM: number;
  rearSetbackM: number;
  leftSetbackM: number;
  rightSetbackM: number;
  roadFrontage: 'north' | 'south' | 'east' | 'west';
  northAngleDeg: number; // 0 to 360
  shape: 'rectangular' | 'corner' | 'l_shaped';
}

export interface SolarVentilationState {
  timeOfDayHour: number; // 6 to 18 (e.g. 14.5 = 2:30 PM)
  season: 'summer' | 'winter' | 'equinox';
  simulationActive: boolean;
  windSpeedKmh: number;
  windDirectionDeg: number;
  showShadows: boolean;
  showAirflowStreams: boolean;
}

export interface DesignAuditIssue {
  id: string;
  category: 'circulation' | 'connectivity' | 'lighting_ventilation' | 'dimensions' | 'privacy' | 'furniture_clearance';
  severity: 'high' | 'moderate' | 'tip';
  title: string;
  description: string;
  recommendation: string;
  affectedRoomIds?: string[];
  autoFixAction?: AIActionCommand;
}

export interface MaterialTakeoffEstimate {
  bricksCount: number;
  cementBags: number;
  steelTonnes: number;
  concreteCubicM: number;
  flooringAreaM2: number;
  paintLiters: number;
  electricalPoints: number;
  plumbingFixtures: number;
  glassAreaM2: number;
}

export interface AIActionCommand {
  type:
    | 'addRoom'
    | 'addFurniture'
    | 'setTool'
    | 'setStyle'
    | 'setMode'
    | 'undo'
    | 'clearAll'
    | 'loadTemplate'
    | 'batchAddElements'
    | 'autoFurnish'
    | 'applyAuditFix';
  roomType?: RoomType;
  furnitureType?: FurnitureType;
  label?: string;
  tool?: ToolType;
  style?: RenderStyle;
  mode?: AppMode;
  templateId?: string;
  elements?: CanvasElement[];
}

export interface TemplateProject {
  id: string;
  name: string;
  category: 'Residential' | 'Commercial' | 'Luxury' | 'Compact';
  description: string;
  dimensions: string;
  roomsCount: number;
  area: string;
  tags: string[];
  elements: CanvasElement[];
}
