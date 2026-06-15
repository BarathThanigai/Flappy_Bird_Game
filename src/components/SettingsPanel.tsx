import React from 'react';
import { Volume2, VolumeX, Shield, Circle, Sliders } from 'lucide-react';
import { DifficultyMode, GameSettings } from '../types';

interface SettingsPanelProps {
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onClose?: () => void;
}

export const BIRD_COLORS = [
  { name: 'Sunny Yellow', value: '#FFD700', border: '#D4AF37' },
  { name: 'Flappy Ruby', value: '#FF4136', border: '#B10DC9' },
  { name: 'Neon Aquamarine', value: '#01FF70', border: '#2ECC40' },
  { name: 'Cyber Violet', value: '#B10DC9', border: '#85144b' },
  { name: 'Aero Orange', value: '#FF851B', border: '#FF4136' },
];

export const DIFFICULTY_INFO = {
  EASY: {
    label: 'Easy',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    activeColor: 'bg-emerald-500 text-white border-emerald-500',
    desc: 'Wide pipe gaps, slower speed. Best for starters.',
  },
  MEDIUM: {
    label: 'Normal',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
    activeColor: 'bg-amber-500 text-slate-900 border-amber-500 font-medium',
    desc: 'The original gameplay gap of 135px with standard speeds.',
  },
  HARD: {
    label: 'Hardcore',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30',
    activeColor: 'bg-rose-500 text-white border-rose-500',
    desc: 'Narrow pipe gaps of 120px, faster scroll. Speed surges.',
  },
};

export default function SettingsPanel({ settings, onChangeSettings, onClose }: SettingsPanelProps) {
  const toggleMute = () => {
    onChangeSettings({ ...settings, mute: !settings.mute });
  };

  const handleDifficulty = (diff: DifficultyMode) => {
    onChangeSettings({ ...settings, difficulty: diff });
  };

  const handleColor = (colorHex: string) => {
    onChangeSettings({ ...settings, birdColor: colorHex });
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-sm w-full mx-auto backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 select-none">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold font-sans tracking-tight">Configuration</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            id="btn_close_settings"
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors cursor-pointer text-slate-300 duration-150"
          >
            Done
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Audio Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="font-semibold text-sm">Game Sounds</div>
            <div className="text-xs text-slate-400">Flaps, points, & collisions</div>
          </div>
          <button
            id="btn_toggle_audio"
            onClick={toggleMute}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
              settings.mute
                ? 'bg-slate-800 border-slate-700 text-red-400 hover:bg-slate-700'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            {settings.mute ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Enabled</span>
              </>
            )}
          </button>
        </div>

        {/* Difficulty Select */}
        <div className="pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-2 font-semibold text-sm">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Difficulty Level</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_INFO) as DifficultyMode[]).map((mode) => {
              const active = settings.difficulty === mode;
              const style = active ? DIFFICULTY_INFO[mode].activeColor : DIFFICULTY_INFO[mode].color;
              return (
                <button
                  key={mode}
                  id={`btn_diff_${mode.toLowerCase()}`}
                  onClick={() => handleDifficulty(mode)}
                  className={`py-2 px-1 rounded-xl text-xs border tracking-wide font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${style}`}
                >
                  {DIFFICULTY_INFO[mode].label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 italic leading-relaxed text-center select-none bg-slate-950/45 p-1.5 rounded-lg border border-slate-900">
            {DIFFICULTY_INFO[settings.difficulty].desc}
          </p>
        </div>

        {/* Dynamic Bird Skin */}
        <div>
          <div className="font-semibold text-sm mb-2.5">Bird Accent Hue</div>
          <div className="flex items-center justify-between gap-1.5 px-2">
            {BIRD_COLORS.map((clr) => {
              const active = settings.birdColor.toUpperCase() === clr.value.toUpperCase();
              return (
                <button
                  key={clr.value}
                  id={`btn_color_${clr.name.replace(/\s+/g, '_').toLowerCase()}`}
                  onClick={() => handleColor(clr.value)}
                  className="relative group focus:outline-none cursor-pointer"
                  title={clr.name}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 transition-transform duration-150 active:scale-95 flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: clr.value,
                      borderColor: active ? '#ffffff' : 'rgba(255,255,255,0.15)',
                      transform: active ? 'scale(1.15)' : 'none',
                    }}
                  >
                    {active && (
                      <div className="w-2 h-2 rounded-full bg-slate-950 shadow-inner" />
                    )}
                  </div>
                  {/* Tooltip on hover */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-800">
                    {clr.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
