import React, { useEffect, useRef } from 'react';
import { CanvasElement } from '../types';

interface MiniMapProps {
  elements: CanvasElement[];
  viewOffset: { x: number; y: number };
  zoomLevel: number;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (x: number, y: number) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  elements,
  viewOffset,
  zoomLevel,
  canvasWidth,
  canvasHeight,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    // Map bounds: virtual world 2000 x 1400
    const worldW = 2000;
    const worldH = 1400;
    const scaleX = w / worldW;
    const scaleY = h / worldH;

    // Draw elements thumbnail
    elements.forEach((el) => {
      if (el.type === 'room' && el.x2 !== undefined && el.y2 !== undefined) {
        const rx = Math.min(el.x1, el.x2) * scaleX;
        const ry = Math.min(el.y1, el.y2) * scaleY;
        const rw = Math.abs(el.x2 - el.x1) * scaleX;
        const rh = Math.abs(el.y2 - el.y1) * scaleY;
        ctx.fillStyle = 'rgba(79, 195, 247, 0.25)';
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (el.type === 'wall' && el.x2 !== undefined && el.y2 !== undefined) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(el.x1 * scaleX, el.y1 * scaleY);
        ctx.lineTo(el.x2 * scaleX, el.y2 * scaleY);
        ctx.stroke();
      } else if (el.type === 'pool' && el.x2 !== undefined && el.y2 !== undefined) {
        const rx = Math.min(el.x1, el.x2) * scaleX;
        const ry = Math.min(el.y1, el.y2) * scaleY;
        const rw = Math.abs(el.x2 - el.x1) * scaleX;
        const rh = Math.abs(el.y2 - el.y1) * scaleY;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fillRect(rx, ry, rw, rh);
      }
    });

    // Viewport box
    const vpX = (-viewOffset.x / zoomLevel) * scaleX;
    const vpY = (-viewOffset.y / zoomLevel) * scaleY;
    const vpW = (canvasWidth / zoomLevel) * scaleX;
    const vpH = (canvasHeight / zoomLevel) * scaleY;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(vpX, vpY, vpW, vpH);
  }, [elements, viewOffset, zoomLevel, canvasWidth, canvasHeight]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldW = 2000;
    const worldH = 1400;
    const targetX = (clickX / rect.width) * worldW;
    const targetY = (clickY / rect.height) * worldH;

    onNavigate(targetX, targetY);
  };

  return (
    <div className="absolute bottom-10 right-4 z-20 bg-[#0d1424]/90 border border-[#1e3a5f] rounded-xl p-1.5 shadow-xl backdrop-blur select-none">
      <div className="text-[8px] font-dm-mono uppercase text-slate-400 mb-1 px-1 flex items-center justify-between">
        <span>Radar MiniMap</span>
        <span className="text-[#4fc3f7]">{Math.round(zoomLevel * 100)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        width={130}
        height={85}
        onClick={handleClick}
        className="rounded cursor-crosshair border border-[#1e293b]"
      />
    </div>
  );
};
