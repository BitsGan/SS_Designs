import * as THREE from 'three';
import { CanvasElement, FurnitureType, PlotConfiguration, RoomType, FlooringType, WallType } from '../types';
import { ROOM_STYLE_MAP, FLOORING_MATERIALS, WALL_TYPE_CONFIG, resolveElementFlooring, resolveElementWallType } from './floorAndWallUtils';

export interface ModelBuilderContext {
  scene: THREE.Scene;
  isRealistic: boolean;
  scale: number; // 0.02
  wallHeight: number;
  holoEdges: THREE.LineSegments[];
  showRoomLabels?: boolean;
  explodedFloorHeight?: number; // Multi-floor vertical exploded separation
  filterFloorLevel?: number | 'all';
}

// Material Palette Cache for High-Performance Realistic & Hologram Rendering
export class ArchitecturalMaterialCache {
  // Realistic Materials
  public wallMat: THREE.MeshStandardMaterial;
  public wallAccentMat: THREE.MeshStandardMaterial;
  public exteriorWallMat: THREE.MeshStandardMaterial;
  public exteriorCopingMat: THREE.MeshStandardMaterial;
  public partitionWallMat: THREE.MeshStandardMaterial;
  public skirtingBoardMat: THREE.MeshStandardMaterial;
  public halfWallCapMat: THREE.MeshStandardMaterial;
  
  // Comprehensive Flooring Materials
  public hardwoodFloorMat: THREE.MeshStandardMaterial;
  public darkWalnutFloorMat: THREE.MeshStandardMaterial;
  public carraraMarbleFloorMat: THREE.MeshStandardMaterial;
  public tileFloorMat: THREE.MeshStandardMaterial;
  public terracottaFloorMat: THREE.MeshStandardMaterial;
  public concreteEpoxyFloorMat: THREE.MeshStandardMaterial;
  public slateDeckFloorMat: THREE.MeshStandardMaterial;
  public plushCarpetFloorMat: THREE.MeshStandardMaterial;
  public grassLawnFloorMat: THREE.MeshStandardMaterial;
  public poolMosaicFloorMat: THREE.MeshStandardMaterial;

  public doorWoodMat: THREE.MeshStandardMaterial;
  public doorFrameMat: THREE.MeshStandardMaterial;
  public brassHardwareMat: THREE.MeshStandardMaterial;
  public chromeMetalMat: THREE.MeshStandardMaterial;
  public blackMetalMat: THREE.MeshStandardMaterial;
  public glassMat: THREE.MeshPhysicalMaterial;
  public fabricWarmMat: THREE.MeshStandardMaterial;
  public fabricCoolMat: THREE.MeshStandardMaterial;
  public fabricDarkMat: THREE.MeshStandardMaterial;
  public whiteLinenMat: THREE.MeshStandardMaterial;
  public ceramicWhiteMat: THREE.MeshStandardMaterial;
  public marbleCounterMat: THREE.MeshStandardMaterial;
  public carPaintMat: THREE.MeshStandardMaterial;
  public carTireMat: THREE.MeshStandardMaterial;
  public foliageMat: THREE.MeshStandardMaterial;
  public foliageLightMat: THREE.MeshStandardMaterial;
  public trunkWoodMat: THREE.MeshStandardMaterial;
  public waterPoolMat: THREE.MeshStandardMaterial;
  public emissiveLightMat: THREE.MeshStandardMaterial;
  public headlampMat: THREE.MeshStandardMaterial;
  public taillampMat: THREE.MeshStandardMaterial;
  // Landscape & Compound & Garden Materials
  public grassLawnMat: THREE.MeshStandardMaterial;
  public stonePavingMat: THREE.MeshStandardMaterial;
  public compoundWallMat: THREE.MeshStandardMaterial;
  public compoundCopingMat: THREE.MeshStandardMaterial;
  public wroughtIronMat: THREE.MeshStandardMaterial;
  public pergolaWoodMat: THREE.MeshStandardMaterial;
  public fountainStoneMat: THREE.MeshStandardMaterial;
  public flowerMagentaMat: THREE.MeshStandardMaterial;
  public flowerGoldMat: THREE.MeshStandardMaterial;
  public flowerLavenderMat: THREE.MeshStandardMaterial;
  public gardenSoilMat: THREE.MeshStandardMaterial;
  public tvGlowMat: THREE.MeshStandardMaterial;
  public fireFlameMat: THREE.MeshStandardMaterial;

  constructor() {
    // 1. Exterior Building Walls (Deep Textured Charcoal / Weatherproof Stucco)
    this.exteriorWallMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Architectural Graphite Slate
      roughness: 0.85,
      metalness: 0.05,
    });
    this.exteriorCopingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark Stone Coping Cap
      roughness: 0.5,
      metalness: 0.15,
    });

    // 2. Interior Partition Walls (Crisp Soft White Drywall)
    this.partitionWallMat = new THREE.MeshStandardMaterial({
      color: 0xfdfcf7, // Crisp Ivory Drywall
      roughness: 0.75,
      metalness: 0.01,
    });
    this.skirtingBoardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Modern Dark Anthracite Baseboard Skirting
      roughness: 0.6,
      metalness: 0.1,
    });
    this.halfWallCapMat = new THREE.MeshStandardMaterial({
      color: 0xc27838, // Warm Polished Oak Capping
      roughness: 0.35,
      metalness: 0.05,
    });

    // Default Fallbacks
    this.wallMat = this.partitionWallMat;
    this.wallAccentMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      metalness: 0.05,
    });

    // 3. Flooring Finishes
    this.hardwoodFloorMat = new THREE.MeshStandardMaterial({
      color: 0xc27838, // Golden Oak Parquet
      roughness: 0.35,
      metalness: 0.05,
    });
    this.darkWalnutFloorMat = new THREE.MeshStandardMaterial({
      color: 0x54321d, // Deep American Walnut
      roughness: 0.3,
      metalness: 0.08,
    });
    this.carraraMarbleFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6, // Carrara White Polished Marble
      roughness: 0.12,
      metalness: 0.15,
    });
    this.tileFloorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Porcelain Rectified Grid Tile
      roughness: 0.25,
      metalness: 0.04,
    });
    this.terracottaFloorMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Hand-fired Tuscan Terracotta
      roughness: 0.65,
      metalness: 0.02,
    });
    this.concreteEpoxyFloorMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // High-Gloss Industrial Epoxy Concrete
      roughness: 0.2,
      metalness: 0.1,
    });
    this.slateDeckFloorMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Charcoal Slate Outdoor Pavers
      roughness: 0.8,
      metalness: 0.05,
    });
    this.plushCarpetFloorMat = new THREE.MeshStandardMaterial({
      color: 0xd6cfc7, // Velvet Wool Warm Carpet
      roughness: 0.95,
      metalness: 0.01,
    });
    this.grassLawnFloorMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Lush Emerald Lawn Turf
      roughness: 0.9,
      metalness: 0.01,
    });
    this.poolMosaicFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2, // Iridescent Turquoise Glass Mosaic
      roughness: 0.08,
      metalness: 0.25,
    });

    this.doorWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Warm mahogany wood
      roughness: 0.45,
      metalness: 0.05,
    });
    this.doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Modern anthracite frame
      roughness: 0.6,
      metalness: 0.2,
    });
    this.brassHardwareMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished brass gold
      roughness: 0.25,
      metalness: 0.85,
    });
    this.chromeMetalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.9,
    });
    this.blackMetalMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.7,
    });
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbfe3ff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 0.15,
      ior: 1.5,
    });
    this.fabricWarmMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate fabric
      roughness: 0.9,
      metalness: 0.02,
    });
    this.fabricCoolMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Royal sapphire fabric
      roughness: 0.85,
      metalness: 0.05,
    });
    this.fabricDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.02,
    });
    this.whiteLinenMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.01,
    });
    this.ceramicWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
    });
    this.marbleCounterMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.1,
    });
    this.carPaintMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Metallic blue
      roughness: 0.2,
      metalness: 0.75,
    });
    this.carTireMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.foliageMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Forest emerald
      roughness: 0.75,
      metalness: 0.05,
    });
    this.foliageLightMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.7,
      metalness: 0.05,
    });
    this.trunkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.waterPoolMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    this.emissiveLightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    this.headlampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.2,
    });
    this.taillampMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.0,
    });

    // Landscape & Compound & Garden
    this.grassLawnMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Rich lush manicured lawn
      roughness: 0.9,
      metalness: 0.02,
    });
    this.stonePavingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Travertine slate pavers
      roughness: 0.75,
      metalness: 0.05,
    });
    this.compoundWallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Perimeter stucco wall
      roughness: 0.85,
      metalness: 0.05,
    });
    this.compoundCopingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark stone coping
      roughness: 0.6,
      metalness: 0.1,
    });
    this.wroughtIronMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Satin black wrought iron
      roughness: 0.4,
      metalness: 0.85,
    });
    this.pergolaWoodMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // Warm teak pergola wood
      roughness: 0.6,
      metalness: 0.05,
    });
    this.fountainStoneMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // Carved limestone
      roughness: 0.4,
      metalness: 0.05,
    });
    this.flowerMagentaMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Vivid magenta blossoms
      roughness: 0.6,
      metalness: 0.02,
    });
    this.flowerGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Warm marigold blossoms
      roughness: 0.6,
      metalness: 0.02,
    });
    this.flowerLavenderMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7, // Lavender flora
      roughness: 0.6,
      metalness: 0.02,
    });
    this.gardenSoilMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Organic rich mulch soil
      roughness: 0.95,
      metalness: 0.01,
    });
    this.tvGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    this.fireFlameMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
  }
}

