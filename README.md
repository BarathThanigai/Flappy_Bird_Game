# 🐦 Flappy Birdy 🐦

**Flappy Birdy** is a full-featured, retro-modern, high-fidelity arcade clone of the iconic mobile game Flappy Bird. Powered by a responsive HTML5 Canvas engine, React coordinate routers, Tailwind CSS, and lightweight in-flight Web Audio oscillators.

---

## Creative & Technical Features

1. **FPS-Independent Canvas Physics**: Calculates delta time ratios on every animation repaint. The game runs identically on a standard 60Hz screen, an ultra-fast 120Hz/144Hz desktop monitor, or a handheld mobile phone.
2. **Web Audio Synthesizer**: Implements procedural audio rendering via the browser's native `AudioContext` object. No bulky MP3/WAV static asset files to download (which means zero 404 network concerns), lightweight sound effects, and persistent mute preservation.
3. **Adaptive Day/Night Skycycle**: Gracefully transitions the canvas background between morning gold, afternoon skies, dusky sunset lavender-copper, and dark starry midnights with glittering cross-flare stars.
4. **Achievement & Medal Badge Systems**: Keeps track of progressive stats (total flaps, maximum scores, accumulated flying distance) inside the client’s `localStorage`. Earn Bronze, Silver, Gold, or Platinum medals based on performance.
5. **Polished Customizations**: Includes a fully interactive Lobby where pilots can configure difficulty variables (Easy, Normal, Hardcore) and alter the bird's aesthetic accent skin (Sunny Gold, Ruby, Neon Teal, Cyber Violet, or Flame).

---

## Project Architecture Layout

- `/src/types.ts`: Models all strictly typed schemas such as state machines, physics boundaries, particles, and settings.
- `/src/utils/audio.ts`: Custom synthesizers crafting acoustic frequency waveforms for flaps, points, explosions, and achievements.
- `/src/utils/achievements.ts`: Evaluates progressive statistics against milestone targets and manages storage states.
- `/src/components/GameCanvas.tsx`: Core engine holding gravity vectors, collision bounds, scrolling ground parallax layers, sparkles, feathers, and custom vector-drawn canvas rendering.
- `/src/components/ScoreBoard.tsx`: Live-action play dashboard housing floating score counts, all-time high-scores, and interactive mute/pause toggles.
- `/src/components/SettingsPanel.tsx`: Overlay configuration console providing access to difficulties and bird colors.
- `/src/components/StartScreen.tsx` & `/src/components/GameOverScreen.tsx`: Cinematic lobby panels presenting statistics, awards, and instructions.
- `/src/App.tsx`: High-level administrator managing user interactions and rendering sliding achievement unlock alerts.

---

## Game Physics Reference Guide

- **Virtual Grid Scale**: `480px` width by `640px` height (scaled seamlessly via adaptive aspect ratios).
- **Gravity Acceleration**: `0.36px / frame²` (Eased on crash).
- **Flapping Impulse**: `-6.8px / frame` (Resets vertical speed instantly to guarantee snappy, crisp inputs).
- **Pipe Airway Clearance (Vertical Gaps)**:
  - Easy: `155px` (Best for starters)
  - Normal/Medium: `135px` (The gold standard)
  - Hardcore: `118px` (Fast action)

---

## Speed Setup Instructions

### 1. Verification of Node dependencies
```bash
npm install
```

### 2. Launch Local Dev server
```bash
npm run dev
```

### 3. Build & Bundler Compilation compiles to distribution static files
```bash
npm run build
```
The static compiler exports distribution files cleanly into `dist/`.

---

## Play Deck Key Controls

- **Flap**: Press **Spacebar**, **Up Arrow (`ArrowUp`)**, or click/tap the screen viewport.
- **Pause/Resume**: Press **Escape (`Esc`)** or **P (`KeyP`)**, or click the toggle on the top right HUD.
- **Mute**: Click the Audio button on the HUD top right.
