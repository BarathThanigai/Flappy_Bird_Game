import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Award, Sparkles, Trophy } from 'lucide-react';
import { MedalType } from '../types';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewBest: boolean;
  onRestart: () => void;
  onHome: () => void;
  medal: MedalType;
}

export default function GameOverScreen({
  score,
  highScore,
  isNewBest,
  onRestart,
  onHome,
  medal
}: GameOverScreenProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth count up animation for score on display
  useEffect(() => {
    if (score === 0) return;
    const duration = 800; // ms
    const startTime = performance.now();

    let animFrame: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out quadratic
      const ease = progress * (2 - progress);
      setAnimatedScore(Math.floor(ease * score));

      if (progress < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        setAnimatedScore(score);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [score]);

  // Medal configuration metadata
  const getMedalDetails = () => {
    switch (medal) {
      case 'BRONZE':
        return {
          title: 'Bronze Wing',
          desc: 'Keep flying!',
          style: 'from-amber-600 via-amber-700 to-amber-900 border-amber-500',
          textColor: 'text-amber-400',
        };
      case 'SILVER':
        return {
          title: 'Silver Soarer',
          desc: 'Amazing flight!',
          style: 'from-zinc-300 via-slate-400 to-zinc-500 border-zinc-200',
          textColor: 'text-zinc-300',
        };
      case 'GOLD':
        return {
          title: 'Gold Glider',
          desc: 'Pro level wings!',
          style: 'from-yellow-400 via-amber-500 to-yellow-600 border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.4)]',
          textColor: 'text-yellow-400',
        };
      case 'PLATINUM':
        return {
          title: 'Platinum Legend',
          desc: 'God-tier pilot!',
          style: 'from-cyan-300 via-sky-400 to-indigo-500 border-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.5)] animate-pulse',
          textColor: 'text-cyan-300',
        };
      default:
        return {
          title: 'No Award',
          desc: 'Pass 5 pipes to win medals!',
          style: 'from-slate-800 to-slate-900 border-slate-700/40',
          textColor: 'text-slate-500',
        };
    }
  };

  const details = getMedalDetails();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 select-none w-full max-w-sm mx-auto">
      {/* Red Glowing Title */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
          GAME OVER
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
          Crash Detected
        </p>
      </div>

      {/* Main Scoring Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative mb-6">
        {isNewBest && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-slate-950 font-extrabold text-[10px] px-3.5 py-1 rounded-full shadow-lg border border-yellow-400/30 flex items-center gap-1 animate-[bounce_1.5s_infinite] uppercase tracking-widest z-10 font-bold">
            <Sparkles className="w-3 h-3 text-white fill-white" />
            <span>NEW BEST SCORE</span>
          </div>
        )}

        {/* Core details layout */}
        <div className="flex items-center gap-4 py-2">
          {/* Medal Plate */}
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <div
              className={`w-18 h-18 rounded-2xl border-2 bg-gradient-to-br flex items-center justify-center relative shadow-lg ${details.style}`}
            >
              {medal !== 'NONE' ? (
                <Award className="w-10 h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-[spin_6s_linear_infinite]" />
              ) : (
                <Trophy className="w-8 h-8 text-slate-600" />
              )}
            </div>
            <span className={`text-[10px] font-extrabold mt-1.5 uppercase tracking-wide leading-none ${details.textColor}`}>
              {details.title}
            </span>
          </div>

          {/* Scores display */}
          <div className="flex-grow space-y-2 text-left pl-2">
            <div>
              <span className="text-xs text-slate-400 lowercase italic">Current distance score</span>
              <div className="text-3xl font-black text-slate-100 font-mono tracking-tighter leading-none mt-0.5">
                {score === 0 ? score : animatedScore}
                <span className="text-xs font-normal text-slate-500 ml-1">pts</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-1.5 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">All-Time High</span>
                <div className="text-sm font-extrabold text-yellow-400 font-mono tracking-tight leading-none mt-0.5">
                  {highScore} pts
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 italic block">Rank Title</span>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide">
                  {score >= 30 ? 'Elite Wingman' : score >= 15 ? 'Sky Captain' : score >= 5 ? 'Novice Flapper' : 'Ground Sparrow'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {medal === 'NONE' && (
          <p className="border-t border-slate-800/50 pt-2.5 mt-2.5 text-[10px] text-slate-400 leading-normal text-center select-none italic">
            💡 Unlock medals matching milestone scores! <br />
            5 = Bronze | 15 = Silver | 30 = Gold | 50 = Platinum
          </p>
        )}
      </div>

      {/* Control Actions buttons */}
      <div className="w-full space-y-3">
        <button
          id="btn_retry_game"
          onClick={onRestart}
          className="w-full group relative flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] transition-all rounded-xl text-slate-950 font-extrabold text-base shadow-[0_4px_16px_rgba(245,158,11,0.2)] cursor-pointer duration-100"
        >
          <RotateCcw className="w-4 h-4" />
          <span>PLAY AGAIN</span>
          <span className="absolute right-3 text-[10px] font-mono font-normal opacity-60 hidden sm:inline border border-slate-950/20 px-1 py-0.5 rounded">
            SPACE
          </span>
        </button>

        <button
          id="btn_return_home"
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-6 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-700/30 transition-all rounded-xl text-slate-200 font-semibold text-sm cursor-pointer duration-100"
        >
          <Home className="w-4 h-4" />
          <span>MAIN MENU</span>
        </button>
      </div>
    </div>
  );
}