// Global material cache
let matCache: ArchitecturalMaterialCache | null = null;
export function getMaterialCache(): ArchitecturalMaterialCache {
  if (!matCache) {
    matCache = new ArchitecturalMaterialCache();
  }
  return matCache;
}

// Resolve Three.js Floor Material from FlooringType
export function getThreeFlooringMaterial(fType: FlooringType): THREE.Material {
  const mc = getMaterialCache();
  switch (fType) {
    case 'hardwood':
      return mc.hardwoodFloorMat;
    case 'dark_parquet':
      return mc.darkWalnutFloorMat;
    case 'marble':
      return mc.carraraMarbleFloorMat;
    case 'ceramic_tile':
      return mc.tileFloorMat;
    case 'terracotta':
      return mc.terracottaFloorMat;
    case 'concrete_epoxy':
      return mc.concreteEpoxyFloorMat;
    case 'stone_deck':
      return mc.slateDeckFloorMat;
    case 'carpet':
      return mc.plushCarpetFloorMat;
    case 'lawn':
      return mc.grassLawnFloorMat;
    case 'pool_tile':
      return mc.poolMosaicFloorMat;
    default:
      return mc.hardwoodFloorMat;
  }
}

// Helper to create a Box Mesh with shadows & material
export function createBox(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  isRealistic = true,
  holoColorHex = 0x4fc3f7,
  ctx?: ModelBuilderContext
): THREE.Object3D {
  const geo = new THREE.BoxGeometry(Math.max(0.04, w), Math.max(0.04, h), Math.max(0.04, d));

  if (isRealistic) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  } else {
    // Holographic glowing frame
    const line = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: holoColorHex, transparent: true, opacity: 0.85 })
    );
    line.position.set(x, y, z);
    if (ctx) ctx.holoEdges.push(line);

    const glass = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: holoColorHex, transparent: true, opacity: 0.08, depthWrite: false })
    );
    glass.position.set(x, y, z);

    const group = new THREE.Group();
    group.add(line);
    group.add(glass);
    return group;
  }
}

// -------------------------------------------------------------
// 1. REALISTIC 3D ARCHITECTURAL DOOR BUILDER
// -------------------------------------------------------------
export function create3DDoor(
  el: CanvasElement,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  const dx = (el.x2 !== undefined ? el.x2 : el.x1 + 35) - el.x1;
  const dy = (el.y2 !== undefined ? el.y2 : el.y1) - el.y1;
  const lenMeters = Math.max(0.7, Math.hypot(dx, dy) * scale);
  const angle = Math.atan2(dy, dx);

  const cx = ((el.x1 + (el.x2 || el.x1 + 35)) / 2 - 400) * scale;
  const cz = ((el.y1 + (el.y2 || el.y1)) / 2 - 300) * scale;
  const doorH = 2.15; // standard 2.15m height
  const frameThick = 0.08;
  const jambThick = 0.05;
  const leafThick = 0.045;

  if (ctx.isRealistic) {
    // Left & Right Door Frame Jambs
    const leftJamb = createBox(jambThick, doorH, frameThick, -lenMeters / 2 + jambThick / 2, doorH / 2, 0, mc.doorFrameMat, true);
    const rightJamb = createBox(jambThick, doorH, frameThick, lenMeters / 2 - jambThick / 2, doorH / 2, 0, mc.doorFrameMat, true);
    // Header Lintel
    const header = createBox(lenMeters, jambThick, frameThick, 0, doorH - jambThick / 2, 0, mc.doorFrameMat, true);
    // Threshold Floor Plate
    const threshold = createBox(lenMeters, 0.02, frameThick * 1.1, 0, 0.01, 0, mc.chromeMetalMat, true);

    group.add(leftJamb, rightJamb, header, threshold);

    // Door Leaf (Ajar at ~35 degrees for realistic architectural feeling)
    const doorLeafWidth = lenMeters - jambThick * 2;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(-lenMeters / 2 + jambThick, 0, 0); // hinge pivot

    const doorPanel = createBox(doorLeafWidth, doorH - jambThick, leafThick, doorLeafWidth / 2, (doorH - jambThick) / 2, 0, mc.doorWoodMat, true);
    leafGroup.add(doorPanel);

    // Recessed Moldings / Panels on door face
    const panelMolding1 = createBox(doorLeafWidth * 0.75, (doorH * 0.35), 0.01, doorLeafWidth / 2, doorH * 0.68, leafThick / 2 + 0.005, mc.doorFrameMat, true);
    const panelMolding2 = createBox(doorLeafWidth * 0.75, (doorH * 0.35), 0.01, doorLeafWidth / 2, doorH * 0.25, leafThick / 2 + 0.005, mc.doorFrameMat, true);
    leafGroup.add(panelMolding1, panelMolding2);

    // Polished Brass Lever Handle + Rosette Backplate
    const handleY = 0.98; // 0.98m standard handle height
    const handleX = doorLeafWidth - 0.08;
    const rosetteFront = createBox(0.045, 0.045, 0.01, handleX, handleY, leafThick / 2 + 0.008, mc.brassHardwareMat, true);
    const rosetteBack = createBox(0.045, 0.045, 0.01, handleX, handleY, -leafThick / 2 - 0.008, mc.brassHardwareMat, true);
    const leverFront = createBox(0.12, 0.02, 0.02, handleX - 0.04, handleY, leafThick / 2 + 0.03, mc.brassHardwareMat, true);
    const leverBack = createBox(0.12, 0.02, 0.02, handleX - 0.04, handleY, -leafThick / 2 - 0.03, mc.brassHardwareMat, true);
    leafGroup.add(rosetteFront, rosetteBack, leverFront, leverBack);

    // Set open angle according to interactive state (open by default or when isOpen === true)
    const isDoorOpen = el.isOpen !== false;
    leafGroup.rotation.y = isDoorOpen ? -Math.PI / 2.2 : 0; // open 82° vs closed
    group.add(leafGroup);
  } else {
    // Holographic Door Frame & Swing Indicator
    const frame = createBox(lenMeters, doorH, 0.06, 0, doorH / 2, 0, mc.wallMat, false, 0xf59e0b, ctx);
    group.add(frame);

    // Swing Arc Line in 3D
    const arcCurve = new THREE.EllipseCurve(
      -lenMeters / 2, 0,
      lenMeters * 0.9, lenMeters * 0.9,
      0, Math.PI / 2,
      false, 0
    );
    const points = arcCurve.getPoints(24);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, 0.04, p.y)));
    const arcLine = new THREE.Line(arcGeo, new THREE.LineDashedMaterial({ color: 0xf59e0b, dashSize: 0.05, gapSize: 0.03 }));
    arcLine.computeLineDistances();
    group.add(arcLine);
  }

  group.position.set(cx, 0, cz);
  group.rotation.y = -angle;
  return group;
}

// -------------------------------------------------------------
// 2. REALISTIC 3D ARCHITECTURAL WINDOW BUILDER
// -------------------------------------------------------------
export function create3DWindow(
  el: CanvasElement,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  const dx = (el.x2 !== undefined ? el.x2 : el.x1 + 40) - el.x1;
  const dy = (el.y2 !== undefined ? el.y2 : el.y1) - el.y1;
  const lenMeters = Math.max(0.8, Math.hypot(dx, dy) * scale);
  const angle = Math.atan2(dy, dx);

  const cx = ((el.x1 + (el.x2 || el.x1 + 40)) / 2 - 400) * scale;
  const cz = ((el.y1 + (el.y2 || el.y1)) / 2 - 300) * scale;

  const winH = 1.35;
  const sillY = 0.9; // 900mm standard sill level
  const winCenterY = sillY + winH / 2;
  const frameThick = 0.12;
  const sashThick = 0.04;

  if (ctx.isRealistic) {
    // Outer Frame (Top, Bottom, Left, Right)
    const topFrame = createBox(lenMeters, sashThick, frameThick, 0, sillY + winH - sashThick / 2, 0, mc.doorFrameMat, true);
    const bottomFrame = createBox(lenMeters, sashThick, frameThick, 0, sillY + sashThick / 2, 0, mc.doorFrameMat, true);
    const leftFrame = createBox(sashThick, winH, frameThick, -lenMeters / 2 + sashThick / 2, winCenterY, 0, mc.doorFrameMat, true);
    const rightFrame = createBox(sashThick, winH, frameThick, lenMeters / 2 - sashThick / 2, winCenterY, 0, mc.doorFrameMat, true);

    // Architectural Window Sill Ledge (Projecting outwards)
    const sillLedge = createBox(lenMeters + 0.1, 0.04, frameThick + 0.08, 0, sillY - 0.02, 0.02, mc.marbleCounterMat, true);

    // Center Mullion (Vertical Bar)
    const centerMullion = createBox(sashThick * 0.8, winH - sashThick * 2, frameThick * 0.9, 0, winCenterY, 0, mc.doorFrameMat, true);

    // Double Glazing Physical Glass Panes
    const glassW = (lenMeters - sashThick * 3) / 2;
    const glassH = winH - sashThick * 2;
    const glassLeft = createBox(glassW, glassH, 0.015, -glassW / 2 - sashThick * 0.4, winCenterY, 0, mc.glassMat, true);
    const glassRight = createBox(glassW, glassH, 0.015, glassW / 2 + sashThick * 0.4, winCenterY, 0, mc.glassMat, true);

    group.add(topFrame, bottomFrame, leftFrame, rightFrame, sillLedge, centerMullion, glassLeft, glassRight);
  } else {
    // Holographic Window Frame + Cyan Glaze
    const frame = createBox(lenMeters, winH, 0.06, 0, winCenterY, 0, mc.wallMat, false, 0x10b981, ctx);
    group.add(frame);
  }

  group.position.set(cx, 0, cz);
  group.rotation.y = -angle;
  return group;
}

