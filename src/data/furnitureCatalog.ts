import { FurnitureCategory, FurnitureType } from '../types';

export interface FurnitureItemDef {
  id: FurnitureType;
  name: string;
  category: FurnitureCategory;
  width: number;  // in canvas px (where 20px = 1m)
  height: number; // in canvas px
  icon: string;
  realDimensions: string; // e.g. "2.0m × 1.8m"
}

export const FURNITURE_CATALOG: FurnitureItemDef[] = [
  // Bedroom
  { id: 'bed_king', name: 'King Bed & Nightstands', category: 'bedroom', width: 44, height: 40, icon: '🛏️', realDimensions: '2.2m × 2.0m' },
  { id: 'bed_single', name: 'Single Bed', category: 'bedroom', width: 22, height: 40, icon: '🛌', realDimensions: '1.1m × 2.0m' },
  { id: 'wardrobe', name: 'Wardrobe Closet', category: 'bedroom', width: 40, height: 14, icon: '🚪', realDimensions: '2.0m × 0.7m' },

  // Living Room
  { id: 'sofa_3p', name: '3-Seater Sofa', category: 'living', width: 46, height: 20, icon: '🛋️', realDimensions: '2.3m × 1.0m' },
  { id: 'sofa_l', name: 'L-Sectional Lounge', category: 'living', width: 56, height: 46, icon: '🛋️', realDimensions: '2.8m × 2.3m' },
  { id: 'armchair', name: 'Armchair', category: 'living', width: 18, height: 18, icon: '🪑', realDimensions: '0.9m × 0.9m' },
  { id: 'coffee_table', name: 'Coffee Table', category: 'living', width: 26, height: 16, icon: '☕', realDimensions: '1.3m × 0.8m' },
  { id: 'tv_unit', name: 'Media Console / TV', category: 'living', width: 40, height: 10, icon: '📺', realDimensions: '2.0m × 0.5m' },

  // Dining
  { id: 'dining_6p', name: 'Dining Table (6-Seat)', category: 'dining', width: 40, height: 26, icon: '🍽️', realDimensions: '2.0m × 1.3m' },
  { id: 'dining_4p', name: 'Dining Table (4-Seat)', category: 'dining', width: 26, height: 26, icon: '🪑', realDimensions: '1.3m × 1.3m' },

  // Kitchen
  { id: 'kitchen_island', name: 'Kitchen Island + Sink', category: 'kitchen', width: 50, height: 22, icon: '🍳', realDimensions: '2.5m × 1.1m' },
  { id: 'stove', name: 'Gas Range / Cooktop', category: 'kitchen', width: 18, height: 16, icon: '🔥', realDimensions: '0.9m × 0.8m' },
  { id: 'fridge', name: 'Double Refrigerator', category: 'kitchen', width: 20, height: 18, icon: '🧊', realDimensions: '1.0m × 0.9m' },

  // Bathroom
  { id: 'bathtub', name: 'Freestanding Bathtub', category: 'bathroom', width: 34, height: 18, icon: '🛁', realDimensions: '1.7m × 0.9m' },
  { id: 'toilet', name: 'Water Closet (WC)', category: 'bathroom', width: 12, height: 16, icon: '🚽', realDimensions: '0.6m × 0.8m' },
  { id: 'shower', name: 'Walk-In Glass Shower', category: 'bathroom', width: 22, height: 22, icon: '🚿', realDimensions: '1.1m × 1.1m' },
  { id: 'vanity', name: 'Vanity Counter + Basin', category: 'bathroom', width: 24, height: 14, icon: '🪞', realDimensions: '1.2m × 0.7m' },

  // Office
  { id: 'desk', name: 'Executive Desk & Chair', category: 'office', width: 32, height: 20, icon: '🖥️', realDimensions: '1.6m × 1.0m' },
  { id: 'meeting_table', name: 'Conference Board Table', category: 'office', width: 60, height: 28, icon: '💼', realDimensions: '3.0m × 1.4m' },

  // Outdoor & Landscape & Compound
  { id: 'car', name: 'Executive Sedan Car', category: 'vehicle', width: 38, height: 80, icon: '🚗', realDimensions: '1.9m × 4.8m' },
  { id: 'suv', name: 'Luxury SUV Vehicle', category: 'vehicle', width: 42, height: 96, icon: '🚙', realDimensions: '2.1m × 5.0m' },
  { id: 'plant_tree', name: 'Architectural Foliage Tree', category: 'outdoor', width: 26, height: 26, icon: '🌿', realDimensions: '1.3m ⌀' },
  { id: 'sun_lounger', name: 'Poolside Sun Lounger', category: 'outdoor', width: 14, height: 38, icon: '🏖️', realDimensions: '0.7m × 1.9m' },
  { id: 'garden_pergola', name: 'Garden Timber Pergola', category: 'outdoor', width: 60, height: 50, icon: '🏛️', realDimensions: '3.0m × 2.5m' },
  { id: 'garden_fountain', name: 'Tiered Water Fountain', category: 'outdoor', width: 32, height: 32, icon: '⛲', realDimensions: '1.6m ⌀' },
  { id: 'flower_bed', name: 'Botanical Flower Bed', category: 'outdoor', width: 48, height: 20, icon: '🌸', realDimensions: '2.4m × 1.0m' },
  { id: 'garden_bench', name: 'Cast Iron Park Bench', category: 'outdoor', width: 30, height: 14, icon: '🪑', realDimensions: '1.5m × 0.7m' },
  { id: 'stepping_stones', name: 'Stone Garden Pathway', category: 'outdoor', width: 20, height: 60, icon: '🪨', realDimensions: '1.0m × 3.0m' },
  { id: 'compound_gate', name: 'Main Compound Gate', category: 'outdoor', width: 70, height: 16, icon: '⛩️', realDimensions: '3.5m × 0.8m' },
  { id: 'outdoor_bbq', name: 'Outdoor BBQ Kitchen Grill', category: 'outdoor', width: 36, height: 20, icon: '🍖', realDimensions: '1.8m × 1.0m' },
  { id: 'garden_light', name: 'Solar Path Bollard Light', category: 'outdoor', width: 10, height: 10, icon: '💡', realDimensions: '0.5m ⌀' },
];

export const FURNITURE_CATEGORIES: { id: FurnitureCategory; label: string; icon: string }[] = [
  { id: 'living', label: 'Living', icon: '🛋️' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'dining', label: 'Dining', icon: '🍽️' },
  { id: 'bathroom', label: 'Bath', icon: '🚿' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'vehicle', label: 'Garage', icon: '🚗' },
  { id: 'outdoor', label: 'Landscape', icon: '🌿' },
];
