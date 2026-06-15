import React from 'react';
import { Play, Trophy, Sliders, Flame } from 'lucide-react';

interface StartScreenProps {
  highScore: number;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  birdColor: string;
}

export default function StartScreen({
  highScore,
  onStartGame,
  onOpenSettings,
  onOpenAchievements,
  birdColor
}: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full py-10 px-6 text-center select-none w-full max-w-sm mx-auto">
      {/* Top Banner / Title */}
      <div className="mt-4 animate-bounce duration-[2000ms] ease-in-out">
        <div className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-xs text-yellow-400 font-medium mb-3 select-none uppercase tracking-widest">
          <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse fill-orange-500" />
          <span>HTML5 Arcade Classic</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-600">
          FLAPPY REACT
        </h1>
        <p className="text-sm text-slate-300 tracking-wide mt-1 font-mono">
          Physics-Based Canvas Engine
        </p>
      </div>

      {/* Interactive Bird Bounce Preview */}
      <div className="relative my-8 flex items-center justify-center h-20 w-20">
        <div className="absolute inset-0 bg-yellow-500/15 rounded-full blur-xl animate-pulse" />
        {/* Procedural SVG representation of Flappy bird matching selected color */}
        <svg
          className="w-14 h-14 animate-[bounce_1.4s_infinite] drop-shadow-[0_6px_8px_rgba(0,0,0,0.45)]"
          viewBox="0 0 100 100"
          style={{ transform: 'scaleX(1)' }}
        >
          {/* Bird Body */}
          <ellipse cx="50" cy="50" rx="35" ry="28" fill={birdColor} stroke="#1e293b" strokeWidth="6" />
          {/* Belly */}
          <ellipse cx="44" cy="56" rx="28" ry="18" fill="#ffffff" opacity="0.85" />
          {/* Eye */}
          <circle cx="68" cy="40" r="10" fill="#ffffff" stroke="#1e293b" strokeWidth="4" />
          <circle cx="70" cy="38" r="4" fill="#000000" />
          {/* Beak */}
          <path d="M 82 45 L 94 50 L 80 56 Z" fill="#f97316" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
          {/* Wing */}
          <ellipse cx="32" cy="50" rx="14" ry="10" fill="#ffffff" stroke="#1e293b" strokeWidth="5" />
        </svg>
      </div>

      {/* Main Start Call-to-action */}
      <div className="w-full space-y-4">
        <button
          id="btn_start_game"
          onClick={onStartGame}
          className="w-full group relative flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] transition-all rounded-2xl text-slate-950 font-extrabold text-lg shadow-[0_8px_24px_rgba(245,158,11,0.35)] cursor-pointer border-b-4 border-amber-700 hover:border-amber-600 duration-150"
        >
          <Play className="w-5 h-5 fill-slate-950 stroke-none" />
          <span>START FLAPPING</span>
          <span className="absolute right-4 text-xs font-mono font-normal opacity-60 hidden sm:inline border border-slate-950/20 px-1.5 py-0.5 rounded">
            SPACEBAR
          </span>
        </button>

        <p className="text-xs text-slate-400 font-medium">
          Press <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700/50">Spacebar</span>, <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700/50">Up Arrow</span>, or <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700/50">Tap/Click</span> to flap
        </p>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="w-full mt-8 border-t border-slate-800/60 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Personal High</span>
          <span className="text-sm font-extrabold text-yellow-400 tracking-wider">
            {highScore} PTS
          </span>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            id="btn_lobby_settings"
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/30 active:bg-slate-800 transition-colors rounded-xl text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
          
          <button
            id="btn_lobby_achievements"
            onClick={onOpenAchievements}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/30 active:bg-slate-800 transition-colors rounded-xl text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>Achievements</span>
          </button>
        </div>
      </div>
    </div>
  );
}