// -------------------------------------------------------------
// 3. REALISTIC 3D WALL SEGMENT BUILDER (EXTERIOR VS PARTITION)
// -------------------------------------------------------------
export function create3DWallSegment(
  el: CanvasElement,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  const dx = (el.x2 !== undefined ? el.x2 : el.x1 + 40) - el.x1;
  const dy = (el.y2 !== undefined ? el.y2 : el.y1) - el.y1;
  const lenMeters = Math.hypot(dx, dy) * scale;
  const angle = Math.atan2(dy, dx);

  const cx = ((el.x1 + (el.x2 || el.x1)) / 2 - 400) * scale;
  const cz = ((el.y1 + (el.y2 || el.y1)) / 2 - 300) * scale;
  const wallType = resolveElementWallType(el);
  const wallConfig = WALL_TYPE_CONFIG[wallType] || WALL_TYPE_CONFIG.partition;
  const wallH = el.wallHeightM || (wallType === 'half_wall' ? 1.1 : ctx.wallHeight || 3.0);
  const wallThick = wallConfig.thicknessM;

  const floorLevel = el.floorLevel || 0;
  const elevationY = floorLevel * (ctx.wallHeight + 0.3) + (ctx.explodedFloorHeight ? floorLevel * ctx.explodedFloorHeight : 0);

  let wallMaterial: THREE.Material = mc.partitionWallMat;
  if (wallType === 'exterior') {
    wallMaterial = mc.exteriorWallMat;
  } else if (wallType === 'accent') {
    wallMaterial = mc.wallAccentMat;
  } else if (wallType === 'glass_curtain') {
    wallMaterial = mc.glassMat;
  }

  // Custom user wall color override if provided
  if (el.wallColor && ctx.isRealistic && wallType !== 'glass_curtain') {
    wallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(el.wallColor),
      roughness: 0.75,
      metalness: 0.02,
    });
  }

  if (ctx.isRealistic) {
    if (wallType === 'glass_curtain') {
      // Glass Curtain Wall with slim Black Metal Framing
      const glass = createBox(lenMeters, wallH, 0.02, 0, wallH / 2, 0, mc.glassMat, true);
      const topFrame = createBox(lenMeters, 0.05, wallThick, 0, wallH - 0.025, 0, mc.blackMetalMat, true);
      const bottomFrame = createBox(lenMeters, 0.05, wallThick, 0, 0.025, 0, mc.blackMetalMat, true);
      const leftFrame = createBox(0.04, wallH, wallThick, -lenMeters / 2 + 0.02, wallH / 2, 0, mc.blackMetalMat, true);
      const rightFrame = createBox(0.04, wallH, wallThick, lenMeters / 2 - 0.02, wallH / 2, 0, mc.blackMetalMat, true);
      group.add(glass, topFrame, bottomFrame, leftFrame, rightFrame);
    } else if (wallType === 'half_wall') {
      // Half-Height Room Divider with Polished Timber/Marble Capping
      const body = createBox(lenMeters, wallH - 0.04, wallThick, 0, (wallH - 0.04) / 2, 0, wallMaterial, true);
      const cap = createBox(lenMeters + 0.02, 0.04, wallThick + 0.04, 0, wallH - 0.02, 0, mc.halfWallCapMat, true);
      const skirting = createBox(lenMeters, 0.06, wallThick + 0.015, 0, 0.03, 0, mc.skirtingBoardMat, true);
      group.add(body, cap, skirting);
    } else if (wallType === 'exterior') {
      // Robust Exterior Load-Bearing Envelope Wall + Dark Stone Coping
      const mainWall = createBox(lenMeters, wallH, wallThick, 0, wallH / 2, 0, wallMaterial, true);
      const coping = createBox(lenMeters + 0.04, 0.05, wallThick + 0.04, 0, wallH + 0.025, 0, mc.exteriorCopingMat, true);
      group.add(mainWall, coping);
    } else {
      // Crisp Interior Partition Wall + Bottom Skirting Baseboard
      const mainWall = createBox(lenMeters, wallH, wallThick, 0, wallH / 2, 0, wallMaterial, true);
      const skirting = createBox(lenMeters, 0.08, wallThick + 0.012, 0, 0.04, 0, mc.skirtingBoardMat, true);
      group.add(mainWall, skirting);
    }
  } else {
    // Holographic Representation (Amber for exterior, Cyan for partition, Purple for accent)
    const holoColor = wallType === 'exterior' ? 0xf59e0b : wallType === 'accent' ? 0xa855f7 : 0x38bdf8;
    const wallMesh = createBox(lenMeters, wallH, wallThick, 0, wallH / 2, 0, mc.wallMat, false, holoColor, ctx);
    group.add(wallMesh);
  }

  group.position.set(cx, elevationY, cz);
  group.rotation.y = -angle;
  return group;
}

// -------------------------------------------------------------
// 3B. REALISTIC 3D ROOM BUILDER (FLOORING FINISHES & ROOM IDENTIFICATION)
// -------------------------------------------------------------
export function create3DRoomElement(
  el: CanvasElement,
  ctx: ModelBuilderContext,
  showCeiling = false,
  isColorCodedView = false
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  if (el.x2 === undefined || el.y2 === undefined) return group;

  const rw = Math.abs(el.x2 - el.x1) * scale;
  const d = Math.abs(el.y2 - el.y1) * scale;
  const cx = ((el.x1 + el.x2) / 2 - 400) * scale;
  const cz = ((el.y1 + el.y2) / 2 - 300) * scale;
  const wallH = el.wallHeightM || ctx.wallHeight || 3.0;
  const floorLevel = el.floorLevel || 0;
  const elevationY = floorLevel * (ctx.wallHeight + 0.3) + (ctx.explodedFloorHeight ? floorLevel * ctx.explodedFloorHeight : 0);

  const roomTheme = el.roomType ? ROOM_STYLE_MAP[el.roomType] : null;
  const flooringType = resolveElementFlooring(el);
  const floorMat = getThreeFlooringMaterial(flooringType);

  if (el.type === 'pool') {
    // Swimming Pool with cyan mosaic interior & animated water surface
    const poolDepth = 0.8;
    const waterMat = mc.waterPoolMat;
    const basinFloor = createBox(rw, 0.05, d, cx, elevationY - poolDepth, cz, mc.poolMosaicFloorMat, ctx.isRealistic, 0x06b6d4, ctx);
    const waterSurface = createBox(rw - 0.08, 0.02, d - 0.08, cx, elevationY - 0.1, cz, waterMat, ctx.isRealistic, 0x06b6d4, ctx);
    // Non-slip Coping Curb
    const copingThick = 0.14;
    const curbN = createBox(rw + copingThick * 2, 0.06, copingThick, cx, elevationY + 0.03, cz - d / 2 - copingThick / 2, mc.carraraMarbleFloorMat, ctx.isRealistic, 0x06b6d4, ctx);
    const curbS = createBox(rw + copingThick * 2, 0.06, copingThick, cx, elevationY + 0.03, cz + d / 2 + copingThick / 2, mc.carraraMarbleFloorMat, ctx.isRealistic, 0x06b6d4, ctx);
    const curbW = createBox(copingThick, 0.06, d, cx - rw / 2 - copingThick / 2, elevationY + 0.03, cz, mc.carraraMarbleFloorMat, ctx.isRealistic, 0x06b6d4, ctx);
    const curbE = createBox(copingThick, 0.06, d, cx + rw / 2 + copingThick / 2, elevationY + 0.03, cz, mc.carraraMarbleFloorMat, ctx.isRealistic, 0x06b6d4, ctx);
    group.add(basinFloor, waterSurface, curbN, curbS, curbW, curbE);
  } else {
    // 1. Structural Floor Slab with assigned Flooring Material
    const floorSlab = createBox(rw, 0.06, d, cx, elevationY + 0.03, cz, floorMat, ctx.isRealistic, 0x4fc3f7, ctx);
    group.add(floorSlab);

    // Floor Perimeter Edge Transition Trim (Subtle Architectural Inset)
    if (ctx.isRealistic) {
      const edgeTrimMat = mc.skirtingBoardMat;
      const trimN = createBox(rw, 0.015, 0.02, cx, elevationY + 0.06, cz - d / 2 + 0.01, edgeTrimMat, true);
      const trimS = createBox(rw, 0.015, 0.02, cx, elevationY + 0.06, cz + d / 2 - 0.01, edgeTrimMat, true);
      const trimW = createBox(0.02, 0.015, d, cx - rw / 2 + 0.01, elevationY + 0.06, cz, edgeTrimMat, true);
      const trimE = createBox(0.02, 0.015, d, cx + rw / 2 - 0.01, elevationY + 0.06, cz, edgeTrimMat, true);
      group.add(trimN, trimS, trimW, trimE);
    }

    // 2. Room Perimeter Walls
    const wallThick = 0.14;
    let wallMat: THREE.Material = mc.partitionWallMat;

    if (isColorCodedView && roomTheme) {
      // Color coded by room style theme for immediate intuitive identification
      wallMat = new THREE.MeshStandardMaterial({
        color: roomTheme.wallColorHex,
        roughness: 0.75,
        metalness: 0.02,
      });
    } else if (el.wallColor) {
      wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(el.wallColor),
        roughness: 0.75,
        metalness: 0.02,
      });
    }

    // Four Perimeter Walls
    const wallN = createBox(rw, wallH, wallThick, cx, elevationY + wallH / 2, cz - d / 2 + wallThick / 2, wallMat, ctx.isRealistic, 0x4fc3f7, ctx);
    const wallS = createBox(rw, wallH, wallThick, cx, elevationY + wallH / 2, cz + d / 2 - wallThick / 2, wallMat, ctx.isRealistic, 0x4fc3f7, ctx);
    const wallW = createBox(wallThick, wallH, d, cx - rw / 2 + wallThick / 2, elevationY + wallH / 2, cz, wallMat, ctx.isRealistic, 0x4fc3f7, ctx);
    const wallE = createBox(wallThick, wallH, d, cx + rw / 2 - wallThick / 2, elevationY + wallH / 2, cz, wallMat, ctx.isRealistic, 0x4fc3f7, ctx);
    group.add(wallN, wallS, wallW, wallE);

    // Optional Ceiling Slab
    if (showCeiling) {
      const ceiling = createBox(rw, 0.08, d, cx, elevationY + wallH + 0.04, cz, mc.partitionWallMat, ctx.isRealistic, 0x4fc3f7, ctx);
      group.add(ceiling);
    }

    // 3. Floating 3D Room Identification Badge & Floor Tag
    if (ctx.showRoomLabels !== false) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const c2d = canvas.getContext('2d');
      if (c2d) {
        // High-contrast clean architectural badge card
        c2d.fillStyle = 'rgba(15, 23, 42, 0.92)';
        c2d.strokeStyle = roomTheme?.accentColor || '#38bdf8';
        c2d.lineWidth = 4;
        c2d.beginPath();
        c2d.roundRect(8, 8, 496, 124, 16);
        c2d.fill();
        c2d.stroke();

        const roomIcon = roomTheme?.icon || '🏠';
        const roomName = (el.label || roomTheme?.label || el.roomType || 'ROOM').toUpperCase();
        const areaM2 = (rw * d * 6.25).toFixed(1); // 1 CAD meter ≈ 2.5 real meters
        const areaSqFt = (parseFloat(areaM2) * 10.764).toFixed(0);
        const fInfo = FLOORING_MATERIALS[flooringType];

        // Header Title
        c2d.font = 'bold 30px sans-serif';
        c2d.fillStyle = '#ffffff';
        c2d.textAlign = 'center';
        c2d.fillText(`${roomIcon}  ${roomName}`, 256, 48);

        // Subtitle: Area & Flooring
        c2d.font = 'bold 20px "DM Mono", monospace';
        c2d.fillStyle = roomTheme?.accentColor || '#38bdf8';
        c2d.fillText(`${areaM2} m² (${areaSqFt} sq ft) • ${fInfo?.label || 'Hardwood'}`, 256, 88);

        // Level indicator
        c2d.font = '16px "DM Mono", monospace';
        c2d.fillStyle = '#94a3b8';
        c2d.fillText(`LEVEL ${floorLevel}  •  ${(rw * 2.5).toFixed(1)}m × ${(d * 2.5).toFixed(1)}m`, 256, 118);
      }

      const badgeTexture = new THREE.CanvasTexture(canvas);
      badgeTexture.minFilter = THREE.LinearFilter;
      const badgeMat = new THREE.SpriteMaterial({
        map: badgeTexture,
        transparent: true,
        depthWrite: false,
      });
      const badgeSprite = new THREE.Sprite(badgeMat);
      badgeSprite.scale.set(3.2, 0.88, 1);
      badgeSprite.position.set(cx, elevationY + wallH + 0.65, cz);
      group.add(badgeSprite);
    }
  }

  return group;
}

