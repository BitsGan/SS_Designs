import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CanvasElement, SolarVentilationState, PlotConfiguration } from '../types';
import {
  Compass,
  Footprints,
  Eye,
  Sun,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Box,
  AlertTriangle,
  CheckCircle2,
  Palette,
  Tag,
  Split,
  Info,
  X,
} from 'lucide-react';
import { sound } from '../utils/audio';
import {
  create3DDoor,
  create3DWindow,
  create3DWallSegment,
  create3DRoomElement,
  create3DStaircase,
  create3DFurniture,
  create3DCompoundBoundary,
  create3DSetbackBoundary,
  createBox,
  getMaterialCache,
  ModelBuilderContext,
} from '../utils/threeModelBuilders';
import { ROOM_STYLE_MAP, FLOORING_MATERIALS, WALL_TYPE_CONFIG } from '../utils/floorAndWallUtils';

interface View3DProps {
  elements: CanvasElement[];
  rotX: number;
  rotY: number;
  zoom: number;
  wallHeight: number;
  autoRotate: boolean;
  isWalkthrough?: boolean;
  onToggleWalkthrough?: () => void;
  renderMode?: 'holographic' | 'realistic';
  solarState?: SolarVentilationState;
  plotConfig?: PlotConfiguration;
  onToggleInteractiveState?: (id: string, prop?: 'isOpen' | 'isOn' | 'waterActive') => void;
}

