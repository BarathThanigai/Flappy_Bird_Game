/**
 * Retro sound effects generated dynamically via Web Audio API.
 * This guarantees audio works locally and in deployed environments without external assets.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Initialize or get audio context
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor prefixed
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export const audioManager = {
  setMute(mute: boolean) {
    isMuted = mute;
    // Save preference
    localStorage.setItem('flappy_react_mute', mute ? 'true' : 'false');
  },

  getMute(): boolean {
    return isMuted;
  },

  initialize() {
    isMuted = localStorage.getItem('flappy_react_mute') === 'true';
  },

  playFlap() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser security autoplays)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Flap sound: short rising/falling triangle wave
    osc.type = 'triangle';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);
  },

  playPoint() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Retro dual tone (like classic Mario/Flappy)
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Quick arpeggio
    playTone(587.33, now, 0.08); // D5
    playTone(880.00, now + 0.08, 0.2); // A5
  },

  playCollision() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Low rumble / crash sound
    const osc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    
    osc.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.35);

    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);

    // Add a quick secondary explosion-like thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(10, now + 0.25);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    subOsc.start(now);
    subOsc.stop(now + 0.25);
  },

  playUnlock() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Clean upbeat chime for achievements
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gainNode.gain.setValueAtTime(0.08, now + i * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }
};
