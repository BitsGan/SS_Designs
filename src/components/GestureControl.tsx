import React, { useEffect, useRef, useState } from 'react';
import { ToolType, RenderStyle, CanvasElement } from '../types';

interface GestureControlProps {
  active: boolean;
  onToggle: () => void;
  currentTool: ToolType;
  onSetTool: (tool: ToolType) => void;
  renderStyle: RenderStyle;
  onSetRenderStyle: (style: RenderStyle) => void;
  onUndo: () => void;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedElementId: string | null;
  onSelectElement: (el: CanvasElement | null) => void;
  showGuide: boolean;
  onCloseGuide: () => void;
}

const TOOLS_ORDER: ToolType[] = [
  'select',
  'room',
  'wall',
  'door',
  'window',
  'circle',
  'arrow',
  'poly',
  'freehand',
  'text',
  'stair',
  'furniture',
  'column',
  'pool',
  'measure',
];

export const GestureControl: React.FC<GestureControlProps> = ({
  active,
  currentTool,
  onSetTool,
  renderStyle,
  onSetRenderStyle,
  onUndo,
  elements,
  setElements,
  selectedElementId,
  onSelectElement,
  showGuide,
  onCloseGuide,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<string>('Initializing...');
  const [actionLabel, setActionLabel] = useState<string>('Show hand to camera');
  const [confidence, setConfidence] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; active: boolean; mode: string }>({
    x: -100,
    y: -100,
    active: false,
    mode: 'normal',
  });

  const lastGestureTimeRef = useRef<number>(0);
  const cursorBufferRef = useRef<Array<{ x: number; y: number }>>([]);
  const wristHistoryRef = useRef<Array<{ x: number; t: number }>>([]);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingGestureRef = useRef<boolean>(false);
  const cameraInstanceRef = useRef<any>(null);
  const handleResultsRef = useRef<(results: any) => void>(() => {});
  const cameraErrorShownRef = useRef(false);

  // Keep the latest handler reachable from the persistent MediaPipe callback (avoids stale closures)
  useEffect(() => {
    handleResultsRef.current = handleResults;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  // Forward pinch actions to the main blueprint canvas via synthetic mouse events
  const dispatchCanvasMouse = (type: string, x: number, y: number) => {
    const target = Array.from(document.querySelectorAll('canvas')).find(
      (c) => typeof c.className === 'string' && c.className.includes('cursor-crosshair')
    );
    if (!target) return false;
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
      })
    );
    return true;
  };

  const smoothCursor = (nx: number, ny: number) => {
    const buf = cursorBufferRef.current;
    buf.push({ x: nx, y: ny });
    if (buf.length > 5) buf.shift();
    const sx = buf.reduce((s, p) => s + p.x, 0) / buf.length;
    const sy = buf.reduce((s, p) => s + p.y, 0) / buf.length;
    return { x: sx, y: sy };
  };

  const detectSwipe = (lm: any[]) => {
    const wx = lm[0].x;
    const list = wristHistoryRef.current;
    list.push({ x: wx, t: Date.now() });
    if (list.length > 12) list.shift();
    if (list.length < 6) return null;
    const old = list[0];
    const cur = list[list.length - 1];
    const dt = (cur.t - old.t) / 1000;
    const vel = (cur.x - old.x) / (dt || 1);
    if (Math.abs(vel) > 0.6) return vel > 0 ? 'left' : 'right';
    return null;
  };

  useEffect(() => {
    if (!active) {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop?.();
        cameraInstanceRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCursorPos({ x: -100, y: -100, active: false, mode: 'normal' });
      return;
    }

    let isSubscribed = true;

    const initTracking = async () => {
      try {
        // Load MediaPipe scripts on demand if not present
        if (!(window as any).Hands) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
            s.crossOrigin = 'anonymous';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load MediaPipe Hands'));
            document.head.appendChild(s);
          });
        }
        if (!(window as any).Camera) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
            s.crossOrigin = 'anonymous';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load MediaPipe Camera'));
            document.head.appendChild(s);
          });
        }

        if (!isSubscribed) return;

        if (!videoRef.current) return;

        const Hands = (window as any).Hands;
        const Camera = (window as any).Camera;

        const hands = new Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        hands.onResults((results: any) => {
          if (!isSubscribed) return;
          handleResultsRef.current(results);
        });

        const cam = new Camera(videoRef.current, {
          onFrame: async () => {
            if (active && videoRef.current) {
              try {
                await hands.send({ image: videoRef.current });
              } catch (e) {
                // Surface WASM/model load failures once instead of failing silently every frame
                if (!cameraErrorShownRef.current) {
                  cameraErrorShownRef.current = true;
                  setStatus('❌ Model load failed');
                  setActionLabel('Check internet connection');
                  showToast('⚠️ Hand model failed to load');
                }
              }
            }
          },
          width: 320,
          height: 240,
        });

        await cam.start();
        cameraInstanceRef.current = cam;
        showToast('✋ Hand Control Active');
      } catch (err: any) {
        console.error('Hand tracking error:', err);
        setStatus('❌ Gesture init failed');
        setActionLabel(
          err?.message?.includes('MediaPipe')
            ? 'CDN blocked — check internet'
            : 'Check camera permissions'
        );
        showToast('⚠️ ' + (err?.message || 'Camera init failed'));
      }
    };

    initTracking();

    return () => {
      isSubscribed = false;
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop?.();
        cameraInstanceRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [active]);

  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
      setStatus('👀 Searching hand');
      setActionLabel('Position hand in frame');
      setConfidence(0);
      setCursorPos((prev) => ({ ...prev, active: false }));
      return;
    }

    const lm = results.multiHandLandmarks[0];

    // Draw landmark joints on mini-camera canvas
    ctx.strokeStyle = 'rgba(124,58,237,0.5)';
    ctx.lineWidth = 1.5;
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17],
    ];

    connections.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(lm[i].x * canvas.width, lm[i].y * canvas.height);
      ctx.lineTo(lm[j].x * canvas.width, lm[j].y * canvas.height);
      ctx.stroke();
    });

    [4, 8, 12, 16, 20].forEach((idx) => {
      ctx.beginPath();
      ctx.arc(lm[idx].x * canvas.width, lm[idx].y * canvas.height, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#a78bfa';
      ctx.fill();
    });

    // Confidence indicator
    const xs = lm.map((p: any) => p.x);
    const ys = lm.map((p: any) => p.y);
    const spread = Math.sqrt(
      Math.pow(Math.max(...xs) - Math.min(...xs), 2) + Math.pow(Math.max(...ys) - Math.min(...ys), 2)
    );
    const conf = Math.min(100, Math.round(spread * 300));
    setConfidence(conf);

    // Mirrored index fingertip
    const ix = 1 - lm[8].x;
    const iy = lm[8].y;
    const thumbX = 1 - lm[4].x;
    const thumbY = lm[4].y;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rawPos = { x: ix * screenW, y: iy * screenH };
    const { x: cx, y: cy } = smoothCursor(rawPos.x, rawPos.y);

    // Finger states
    const tips = [4, 8, 12, 16, 20];
    const joints = [3, 6, 10, 14, 18];
    const fingers = tips.map((tip, i) => {
      if (i === 0) return lm[4].x > lm[2].x; // Thumb raised in mirror
      return lm[tip].y < lm[joints[i]].y;
    });

    const [thumb, index, middle, ring, pinky] = fingers;
    const countUp = fingers.filter(Boolean).length;

    // Pinch distance
    const dx = (thumbX - ix) * screenW;
    const dy = (thumbY - iy) * screenH;
    const pinchDist = Math.sqrt(dx * dx + dy * dy);
    const isPinching = pinchDist < 36;
    const isPointing = index && !middle && !ring && !pinky;

    // Release any in-progress pinch stroke if the hand shape changed
    if (!isPointing && drawStartRef.current) {
      dispatchCanvasMouse('mouseup', cx, cy);
      drawStartRef.current = null;
    }

    const now = Date.now();
    const canTrigger = now - lastGestureTimeRef.current > 600;

    // Fist -> Undo
    if (countUp === 0) {
      setStatus('✊ Fist');
      setActionLabel('UNDO ACTION');
      setCursorPos({ x: cx, y: cy, active: true, mode: 'fist' });
      if (canTrigger) {
        onUndo();
        lastGestureTimeRef.current = now;
        showToast('↩ Undone last change');
      }
      return;
    }

    // Open hand -> Select mode
    if (countUp >= 4) {
      setStatus('🖐 Open Hand');
      setActionLabel('SELECT MODE');
      setCursorPos({ x: cx, y: cy, active: true, mode: 'open' });
      if (canTrigger && currentTool !== 'select') {
        onSetTool('select');
        lastGestureTimeRef.current = now;
        showToast('⬚ Select Mode Enabled');
      }
      return;
    }

    // Two fingers -> Switch tool
    if (index && middle && !ring && !pinky) {
      setStatus('✌️ Two Fingers');
      const swipe = detectSwipe(lm);
      if (swipe && canTrigger) {
        const curIdx = TOOLS_ORDER.indexOf(currentTool);
        const nextIdx =
          swipe === 'right'
            ? (curIdx + 1) % TOOLS_ORDER.length
            : (curIdx - 1 + TOOLS_ORDER.length) % TOOLS_ORDER.length;
        onSetTool(TOOLS_ORDER[nextIdx]);
        lastGestureTimeRef.current = now;
        showToast('🔄 Tool: ' + TOOLS_ORDER[nextIdx].toUpperCase());
      } else {
        setActionLabel('Swipe left/right to change tool');
      }
      setCursorPos({ x: cx, y: cy, active: true, mode: 'two' });
      return;
    }

    // Shaka (thumb + pinky) -> Delete
    if (thumb && !index && !middle && !ring && pinky) {
      setStatus('🤙 Shaka Sign');
      setActionLabel('DELETE SELECTED');
      setCursorPos({ x: cx, y: cy, active: true, mode: 'fist' });
      if (canTrigger && selectedElementId) {
        setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
        onSelectElement(null);
        lastGestureTimeRef.current = now;
        showToast('🗑 Element Deleted');
      }
      return;
    }

    // Three fingers -> Cycle render style
    if (index && middle && ring && !pinky && !thumb) {
      setStatus('🖖 Three Fingers');
      setActionLabel('CYCLE RENDER STYLE');
      setCursorPos({ x: cx, y: cy, active: true, mode: 'open' });
      if (canTrigger) {
        const styles: RenderStyle[] = ['blueprint', 'wireframe', 'sketch', 'realistic', 'night', 'xray'];
        const curIdx = styles.indexOf(renderStyle);
        const nextStyle = styles[(curIdx + 1) % styles.length];
        onSetRenderStyle(nextStyle);
        lastGestureTimeRef.current = now;
        showToast('🎨 Style: ' + nextStyle.toUpperCase());
      }
      return;
    }

    // Index pointing -> Move cursor / Pinch to draw on the canvas
    if (isPointing) {
      setStatus('☝️ Index Pointing');
      if (isPinching) {
        setActionLabel('🤏 PINCHING (DRAW / DRAG)');
        setCursorPos({ x: cx, y: cy, active: true, mode: 'pinching' });
        if (!drawStartRef.current) {
          drawStartRef.current = { x: cx, y: cy };
          if (dispatchCanvasMouse('mousedown', cx, cy)) {
            showToast('🤏 Pinch drawing started');
          }
        } else {
          dispatchCanvasMouse('mousemove', cx, cy);
        }
      } else {
        setActionLabel('Tracking cursor');
        setCursorPos({ x: cx, y: cy, active: true, mode: 'normal' });
        if (drawStartRef.current) {
          dispatchCanvasMouse('mouseup', cx, cy);
          drawStartRef.current = null;
        } else {
          dispatchCanvasMouse('mousemove', cx, cy);
        }
      }
      return;
    }

    setStatus('Hand tracking ready');
    setActionLabel('Ready');
    setCursorPos({ x: cx, y: cy, active: true, mode: 'normal' });
  };

  return (
    <>
      {/* Mini Video Feed & Canvas */}
      {active && (
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-1.5 select-none">
          <div className="relative w-40 h-28 rounded-lg overflow-hidden border-2 border-purple-500 shadow-xl bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width={160}
              height={120}
              className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
            />
          </div>

          {/* Gesture HUD */}
          <div className="w-40 bg-[#0a0814]/90 border border-purple-500/50 rounded-lg p-2.5 backdrop-blur text-[10px] font-dm-mono text-purple-300 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1 font-semibold text-white">
              <span>✋</span>
              <span className="truncate">{status}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-[9px] mb-1.5">
              <span>🎯</span>
              <span>Tool: {currentTool.toUpperCase()}</span>
            </div>
            <div className="text-[#10b981] font-medium text-[9px] truncate mb-1.5">
              👁 {actionLabel}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-150"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <div className="text-[8px] text-purple-400 text-right mt-0.5">conf {confidence}%</div>
          </div>
        </div>
      )}

      {/* Floating Gesture Cursor */}
      {active && cursorPos.active && (
        <div
          className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-75 z-50 ${
            cursorPos.mode === 'pinching'
              ? 'w-4 h-4 border-2 border-[#10b981] bg-[#10b981]/40 shadow-[0_0_12px_#10b981]'
              : cursorPos.mode === 'two'
              ? 'w-6 h-6 border-2 border-amber-400 bg-amber-400/20'
              : cursorPos.mode === 'fist'
              ? 'w-6 h-6 border-2 border-red-500 bg-red-500/20'
              : 'w-5 h-5 border-2 border-purple-500 bg-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
          }`}
          style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
        />
      )}

      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 bg-[#0a0814]/95 border border-purple-500 px-4 py-1.5 rounded-full text-xs font-dm-mono text-purple-200 z-50 shadow-2xl animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Gesture Help Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-purple-500 rounded-xl p-6 max-w-md w-full shadow-2xl text-slate-200">
            <h3 className="font-bebas text-2xl tracking-wider text-purple-300 mb-3 flex items-center gap-2">
              <span>✋</span> Hand Gesture Controls
            </h3>
            <div className="space-y-2 text-xs font-dm-mono divide-y divide-slate-800">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">☝️ Index Only</span>
                <span className="text-slate-400">Aim & move cursor</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">🤏 Pinch (Thumb+Index)</span>
                <span className="text-slate-400">Draw / Drag / Select</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">✌️ 2 Fingers + Swipe</span>
                <span className="text-slate-400">Switch tool left / right</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">🖖 3 Fingers</span>
                <span className="text-slate-400">Cycle render style</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">✊ Fist</span>
                <span className="text-slate-400">Undo last action</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">🖐 Open Hand (5 fingers)</span>
                <span className="text-slate-400">Switch to Select Mode</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-purple-300 font-bold">🤙 Thumb + Pinky</span>
                <span className="text-slate-400">Delete selected item</span>
              </div>
            </div>
            <button
              onClick={onCloseGuide}
              className="mt-5 w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500 text-purple-200 rounded-lg font-dm-mono text-xs cursor-pointer transition-colors"
            >
              Got it! Start Designing
            </button>
          </div>
        </div>
      )}
    </>
  );
};