// -------------------------------------------------------------
// 4. REALISTIC 3D STAIRCASE BUILDER
// -------------------------------------------------------------
export function create3DStaircase(
  el: CanvasElement,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  const w = Math.abs((el.x2 || el.x1 + 30) - el.x1) * scale;
  const d = Math.abs((el.y2 || el.y1 + 60) - el.y1) * scale;
  const cx = ((el.x1 + (el.x2 || el.x1 + 30)) / 2 - 400) * scale;
  const cz = ((el.y1 + (el.y2 || el.y1 + 60)) / 2 - 300) * scale;

  const totalHeight = ctx.wallHeight || 3.0;
  const steps = 12;
  const treadDepth = d / steps;
  const riserHeight = totalHeight / steps;

  for (let i = 0; i < steps; i++) {
    const stepY = (i + 1) * riserHeight - riserHeight / 2;
    const stepZ = -d / 2 + i * treadDepth + treadDepth / 2;
    const tread = createBox(w, (i + 1) * riserHeight, treadDepth, 0, stepY / 2 + (i + 1) * riserHeight / 4, stepZ, mc.hardwoodFloorMat, ctx.isRealistic, 0xf59e0b, ctx);
    group.add(tread);
  }

  // Side Glass Balustrade & Handrail
  if (ctx.isRealistic) {
    const railPost = createBox(0.04, totalHeight + 0.9, 0.04, w / 2 - 0.02, (totalHeight + 0.9) / 2, 0, mc.brassHardwareMat, true);
    const handrail = createBox(0.06, 0.04, d * 1.1, w / 2 - 0.02, totalHeight * 0.6 + 0.9, 0, mc.doorWoodMat, true);
    handrail.rotation.x = Math.atan2(totalHeight, d);
    group.add(railPost, handrail);
  }

  group.position.set(cx, 0, cz);
  return group;
}

