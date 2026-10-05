import { CanvasElement, RoomType, FurnitureType } from '../types';

interface RoomBounds {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roomType: RoomType;
  label?: string;
}

export function autoFurnishRoom(room: RoomBounds): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const rx = Math.min(room.x1, room.x2);
  const ry = Math.min(room.y1, room.y2);
  const rw = Math.abs(room.x2 - room.x1);
  const rh = Math.abs(room.y2 - room.y1);
  const type = room.roomType || 'bedroom';

  const makeFurn = (
    ftype: FurnitureType,
    fx: number,
    fy: number,
    fw: number,
    fh: number,
    rot = 0
  ): CanvasElement => ({
    id: `furn_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'furniture',
    x1: Math.round(fx),
    y1: Math.round(fy),
    x2: Math.round(fx + fw),
    y2: Math.round(fy + fh),
    color: '#a78bfa',
    layer: 3,
    furnitureType: ftype,
    rotation: rot,
  });

  if (type === 'bedroom') {
    // Bed against top wall, centered
    const bedW = Math.min(80, rw * 0.45);
    const bedH = Math.min(90, rh * 0.55);
    const bedX = rx + (rw - bedW) / 2;
    const bedY = ry + 15;
    elements.push(makeFurn('bed_king', bedX, bedY, bedW, bedH));

    // Wardrobe on side wall if space permits
    if (rw > 120) {
      elements.push(makeFurn('wardrobe', rx + 15, ry + rh - 45, Math.min(70, rw * 0.4), 30));
    }
  } else if (type === 'living') {
    // Main 3-seat sofa
    const sofaW = Math.min(100, rw * 0.5);
    const sofaH = Math.min(45, rh * 0.28);
    const sofaX = rx + (rw - sofaW) / 2;
    const sofaY = ry + rh * 0.35;
    elements.push(makeFurn('sofa_3p', sofaX, sofaY, sofaW, sofaH));

    // Coffee table
    const tableW = sofaW * 0.65;
    const tableH = 25;
    elements.push(makeFurn('coffee_table', sofaX + (sofaW - tableW) / 2, sofaY + sofaH + 12, tableW, tableH));

    // TV unit against opposite wall
    if (rh > 120) {
      elements.push(makeFurn('tv_unit', rx + (rw - sofaW * 0.8) / 2, ry + 15, sofaW * 0.8, 22));
    }
  } else if (type === 'dining') {
    // 6-person dining set centered
    const dtW = Math.min(90, rw * 0.6);
    const dtH = Math.min(60, rh * 0.5);
    elements.push(makeFurn('dining_6p', rx + (rw - dtW) / 2, ry + (rh - dtH) / 2, dtW, dtH));
  } else if (type === 'kitchen') {
    // Island or work counter
    const islandW = Math.min(80, rw * 0.55);
    const islandH = Math.min(45, rh * 0.4);
    elements.push(makeFurn('kitchen_island', rx + (rw - islandW) / 2, ry + (rh - islandH) / 2, islandW, islandH));
  } else if (type === 'bathroom') {
    // Bathtub / Shower + Vanity
    const tubW = Math.min(60, rw * 0.45);
    const tubH = Math.min(35, rh * 0.4);
    elements.push(makeFurn('bathtub', rx + 12, ry + 12, tubW, tubH));
    elements.push(makeFurn('vanity', rx + rw - 35, ry + 12, 25, 25));
    elements.push(makeFurn('toilet', rx + rw - 35, ry + rh - 35, 22, 22));
  } else if (type === 'office') {
    // Executive desk & meeting table
    elements.push(makeFurn('desk', rx + (rw - 70) / 2, ry + 20, 70, 35));
    elements.push(makeFurn('armchair', rx + (rw - 30) / 2, ry + 60, 30, 30));
  } else if (type === 'garage') {
    // Vehicle
    elements.push(makeFurn('car', rx + (rw - 80) / 2, ry + (rh - 110) / 2, 80, 110));
  } else if (type === 'pool' || type === 'patio' || type === 'garden') {
    elements.push(makeFurn('sun_lounger', rx + 20, ry + 20, 30, 50));
    elements.push(makeFurn('plant_tree', rx + rw - 40, ry + rh - 40, 30, 30));
  }

  return elements;
}

export function autoFurnishEntireFloorPlan(elements: CanvasElement[]): CanvasElement[] {
  const rooms = elements.filter((e) => e.type === 'room' && e.x2 !== undefined && e.y2 !== undefined);
  const newFurniture: CanvasElement[] = [];

  rooms.forEach((r) => {
    const furn = autoFurnishRoom({
      id: r.id,
      x1: r.x1,
      y1: r.y1,
      x2: r.x2!,
      y2: r.y2!,
      roomType: r.roomType || 'bedroom',
      label: r.label,
    });
    newFurniture.push(...furn);
  });

  return newFurniture;
}