export const View3D: React.FC<View3DProps> = ({
  elements,
  rotX,
  rotY,
  zoom,
  wallHeight,
  autoRotate,
  isWalkthrough = false,
  onToggleWalkthrough,
  renderMode = 'realistic',
  solarState,
  plotConfig,
  onToggleInteractiveState,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const currentRotYRef = useRef((rotY * Math.PI) / 180);

  // First-Person Walkthrough State
  const playerPosRef = useRef({ x: 0, y: 1.68, z: 2.0 }); // 1.68m eye level
  const playerRotRef = useRef({ yaw: 0, pitch: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const [radarPos, setRadarPos] = useState({ x: 0, z: 0, angle: 0 });
  const [showCeiling, setShowCeiling] = useState(false);
  const [active3DStyle, setActive3DStyle] = useState<'holographic' | 'realistic'>(renderMode);
  const [isColorCodedRooms, setIsColorCodedRooms] = useState(false);
  const [showRoomBadges, setShowRoomBadges] = useState(true);
  const [selectedFloorLevel, setSelectedFloorLevel] = useState<number | 'all'>('all');
  const [isExplodedView, setIsExplodedView] = useState(false);
  const [showFlooringLegend, setShowFlooringLegend] = useState(false);

  useEffect(() => {
    setActive3DStyle(renderMode);
  }, [renderMode]);

  useEffect(() => {
    currentRotYRef.current = (rotY * Math.PI) / 180;
  }, [rotY]);

  // Keyboard navigation for first-person walkthrough
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Palette & Materials
    const isRealistic = active3DStyle === 'realistic';
    const bg3d = isRealistic ? 0x0b1120 : 0x03060c;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg3d);
    if (!isRealistic) {
      scene.fog = new THREE.Fog(bg3d, 20, 85);
    } else {
      scene.fog = new THREE.FogExp2(0x0b1120, 0.012);
    }

    // Camera
    const camera = new THREE.PerspectiveCamera(isWalkthrough ? 65 : 50, width / height, 0.1, 300);
    if (isWalkthrough) {
      camera.position.set(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);
    } else {
      camera.position.set(zoom, zoom * 0.7, zoom);
      camera.lookAt(0, 1, 0);
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(
      isRealistic ? 0xffffff : 0x224466,
      isRealistic ? 1.1 : 1.4
    );
    scene.add(ambientLight);

    // Dynamic Sun Light based on Solar study
    const sunLight = new THREE.DirectionalLight(0xfff7ed, isRealistic ? 1.8 : 0.8);
    const sunHour = solarState?.timeOfDayHour || 14;
    const sunProgress = (sunHour - 6) / 12;
    const sunElevation = Math.sin(sunProgress * Math.PI) * 25 + 5;
    const sunAzimuth = (sunProgress * Math.PI) - Math.PI / 2;
    sunLight.position.set(Math.cos(sunAzimuth) * 35, sunElevation, Math.sin(sunAzimuth) * 35);
    sunLight.castShadow = isRealistic;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Ground Grid & Terrain Floor
    if (!isRealistic) {
      const gridHelper = new THREE.GridHelper(54, 54, 0x4fc3f7, 0x0f3556);
      scene.add(gridHelper);
    } else {
      // Realistic Architectural Grass & Site Floor
      const groundGeo = new THREE.PlaneGeometry(120, 120);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
        metalness: 0.05,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    }

    const scale = 0.02; // CAD scale
    const holoEdges: THREE.LineSegments[] = [];

    // Context for modular 3D builders
    const builderContext: ModelBuilderContext = {
      scene,
      isRealistic,
      scale,
      wallHeight,
      holoEdges,
      showRoomLabels: showRoomBadges,
      explodedFloorHeight: isExplodedView ? 1.8 : 0,
      filterFloorLevel: selectedFloorLevel,
    };

    const mc = getMaterialCache();

    // Render 3D CAD Elements with Realistic Geometry & Multi-Floor Isolation
    elements.forEach((el) => {
      // Check floor filter
      const elFloor = el.floorLevel || 0;
      if (selectedFloorLevel !== 'all' && elFloor !== selectedFloorLevel) {
        return;
      }

      if (el.type === 'room' || el.type === 'pool') {
        const roomObj = create3DRoomElement(el, builderContext, showCeiling, isColorCodedRooms);
        scene.add(roomObj);
      } else if (el.type === 'door') {
        const doorObj = create3DDoor(el, builderContext);
        scene.add(doorObj);
      } else if (el.type === 'window') {
        const winObj = create3DWindow(el, builderContext);
        scene.add(winObj);
      } else if (el.type === 'wall') {
        const wallObj = create3DWallSegment(el, builderContext);
        scene.add(wallObj);
      } else if (el.type === 'stair') {
        const stairObj = create3DStaircase(el, builderContext);
        scene.add(stairObj);
      } else if (el.type === 'furniture') {
        const furnObj = create3DFurniture(el, builderContext);
        scene.add(furnObj);
      } else if (el.type === 'column') {
        const colRadius = 0.22;
        const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, wallHeight, 24);
        const mats = getMaterialCache();
        const colMesh = isRealistic
          ? new THREE.Mesh(colGeo, mats.wallMat)
          : new THREE.Mesh(colGeo, new THREE.MeshBasicMaterial({ color: 0x4fc3f7, wireframe: true }));
        const cx = (el.x1 - 400) * scale;
        const cz = (el.y1 - 300) * scale;
        colMesh.position.set(cx, wallHeight / 2, cz);
        colMesh.castShadow = isRealistic;
        colMesh.receiveShadow = isRealistic;
        scene.add(colMesh);

        if (isRealistic) {
          const baseGeo = new THREE.BoxGeometry(colRadius * 2.5, 0.12, colRadius * 2.5);
          const baseMesh = new THREE.Mesh(baseGeo, mats.marbleCounterMat);
          baseMesh.position.set(cx, 0.06, cz);
          scene.add(baseMesh);

          const capMesh = new THREE.Mesh(baseGeo, mats.marbleCounterMat);
          capMesh.position.set(cx, wallHeight - 0.06, cz);
          scene.add(capMesh);
        }
      }
    });

    // Render Compound Perimeter Boundaries and Regulatory Setbacks in 3D
    if (plotConfig) {
      const hasAnyViolation = elements.some((el) => el.isSetbackViolated);
      const compoundObj = create3DCompoundBoundary(plotConfig, builderContext);
      const setbackObj = create3DSetbackBoundary(plotConfig, builderContext, hasAnyViolation);
      scene.add(compoundObj);
      scene.add(setbackObj);
    }

    // Pointer Drag & Mouse Look Controls with 3D Raycasting Interaction
    let mouseDownPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (isWalkthrough) {
        playerRotRef.current.yaw -= dx * 0.0035;
        playerRotRef.current.pitch = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, playerRotRef.current.pitch - dy * 0.0035)
        );
      } else {
        currentRotYRef.current += dx * 0.005;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDraggingRef.current = false;
      const dragDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);

      // If click was a tap (< 6px drag), perform 3D raycast interaction!
      if (dragDist < 6 && onToggleInteractiveState) {
        const rect = container.getBoundingClientRect();
        mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseVector, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
          let current: THREE.Object3D | null = hit.object;
          while (current && current !== scene) {
            if (current.userData && current.userData.elementId) {
              const elId = current.userData.elementId;
              onToggleInteractiveState(elId);
              return;
            }
            current = current.parent;
          }
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation & Walkthrough Physics Loop
    let t = 0;
    const moveSpeed = 0.06;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      t += 0.02;

      if (isWalkthrough) {
        // WASD / Arrow Key Physics Movement
        const keys = keysPressedRef.current;
        const yaw = playerRotRef.current.yaw;
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

        if (keys['w'] || keys['arrowup']) playerPosRef.current.x += forward.x * moveSpeed, playerPosRef.current.z += forward.z * moveSpeed;
        if (keys['s'] || keys['arrowdown']) playerPosRef.current.x -= forward.x * moveSpeed, playerPosRef.current.z -= forward.z * moveSpeed;
        if (keys['a'] || keys['arrowleft']) playerPosRef.current.x -= right.x * moveSpeed, playerPosRef.current.z -= right.z * moveSpeed;
        if (keys['d'] || keys['arrowright']) playerPosRef.current.x += right.x * moveSpeed, playerPosRef.current.z += right.z * moveSpeed;

        camera.position.set(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);

        const lookTarget = new THREE.Vector3(
          playerPosRef.current.x - Math.sin(yaw) * Math.cos(playerRotRef.current.pitch),
          playerPosRef.current.y + Math.sin(playerRotRef.current.pitch),
          playerPosRef.current.z - Math.cos(yaw) * Math.cos(playerRotRef.current.pitch)
        );
        camera.lookAt(lookTarget);

        setRadarPos({
          x: playerPosRef.current.x,
          z: playerPosRef.current.z,
          angle: (yaw * 180) / Math.PI,
        });
      } else {
        if (autoRotate) {
          currentRotYRef.current += 0.003;
        }

        const radX = (rotX * Math.PI) / 180;
        const rY = currentRotYRef.current;
        const z = zoom || 8;

        camera.position.set(
          Math.sin(rY) * z * 1.2,
          z * Math.sin(radX) + z * 0.3 + 1,
          Math.cos(rY) * z * 1.2
        );
        camera.lookAt(0, 1, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [
    elements,
    zoom,
    wallHeight,
    rotX,
    rotY,
    autoRotate,
    isWalkthrough,
    active3DStyle,
    solarState,
    plotConfig,
    showCeiling,
    isColorCodedRooms,
    showRoomBadges,
    selectedFloorLevel,
    isExplodedView,
  ]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-[#0a0f1d]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap max-w-[calc(100%-2rem)]">
        {onToggleWalkthrough && (
          <button
            onClick={() => {
              sound.playClick();
              onToggleWalkthrough();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isWalkthrough
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-[#111827]/90 text-slate-200 border border-[#1e3a5f] hover:border-[#4fc3f7]'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>{isWalkthrough ? 'Exit Walkthrough (ESC)' : 'Start 1st-Person Walkthrough'}</span>
          </button>
        )}

        {/* Realistic / Hologram Switcher */}
        <button
          onClick={() => {
            sound.playClick();
            setActive3DStyle((prev) => (prev === 'realistic' ? 'holographic' : 'realistic'));
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            active3DStyle === 'realistic'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10'
              : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 shadow-lg shadow-cyan-500/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{active3DStyle === 'realistic' ? 'Mode: Realistic 3D' : 'Mode: Holographic 3D'}</span>
        </button>

        {/* Room Color Variation Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            setIsColorCodedRooms(!isColorCodedRooms);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            isColorCodedRooms
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/20'
              : 'bg-[#111827]/90 border-[#1e3a5f] text-slate-300 hover:text-white'
          }`}
          title="Color variations to easily identify rooms in 3D"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Room Colors {isColorCodedRooms ? 'ON' : 'OFF'}</span>
        </button>

        {/* 3D Room Badges Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            setShowRoomBadges(!showRoomBadges);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            showRoomBadges
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
              : 'bg-[#111827]/90 border-[#1e3a5f] text-slate-400'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>3D Room Badges</span>
        </button>

        {/* Floor Level Filter Selector */}
        <div className="flex items-center bg-[#111827]/90 border border-[#1e3a5f] rounded-xl p-0.5 text-xs font-dm-mono shadow-md">
          <span className="px-2 text-[10px] text-slate-400 uppercase font-bold">Floor:</span>
          {(['all', 0, 1, 2] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playClick();
                setSelectedFloorLevel(lvl);
              }}
              className={`px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                selectedFloorLevel === lvl
                  ? 'bg-[#1e3a5f] text-[#4fc3f7] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl === 'all' ? 'All' : `L${lvl}`}
            </button>
          ))}
        </div>

        {/* Exploded Multi-Floor View Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            setIsExplodedView(!isExplodedView);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            isExplodedView
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20'
              : 'bg-[#111827]/90 border-[#1e3a5f] text-slate-300 hover:text-white'
          }`}
          title="Separates floor levels vertically for exploded architectural viewing"
        >
          <Split className="w-3.5 h-3.5" />
          <span>{isExplodedView ? 'Stacked View' : 'Exploded Floors'}</span>
        </button>

        {/* Roof / Ceiling Toggle */}
        <button
          onClick={() => setShowCeiling(!showCeiling)}
          className={`px-3 py-1.5 rounded-xl text-xs font-dm-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
            showCeiling
              ? 'bg-purple-950/80 border-purple-500 text-purple-200'
              : 'bg-[#111827]/90 border-[#1e3a5f] text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Roof/Ceiling {showCeiling ? 'ON' : 'OFF'}</span>
        </button>

        {/* Architectural Legend Modal Trigger */}
        <button
          onClick={() => {
            sound.playClick();
            setShowFlooringLegend(true);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-dm-mono border border-[#1e3a5f] bg-[#111827]/90 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Architectural Legend</span>
        </button>
      </div>

      {/* Architectural Materials & Flooring Legend Modal */}
      {showFlooringLegend && (
        <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e3a5f] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl custom-scrollbar text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold font-dm-sans text-white flex items-center gap-2">
                  <span>🏛️ Architectural Finishes & Wall Specifications</span>
                </h3>
                <p className="text-xs text-slate-400 font-dm-sans mt-0.5">
                  Distinct color variations and physical specifications for walls, partitions, and floorings
                </p>
              </div>
              <button
                onClick={() => setShowFlooringLegend(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Wall Types */}
            <div className="mt-4">
              <h4 className="text-xs font-dm-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
                1. Structural Wall Styles & Color Identification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.values(WALL_TYPE_CONFIG).map((w) => (
                  <div key={w.type} className="p-3 bg-[#111827] border border-[#1e293b] rounded-xl flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 border border-white/20 shadow-md"
                      style={{ backgroundColor: w.color2D }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white font-dm-sans flex items-center gap-1.5">
                        <span>{w.label}</span>
                        <span className="text-[10px] font-dm-mono text-slate-400">({w.thicknessM * 100}cm)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Flooring Finishes */}
            <div className="mt-5">
              <h4 className="text-xs font-dm-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
                2. Separate Floorings & Materials According to Design
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.values(FLOORING_MATERIALS).map((f) => (
                  <div key={f.type} className="p-2.5 bg-[#111827] border border-[#1e293b] rounded-xl flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div
                      className="w-5 h-5 rounded-md shrink-0 border border-white/20"
                      style={{ backgroundColor: f.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white font-dm-sans truncate">{f.label}</div>
                      <div className="text-[10px] text-slate-400 font-dm-mono">
                        Roughness: {f.roughness} · {f.isWaterproof ? 'Waterproof' : 'Interior Finish'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex justify-end">
              <button
                onClick={() => setShowFlooringLegend(false)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold font-dm-mono cursor-pointer hover:opacity-95"
              >
                Close Legend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Person Walkthrough Radar & On-screen Joystick Controls */}
      {isWalkthrough && (
        <>
          {/* Mini-Radar Map */}
          <div className="absolute top-4 right-4 z-20 w-32 h-32 bg-[#0a0f1d]/90 border border-emerald-500/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center">
            <span className="text-[9px] font-dm-mono text-emerald-300 font-bold uppercase mb-1">
              Position Radar
            </span>
            <div className="relative w-20 h-20 bg-[#060b14] border border-[#1e293b] rounded-full flex items-center justify-center overflow-hidden">
              <div className="absolute w-full h-[1px] bg-[#1e293b]" />
              <div className="absolute h-full w-[1px] bg-[#1e293b]" />
              {/* Player dot and directional fov cone */}
              <div
                className="absolute w-3 h-3 bg-emerald-400 rounded-full shadow-lg flex items-center justify-center transition-transform"
                style={{
                  transform: `translate(${radarPos.x * 4}px, ${radarPos.z * 4}px) rotate(${radarPos.angle}deg)`,
                }}
              >
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-white -translate-y-2" />
              </div>
            </div>
            <span className="text-[8px] font-dm-mono text-slate-400 mt-1">WASD to Walk</span>
          </div>

          {/* Bottom HUD Instruction Banner */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#0a0f1d]/90 border border-[#1e3a5f] rounded-2xl backdrop-blur-md flex items-center gap-4 text-xs font-dm-mono text-slate-300">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">W</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">A</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">S</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">D</span>
              <span className="text-slate-400 ml-1">Move</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Click & Drag to Look Around</span>
          </div>
        </>
      )}
    </div>
  );
};