// -------------------------------------------------------------
// 5. COMPREHENSIVE REALISTIC 3D FURNITURE BUILDERS (ALL 20+ TYPES)
// -------------------------------------------------------------
export function create3DFurniture(
  el: CanvasElement,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const scale = ctx.scale;

  const fw = Math.max(0.4, Math.abs((el.x2 || el.x1 + 40) - el.x1) * scale);
  const fd = Math.max(0.4, Math.abs((el.y2 || el.y1 + 40) - el.y1) * scale);
  const fcx = ((el.x1 + (el.x2 || el.x1 + 40)) / 2 - 400) * scale;
  const fcz = ((el.y1 + (el.y2 || el.y1 + 40)) / 2 - 300) * scale;
  const ftype = (el.furnitureType || 'sofa_3p') as FurnitureType;

  // Apply Element Rotation if defined
  const rotDeg = el.rotation || 0;
  group.rotation.y = (rotDeg * Math.PI) / 180;

  if (!ctx.isRealistic) {
    // Standard Holographic Model Fallback
    const holoBox = createBox(fw, 0.55, fd, 0, 0.28, 0, mc.fabricCoolMat, false, 0xa78bfa, ctx);
    group.add(holoBox);
    group.position.set(fcx, 0, fcz);
    return group;
  }

  // Realistic Procedural Architectural 3D Builders:
  switch (ftype) {
    case 'bed_king':
    case 'bed_single': {
      const isKing = ftype === 'bed_king';
      const bedW = isKing ? fw * 0.72 : fw * 0.8;
      const standW = (fw - bedW) / 2;

      // Platform Bed Base Frame (Walnut)
      const base = createBox(bedW, 0.22, fd, 0, 0.11, 0, mc.doorWoodMat);
      // Plush Quilted White Mattress
      const mattress = createBox(bedW * 0.95, 0.25, fd * 0.94, 0, 0.34, 0, mc.whiteLinenMat);
      // Tall Padded Headboard
      const headboard = createBox(bedW, 0.95, 0.08, 0, 0.48, -fd / 2 + 0.04, mc.fabricWarmMat);
      // Folded Luxury Duvet / Bedspread (Slate Blue)
      const duvet = createBox(bedW * 0.96, 0.08, fd * 0.58, 0, 0.48, fd * 0.18, mc.fabricCoolMat);

      group.add(base, mattress, headboard, duvet);

      // Pillows with realistic ergonomic tilt
      if (isKing) {
        const pillowW = bedW * 0.42;
        const pillowL = createBox(pillowW, 0.1, 0.28, -bedW * 0.23, 0.5, -fd * 0.3, mc.whiteLinenMat);
        const pillowR = createBox(pillowW, 0.1, 0.28, bedW * 0.23, 0.5, -fd * 0.3, mc.whiteLinenMat);
        pillowL.rotation.x = 0.2;
        pillowR.rotation.x = 0.2;
        group.add(pillowL, pillowR);
      } else {
        const pillow = createBox(bedW * 0.75, 0.1, 0.28, 0, 0.5, -fd * 0.3, mc.whiteLinenMat);
        pillow.rotation.x = 0.2;
        group.add(pillow);
      }

      // Nightstands & Bedside Lamps on Left and Right
      if (standW > 0.15) {
        [-1, 1].forEach((side) => {
          const standX = side * (bedW / 2 + standW / 2);
          const stand = createBox(standW * 0.85, 0.45, fd * 0.4, standX, 0.22, -fd * 0.25, mc.doorWoodMat);
          const lampBase = createBox(0.1, 0.02, 0.1, standX, 0.46, -fd * 0.25, mc.brassHardwareMat);
          const lampPole = createBox(0.02, 0.25, 0.02, standX, 0.58, -fd * 0.25, mc.brassHardwareMat);
          const lampShade = createBox(0.18, 0.16, 0.18, standX, 0.73, -fd * 0.25, mc.emissiveLightMat);
          group.add(stand, lampBase, lampPole, lampShade);
        });
      }
      break;
    }

    case 'wardrobe': {
      // Tall Full-Height Wardrobe
      const wardrobeH = 2.3;
      const body = createBox(fw, wardrobeH, fd, 0, wardrobeH / 2, 0, mc.doorWoodMat);
      const cornice = createBox(fw * 1.04, 0.06, fd * 1.04, 0, wardrobeH + 0.03, 0, mc.doorFrameMat);
      // Dual Door Groove Lines & Long Brass Handles
      const doorLine = createBox(0.01, wardrobeH * 0.9, 0.01, 0, wardrobeH / 2, fd / 2 + 0.005, mc.doorFrameMat);
      const handleL = createBox(0.02, 0.4, 0.02, -0.06, 1.1, fd / 2 + 0.02, mc.brassHardwareMat);
      const handleR = createBox(0.02, 0.4, 0.02, 0.06, 1.1, fd / 2 + 0.02, mc.brassHardwareMat);
      group.add(body, cornice, doorLine, handleL, handleR);
      break;
    }

    case 'sofa_3p':
    case 'sofa_l':
    case 'armchair': {
      const isL = ftype === 'sofa_l';
      const isArm = ftype === 'armchair';
      const seatH = 0.42;
      const backH = 0.78;
      const armW = 0.14;

      // Base Wooden Frame & 4 Corner Metal Legs
      const base = createBox(fw, 0.14, fd, 0, 0.14, 0, mc.fabricWarmMat);
      group.add(base);

      // Backrest
      const backrest = createBox(fw, backH - seatH, 0.18, 0, (seatH + backH) / 2, -fd / 2 + 0.09, mc.fabricWarmMat);
      // Left & Right Armrests
      const armL = createBox(armW, backH * 0.75, fd, -fw / 2 + armW / 2, (backH * 0.75) / 2, 0, mc.fabricWarmMat);
      const armR = createBox(armW, backH * 0.75, fd, fw / 2 - armW / 2, (backH * 0.75) / 2, 0, mc.fabricWarmMat);
      group.add(backrest, armL, armR);

      // Plump Individual Seat Cushions
      const cushionDepth = fd - 0.2;
      if (isArm) {
        const cushion = createBox(fw - armW * 2, 0.16, cushionDepth, 0, seatH, 0.05, mc.fabricCoolMat);
        group.add(cushion);
      } else if (isL) {
        // Main 2 cushions + Chaise extension cushion
        const mainW = (fw - armW * 2) * 0.65;
        const chaiseW = (fw - armW * 2) * 0.35;
        const c1 = createBox(mainW, 0.16, cushionDepth * 0.7, -chaiseW / 2, seatH, -0.05, mc.fabricCoolMat);
        const cChaise = createBox(chaiseW, 0.16, fd - 0.1, fw / 2 - armW - chaiseW / 2, seatH, 0.02, mc.fabricCoolMat);
        group.add(c1, cChaise);
      } else {
        // 3-Seater: 3 separate comfy cushions
        const cushionCount = 3;
        const cw = (fw - armW * 2 - 0.04) / cushionCount;
        for (let i = 0; i < cushionCount; i++) {
          const cx = -fw / 2 + armW + 0.02 + cw / 2 + i * (cw + 0.01);
          const cushion = createBox(cw, 0.16, cushionDepth, cx, seatH, 0.05, mc.fabricCoolMat);
          group.add(cushion);
        }
      }
      break;
    }

    case 'coffee_table': {
      // Modern Glass & Walnut Coffee Table
      const tableH = 0.42;
      const glassTop = createBox(fw, 0.02, fd, 0, tableH, 0, mc.glassMat);
      const lowerShelf = createBox(fw * 0.85, 0.02, fd * 0.85, 0, tableH * 0.4, 0, mc.doorWoodMat);
      // 4 Slim Matte Black Steel Legs
      const legRadius = 0.025;
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => {
          const leg = createBox(legRadius, tableH, legRadius, sx * (fw / 2 - 0.04), tableH / 2, sz * (fd / 2 - 0.04), mc.blackMetalMat);
          group.add(leg);
        });
      });
      group.add(glassTop, lowerShelf);
      break;
    }

    case 'tv_unit': {
      // Modern Credenza + Thin Widescreen OLED TV
      const unitH = 0.48;
      const credenza = createBox(fw, unitH, fd, 0, unitH / 2, 0, mc.doorWoodMat);
      // TV Stand & Flat Screen
      const tvW = fw * 0.88;
      const tvH = 0.75;
      const tvStand = createBox(tvW * 0.35, 0.02, fd * 0.4, 0, unitH + 0.01, 0, mc.blackMetalMat);
      const tvPole = createBox(0.04, 0.12, 0.04, 0, unitH + 0.06, 0, mc.blackMetalMat);
      const tvScreen = createBox(tvW, tvH, 0.02, 0, unitH + 0.12 + tvH / 2, 0, mc.blackMetalMat);
      const isTvOn = el.isOn !== false;
      const tvBezel = createBox(
        tvW * 0.98,
        tvH * 0.96,
        0.005,
        0,
        unitH + 0.12 + tvH / 2,
        0.011,
        isTvOn ? mc.tvGlowMat : mc.fabricDarkMat
      );
      // Slim Soundbar
      const soundbar = createBox(tvW * 0.6, 0.05, 0.07, 0, unitH + 0.03, fd * 0.25, mc.blackMetalMat);
      group.add(credenza, tvStand, tvPole, tvScreen, tvBezel, soundbar);
      break;
    }

    case 'dining_6p':
    case 'dining_4p': {
      const is6P = ftype === 'dining_6p';
      const tableH = 0.76;
      const tableTop = createBox(fw, 0.04, fd, 0, tableH, 0, mc.hardwoodFloorMat);
      // 4 Table Legs
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => {
          const leg = createBox(0.06, tableH, 0.06, sx * (fw / 2 - 0.06), tableH / 2, sz * (fd / 2 - 0.06), mc.doorWoodMat);
          group.add(leg);
        });
      });
      group.add(tableTop);

      // Dining Chairs (Seats + Backrests + Legs)
      const chairsPerSide = is6P ? 3 : 2;
      const chairW = (fw - 0.2) / chairsPerSide;
      for (let i = 0; i < chairsPerSide; i++) {
        const chairX = -fw / 2 + 0.1 + chairW / 2 + i * chairW;
        [-1, 1].forEach((sideZ) => {
          const chairZ = sideZ * (fd / 2 + 0.22);
          const chairSeat = createBox(chairW * 0.75, 0.04, 0.38, chairX, 0.46, chairZ, mc.fabricWarmMat);
          const chairBack = createBox(chairW * 0.75, 0.42, 0.04, chairX, 0.68, chairZ + sideZ * 0.18, mc.doorWoodMat);
          const chairLeg = createBox(0.03, 0.46, 0.03, chairX, 0.23, chairZ, mc.blackMetalMat);
          group.add(chairSeat, chairBack, chairLeg);
        });
      }
      break;
    }

    case 'kitchen_island': {
      // Luxury Quartz Countertop with Waterfall edge
      const islandH = 0.92;
      const counter = createBox(fw, 0.06, fd, 0, islandH, 0, mc.marbleCounterMat);
      const cabinetry = createBox(fw * 0.92, islandH - 0.06, fd * 0.85, 0, (islandH - 0.06) / 2, 0, mc.doorFrameMat);

      // Inset Stainless Steel Double Sink
      const sinkW = 0.7;
      const sinkD = 0.42;
      const sink = createBox(sinkW, 0.18, sinkD, -fw * 0.2, islandH - 0.06, 0, mc.chromeMetalMat);
      // Tall Chrome Gooseneck Faucet
      const faucetBase = createBox(0.04, 0.25, 0.04, -fw * 0.2, islandH + 0.15, -sinkD * 0.35, mc.chromeMetalMat);
      const faucetNeck = createBox(0.04, 0.04, 0.18, -fw * 0.2, islandH + 0.28, -sinkD * 0.2, mc.chromeMetalMat);

      // 2 Modern Bar Stools along overhang
      [-1, 1].forEach((side) => {
        const stoolX = side * (fw * 0.25);
        const stool = createBox(0.35, 0.05, 0.35, stoolX, 0.65, fd / 2 + 0.22, mc.doorWoodMat);
        const stoolLeg = createBox(0.03, 0.65, 0.03, stoolX, 0.32, fd / 2 + 0.22, mc.blackMetalMat);
        group.add(stool, stoolLeg);
      });

      group.add(counter, cabinetry, sink, faucetBase, faucetNeck);
      break;
    }

    case 'stove': {
      // Induction / Gas Range + Oven Unit + Overhead Canopy Hood
      const stoveH = 0.9;
      const body = createBox(fw, stoveH, fd, 0, stoveH / 2, 0, mc.chromeMetalMat);
      const glassTop = createBox(fw * 0.96, 0.02, fd * 0.96, 0, stoveH + 0.01, 0, mc.blackMetalMat);
      const ovenGlass = createBox(fw * 0.8, 0.45, 0.02, 0, 0.45, fd / 2 + 0.01, mc.fabricDarkMat);
      const ovenHandle = createBox(fw * 0.7, 0.03, 0.04, 0, 0.7, fd / 2 + 0.04, mc.chromeMetalMat);
      // 4 Burner Rings + Active Flame Glow
      const isStoveOn = el.isOn === true;
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => {
          const burner = createBox(0.14, 0.01, 0.14, sx * 0.18, stoveH + 0.02, sz * 0.16, isStoveOn ? mc.fireFlameMat : mc.chromeMetalMat);
          group.add(burner);
        });
      });
      // Overhead Range Hood
      const hood = createBox(fw * 1.05, 0.25, fd * 1.05, 0, 2.0, 0, mc.chromeMetalMat);
      const hoodFlue = createBox(fw * 0.4, 0.8, fd * 0.4, 0, 2.5, 0, mc.chromeMetalMat);
      group.add(body, glassTop, ovenGlass, ovenHandle, hood, hoodFlue);
      break;
    }

    case 'fridge': {
      // French-Door Stainless Steel Fridge
      const fridgeH = 1.95;
      const body = createBox(fw, fridgeH, fd, 0, fridgeH / 2, 0, mc.chromeMetalMat);
      // Door seams & Long vertical bar handles
      const handleL = createBox(0.03, 0.7, 0.04, -0.06, 1.2, fd / 2 + 0.03, mc.doorFrameMat);
      const handleR = createBox(0.03, 0.7, 0.04, 0.06, 1.2, fd / 2 + 0.03, mc.doorFrameMat);
      const freezerHandle = createBox(fw * 0.75, 0.03, 0.04, 0, 0.55, fd / 2 + 0.03, mc.doorFrameMat);
      group.add(body, handleL, handleR, freezerHandle);
      break;
    }

    case 'bathtub': {
      // Freestanding High-Gloss Acrylic Soaking Tub
      const tubH = 0.58;
      const outerTub = createBox(fw, tubH, fd, 0, tubH / 2, 0, mc.ceramicWhiteMat);
      const innerBasin = createBox(fw * 0.84, tubH * 0.85, fd * 0.82, 0, tubH * 0.6, 0, mc.waterPoolMat);
      // Freestanding Chrome Tub Filler Faucet & Mixer
      const faucetPole = createBox(0.04, 0.88, 0.04, fw / 2 + 0.1, 0.44, 0, mc.chromeMetalMat);
      const faucetSpout = createBox(0.18, 0.04, 0.04, fw / 2, 0.84, 0, mc.chromeMetalMat);
      group.add(outerTub, innerBasin, faucetPole, faucetSpout);
      break;
    }

    case 'toilet': {
      // Modern Wall-Hung Ceramic WC + Cistern Tank
      const wcBase = createBox(fw, 0.42, fd * 0.7, 0, 0.21, fd * 0.15, mc.ceramicWhiteMat);
      const wcTank = createBox(fw * 0.95, 0.75, fd * 0.35, 0, 0.38, -fd * 0.32, mc.ceramicWhiteMat);
      const flushButton = createBox(0.08, 0.04, 0.01, 0, 0.68, -fd * 0.32 + fd * 0.35 / 2 + 0.005, mc.chromeMetalMat);
      group.add(wcBase, wcTank, flushButton);
      break;
    }

    case 'shower': {
      // Frameless Tempered Glass Shower Cubicle
      const showerH = 2.15;
      const tray = createBox(fw, 0.06, fd, 0, 0.03, 0, mc.tileFloorMat);
      const glassDoor = createBox(fw, showerH, 0.01, 0, showerH / 2, fd / 2, mc.glassMat);
      const glassSide = createBox(0.01, showerH, fd, fw / 2, showerH / 2, 0, mc.glassMat);
      // Wall Showerhead & Chrome Mixer
      const showerHead = createBox(0.24, 0.02, 0.24, 0, 2.0, -fd / 2 + 0.2, mc.chromeMetalMat);
      const showerArm = createBox(0.03, 0.03, 0.25, 0, 2.08, -fd / 2 + 0.12, mc.chromeMetalMat);
      group.add(tray, glassDoor, glassSide, showerHead, showerArm);
      break;
    }

    case 'vanity': {
      // Floating Floating Wood Vanity + Ceramic Vessel Basin + Illuminated Mirror
      const vanityH = 0.55;
      const cabinet = createBox(fw, vanityH, fd, 0, 0.55, 0, mc.doorWoodMat);
      const counter = createBox(fw * 1.02, 0.04, fd * 1.02, 0, 0.84, 0, mc.marbleCounterMat);
      const basin = createBox(fw * 0.6, 0.14, fd * 0.65, 0, 0.92, 0, mc.ceramicWhiteMat);
      const faucet = createBox(0.04, 0.22, 0.12, 0, 1.0, -fd * 0.2, mc.chromeMetalMat);
      // Large Backlit Mirror
      const mirror = createBox(fw * 0.9, 0.95, 0.02, 0, 1.6, -fd / 2 + 0.01, mc.glassMat);
      group.add(cabinet, counter, basin, faucet, mirror);
      break;
    }

    case 'desk':
    case 'meeting_table': {
      const isMeeting = ftype === 'meeting_table';
      const deskH = 0.76;
      const deskTop = createBox(fw, 0.04, fd, 0, deskH, 0, mc.hardwoodFloorMat);
      // Modern Steel Loop Legs
      [-1, 1].forEach((sx) => {
        const loop = createBox(0.05, deskH, fd * 0.9, sx * (fw / 2 - 0.06), deskH / 2, 0, mc.blackMetalMat);
        group.add(loop);
      });

      // Executive Mesh Task Chair
      const chairSeat = createBox(0.5, 0.08, 0.48, 0, 0.48, fd / 2 + 0.28, mc.fabricDarkMat);
      const chairBack = createBox(0.48, 0.58, 0.06, 0, 0.8, fd / 2 + 0.5, mc.fabricDarkMat);
      const chairPole = createBox(0.05, 0.48, 0.05, 0, 0.24, fd / 2 + 0.28, mc.chromeMetalMat);
      const laptop = createBox(0.32, 0.01, 0.24, 0, deskH + 0.01, 0, mc.chromeMetalMat);
      group.add(deskTop, chairSeat, chairBack, chairPole, laptop);
      break;
    }

    case 'car':
    case 'suv': {
      const isSUV = ftype === 'suv';
      const carH = isSUV ? 1.68 : 1.42;

      // Chassis Body (Metallic Automotive Paint)
      const bodyLower = createBox(fw, carH * 0.5, fd, 0, carH * 0.35, 0, mc.carPaintMat);
      const bodyCabin = createBox(fw * 0.88, carH * 0.45, fd * 0.55, 0, carH * 0.72, -fd * 0.05, mc.carPaintMat);

      // Glass Windshields (Front, Rear, Sides)
      const frontGlass = createBox(fw * 0.84, carH * 0.35, 0.02, 0, carH * 0.7, fd * 0.22, mc.glassMat);
      frontGlass.rotation.x = 0.35;
      const rearGlass = createBox(fw * 0.84, carH * 0.35, 0.02, 0, carH * 0.7, -fd * 0.32, mc.glassMat);
      rearGlass.rotation.x = -0.35;
      group.add(bodyLower, bodyCabin, frontGlass, rearGlass);

      // 4 Rubber Wheels with Alloy Rims
      const wheelW = 0.22;
      const wheelR = 0.34;
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => {
          const wheel = createBox(wheelW, wheelR * 2, wheelR * 2, sx * (fw / 2 + 0.02), wheelR, sz * (fd * 0.32), mc.carTireMat);
          const rim = createBox(wheelW * 1.05, wheelR * 1.2, wheelR * 1.2, sx * (fw / 2 + 0.02), wheelR, sz * (fd * 0.32), mc.chromeMetalMat);
          group.add(wheel, rim);
        });
      });

      // Front Xenon Headlights & Rear LED Taillights
      const headlightL = createBox(0.24, 0.1, 0.02, -fw * 0.32, carH * 0.4, fd / 2 + 0.01, mc.headlampMat);
      const headlightR = createBox(0.24, 0.1, 0.02, fw * 0.32, carH * 0.4, fd / 2 + 0.01, mc.headlampMat);
      const taillightL = createBox(0.24, 0.1, 0.02, -fw * 0.32, carH * 0.45, -fd / 2 - 0.01, mc.taillampMat);
      const taillightR = createBox(0.24, 0.1, 0.02, fw * 0.32, carH * 0.45, -fd / 2 - 0.01, mc.taillampMat);
      group.add(headlightL, headlightR, taillightL, taillightR);
      break;
    }

    case 'plant_tree': {
      // Ceramic Planter Pot
      const potH = 0.48;
      const pot = createBox(fw * 0.55, potH, fw * 0.55, 0, potH / 2, 0, mc.ceramicWhiteMat);
      // Trunk
      const trunkH = 1.2;
      const trunk = createBox(0.12, trunkH, 0.12, 0, potH + trunkH / 2, 0, mc.trunkWoodMat);
      // Overlapping Spherical Foliage Canopy
      const sphereGeo1 = new THREE.SphereGeometry(fw * 0.65, 16, 16);
      const foliage1 = new THREE.Mesh(sphereGeo1, mc.foliageMat);
      foliage1.position.set(0, potH + trunkH + 0.2, 0);
      foliage1.castShadow = true;

      const sphereGeo2 = new THREE.SphereGeometry(fw * 0.45, 14, 14);
      const foliage2 = new THREE.Mesh(sphereGeo2, mc.foliageLightMat);
      foliage2.position.set(fw * 0.2, potH + trunkH + 0.45, fw * 0.15);
      foliage2.castShadow = true;

      group.add(pot, trunk, foliage1, foliage2);
      break;
    }

    case 'sun_lounger': {
      // Teak Wood Chaise Lounge + Reclining Ergonomic Cushion
      const chaiseH = 0.24;
      const frame = createBox(fw, chaiseH, fd, 0, chaiseH / 2, 0, mc.doorWoodMat);
      const cushion = createBox(fw * 0.94, 0.08, fd * 0.94, 0, chaiseH + 0.04, 0, mc.whiteLinenMat);
      // Inclined Headrest
      const headrest = createBox(fw * 0.94, 0.1, fd * 0.35, 0, chaiseH + 0.16, -fd * 0.28, mc.whiteLinenMat);
      headrest.rotation.x = 0.4;
      group.add(frame, cushion, headrest);
      break;
    }

    // ---------------------------------------------------------
    // GARDEN, LANDSCAPING & COMPOUND 3D ARCHITECTURAL MODELS
    // ---------------------------------------------------------
    case 'garden_pergola': {
      // 4 Heavy Timber Posts + Overhead Crossbeams & Rafters
      const pergolaH = 2.45;
      const postSize = 0.14;
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => {
          const post = createBox(
            postSize,
            pergolaH,
            postSize,
            sx * (fw / 2 - postSize / 2),
            pergolaH / 2,
            sz * (fd / 2 - postSize / 2),
            mc.pergolaWoodMat
          );
          group.add(post);
        });
      });

      // 2 Longitudinal Main Support Beams
      [-1, 1].forEach((sz) => {
        const beam = createBox(
          fw * 1.1,
          0.16,
          0.08,
          0,
          pergolaH - 0.08,
          sz * (fd / 2 - postSize / 2),
          mc.pergolaWoodMat
        );
        group.add(beam);
      });

      // 7 Transverse Shading Rafter Slats
      const rafterCount = 7;
      for (let i = 0; i < rafterCount; i++) {
        const rz = -fd / 2 + (i * fd) / (rafterCount - 1);
        const rafter = createBox(0.06, 0.14, fd * 1.1, 0, pergolaH + 0.07, rz, mc.pergolaWoodMat);
        group.add(rafter);
      }
      break;
    }

    case 'garden_fountain': {
      // Tiered Circular Stone Water Fountain
      const baseR = Math.min(fw, fd) / 2;
      const basinGeo = new THREE.CylinderGeometry(baseR, baseR * 0.9, 0.35, 24);
      const basinMesh = new THREE.Mesh(basinGeo, mc.fountainStoneMat);
      basinMesh.position.set(0, 0.175, 0);
      basinMesh.castShadow = true;

      const waterGeo = new THREE.CylinderGeometry(baseR * 0.88, baseR * 0.88, 0.02, 24);
      const waterMesh = new THREE.Mesh(waterGeo, mc.waterPoolMat);
      waterMesh.position.set(0, 0.32, 0);

      // Center Fountain Pillar + Upper Basin
      const colGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 16);
      const colMesh = new THREE.Mesh(colGeo, mc.fountainStoneMat);
      colMesh.position.set(0, 0.6, 0);

      const upperBasinGeo = new THREE.CylinderGeometry(baseR * 0.5, baseR * 0.45, 0.2, 20);
      const upperBasinMesh = new THREE.Mesh(upperBasinGeo, mc.fountainStoneMat);
      upperBasinMesh.position.set(0, 0.95, 0);

      const finialGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const finialMesh = new THREE.Mesh(finialGeo, mc.fountainStoneMat);
      finialMesh.position.set(0, 1.15, 0);

      group.add(basinMesh, waterMesh, colMesh, upperBasinMesh, finialMesh);
      break;
    }

    case 'flower_bed': {
      // Raised Garden Bed with Rich Soil & Multi-Color Blossoms
      const bedH = 0.32;
      const bedBorder = createBox(fw, bedH, fd, 0, bedH / 2, 0, mc.compoundWallMat);
      const soil = createBox(fw * 0.92, 0.06, fd * 0.92, 0, bedH, 0, mc.gardenSoilMat);
      group.add(bedBorder, soil);

      // Lush Cluster of Flower Blooms & Foliage Shrub Spheres
      const clusterCount = 6;
      const flowerMats = [mc.flowerMagentaMat, mc.flowerGoldMat, mc.flowerLavenderMat, mc.foliageLightMat];
      for (let i = 0; i < clusterCount; i++) {
        const fx = -fw * 0.38 + (i * (fw * 0.76)) / (clusterCount - 1);
        const fz = (i % 2 === 0 ? -1 : 1) * (fd * 0.22);
        const shrubGeo = new THREE.SphereGeometry(0.18 + (i % 3) * 0.04, 12, 12);
        const shrub = new THREE.Mesh(shrubGeo, flowerMats[i % flowerMats.length]);
        shrub.position.set(fx, bedH + 0.16, fz);
        shrub.castShadow = true;
        group.add(shrub);
      }
      break;
    }

    case 'garden_bench': {
      // Slatted Cast Iron & Mahogany Park Bench
      const benchH = 0.44;
      const seat = createBox(fw, 0.04, fd * 0.8, 0, benchH, 0, mc.doorWoodMat);
      const back = createBox(fw, 0.36, 0.04, 0, benchH + 0.25, -fd * 0.35, mc.doorWoodMat);
      [-1, 1].forEach((sx) => {
        const leg = createBox(0.04, benchH + 0.35, fd * 0.85, sx * (fw / 2 - 0.04), (benchH + 0.35) / 2, 0, mc.wroughtIronMat);
        group.add(leg);
      });
      group.add(seat, back);
      break;
    }

    case 'stepping_stones': {
      // Natural Flagstone Garden Pathway Stepping Pavers
      const stoneCount = 4;
      const stepSpacing = fd / stoneCount;
      for (let i = 0; i < stoneCount; i++) {
        const sz = -fd / 2 + stepSpacing * (i + 0.5);
        const sx = (i % 2 === 0 ? -1 : 1) * 0.06;
        const stone = createBox(fw * 0.85, 0.04, stepSpacing * 0.75, sx, 0.02, sz, mc.stonePavingMat);
        group.add(stone);
      }
      break;
    }

    case 'compound_gate': {
      // Heavy Concrete Gate Piers & Sliding/Hinged Wrought Iron Gate Leaf
      const pierW = 0.45;
      const gateH = 2.1;
      const isGateOpen = el.isOpen === true;

      // Left & Right Masonry Gate Piers
      const pierL = createBox(pierW, gateH + 0.2, pierW, -fw / 2 + pierW / 2, (gateH + 0.2) / 2, 0, mc.compoundWallMat);
      const pierR = createBox(pierW, gateH + 0.2, pierW, fw / 2 - pierW / 2, (gateH + 0.2) / 2, 0, mc.compoundWallMat);
      const capL = createBox(pierW * 1.15, 0.08, pierW * 1.15, -fw / 2 + pierW / 2, gateH + 0.24, 0, mc.compoundCopingMat);
      const capR = createBox(pierW * 1.15, 0.08, pierW * 1.15, fw / 2 - pierW / 2, gateH + 0.24, 0, mc.compoundCopingMat);
      group.add(pierL, pierR, capL, capR);

      // Wrought Iron Sliding / Dual Swing Gate
      const gateOpeningW = fw - pierW * 2;
      const gateGroup = new THREE.Group();
      gateGroup.position.set(-gateOpeningW / 2, 0, 0);

      // Slide or rotate gate if open
      if (isGateOpen) {
        gateGroup.position.x += gateOpeningW * 0.75;
      }

      const gateFrame = createBox(gateOpeningW, gateH * 0.9, 0.05, gateOpeningW / 2, gateH * 0.45 + 0.05, 0, mc.wroughtIronMat);
      gateGroup.add(gateFrame);

      // Vertical Wrought Iron Bars
      const barCount = 10;
      for (let b = 0; b < barCount; b++) {
        const bx = 0.1 + (b * (gateOpeningW - 0.2)) / (barCount - 1);
        const bar = createBox(0.025, gateH * 0.85, 0.025, bx, gateH * 0.45 + 0.05, 0, mc.wroughtIronMat);
        const finial = createBox(0.04, 0.08, 0.04, bx, gateH * 0.92, 0, mc.brassHardwareMat);
        gateGroup.add(bar, finial);
      }
      group.add(gateGroup);
      break;
    }

    case 'outdoor_bbq': {
      // Outdoor Kitchen Island + Gas BBQ Grill & Side Burner
      const bbqH = 0.92;
      const counter = createBox(fw, 0.06, fd, 0, bbqH, 0, mc.marbleCounterMat);
      const cabinetry = createBox(fw * 0.96, bbqH - 0.06, fd * 0.9, 0, (bbqH - 0.06) / 2, 0, mc.blackMetalMat);
      const grillBody = createBox(fw * 0.55, 0.35, fd * 0.8, 0, bbqH + 0.18, 0, mc.chromeMetalMat);
      const grillHood = createBox(fw * 0.52, 0.25, fd * 0.75, 0, bbqH + 0.48, -0.05, mc.chromeMetalMat);
      const handle = createBox(fw * 0.45, 0.03, 0.04, 0, bbqH + 0.4, fd * 0.38, mc.chromeMetalMat);

      const isBbqOn = el.isOn === true;
      if (isBbqOn) {
        const flames = createBox(fw * 0.48, 0.05, fd * 0.65, 0, bbqH + 0.19, 0, mc.fireFlameMat);
        group.add(flames);
      }

      group.add(counter, cabinetry, grillBody, grillHood, handle);
      break;
    }

    case 'garden_light': {
      // Modern Bollard Landscape Light with Louvers & Emissive LED Core
      const bollardH = 0.75;
      const bollardR = 0.08;
      const poleGeo = new THREE.CylinderGeometry(bollardR, bollardR, bollardH, 16);
      const pole = new THREE.Mesh(poleGeo, mc.blackMetalMat);
      pole.position.set(0, bollardH / 2, 0);
      pole.castShadow = true;

      const isLightOn = el.isOn !== false;
      const ledGeo = new THREE.CylinderGeometry(bollardR * 0.9, bollardR * 0.9, 0.12, 16);
      const led = new THREE.Mesh(ledGeo, isLightOn ? mc.emissiveLightMat : mc.ceramicWhiteMat);
      led.position.set(0, bollardH - 0.1, 0);

      const capGeo = new THREE.CylinderGeometry(bollardR * 1.15, bollardR * 1.15, 0.04, 16);
      const cap = new THREE.Mesh(capGeo, mc.blackMetalMat);
      cap.position.set(0, bollardH + 0.02, 0);

      group.add(pole, led, cap);
      break;
    }

    default: {
      const generic = createBox(fw, 0.45, fd, 0, 0.22, 0, mc.fabricWarmMat);
      group.add(generic);
      break;
    }
  }

  // Store element metadata for 3D interactive raycast clicking
  group.userData = {
    elementId: el.id,
    type: el.type,
    furnitureType: ftype,
    isOpen: el.isOpen,
    isOn: el.isOn,
    waterActive: el.waterActive,
  };

  group.position.set(fcx, 0, fcz);
  return group;
}

