export type GameState = 'IDLE' | 'PLAYING' | 'GAMEOVER' | 'PAUSED';

export type DifficultyMode = 'EASY' | 'MEDIUM' | 'HARD';

export interface Bird {
  y: number;
  velocity: number;
  rotation: number;
  radius: number;
  wingAngle: number;
  wingDirection: number;
}

export interface Pipe {
  id: string;
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  pulseTime: number; // for juicy animations when score point triggers
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number; // 0 to 1
  decay: number;
  gravity: number;
  rotation: number;
  rotationSpeed: number;
  type: 'feather' | 'sparkle' | 'dust' | 'moonstar';
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  criteria: string;
  requirement: number;
  unlocked: boolean;
  category: 'score' | 'flaps' | 'distance';
  badgeColor: string;
}

export type MedalType = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface GameSettings {
  mute: boolean;
  difficulty: DifficultyMode;
  birdColor: string; // Hex color code
}
