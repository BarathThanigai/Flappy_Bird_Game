import React from 'react';
import { Trophy, Lock, CheckCircle, Award } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsPanelProps {
  achievements: Achievement[];
  onClose: () => void;
}

export default function AchievementsPanel({ achievements, onClose }: AchievementsPanelProps) {
  const totalCount = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100) || 0;

  return (
    <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-sm w-full mx-auto backdrop-blur-md flex flex-col max-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold font-sans tracking-tight">Achievements</h2>
        </div>
        <button
          onClick={onClose}
          id="btn_close_achievements"
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors cursor-pointer text-slate-300 duration-150"
        >
          Back
        </button>
      </div>

      {/* Completion Meter */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4 flex-shrink-0 select-none">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-semibold">
          <span>Unlocked Trophies</span>
          <span className="text-yellow-400 font-bold">{unlockedCount} / {totalCount} ({completionPercent}%)</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* List Container - Scrollable */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-grow scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
        {achievements.map((ach) => {
          return (
            <div
              key={ach.id}
              className={`flex items-center transition-all duration-200 border rounded-xl p-3 select-none ${
                ach.unlocked
                  ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-850'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3.5 shadow-md flex-shrink-0 bg-gradient-to-br ${
                  ach.unlocked ? ach.badgeColor : 'from-slate-800 to-slate-900 border border-slate-700/20'
                }`}
              >
                {ach.unlocked ? (
                  <Award className="w-5 h-5 text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.3)] animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-500" />
                )}
              </div>

              {/* Text metadata */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3
                    className={`text-xs font-bold leading-none truncate ${
                      ach.unlocked ? 'text-yellow-400' : 'text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </h3>
                  {ach.unlocked && (
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-medium mt-1 leading-snug">
                  {ach.description}
                </p>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                  Goal: {ach.criteria}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