// -------------------------------------------------------------
// 4. COMPOUND PERIMETER WALLS & BOUNDARY ENCLOSURE
// -------------------------------------------------------------
export function create3DCompoundBoundary(
  plotConfig: PlotConfiguration,
  ctx: ModelBuilderContext
): THREE.Group {
  const group = new THREE.Group();
  const mc = getMaterialCache();
  const pw = plotConfig.widthM;
  const pd = plotConfig.depthM;
  const wallH = 1.8; // 1.8m compound wall height
  const wallThick = 0.25;
  const pierSize = 0.45;
  const pierH = wallH + 0.15;

  if (ctx.isRealistic) {
    // 4 Boundary Walls with Driveway Gate Opening on Road Frontage
    const road = plotConfig.roadFrontage;
    const gateWidth = 4.0; // 4.0m driveway gate opening

    // North Wall (Z = -pd/2)
    if (road === 'north') {
      const leftLen = (pw - gateWidth) / 2;
      const rightLen = leftLen;
      group.add(createBox(leftLen, wallH, wallThick, -pw / 2 + leftLen / 2, wallH / 2, -pd / 2, mc.compoundWallMat));
      group.add(createBox(rightLen, wallH, wallThick, pw / 2 - rightLen / 2, wallH / 2, -pd / 2, mc.compoundWallMat));
      // Coping
      group.add(createBox(leftLen, 0.06, wallThick * 1.2, -pw / 2 + leftLen / 2, wallH + 0.03, -pd / 2, mc.compoundCopingMat));
      group.add(createBox(rightLen, 0.06, wallThick * 1.2, pw / 2 - rightLen / 2, wallH + 0.03, -pd / 2, mc.compoundCopingMat));
    } else {
      group.add(createBox(pw, wallH, wallThick, 0, wallH / 2, -pd / 2, mc.compoundWallMat));
      group.add(createBox(pw, 0.06, wallThick * 1.2, 0, wallH + 0.03, -pd / 2, mc.compoundCopingMat));
    }

    // South Wall (Z = +pd/2)
    if (road === 'south') {
      const leftLen = (pw - gateWidth) / 2;
      const rightLen = leftLen;
      group.add(createBox(leftLen, wallH, wallThick, -pw / 2 + leftLen / 2, wallH / 2, pd / 2, mc.compoundWallMat));
      group.add(createBox(rightLen, wallH, wallThick, pw / 2 - rightLen / 2, wallH / 2, pd / 2, mc.compoundWallMat));
      group.add(createBox(leftLen, 0.06, wallThick * 1.2, -pw / 2 + leftLen / 2, wallH + 0.03, pd / 2, mc.compoundCopingMat));
      group.add(createBox(rightLen, 0.06, wallThick * 1.2, pw / 2 - rightLen / 2, wallH + 0.03, pd / 2, mc.compoundCopingMat));
    } else {
      group.add(createBox(pw, wallH, wallThick, 0, wallH / 2, pd / 2, mc.compoundWallMat));
      group.add(createBox(pw, 0.06, wallThick * 1.2, 0, wallH + 0.03, pd / 2, mc.compoundCopingMat));
    }

    // East Wall (X = +pw/2)
    if (road === 'east') {
      const topLen = (pd - gateWidth) / 2;
      const botLen = topLen;
      group.add(createBox(wallThick, wallH, topLen, pw / 2, wallH / 2, -pd / 2 + topLen / 2, mc.compoundWallMat));
      group.add(createBox(wallThick, wallH, botLen, pw / 2, wallH / 2, pd / 2 - botLen / 2, mc.compoundWallMat));
      group.add(createBox(wallThick * 1.2, 0.06, topLen, pw / 2, wallH + 0.03, -pd / 2 + topLen / 2, mc.compoundCopingMat));
      group.add(createBox(wallThick * 1.2, 0.06, botLen, pw / 2, wallH + 0.03, pd / 2 - botLen / 2, mc.compoundCopingMat));
    } else {
      group.add(createBox(wallThick, wallH, pd, pw / 2, wallH / 2, 0, mc.compoundWallMat));
      group.add(createBox(wallThick * 1.2, 0.06, pd, pw / 2, wallH + 0.03, 0, mc.compoundCopingMat));
    }

    // West Wall (X = -pw/2)
    if (road === 'west') {
      const topLen = (pd - gateWidth) / 2;
      const botLen = topLen;
      group.add(createBox(wallThick, wallH, topLen, -pw / 2, wallH / 2, -pd / 2 + topLen / 2, mc.compoundWallMat));
      group.add(createBox(wallThick, wallH, botLen, -pw / 2, wallH / 2, pd / 2 - botLen / 2, mc.compoundWallMat));
      group.add(createBox(wallThick * 1.2, 0.06, topLen, -pw / 2, wallH + 0.03, -pd / 2 + topLen / 2, mc.compoundCopingMat));
      group.add(createBox(wallThick * 1.2, 0.06, botLen, -pw / 2, wallH + 0.03, pd / 2 - botLen / 2, mc.compoundCopingMat));
    } else {
      group.add(createBox(wallThick, wallH, pd, -pw / 2, wallH / 2, 0, mc.compoundWallMat));
      group.add(createBox(wallThick * 1.2, 0.06, pd, -pw / 2, wallH + 0.03, 0, mc.compoundCopingMat));
    }

    // 4 Corner Pillars with Pyramid Coping
    [
      [-pw / 2, -pd / 2],
      [pw / 2, -pd / 2],
      [-pw / 2, pd / 2],
      [pw / 2, pd / 2],
    ].forEach(([cx, cz]) => {
      const pier = createBox(pierSize, pierH, pierSize, cx, pierH / 2, cz, mc.compoundWallMat);
      const cap = createBox(pierSize * 1.15, 0.08, pierSize * 1.15, cx, pierH + 0.04, cz, mc.compoundCopingMat);
      group.add(pier, cap);
    });

    // Asphalt Access Road Outside Frontage
    const roadWidth = 6.0;
    if (road === 'east') {
      const asphalt = createBox(roadWidth, 0.02, pd * 1.4, pw / 2 + roadWidth / 2 + 0.1, 0.01, 0, mc.blackMetalMat);
      group.add(asphalt);
    } else if (road === 'north') {
      const asphalt = createBox(pw * 1.4, 0.02, roadWidth, 0, 0.01, -pd / 2 - roadWidth / 2 - 0.1, mc.blackMetalMat);
      group.add(asphalt);
    } else if (road === 'south') {
      const asphalt = createBox(pw * 1.4, 0.02, roadWidth, 0, 0.01, pd / 2 + roadWidth / 2 + 0.1, mc.blackMetalMat);
      group.add(asphalt);
    } else if (road === 'west') {
      const asphalt = createBox(roadWidth, 0.02, pd * 1.4, -pw / 2 - roadWidth / 2 - 0.1, 0.01, 0, mc.blackMetalMat);
      group.add(asphalt);
    }
  } else {
    // Holographic Compound Perimeter Wireframe
    const geo = new THREE.BoxGeometry(pw, wallH, pd);
    const line = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
    );
    line.position.set(0, wallH / 2, 0);
    ctx.holoEdges.push(line);
    group.add(line);
  }

  return group;
}

