import { TemplateProject, CanvasElement } from '../types';

export const TEMPLATES: TemplateProject[] = [
  {
    id: 'modern_3bhk_villa',
    name: 'Modern 3BHK Poolside Villa',
    category: 'Luxury',
    description: 'Contemporary 3-bedroom single-level villa featuring an open-concept great room, primary en-suite with walk-in closet, expansive pool terrace, and double garage.',
    dimensions: '22.0m × 16.0m',
    roomsCount: 7,
    area: '240 m² / 2,580 sq ft',
    tags: ['Villa', 'Pool', 'En-Suite', 'Open-Concept', 'Garage'],
    elements: [
      // Foyer & Entry
      { id: 't1_foyer', type: 'room', x1: 280, y1: 360, x2: 360, y2: 440, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'FOYER', roomType: 'hallway' },
      { id: 't1_door_main', type: 'door', x1: 310, y1: 435, x2: 330, y2: 445, color: '#f59e0b', lineWidth: 2, layer: 1 },

      // Great Room / Living
      { id: 't1_living', type: 'room', x1: 360, y1: 240, x2: 560, y2: 440, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'GREAT ROOM / LIVING', roomType: 'living' },
      { id: 't1_sofa', type: 'furniture', furnitureType: 'sofa_l', x1: 380, y1: 320, x2: 436, y2: 366, color: '#a78bfa', lineWidth: 1.5, layer: 3, label: 'L-Lounge' },
      { id: 't1_coffee', type: 'furniture', furnitureType: 'coffee_table', x1: 410, y1: 340, x2: 436, y2: 356, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_tv', type: 'furniture', furnitureType: 'tv_unit', x1: 510, y1: 330, x2: 550, y2: 340, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      // Gourmet Kitchen & Dining
      { id: 't1_kitchen', type: 'room', x1: 360, y1: 120, x2: 560, y2: 240, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'GOURMET KITCHEN & DINING', roomType: 'kitchen' },
      { id: 't1_island', type: 'furniture', furnitureType: 'kitchen_island', x1: 390, y1: 170, x2: 440, y2: 192, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_dining', type: 'furniture', furnitureType: 'dining_6p', x1: 480, y1: 160, x2: 520, y2: 186, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_k_win', type: 'window', x1: 420, y1: 115, x2: 500, y2: 125, color: '#10b981', lineWidth: 1.5, layer: 1 },

      // Primary Master Suite
      { id: 't1_mbed', type: 'room', x1: 140, y1: 120, x2: 280, y2: 260, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'MASTER BEDROOM', roomType: 'bedroom' },
      { id: 't1_mbed_furn', type: 'furniture', furnitureType: 'bed_king', x1: 160, y1: 140, x2: 204, y2: 180, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_mbed_win', type: 'window', x1: 180, y1: 115, x2: 240, y2: 125, color: '#10b981', lineWidth: 1.5, layer: 1 },

      // Primary Master En-suite Bath
      { id: 't1_mbath', type: 'room', x1: 140, y1: 260, x2: 280, y2: 360, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'MASTER EN-SUITE', roomType: 'bathroom' },
      { id: 't1_tub', type: 'furniture', furnitureType: 'bathtub', x1: 155, y1: 275, x2: 189, y2: 293, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_shower', type: 'furniture', furnitureType: 'shower', x1: 245, y1: 275, x2: 267, y2: 297, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_vanity', type: 'furniture', furnitureType: 'vanity', x1: 195, y1: 340, x2: 219, y2: 354, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      // Bedroom 2
      { id: 't1_bed2', type: 'room', x1: 560, y1: 120, x2: 700, y2: 240, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'GUEST BEDROOM 2', roomType: 'bedroom' },
      { id: 't1_bed2_furn', type: 'furniture', furnitureType: 'bed_single', x1: 620, y1: 140, x2: 642, y2: 180, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_bed2_win', type: 'window', x1: 600, y1: 115, x2: 660, y2: 125, color: '#10b981', lineWidth: 1.5, layer: 1 },

      // Bedroom 3 / Office
      { id: 't1_bed3', type: 'room', x1: 560, y1: 240, x2: 700, y2: 360, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'STUDIO OFFICE / BED 3', roomType: 'office' },
      { id: 't1_desk_furn', type: 'furniture', furnitureType: 'desk', x1: 600, y1: 270, x2: 632, y2: 290, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      // Powder Room / Common Bath
      { id: 't1_bath2', type: 'room', x1: 560, y1: 360, x2: 700, y2: 440, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'GUEST BATH', roomType: 'bathroom' },
      { id: 't1_toilet_furn', type: 'furniture', furnitureType: 'toilet', x1: 600, y1: 380, x2: 612, y2: 396, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      // Double Garage
      { id: 't1_garage', type: 'room', x1: 140, y1: 360, x2: 280, y2: 520, color: '#4fc3f7', lineWidth: 2, layer: 0, label: '2-CAR GARAGE', roomType: 'garage' },
      { id: 't1_car1', type: 'furniture', furnitureType: 'car', x1: 160, y1: 400, x2: 198, y2: 480, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't1_car2', type: 'furniture', furnitureType: 'suv', x1: 215, y1: 390, x2: 257, y2: 486, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      // Outdoor Swimming Pool & Veranda
      { id: 't1_pool', type: 'pool', x1: 360, y1: 480, x2: 600, y2: 560, color: '#06b6d4', lineWidth: 2, layer: 0, label: 'INFINITY POOL (12m × 4m)', roomType: 'pool' },
      { id: 't1_tree1', type: 'furniture', furnitureType: 'plant_tree', x1: 630, y1: 500, x2: 656, y2: 526, color: '#10b981', lineWidth: 1.5, layer: 3 },
      { id: 't1_tree2', type: 'furniture', furnitureType: 'plant_tree', x1: 320, y1: 500, x2: 346, y2: 526, color: '#10b981', lineWidth: 1.5, layer: 3 },

      // Dimensions
      { id: 't1_dim1', type: 'measure', x1: 140, y1: 90, x2: 700, y2: 90, color: '#f59e0b', lineWidth: 1, layer: 2 },
      { id: 't1_text1', type: 'text', x1: 390, y1: 82, color: '#f59e0b', label: '28.0m Total Span', layer: 2 },
    ],
  },
  {
    id: 'scandinavian_loft',
    name: 'Scandinavian Urban Loft',
    category: 'Compact',
    description: 'Chic 65 m² open-plan loft with integrated sleeping pod, island kitchen, acoustic work nook, and glass divider.',
    dimensions: '10.0m × 7.0m',
    roomsCount: 4,
    area: '65 m² / 700 sq ft',
    tags: ['Apartment', 'Loft', 'Minimalist', 'Compact', 'Nordic'],
    elements: [
      { id: 't2_main', type: 'room', x1: 260, y1: 160, x2: 540, y2: 420, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'LIVING & DINING LOFT', roomType: 'living' },
      { id: 't2_bedpod', type: 'room', x1: 260, y1: 160, x2: 380, y2: 280, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'SLEEPING NOOK', roomType: 'bedroom' },
      { id: 't2_bed', type: 'furniture', furnitureType: 'bed_king', x1: 280, y1: 180, x2: 324, y2: 220, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't2_bath', type: 'room', x1: 440, y1: 160, x2: 540, y2: 260, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'BATHROOM', roomType: 'bathroom' },
      { id: 't2_shower', type: 'furniture', furnitureType: 'shower', x1: 505, y1: 175, x2: 527, y2: 197, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't2_sofa', type: 'furniture', furnitureType: 'sofa_3p', x1: 320, y1: 340, x2: 366, y2: 360, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't2_desk', type: 'furniture', furnitureType: 'desk', x1: 470, y1: 340, x2: 502, y2: 360, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't2_door', type: 'door', x1: 390, y1: 415, x2: 410, y2: 425, color: '#f59e0b', lineWidth: 2, layer: 1 },
      { id: 't2_win', type: 'window', x1: 300, y1: 415, x2: 360, y2: 425, color: '#10b981', lineWidth: 1.5, layer: 1 },
    ],
  },
  {
    id: 'commercial_tech_office',
    name: 'Tech Office Workspace',
    category: 'Commercial',
    description: 'Modern collaborative workplace with executive boardroom, hot-desk open floor, breakroom kitchen, and phone booths.',
    dimensions: '24.0m × 14.0m',
    roomsCount: 6,
    area: '320 m² / 3,440 sq ft',
    tags: ['Office', 'Corporate', 'Conference', 'Commercial', 'Tech'],
    elements: [
      { id: 't3_open', type: 'room', x1: 200, y1: 140, x2: 480, y2: 420, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'OPEN COLLABORATION DESKS', roomType: 'office' },
      { id: 't3_desk1', type: 'furniture', furnitureType: 'desk', x1: 240, y1: 200, x2: 272, y2: 220, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't3_desk2', type: 'furniture', furnitureType: 'desk', x1: 300, y1: 200, x2: 332, y2: 220, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't3_desk3', type: 'furniture', furnitureType: 'desk', x1: 360, y1: 200, x2: 392, y2: 220, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't3_desk4', type: 'furniture', furnitureType: 'desk', x1: 240, y1: 280, x2: 272, y2: 300, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't3_desk5', type: 'furniture', furnitureType: 'desk', x1: 300, y1: 280, x2: 332, y2: 300, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
      { id: 't3_desk6', type: 'furniture', furnitureType: 'desk', x1: 360, y1: 280, x2: 392, y2: 300, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't3_board', type: 'room', x1: 480, y1: 140, x2: 680, y2: 280, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'EXECUTIVE BOARDROOM', roomType: 'office' },
      { id: 't3_mtg', type: 'furniture', furnitureType: 'meeting_table', x1: 530, y1: 190, x2: 590, y2: 218, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't3_cafe', type: 'room', x1: 480, y1: 280, x2: 680, y2: 420, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'PANTRY & BREAKROOM', roomType: 'kitchen' },
      { id: 't3_dining', type: 'furniture', furnitureType: 'dining_6p', x1: 540, y1: 330, x2: 580, y2: 356, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't3_entry', type: 'door', x1: 320, y1: 415, x2: 360, y2: 425, color: '#f59e0b', lineWidth: 2, layer: 1 },
    ],
  },
  {
    id: 'duplex_family_home',
    name: '2-Story Family Residence',
    category: 'Residential',
    description: 'Balanced 4-bedroom suburban layout with sweeping entry stairs, formal dining, kitchen bar, family den, and dual balconies.',
    dimensions: '18.0m × 14.0m',
    roomsCount: 8,
    area: '210 m² / 2,260 sq ft',
    tags: ['Duplex', 'Family', '4BHK', 'Staircase', 'Traditional'],
    elements: [
      { id: 't4_foyer', type: 'room', x1: 320, y1: 320, x2: 440, y2: 440, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'CENTRAL FOYER', roomType: 'hallway' },
      { id: 't4_stair', type: 'stair', x1: 340, y1: 330, x2: 380, y2: 410, color: '#f59e0b', lineWidth: 1.5, layer: 1, label: 'STAIRS TO L2' },

      { id: 't4_living', type: 'room', x1: 180, y1: 280, x2: 320, y2: 440, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'FORMAL LIVING', roomType: 'living' },
      { id: 't4_sofa', type: 'furniture', furnitureType: 'sofa_3p', x1: 220, y1: 340, x2: 266, y2: 360, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't4_dining', type: 'room', x1: 180, y1: 140, x2: 320, y2: 280, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'DINING SALON', roomType: 'dining' },
      { id: 't4_table', type: 'furniture', furnitureType: 'dining_6p', x1: 230, y1: 190, x2: 270, y2: 216, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't4_kitchen', type: 'room', x1: 320, y1: 140, x2: 460, y2: 280, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'KITCHEN & PANTRY', roomType: 'kitchen' },
      { id: 't4_island', type: 'furniture', furnitureType: 'kitchen_island', x1: 360, y1: 190, x2: 410, y2: 212, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't4_bed1', type: 'room', x1: 460, y1: 140, x2: 620, y2: 280, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'GROUND SUITE', roomType: 'bedroom' },
      { id: 't4_bed', type: 'furniture', furnitureType: 'bed_king', x1: 510, y1: 170, x2: 554, y2: 210, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't4_bath', type: 'room', x1: 460, y1: 280, x2: 620, y2: 360, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'EN-SUITE BATH', roomType: 'bathroom' },
      { id: 't4_tub', type: 'furniture', furnitureType: 'bathtub', x1: 520, y1: 300, x2: 554, y2: 318, color: '#a78bfa', lineWidth: 1.5, layer: 3 },

      { id: 't4_garage', type: 'room', x1: 460, y1: 360, x2: 620, y2: 480, color: '#4fc3f7', lineWidth: 2, layer: 0, label: 'ATTACHED GARAGE', roomType: 'garage' },
      { id: 't4_car', type: 'furniture', furnitureType: 'suv', x1: 500, y1: 380, x2: 542, y2: 460, color: '#a78bfa', lineWidth: 1.5, layer: 3 },
    ],
  },
];
