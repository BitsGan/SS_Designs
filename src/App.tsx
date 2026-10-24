import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import {
  CanvasElement,
  ToolType,
  RenderStyle,
  AppMode,
  Layer,
  RoomType,
  CanvasSnapshot,
  AIActionCommand,
  ProjectMetadata,
  TemplateProject,
  FurnitureType,
  PlotConfiguration,
  SolarVentilationState,
} from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasToolbar } from './components/CanvasToolbar';
import { Canvas2D } from './components/Canvas2D';
import { GestureControl } from './components/GestureControl';
import { RightPanel } from './components/RightPanel';
import { StatusBar } from './components/StatusBar';
import { CinematicIntro } from './components/CinematicIntro';
import { TemplatesModal } from './components/TemplatesModal';
import { AnalysisModal } from './components/AnalysisModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { VoiceControl } from './components/VoiceControl';
import { PlotSettingsModal } from './components/PlotSettingsModal';
import { SolarVentilationBar } from './components/SolarVentilationBar';

// Lazy-load heavy 3D view and AI assistant to reduce initial bundle
const View3D = lazy(() => import('./components/View3D').then((m) => ({ default: m.View3D })));
const AIAssistant = lazy(() => import('./components/AIAssistant').then((m) => ({ default: m.AIAssistant })));
import { FURNITURE_CATALOG } from './data/furnitureCatalog';
import { TEMPLATES } from './data/templates';
import { exportHighResPNG, exportToSVG } from './utils/exportUtils';
import { autoFurnishEntireFloorPlan } from './utils/furnishingUtils';
import { sound } from './utils/audio';
import { validateSetbacks } from './utils/setbackUtils';

const INITIAL_LAYERS: Layer[] = [
  { id: 0, name: 'Floor Plan & Rooms', color: '#4fc3f7', visible: true },
  { id: 1, name: 'Walls & Openings', color: '#f59e0b', visible: true },
  { id: 2, name: 'Dimensions & Annotations', color: '#10b981', visible: true },
  { id: 3, name: 'Furniture & Fixtures', color: '#a78bfa', visible: true },
];

const INITIAL_METADATA: ProjectMetadata = {
  projectName: 'Modern Luxury Villa Residence',
  clientName: 'Private Client',
  architectName: 'SS Developments Lead Architect',
  location: 'Los Angeles, CA',
  scale: '1:50',
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  revision: 'A.01',
  unit: 'metric',
};

const INITIAL_PLOT_CONFIG: PlotConfiguration = {
  widthM: 25,
  depthM: 30,
  frontSetbackM: 4.5,
  rearSetbackM: 3.0,
  leftSetbackM: 2.0,
  rightSetbackM: 2.0,
  roadFrontage: 'east',
  northAngleDeg: 0,
  shape: 'rectangular',
};

const INITIAL_SOLAR_STATE: SolarVentilationState = {
  timeOfDayHour: 14.0, // 2:00 PM
  season: 'summer',
  simulationActive: true,
  windSpeedKmh: 14,
  windDirectionDeg: 65,
  showShadows: true,
  showAirflowStreams: true,
};

const ROOM_SIZES: Record<RoomType, [number, number]> = {
  bedroom: [160, 140],
  bathroom: [80, 80],
  kitchen: [140, 100],
  living: [220, 160],
  garage: [200, 140],
  office: [140, 110],
  pool: [220, 110],
  dining: [140, 120],
  balcony: [160, 60],
  hallway: [80, 160],
  closet: [60, 60],
  patio: [180, 120],
  garden: [200, 140],
};

const ROOM_LABELS: Record<RoomType, string> = {
  bedroom: 'BEDROOM',
  bathroom: 'BATHROOM',
  kitchen: 'KITCHEN',
  living: 'LIVING ROOM',
  garage: 'GARAGE',
  office: 'OFFICE',
  pool: 'POOL',
  dining: 'DINING ROOM',
  balcony: 'BALCONY',
  hallway: 'FOYER / HALLWAY',
  closet: 'WALK-IN CLOSET',
  patio: 'OUTDOOR PATIO',
  garden: 'LANDSCAPE GARDEN',
};