// -------------------------------------------------------------
// 5. REGULATORY SETBACK RESTRICTION BOUNDARY & VIOLATIONS
// -------------------------------------------------------------
export function create3DSetbackBoundary(
  plotConfig: PlotConfiguration,
  ctx: ModelBuilderContext,
  hasViolation: boolean
): THREE.Group {
  const group = new THREE.Group();
  const pw = plotConfig.widthM;
  const pd = plotConfig.depthM;

  // Compute buildable envelope based on setbacks
  // Map setbacks according to road orientation
  let frontSetback = plotConfig.frontSetbackM;
  let rearSetback = plotConfig.rearSetbackM;
  let leftSetback = plotConfig.leftSetbackM;
  let rightSetback = plotConfig.rightSetbackM;

  let minX = -pw / 2 + leftSetback;
  let maxX = pw / 2 - rightSetback;
  let minZ = -pd / 2 + rearSetback;
  let maxZ = pd / 2 - frontSetback;

  if (plotConfig.roadFrontage === 'east') {
    maxX = pw / 2 - frontSetback;
    minX = -pw / 2 + rearSetback;
    minZ = -pd / 2 + leftSetback;
    maxZ = pd / 2 - rightSetback;
  } else if (plotConfig.roadFrontage === 'north') {
    minZ = -pd / 2 + frontSetback;
    maxZ = pd / 2 - rearSetback;
    minX = -pw / 2 + leftSetback;
    maxX = pw / 2 - rightSetback;
  } else if (plotConfig.roadFrontage === 'west') {
    minX = -pw / 2 + frontSetback;
    maxX = pw / 2 - rearSetback;
    minZ = -pd / 2 + rightSetback;
    maxZ = pd / 2 - leftSetback;
  }

  const bw = Math.max(1, maxX - minX);
  const bd = Math.max(1, maxZ - minZ);
  const bcx = (minX + maxX) / 2;
  const bcz = (minZ + maxZ) / 2;
  const fenceH = 1.2;

  const colorHex = hasViolation ? 0xef4444 : 0xf59e0b;

  // Translucent Setback Boundary Fence Ribbon
  const fenceGeo = new THREE.BoxGeometry(bw, fenceH, bd);
  const fenceEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(fenceGeo),
    new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 })
  );
  fenceEdges.position.set(bcx, fenceH / 2, bcz);
  ctx.holoEdges.push(fenceEdges);

  const fillMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: hasViolation ? 0.12 : 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fenceFill = new THREE.Mesh(fenceGeo, fillMat);
  fenceFill.position.set(bcx, fenceH / 2, bcz);

  group.add(fenceEdges, fenceFill);
  return group;
}
