import React, { useEffect, useState } from 'react';

interface CinematicIntroProps {
  onComplete?: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 900);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, 2800);
    const handleKeyDown = () => dismiss();
    window.addEventListener('keydown', handleKeyDown, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-opacity duration-900 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(79,195,247,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Laser Scanline */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4fc3f7] to-transparent animate-scan-down opacity-60" />

      {/* Technical Corner Brackets */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-[#4fc3f7]" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-[#4fc3f7]" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-[#4fc3f7]" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-[#4fc3f7]" />

      {/* Tagline */}
      <div className="font-dm-mono text-[11px] tracking-[6px] text-[#4fc3f7] uppercase mb-4 animate-pulse">
        Architecture · Design · Vision
      </div>

      {/* Title */}
      <div className="font-bebas text-6xl md:text-8xl tracking-[8px] text-white text-center drop-shadow-[0_0_40px_rgba(79,195,247,0.45)] relative pb-3">
        SS DESIGN STUDIO
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4fc3f7] via-[#f59e0b] to-transparent" />
      </div>

      {/* Subtitle */}
      <div className="font-dm-sans text-xs tracking-[4px] text-slate-400 uppercase mt-5">
        Developed by SS Developments &nbsp;·&nbsp; v4.0 Pro
      </div>

      {/* Animated Dot Sequence */}
      <div className="flex gap-2.5 mt-8">
        <div className="w-1.5 h-1.5 rounded-full bg-[#4fc3f7] animate-ping" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" style={{ animationDelay: '200ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" style={{ animationDelay: '400ms' }} />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-52 h-0.5 bg-slate-800 rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#4fc3f7] to-[#f59e0b] w-full origin-left transition-all duration-2500 animate-pulse" />
      </div>

      <div className="absolute bottom-4 text-[10px] font-dm-mono text-slate-600">
        Click anywhere or press any key to start
      </div>
    </div>
  );
};