export default function App() {
  // Application Modes & Rendering
  const [appMode, setAppMode] = useState<AppMode>('blueprint');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('blueprint');

  // Tools & Styling
  const [currentTool, setCurrentTool] = useState<ToolType>('room');
  const [currentColor, setCurrentColor] = useState<string>('#4fc3f7');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [gridSize, setGridSize] = useState<number>(20);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Project Metadata & Modals
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata>(INITIAL_METADATA);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState<boolean>(false);

  // Plot & Solar Study State
  const [plotConfig, setPlotConfig] = useState<PlotConfiguration>(INITIAL_PLOT_CONFIG);
  const [solarState, setSolarState] = useState<SolarVentilationState>(INITIAL_SOLAR_STATE);
  const [showSolarBar, setShowSolarBar] = useState<boolean>(true);

  // Voice Architecture Control & Walkthrough Mode
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [isWalkthrough, setIsWalkthrough] = useState<boolean>(false);

  // Light / Dark Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Right Side Panel Open / Collapsed
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  // Layers
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [activeLayer, setActiveLayer] = useState<number>(0);

  // Elements & Undo History
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 3D View Parameters
  const [rot3dX, setRot3dX] = useState<number>(30);
  const [rot3dY, setRot3dY] = useState<number>(45);
  const [zoom3d, setZoom3d] = useState<number>(8);
  const [height3d, setHeight3d] = useState<number>(3);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Hand Gestures
  const [gestureActive, setGestureActive] = useState<boolean>(false);
  const [showGestureGuide, setShowGestureGuide] = useState<boolean>(false);

  // Status Bar Coordinates
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Save current state into history
  const saveHistory = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev, JSON.stringify(elements)];
      if (next.length > 30) next.shift();
      return next;
    });
  }, [elements]);

  // Undo action
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const previousState = copy.pop();
      if (previousState) {
        setElements(JSON.parse(previousState));
        setSelectedElementId(null);
        sound.playSnap();
      }
      return copy;
    });
  }, []);

  // Initialize initial sample architectural blueprint
  useEffect(() => {
    const cx = 400;
    const cy = 280;

    const initialDraft: CanvasElement[] = [
      {
        id: 'el_1',
        type: 'room',
        x1: cx - 200,
        y1: cy - 160,
        x2: cx + 200,
        y2: cy + 160,
        color: '#4fc3f7',
        lineWidth: 2,
        layer: 0,
        label: 'GREAT LIVING ROOM',
        roomType: 'living',
      },
      {
        id: 'el_furn_1',
        type: 'furniture',
        furnitureType: 'sofa_l',
        x1: cx - 140,
        y1: cy - 60,
        x2: cx - 84,
        y2: cy - 14,
        color: '#a78bfa',
        lineWidth: 1.5,
        layer: 3,
        label: 'L-Sofa',
      },
      {
        id: 'el_furn_2',
        type: 'furniture',
        furnitureType: 'coffee_table',
        x1: cx - 70,
        y1: cy - 45,
        x2: cx - 44,
        y2: cy - 29,
        color: '#a78bfa',
        lineWidth: 1.5,
        layer: 3,
      },
      {
        id: 'el_2',
        type: 'room',
        x1: cx + 200,
        y1: cy - 160,
        x2: cx + 360,
        y2: cy + 0,
        color: '#4fc3f7',
        lineWidth: 2,
        layer: 0,
        label: 'KITCHEN & PANTRY',
        roomType: 'kitchen',
      },
      {
        id: 'el_furn_3',
        type: 'furniture',
        furnitureType: 'kitchen_island',
        x1: cx + 230,
        y1: cy - 110,
        x2: cx + 280,
        y2: cy - 88,
        color: '#a78bfa',
        lineWidth: 1.5,
        layer: 3,
      },
      {
        id: 'el_3',
        type: 'room',
        x1: cx + 200,
        y1: cy + 0,
        x2: cx + 360,
        y2: cy + 160,
        color: '#4fc3f7',
        lineWidth: 2,
        layer: 0,
        label: 'PRIMARY SUITE',
        roomType: 'bedroom',
      },
      {
        id: 'el_furn_4',
        type: 'furniture',
        furnitureType: 'bed_king',
        x1: cx + 240,
        y1: cy + 40,
        x2: cx + 284,
        y2: cy + 80,
        color: '#a78bfa',
        lineWidth: 1.5,
        layer: 3,
      },
      {
        id: 'el_4',
        type: 'room',
        x1: cx - 360,
        y1: cy - 160,
        x2: cx - 200,
        y2: cy - 20,
        color: '#4fc3f7',
        lineWidth: 2,
        layer: 0,
        label: 'GUEST BEDROOM',
        roomType: 'bedroom',
      },
      {
        id: 'el_5',
        type: 'room',
        x1: cx - 360,
        y1: cy - 20,
        x2: cx - 200,
        y2: cy + 160,
        color: '#4fc3f7',
        lineWidth: 2,
        layer: 0,
        label: 'SPA BATH & UTILITY',
        roomType: 'bathroom',
      },
      {
        id: 'el_door_1',
        type: 'door',
        x1: cx - 200,
        y1: cy - 100,
        x2: cx - 200,
        y2: cy - 65,
        color: '#f59e0b',
        lineWidth: 2,
        layer: 1,
      },
      {
        id: 'el_door_2',
        type: 'door',
        x1: cx + 200,
        y1: cy - 80,
        x2: cx + 200,
        y2: cy - 45,
        color: '#f59e0b',
        lineWidth: 2,
        layer: 1,
      },
      {
        id: 'el_door_3',
        type: 'door',
        x1: cx + 200,
        y1: cy + 60,
        x2: cx + 200,
        y2: cy + 95,
        color: '#f59e0b',
        lineWidth: 2,
        layer: 1,
      },
      {
        id: 'el_win_1',
        type: 'window',
        x1: cx - 120,
        y1: cy - 160,
        x2: cx + 40,
        y2: cy - 160,
        color: '#10b981',
        lineWidth: 2.5,
        layer: 1,
      },
      {
        id: 'el_win_2',
        type: 'window',
        x1: cx + 360,
        y1: cy + 40,
        x2: cx + 360,
        y2: cy + 120,
        color: '#10b981',
        lineWidth: 2.5,
        layer: 1,
      },
    ];

    setElements(initialDraft);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape' && isWalkthrough) {
        setIsWalkthrough(false);
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          saveHistory();
          sound.playDelete();
          setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
          setSelectedElementId(null);
        }
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const keyMap: Record<string, ToolType> = {
          s: 'select',
          r: 'room',
          w: 'wall',
          d: 'door',
          c: 'circle',
          a: 'arrow',
          p: 'poly',
          f: 'freehand',
          t: 'text',
          m: 'measure',
        };
        const mapped = keyMap[e.key.toLowerCase()];
        if (mapped) {
          sound.playClick();
          setCurrentTool(mapped);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, selectedElementId, saveHistory, isWalkthrough]);

  // Switch App Mode
  const handleSetMode = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'realistic') {
      setRenderStyle('realistic');
    } else if (mode === 'blueprint') {
      setRenderStyle('blueprint');
      setIsWalkthrough(false);
    }
  };

  // Add Room Preset
  const handleAddPresetRoom = (type: RoomType) => {
    const cx = 400;
    const cy = 300;
    const s = ROOM_SIZES[type] || [120, 100];
    saveHistory();
    sound.playClick();

    const newRoom: CanvasElement = {
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type === 'pool' ? 'pool' : 'room',
      x1: cx - s[0] / 2,
      y1: cy - s[1] / 2,
      x2: cx + s[0] / 2,
      y2: cy + s[1] / 2,
      color: currentColor,
      lineWidth: 2,
      layer: activeLayer,
      roomType: type,
      label: ROOM_LABELS[type] || 'ROOM',
    };

    setElements((prev) => [...prev, newRoom]);
    setSelectedElementId(newRoom.id);
  };

  // Add Furniture from catalog
  const handleAddFurniture = (furnitureType: FurnitureType) => {
    const itemDef = FURNITURE_CATALOG.find((f) => f.id === furnitureType);
    const fw = itemDef ? itemDef.width : 30;
    const fh = itemDef ? itemDef.height : 20;

    const cx = 400;
    const cy = 300;
    saveHistory();
    sound.playClick();

    const newFurniture: CanvasElement = {
      id: 'furn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'furniture',
      furnitureType,
      x1: cx - fw / 2,
      y1: cy - fh / 2,
      x2: cx + fw / 2,
      y2: cy + fh / 2,
      color: '#a78bfa',
      lineWidth: 1.5,
      layer: 3,
      label: itemDef?.name,
    };

    setElements((prev) => [...prev, newFurniture]);
    setSelectedElementId(newFurniture.id);
  };

  // Smart Auto-Furnish All Rooms
  const handleAutoFurnish = () => {
    saveHistory();
    const newItems = autoFurnishEntireFloorPlan(elements);
    setElements((prev) => [...prev, ...newItems]);
    sound.playSuccess();
  };

  // Load Template from library
  const handleSelectTemplate = (template: TemplateProject) => {
    saveHistory();
    setElements(template.elements);
    setSelectedElementId(null);
    setProjectMetadata((prev) => ({
      ...prev,
      projectName: template.name,
    }));
  };

  // Delete Selected Element
  const handleDeleteSelected = () => {
    if (selectedElementId) {
      saveHistory();
      sound.playDelete();
      setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  // Layer Management
  const handleAddLayer = () => {
    const name = window.prompt('Enter layer title:', `Layer ${layers.length + 1}`);
    if (name) {
      const colors = ['#4fc3f7', '#f59e0b', '#10b981', '#ef4444', '#a78bfa', '#fb7185'];
      const newLayer: Layer = {
        id: layers.length,
        name,
        color: colors[layers.length % colors.length],
        visible: true,
      };
      setLayers((prev) => [...prev, newLayer]);
      setActiveLayer(newLayer.id);
      sound.playSuccess();
    }
  };

  const handleToggleLayerVisible = (layerId: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: l.visible === false ? true : false } : l))
    );
    sound.playClick();
  };

  // Clear Canvas
  const handleClear = () => {
    if (window.confirm('Clear all architectural blueprint elements on canvas?')) {
      saveHistory();
      sound.playDelete();
      setElements([]);
      setSelectedElementId(null);
    }
  };

  // Export High-Res PNG with Certified Title Block
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = exportHighResPNG(canvas, projectMetadata, 2);
      const link = document.createElement('a');
      link.download = `${projectMetadata.projectName.toLowerCase().replace(/\s+/g, '-')}-blueprint.png`;
      link.href = dataUrl;
      link.click();
      sound.playSuccess();
    }
  };

  // Export Scalable Vector SVG for CAD
  const handleExportSVG = () => {
    const svgContent = exportToSVG(elements, projectMetadata);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${projectMetadata.projectName.toLowerCase().replace(/\s+/g, '-')}-vector.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    sound.playSuccess();
  };

  // Interactive Object State Toggle (Doors, Lights, BBQ/Fire, Water Fountains/Pools, Cars/Engines)
  const handleToggleInteractiveState = useCallback((id: string) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        saveHistory();

        if (el.type === 'door' || el.furnitureType === 'compound_gate') {
          const nextState = el.isOpen === false ? true : false;
          if (nextState) sound.playDoorOpen();
          else sound.playDoorClose();
          return { ...el, isOpen: nextState };
        }

        if (el.furnitureType === 'garden_light' || el.furnitureType === 'tv_unit') {
          const nextState = el.isOn === false ? true : false;
          sound.playLightClick();
          return { ...el, isOn: nextState };
        }

        if (el.furnitureType === 'outdoor_bbq' || el.furnitureType === 'stove') {
          const nextState = el.isOn === true ? false : true;
          sound.playFireIgnite();
          return { ...el, isOn: nextState };
        }

        if (
          el.type === 'pool' ||
          el.furnitureType === 'garden_fountain' ||
          el.furnitureType === 'bathtub' ||
          el.furnitureType === 'shower'
        ) {
          const nextState = el.waterActive === false ? true : false;
          sound.playWaterSplash();
          return { ...el, waterActive: nextState };
        }

        if (el.furnitureType === 'car' || el.furnitureType === 'suv') {
          const nextState = el.isOn === false ? true : false;
          sound.playCarHonk();
          return { ...el, isOn: nextState };
        }

        // Generic toggle
        const nextState = el.isOpen === false ? true : false;
        return { ...el, isOpen: nextState };
      })
    );
  }, [saveHistory]);

  // Real-time setback validation & auto-tagging
  useEffect(() => {
    if (!plotConfig) return;
    const { elements: validatedElements, report } = validateSetbacks(elements, plotConfig);
    if (report.hasViolations) {
      const anyDiff = validatedElements.some(
        (updatedEl, i) => updatedEl.isSetbackViolated !== elements[i]?.isSetbackViolated
      );
      if (anyDiff) {
        setElements(validatedElements);
      }
    }
  }, [elements.length, plotConfig]);

  // Execute Action triggered from Gemini AI Assistant or Voice Control
  const handleExecuteAIAction = (action: AIActionCommand) => {
    switch (action.type) {
      case 'addRoom':
        if (action.roomType) {
          handleAddPresetRoom(action.roomType);
          if (action.label) {
            setElements((prev) => {
              if (prev.length === 0) return prev;
              const copy = [...prev];
              copy[copy.length - 1].label = action.label;
              return copy;
            });
          }
        }
        break;
      case 'addFurniture':
        if (action.furnitureType) {
          handleAddFurniture(action.furnitureType);
        }
        break;
      case 'setTool':
        if (action.tool) setCurrentTool(action.tool);
        break;
      case 'setStyle':
        if (action.style) setRenderStyle(action.style);
        break;
      case 'setMode':
        if (action.mode) handleSetMode(action.mode);
        break;
      case 'loadTemplate':
        if (action.templateId) {
          const tmpl = TEMPLATES.find((t) => t.id === action.templateId);
          if (tmpl) {
            handleSelectTemplate(tmpl);
            sound.playSuccess();
          }
        }
        break;
      case 'batchAddElements':
        if (action.elements && action.elements.length > 0) {
          saveHistory();
          sound.playSuccess();
          setElements((prev) => [...prev, ...action.elements!]);
        }
        break;
      case 'autoFurnish':
        handleAutoFurnish();
        break;
      case 'undo':
        handleUndo();
        break;
      case 'clearAll':
        saveHistory();
        sound.playDelete();
        setElements([]);
        setSelectedElementId(null);
        break;
    }
  };

  // Voice command dispatcher
  const handleExecuteVoiceCommand = (cmd: {
    action: string;
    roomType?: RoomType;
    tool?: ToolType;
    mode?: AppMode;
    prompt?: string;
  }) => {
    if (cmd.action === 'addRoom' && cmd.roomType) {
      handleAddPresetRoom(cmd.roomType);
    } else if (cmd.action === 'setTool' && cmd.tool) {
      setCurrentTool(cmd.tool);
    } else if (cmd.action === 'setMode' && cmd.mode) {
      handleSetMode(cmd.mode);
    } else if (cmd.action === 'startWalkthrough') {
      setAppMode('3d');
      setIsWalkthrough(true);
    } else if (cmd.action === 'undo') {
      handleUndo();
    } else if (cmd.action === 'clear') {
      handleClear();
    } else if (cmd.action === 'openAnalysis') {
      setIsAnalysisModalOpen(true);
    } else if (cmd.action === 'openBOQ') {
      setIsAnalysisModalOpen(true);
    } else if (cmd.action === 'autoFurnish') {
      handleAutoFurnish();
    } else if (cmd.action === 'openGenerator') {
      setIsAIGeneratorOpen(true);
    }
  };

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  const canvasSnapshot: CanvasSnapshot = useMemo(() => {
    const roomsList = elements
      .filter((e) => e.type === 'room')
      .map((e) => {
        const w = e.x2 !== undefined ? Math.round(Math.abs(e.x2 - e.x1)) : 0;
        const h = e.y2 !== undefined ? Math.round(Math.abs(e.y2 - e.y1)) : 0;
        const areaM2 = Math.round((w * 0.05) * (h * 0.05) * 10) / 10;
        return {
          label: e.label || e.roomType || 'ROOM',
          type: e.roomType,
          w,
          h,
          areaM2,
          layer: e.layer,
        };
      });

    const totalAreaM2 = roomsList.reduce((sum, r) => sum + r.areaM2, 0);

    return {
      elementCount: elements.length,
      currentTool,
      renderStyle,
      appMode,
      gridSize,
      unit: projectMetadata.unit,
      rooms: roomsList,
      totalAreaM2: Math.round(totalAreaM2 * 10) / 10,
      walls: elements.filter((e) => e.type === 'wall').length,
      doors: elements.filter((e) => e.type === 'door').length,
      windows: elements.filter((e) => e.type === 'window').length,
      furniture: elements.filter((e) => e.type === 'furniture').length,
      layers: layers.map((l) => l.name),
      selectedElement: selectedElement
        ? { type: selectedElement.type, label: selectedElement.label || selectedElement.roomType }
        : null,
    };
  }, [elements, currentTool, renderStyle, appMode, gridSize, layers, selectedElement, projectMetadata.unit]);

  const builtUpAreaM2 = useMemo(() => {
    return Math.round(canvasSnapshot.totalAreaM2 * 1.18 * 10) / 10;
  }, [canvasSnapshot.totalAreaM2]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] overflow-hidden select-none font-dm-sans text-slate-100">
      {/* Intro Overlay */}
      <CinematicIntro />

      {/* Voice Architecture Control Floating Banner */}
      <VoiceControl
        isActive={voiceActive}
        onToggle={() => setVoiceActive(!voiceActive)}
        onExecuteVoiceCommand={handleExecuteVoiceCommand}
      />

      {/* Top Application Bar */}
      <TopBar
        mode={appMode}
        onSetMode={handleSetMode}
        gestureActive={gestureActive}
        onToggleGesture={() => setGestureActive(!gestureActive)}
        onShowGuide={() => setShowGestureGuide(true)}
        onClear={handleClear}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onToggleVoice={() => setVoiceActive(!voiceActive)}
        voiceActive={voiceActive}
        onOpenPlotSettings={() => setIsPlotModalOpen(true)}
        onAutoFurnish={handleAutoFurnish}
        onToggleSolarBar={() => setShowSolarBar(!showSolarBar)}
        showSolarBar={showSolarBar}
        projectName={projectMetadata.projectName}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      {/* Solar & Wind Sunlight Simulation Control Bar */}
      {showSolarBar && (
        <SolarVentilationBar
          solarState={solarState}
          onChangeSolarState={setSolarState}
          northAngleDeg={plotConfig.northAngleDeg}
        />
      )}

      {/* Main Studio Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Tools Palette */}
        <Sidebar activeTool={currentTool} onSelectTool={setCurrentTool} />

        {/* Center Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Canvas Sub-Toolbar */}
          {appMode !== '3d' && (
            <CanvasToolbar
              gridSize={gridSize}
              onSetGridSize={setGridSize}
              currentColor={currentColor}
              onSetColor={setCurrentColor}
              strokeWidth={strokeWidth}
              onSetStrokeWidth={setStrokeWidth}
              snapEnabled={snapEnabled}
              onToggleSnap={() => setSnapEnabled(!snapEnabled)}
              showGrid={showGrid}
              onToggleShowGrid={() => setShowGrid(!showGrid)}
              onUndo={handleUndo}
              canUndo={history.length > 0}
            />
          )}

          {/* View Container: 2D Canvas or 3D / Walkthrough Mode */}
          <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
            {appMode === '3d' ? (
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-[#0d1117] text-cyan-400 font-dm-mono text-xs">Loading 3D engine…</div>}>
                <View3D
                  elements={elements}
                  rotX={rot3dX}
                  rotY={rot3dY}
                  zoom={zoom3d}
                  wallHeight={height3d}
                  autoRotate={autoRotate}
                  isWalkthrough={isWalkthrough}
                  onToggleWalkthrough={() => setIsWalkthrough(!isWalkthrough)}
                  renderMode={renderStyle === 'blueprint' ? 'holographic' : 'realistic'}
                  solarState={solarState}
                  plotConfig={plotConfig}
                  onToggleInteractiveState={handleToggleInteractiveState}
                />
              </Suspense>
            ) : (
              <Canvas2D
                elements={elements}
                setElements={setElements}
                currentTool={currentTool}
                currentColor={currentColor}
                renderStyle={renderStyle}
                theme={theme}
                gridSize={gridSize}
                strokeWidth={strokeWidth}
                snapEnabled={snapEnabled}
                showGrid={showGrid}
                selectedElementId={selectedElementId}
                onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
                activeLayer={activeLayer}
                layers={layers}
                saveHistory={saveHistory}
                onUpdateStatusCoords={(x, y) => setCursorCoords({ x, y })}
                plotConfig={plotConfig}
                onToggleInteractiveState={handleToggleInteractiveState}
              />
            )}

            {/* Hand Gesture Tracking Overlay */}
            <GestureControl
              active={gestureActive}
              onToggle={() => setGestureActive(!gestureActive)}
              currentTool={currentTool}
              onSetTool={setCurrentTool}
              renderStyle={renderStyle}
              onSetRenderStyle={setRenderStyle}
              onUndo={handleUndo}
              elements={elements}
              setElements={setElements}
              selectedElementId={selectedElementId}
              onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
              showGuide={showGestureGuide}
              onCloseGuide={() => setShowGestureGuide(false)}
            />

            {/* Bottom Floating Mode Pill */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 bg-[#111827]/90 border border-[#1e293b] rounded-full px-3.5 py-1 text-[10px] font-dm-mono text-slate-400 flex items-center gap-2 shadow-lg backdrop-blur pointer-events-none z-10 whitespace-nowrap">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isWalkthrough
                    ? 'bg-emerald-400'
                    : appMode === '3d'
                    ? 'bg-amber-400'
                    : 'bg-[#4fc3f7]'
                } animate-pulse`}
              />
              <span>
                {isWalkthrough
                  ? 'FIRST-PERSON WALKTHROUGH · WASD TO WALK'
                  : appMode === '3d'
                  ? '3D ARCHITECTURAL MODEL · ORBIT VIEW'
                  : appMode === 'realistic'
                  ? 'REALISTIC MODE · MATERIAL PREVIEW'
                  : 'BLUEPRINT MODE · DRAFTING'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Properties & Inspector Panel */}
        <RightPanel
          renderStyle={renderStyle}
          onSetRenderStyle={setRenderStyle}
          appMode={appMode}
          rot3dX={rot3dX}
          onSetRot3dX={setRot3dX}
          rot3dY={rot3dY}
          onSetRot3dY={setRot3dY}
          zoom3d={zoom3d}
          onSetZoom3d={setZoom3d}
          height3d={height3d}
          onSetHeight3d={setHeight3d}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
          selectedElement={selectedElement}
          onUpdateElement={(updated) => {
            if (!selectedElementId) return;
            setElements((prev) =>
              prev.map((el) => (el.id === selectedElementId ? { ...el, ...updated } : el))
            );
          }}
          onDeleteSelected={handleDeleteSelected}
          onAddPresetRoom={handleAddPresetRoom}
          onAddFurniture={handleAddFurniture}
          layers={layers}
          activeLayer={activeLayer}
          onSetActiveLayer={setActiveLayer}
          onToggleLayerVisible={handleToggleLayerVisible}
          onAddLayer={handleAddLayer}
          elements={elements}
          isOpen={isRightPanelOpen}
          onTogglePanel={() => setIsRightPanelOpen((open) => !open)}
        />
      </div>

      {/* Floating AI Architectural Assistant */}
      <Suspense fallback={null}>
        <AIAssistant canvasSnapshot={canvasSnapshot} onExecuteAction={handleExecuteAIAction} />
      </Suspense>

      {/* Bottom Status Bar */}
      <StatusBar
        currentTool={currentTool}
        cursorX={cursorCoords.x}
        cursorY={cursorCoords.y}
        itemCount={elements.length}
        snapEnabled={snapEnabled}
        gestureActive={gestureActive}
      />

      {/* AI Text-to-Floorplan Generation Modal */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        plotConfig={plotConfig}
        onUpdatePlotConfig={setPlotConfig}
        onApplyPlan={(newElements, name) => {
          saveHistory();
          setElements(newElements);
          setSelectedElementId(null);
          setProjectMetadata((prev) => ({ ...prev, projectName: name }));
          sound.playSuccess();
        }}
      />

      {/* Site & Plot Configuration Modal */}
      <PlotSettingsModal
        isOpen={isPlotModalOpen}
        onClose={() => setIsPlotModalOpen(false)}
        plotConfig={plotConfig}
        onUpdate={setPlotConfig}
        builtUpAreaM2={builtUpAreaM2}
      />

      {/* Interactive Templates Gallery */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* AI Design Audit, Area Schedule & BOQ Modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        elements={elements}
        onApplyFix={handleExecuteAIAction}
      />

      {/* Project Metadata & Certification Stamp Settings */}
      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        metadata={projectMetadata}
        onUpdateMetadata={(meta) => setProjectMetadata((prev) => ({ ...prev, ...meta }))}
      />
    </div>
  );
}
