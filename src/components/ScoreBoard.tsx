import React from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export default function ScoreBoard({
  score,
  highScore,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute
}: ScoreBoardProps) {
  return (
    <div className="absolute top-4 left-0 right-0 px-5 flex items-center justify-between pointer-events-none select-none z-30">
      {/* Current Score Bubble */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-950/75 border border-slate-800/80 rounded-2xl px-4 py-2 flex flex-col items-center shadow-lg backdrop-blur-sm min-w-16">
          <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider leading-none">
            Score
          </span>
          <span className="text-2xl font-black text-yellow-400 font-mono tracking-tighter leading-none mt-1 animate-[pulse_2s_infinite]">
            {score}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/40 rounded-xl px-3 py-1 flex items-baseline gap-1 shadow-md backdrop-blur-sm">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider">High</span>
          <span className="text-xs font-bold text-slate-300 font-mono">{highScore}</span>
        </div>
      </div>

      {/* Control Actions - interactive elements MUST have pointer-events-auto */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Toggle Mute */}
        <button
          id="hud_btn_mute"
          onClick={onToggleMute}
          className="w-10 h-10 flex items-center justify-center bg-slate-950/75 border border-slate-800/80 hover:bg-slate-900 active:scale-95 transition-all rounded-full shadow-lg text-slate-300 hover:text-white cursor-pointer"
          title={isMuted ? 'Unmute Sounds' : 'Mute Sounds'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Toggle Pause */}
        <button
          id="hud_btn_pause"
          onClick={onTogglePause}
          className="w-10 h-10 flex items-center justify-center bg-slate-950/75 border border-slate-800/80 hover:bg-slate-900 active:scale-95 transition-all rounded-full shadow-lg text-slate-300 hover:text-white cursor-pointer"
          title={isPaused ? 'Resume Flight' : 'Pause Flight'}
        >
          {isPaused ? (
            <Play className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ) : (
            <Pause className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );
}
