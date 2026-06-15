import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { GameState, DifficultyMode, Bird, Pipe, Particle, ScorePopup } from '../types';
import { audioManager } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: DifficultyMode;
  birdColor: string;
  isPaused: boolean;
  onIncrementScore: (x: number, y: number) => void;
  onGameOver: (finalScore: number) => void;
  onNewFlap: () => void;
}

export interface GameCanvasHandle {
  resetGame: () => void;
  triggerFlap: () => void;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const GROUND_HEIGHT = 100;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({
  gameState,
  difficulty,
  birdColor,
  isPaused,
  onIncrementScore,
  onGameOver,
  onNewFlap
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core physics references - avoided state triggers during animation frames to maximize FPS.
  const gameStateRef = useRef<GameState>(gameState);
  const isPausedRef = useRef<boolean>(isPaused);
  const difficultyRef = useRef<DifficultyMode>(difficulty);
  const birdColorRef = useRef<string>(birdColor);

  // Game physics parameters
  const scoreRef = useRef<number>(0);
  const distanceCoveredRef = useRef<number>(0);
  const totalFlapsRef = useRef<number>(0);

  // Bird parameters
  const birdRef = useRef<Bird>({
    y: 280,
    velocity: 0,
    rotation: 0,
    radius: 14,
    wingAngle: 0,
    wingDirection: 1,
  });

  // Level arrays
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);

  // Environment scroll parameters
  const skyScrollX = useRef<number>(0);
  const citiesScrollX = useRef<number>(0);
  const groundScrollX = useRef<number>(0);

  // Day/Night Cycle (value 0 to 1 representing time)
  // 0.0-0.2 Morning, 0.2-0.5 Day, 0.5-0.7 Sunset, 0.7-1.0 Midnight Night
  const timeCycleRef = useRef<number>(0.3); // Starts during gorgeous bright day ratio
  const lastScoreColorRef = useRef<string>('#ffffff');

  // Sync references with props
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    birdColorRef.current = birdColor;
  }, [birdColor]);

  // Command handle to pass calls from parent triggers (Buttons or keyboard listeners)
  useImperativeHandle(ref, () => ({
    resetGame() {
      scoreRef.current = 0;
      distanceCoveredRef.current = 0;
      birdRef.current = {
        y: 280,
        velocity: 0,
        rotation: 0,
        radius: 14,
        wingAngle: 0,
        wingDirection: 1,
      };
      pipesRef.current = [];
      particlesRef.current = [];
      popupsRef.current = [];
      
      // Seed first batch of pipes immediately
      spawnPipe(CANVAS_WIDTH + 150);
      spawnPipe(CANVAS_WIDTH + 380);
    },
    triggerFlap() {
      // Ignore flap if paused, game isn't active or over
      if (gameStateRef.current === 'GAMEOVER' || isPausedRef.current) return;
      
      // Standard positive flap lift
      // Resets upward motion cleanly for crisp inputs
      birdRef.current.velocity = -6.8;
      totalFlapsRef.current += 1;
      onNewFlap();
      audioManager.playFlap();

      // Emit fluffy feather flight particles
      const birdX = 120;
      const birdY = birdRef.current.y;
      for (let i = 0; i < 6; i++) {
        spawnParticle(
          birdX - 6,
          birdY,
          -1.5 - Math.random() * 2,
          (Math.random() - 0.5) * 3,
          'feather',
          '#ffffff',
          0.8 + Math.random() * 0.4
        );
      }
    }
  }));

  // Spawn modular items helper
  const spawnPipe = (startX: number) => {
    const diff = difficultyRef.current;
    
    // Gaps size based on selected difficulty
    let gap = 135;
    if (diff === 'EASY') gap = 155;
    if (diff === 'HARD') gap = 118;

    const minHeight = 60;
    const maxHeight = GROUND_Y - gap - minHeight;
    // Random height distribution
    const topHeight = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
    const bottomY = topHeight + gap;

    pipesRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x: startX,
      topHeight,
      bottomY,
      passed: false,
      pulseTime: 0,
    });
  };

  const spawnParticle = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: 'feather' | 'sparkle' | 'dust' | 'moonstar',
    color = '#ffffff',
    sizeFactor = 1.0
  ) => {
    particlesRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx,
      vy,
      size: (type === 'feather' ? 3 + Math.random() * 3 : (type === 'sparkle' ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2)) * sizeFactor,
      alpha: 1.0,
      color,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.02,
      gravity: type === 'feather' ? 0.08 : (type === 'sparkle' ? 0.01 : 0.05),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      type,
    });
  };

  const spawnPopup = (x: number, y: number, text: string) => {
    popupsRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      text,
      alpha: 1.0,
      vy: -1.5,
    });
  };

  // Run the HTML5 Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Force canvas element internals to lock into game standard resolution
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Secondary static objects generated for decorative stars and layers
    const staticStars: { x: number; y: number; s: number; ph: number }[] = [];
    for (let i = 0; i < 40; i++) {
      staticStars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (GROUND_Y - 200),
        s: 0.5 + Math.random() * 1.5,
        ph: Math.random() * Math.PI * 2,
      });
    }

    const staticClouds: { x: number; y: number; scale: number; speed: number }[] = [
      { x: 50, y: 120, scale: 0.9, speed: 0.12 },
      { x: 220, y: 60, scale: 1.3, speed: 0.08 },
      { x: 380, y: 150, scale: 0.8, speed: 0.15 },
    ];

    // Main render loop
    const tick = (time: number) => {
      // Delta time based on ideal 60Hz timeframe (16.66ms = 1.0 multiplier)
      let dt = (time - lastTime) / 16.666;
      if (dt > 4.0) dt = 4.0; // cap lag spike to avoid huge wall clipping
      lastTime = time;

      if (!isPausedRef.current) {
        updatePhysics(dt, time);
      }
      renderScene(ctx, staticStars, staticClouds, dt, time);

      animId = requestAnimationFrame(tick);
    };

    // Update Physics function
    const updatePhysics = (dt: number, time: number) => {
      const state = gameStateRef.current;
      const diff = difficultyRef.current;

      // Slowly increment day/night cycle
      timeCycleRef.current = (timeCycleRef.current + 0.000185 * dt) % 1.0;

      // Base speeds governed by selected Difficulty settings
      let baseSpeed = 2.4;
      if (diff === 'EASY') baseSpeed = 2.1;
      if (diff === 'HARD') baseSpeed = 3.0;

      // Adaptive difficulty scaling - slightly accelerates movement as score climbs!
      const currentScore = scoreRef.current;
      const speedMultiplier = 1.0 + Math.min(currentScore * 0.015, 0.25);
      const gameSpeed = baseSpeed * speedMultiplier * dt;

      // Ground/city scroll offsets
      if (state === 'PLAYING') {
        distanceCoveredRef.current += gameSpeed;
        skyScrollX.current = (skyScrollX.current + 0.085 * dt) % CANVAS_WIDTH;
        citiesScrollX.current = (citiesScrollX.current + 0.28 * dt) % CANVAS_WIDTH;
        groundScrollX.current = (groundScrollX.current + gameSpeed) % 24; // repeated block sizes
      } else if (state === 'IDLE') {
        skyScrollX.current = (skyScrollX.current + 0.085 * dt) % CANVAS_WIDTH;
        citiesScrollX.current = (citiesScrollX.current + 0.28 * dt) % CANVAS_WIDTH;
        groundScrollX.current = (groundScrollX.current + baseSpeed * dt) % 24;
      }

      const bird = birdRef.current;

      if (state === 'IDLE') {
        // Soft hover effect up/down while resting in menu
        bird.y = 280 + Math.sin(time / 200) * 85 * 0.12;
        bird.velocity = 0;
        bird.rotation = 0;
        
        // Quiet slow flap
        bird.wingAngle += 0.12 * dt;
      } else if (state === 'PLAYING' || state === 'GAMEOVER') {
        // Gravity accel
        const gravityConst = state === 'GAMEOVER' ? 0.42 : 0.36;
        bird.velocity += gravityConst * dt;
        
        // Terminal gravity safety clamp
        if (bird.velocity > 11.5) bird.velocity = 11.5;

        bird.y += bird.velocity * dt;

        // Custom rotational pitching based on vertical speed vectors
        if (state === 'PLAYING') {
          if (bird.velocity < 2) {
            // Pivot up quickly on flap lift
            bird.rotation = Math.max(bird.rotation - 0.125 * dt, -Math.PI * 0.12);
          } else {
            // Slowly nose dive as gravity wins
            bird.rotation = Math.min(bird.rotation + 0.045 * dt, Math.PI * 0.45);
          }
          // Wing flap cycles relative to velocity speed
          bird.wingAngle += (bird.velocity < 0 ? 0.45 : 0.15) * dt;
        } else {
          // Crash rotate nose down
          bird.rotation = Math.min(bird.rotation + 0.08 * dt, Math.PI * 0.5);
          // Stop flapping on death
          bird.wingAngle = 0;
        }
      }

      // Check collision if playing
      if (state === 'PLAYING') {
        // Ground crash
        if (bird.y + bird.radius >= GROUND_Y) {
          bird.y = GROUND_Y - bird.radius;
          handleCrash();
        }

        // Sky barrier soft limit
        if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0.5; // push bird down gently
        }

        // Pipes handling
        const pipes = pipesRef.current;
        const width = 64; // standard pipe diameter width
        const birdX = 120; // fixed relative coordinate of horizontal flight

        // Check each pipe
        for (let i = pipes.length - 1; i >= 0; i--) {
          const pipe = pipes[i];
          pipe.x -= gameSpeed;

          // Score check
          if (!pipe.passed && pipe.x + width / 2 <= birdX) {
            pipe.passed = true;
            scoreRef.current += 1;
            
            // Pulse top-pipe trigger indicator
            pipe.pulseTime = 12;

            // Trigger score popup
            spawnPopup(birdX + 20, bird.y - 25, '+1');
            audioManager.playPoint();

            // Emit sparkle stars
            const themeColors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff'];
            const pColor = themeColors[Math.floor(Math.random() * themeColors.length)];
            lastScoreColorRef.current = pColor;
            onIncrementScore(scoreRef.current, parseInt(distanceCoveredRef.current.toFixed(0)));

            for (let s = 0; s < 12; s++) {
              spawnParticle(
                pipe.x + width / 2,
                (pipe.topHeight + pipe.bottomY) / 2,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                'sparkle',
                pColor,
                1.2
              );
            }
          }

          // AABB + Circular Collision calculation
          const birdY = bird.y;
          const radius = bird.radius - 2; // slight grace cushion to keep game fun

          // Pipe 1 box (Top)
          const inX = birdX + radius > pipe.x && birdX - radius < pipe.x + width;
          const hitTop = inX && birdY - radius < pipe.topHeight;
          const hitBottom = inX && birdY + radius > pipe.bottomY;

          if (hitTop || hitBottom) {
            handleCrash();
          }
        }

        // Prune off-screen pipes and spawn new ones
        if (pipes.length > 0 && pipes[0].x < -120) {
          pipes.shift();
        }

        // Keep distance-based spawning
        if (pipes.length > 0) {
          const lastPipe = pipes[pipes.length - 1];
          const minPipeSpacing = diff === 'EASY' ? 260 : diff === 'HARD' ? 200 : 230;
          if (lastPipe.x < CANVAS_WIDTH + 150 - minPipeSpacing) {
            spawnPipe(CANVAS_WIDTH + 80);
          }
        }
      }

      // Keep gravity affecting dead bird until it settles on ground
      if (state === 'GAMEOVER') {
        if (bird.y + bird.radius >= GROUND_Y) {
          bird.y = GROUND_Y - bird.radius;
          bird.velocity = 0;
        }
      }

      // Update active particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.rotation += p.rotationSpeed * dt;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Update score floating animations
      const popups = popupsRef.current;
      for (let i = popups.length - 1; i >= 0; i--) {
        const pop = popups[i];
        pop.y += pop.vy * dt;
        pop.alpha -= 0.02 * dt;
        if (pop.alpha <= 0) {
          popups.splice(i, 1);
        }
      }
    };

    // Crash Action trigger
    const handleCrash = () => {
      gameStateRef.current = 'GAMEOVER';
      audioManager.playCollision();

      // Explode the bird into feathers!
      const birdX = 120;
      const birdY = birdRef.current.y;
      const targetColor = birdColorRef.current;
      
      for (let i = 0; i < 22; i++) {
        spawnParticle(
          birdX,
          birdY,
          (Math.random() - 0.5) * 6,
          -4 + Math.random() * 5,
          'feather',
          Math.random() > 0.4 ? targetColor : '#ffffff',
          1.0
        );
      }

      // Notify parent page
      onGameOver(scoreRef.current);
    };

    // Custom Canvas Render Engine
    const renderScene = (
      c: CanvasRenderingContext2D,
      stars: { x: number; y: number; s: number; ph: number }[],
      clouds: { x: number; y: number; scale: number; speed: number }[],
      dt: number,
      time: number
    ) => {
      c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. SKY GRADIENT based on Day/Night Cycle
      const phase = timeCycleRef.current;
      let skyGrd = c.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      
      if (phase >= 0.0 && phase < 0.2) {
        // Morning: soft gold and lavender
        const blend = phase / 0.2;
        skyGrd.addColorStop(0, interpolateColor('#1A2238', '#FCCF31', blend));
        skyGrd.addColorStop(0.5, interpolateColor('#493240', '#F55555', blend));
        skyGrd.addColorStop(1, interpolateColor('#240B36', '#3b82f6', blend));
      } else if (phase >= 0.2 && phase < 0.5) {
        // Light Sky Blue Day
        const blend = (phase - 0.2) / 0.3;
        skyGrd.addColorStop(0, interpolateColor('#FCCF31', '#14b8a6', blend * 0.1));
        skyGrd.addColorStop(0.4, '#38bdf8');
        skyGrd.addColorStop(1, '#0284c7');
      } else if (phase >= 0.5 && phase < 0.7) {
        // Dusk Sunset: Warm copper rose
        const blend = (phase - 0.5) / 0.2;
        skyGrd.addColorStop(0, interpolateColor('#38bdf8', '#ff7e5f', blend));
        skyGrd.addColorStop(0.5, interpolateColor('#0284c7', '#feb47b', blend));
        skyGrd.addColorStop(1, interpolateColor('#1e293b', '#2c1a35', blend));
      } else {
        // Midnight Navy starry night
        const blend = (phase - 0.7) / 0.3;
        skyGrd.addColorStop(0, interpolateColor('#ff7e5f', '#060B19', blend));
        skyGrd.addColorStop(0.5, interpolateColor('#feb47b', '#0B1528', blend));
        skyGrd.addColorStop(1, interpolateColor('#2c1a35', '#111827', blend));
      }

      c.fillStyle = skyGrd;
      c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Stars rendering (if sunset or night)
      if (phase < 0.2 || phase > 0.5) {
        let starsAlpha = 0;
        if (phase < 0.2) {
          starsAlpha = (1.0 - phase / 0.2) * 0.85;
        } else if (phase > 0.5 && phase < 0.7) {
          starsAlpha = ((phase - 0.5) / 0.2) * 0.85;
        } else {
          starsAlpha = 0.85;
        }

        c.save();
        c.globalAlpha = starsAlpha;
        stars.forEach((star) => {
          // Soft shimmer multiplier
          const shm = Math.abs(Math.sin((time / 400) + star.ph));
          c.fillStyle = `rgba(255, 255, 255, ${0.35 + shm * 0.6})`;
          c.beginPath();
          c.arc(star.x, star.y, star.s, 0, Math.PI * 2);
          c.fill();

          // Draw an occasional tiny shiny diamond/cross flare for star depth!
          if (star.s > 1.8 && shm > 0.85) {
            c.strokeStyle = 'rgba(255, 255, 100, 0.4)';
            c.lineWidth = 0.4;
            c.beginPath();
            c.moveTo(star.x - 4, star.y);
            c.lineTo(star.x + 4, star.y);
            c.moveTo(star.x, star.y - 4);
            c.lineTo(star.x, star.y + 4);
            c.stroke();
          }
        });
        c.restore();
      }

      // Moon/Sun representation
      c.save();
      if (phase >= 0.2 && phase < 0.6) {
        // Sun during daylight
        const sunX = CANVAS_WIDTH - 100;
        const sunY = 90;
        let radGrd = c.createRadialGradient(sunX, sunY, 3, sunX, sunY, 28);
        radGrd.addColorStop(0, '#FFFFFF');
        radGrd.addColorStop(0.3, '#FFF3CD');
        radGrd.addColorStop(1, 'rgba(252, 211, 77, 0.0)');
        c.fillStyle = radGrd;
        c.beginPath();
        c.arc(sunX, sunY, 30, 0, Math.PI * 2);
        c.fill();
      } else if (phase >= 0.6 || phase < 0.25) {
        // Celestial Moon during Sunset/Night
        const moonX = 100;
        const moonY = 120;
        c.shadowColor = 'rgba(165, 180, 252, 0.4)';
        c.shadowBlur = 10;
        c.fillStyle = '#E0E7FF';
        c.beginPath();
        c.arc(moonX, moonY, 16, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0; // reset

        // Draw shadow arc to make it a crescent moon!
        c.fillStyle = phase > 0.7 ? '#0B1528' : 'rgba(30, 41, 59, 0.55)'; // blends with active sky
        c.beginPath();
        c.arc(moonX + 5, moonY - 3, 15, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      // 3. Drifting Clouds
      c.fillStyle = 'rgba(255, 255, 255, 0.15)';
      clouds.forEach((cloud, idx) => {
        // Scroll cloud based on speeds
        cloud.x = (cloud.x - cloud.speed * dt + CANVAS_WIDTH + 80) % (CANVAS_WIDTH + 140) - 80;

        c.beginPath();
        c.arc(cloud.x, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
        c.arc(cloud.x + 20 * cloud.scale, cloud.y - 12 * cloud.scale, 20 * cloud.scale, 0, Math.PI * 2);
        c.arc(cloud.x - 20 * cloud.scale, cloud.y + 5 * cloud.scale, 16 * cloud.scale, 0, Math.PI * 2);
        c.arc(cloud.x + 35 * cloud.scale, cloud.y + 4 * cloud.scale, 15 * cloud.scale, 0, Math.PI * 2);
        c.fill();
      });

      // 4. Distant City Skyline back scroller
      c.save();
      c.globalAlpha = phase >= 0.7 || phase < 0.15 ? 0.25 : 0.4;
      c.fillStyle = phase >= 0.5 ? '#1E1B4B' : '#0F766E'; // Twilight indigo or forest green
      
      const cityTileW = 50;
      for (let i = 0; i < (CANVAS_WIDTH / cityTileW) + 2; i++) {
        // Fixed buildings height profile
        const h1 = 90 + Math.sin(i * 1.5) * 20;
        const h2 = 140 + Math.cos(i * 0.9) * 40;
        const xPos = i * cityTileW - (citiesScrollX.current);

        c.fillRect(xPos, GROUND_Y - h1, cityTileW - 2, h1);
        c.fillRect(xPos + cityTileW/2, GROUND_Y - h2, 18, h2);
      }
      c.restore();

      // 5. Drawing Pipes
      pipesRef.current.forEach((pipe) => {
        const pipeW = 64;
        const activePulse = Math.max(0, pipe.pulseTime);
        const rimOffset = activePulse > 0 ? Math.sin(activePulse / 2) * 5 : 0;
        pipe.pulseTime -= dt;

        c.save();
        // Modern Retro pipe drawing style (gradients + highlights)
        
        // --- TOP PIPE ---
        let topGrd = c.createLinearGradient(pipe.x - rimOffset, 0, pipe.x + pipeW + rimOffset, 0);
        topGrd.addColorStop(0, '#047857'); // Dark green
        topGrd.addColorStop(0.2, '#10b981'); // Bright emerald highlights
        topGrd.addColorStop(0.5, '#34d399'); // Neon center
        topGrd.addColorStop(0.8, '#059669');
        topGrd.addColorStop(1, '#064e3b'); // Deep shadow corner
        
        c.fillStyle = topGrd;
        c.strokeStyle = '#022c22';
        c.lineWidth = 3.5;

        // Pipe stem
        c.beginPath();
        c.rect(pipe.x, -5, pipeW, pipe.topHeight);
        c.fill();
        c.stroke();

        // Overlap Cap rim (slightly wider than stem)
        const capH = 24;
        const capX = pipe.x - 4 - rimOffset;
        const capY = pipe.topHeight - capH;
        c.beginPath();
        c.rect(capX, capY, pipeW + 8 + (rimOffset * 2), capH);
        c.fill();
        c.stroke();

        // Inner rim shadow pattern
        c.fillStyle = 'rgba(0, 0, 0, 0.15)';
        c.fillRect(capX + 1.5, capY + capH - 5, pipeW + 5 + (rimOffset * 2), 3);

        // --- BOTTOM PIPE ---
        let botGrd = c.createLinearGradient(pipe.x - rimOffset, 0, pipe.x + pipeW + rimOffset, 0);
        botGrd.addColorStop(0, '#047857');
        botGrd.addColorStop(0.2, '#10b981');
        botGrd.addColorStop(0.5, '#34d399');
        botGrd.addColorStop(0.8, '#059669');
        botGrd.addColorStop(1, '#064e3b');

        c.fillStyle = botGrd;

        // Bottom pipe stem
        c.beginPath();
        c.rect(pipe.x, pipe.bottomY, pipeW, GROUND_Y - pipe.bottomY + 10);
        c.fill();
        c.stroke();

        // Bottom Cap rim
        const bCapY = pipe.bottomY;
        c.beginPath();
        c.rect(capX, bCapY, pipeW + 8 + (rimOffset * 2), capH);
        c.fill();
        c.stroke();

        // Inner rim highlighted bevel lines
        c.fillStyle = 'rgba(255, 255, 255, 0.2)';
        c.fillRect(capX + 3, bCapY + 2.5, 3, capH - 5);

        c.restore();
      });

      // 6. Draw Score Popups
      popupsRef.current.forEach((pop) => {
        c.save();
        c.globalAlpha = pop.alpha;
        c.fillStyle = lastScoreColorRef.current;
        c.font = 'bold 18px font-mono, sans-serif';
        c.textAlign = 'center';
        c.shadowColor = '#000000';
        c.shadowBlur = 4;
        c.fillText(pop.text, pop.x, pop.y);
        c.restore();
      });

      // 7. Draw Active Particles
      particlesRef.current.forEach((p) => {
        c.save();
        c.globalAlpha = Math.max(0, p.alpha);
        c.translate(p.x, p.y);
        c.rotate(p.rotation);

        c.fillStyle = p.color;

        if (p.type === 'feather') {
          // Feather soft vector shapes
          c.beginPath();
          c.ellipse(0, 0, p.size * 2.2, p.size * 0.9, 0, 0, Math.PI * 2);
          c.fill();
          
          // Feather vane line
          c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          c.lineWidth = 1.0;
          c.beginPath();
          c.moveTo(-p.size * 1.5, 0);
          c.lineTo(p.size * 1.5, 0);
          c.stroke();
        } else if (p.type === 'sparkle') {
          // Sparkle four-point star polygon
          c.shadowColor = p.color;
          c.shadowBlur = 35;
          c.beginPath();
          c.moveTo(0, -p.size);
          c.lineTo(p.size * 0.3, -p.size * 0.3);
          c.lineTo(p.size, 0);
          c.lineTo(p.size * 0.3, p.size * 0.3);
          c.lineTo(0, p.size);
          c.lineTo(-p.size * 0.3, p.size * 0.3);
          c.lineTo(-p.size, 0);
          c.lineTo(-p.size * 0.3, -p.size * 0.3);
          c.closePath();
          c.fill();
        } else {
          // Standard dust particles circular dots
          c.beginPath();
          c.arc(0, 0, p.size, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      });

      // 8. THE FLAPPY BIRD DRAWING
      const bird = birdRef.current;
      c.save();
      c.translate(120, bird.y);
      c.rotate(bird.rotation);

      // Shadow overlay
      c.shadowColor = 'rgba(0, 0, 0, 0.35)';
      c.shadowBlur = 6;
      c.shadowOffsetY = 4;

      // --- BIRD BODY (Ellipse with custom boundary) ---
      c.fillStyle = birdColorRef.current;
      c.strokeStyle = '#111827';
      c.lineWidth = 3.5;
      
      c.beginPath();
      c.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Reset shadows for details
      c.shadowColor = 'transparent';
      c.shadowBlur = 0;
      c.shadowOffsetY = 0;

      // Soft bright white belly highlights
      c.fillStyle = 'rgba(255, 255, 255, 0.7)';
      c.beginPath();
      c.ellipse(-4, 3, 11, 7, 0, 0, Math.PI * 2);
      c.fill();

      // --- BIRD BIG CARTOON EYE ---
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.arc(8, -4, 5.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Pupil black dot
      c.fillStyle = '#0F172A';
      c.beginPath();
      c.arc(9.5, -4, 2.2, 0, Math.PI * 2);
      c.fill();

      // White shine tip
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.arc(8.5, -5, 0.7, 0, Math.PI * 2);
      c.fill();

      // --- ORANGE BEAK ---
      c.fillStyle = '#f97316'; // Vibrant orange
      c.lineWidth = 2.8;
      
      c.beginPath();
      c.moveTo(15, -1);
      c.quadraticCurveTo(24, 0, 23, 3);
      c.quadraticCurveTo(15, 6, 14, 3);
      c.closePath();
      c.fill();
      c.stroke();

      // --- WING (Flapping animation) ---
      // Map wing oscillating angle based on flight states
      const wingSweep = Math.sin(bird.wingAngle) * 8.5;
      
      c.save();
      c.translate(-9, 1);
      c.rotate(wingSweep * Math.PI / 180);
      c.fillStyle = '#FFFFFF';
      c.strokeStyle = '#111827';
      c.lineWidth = 3.0;

      c.beginPath();
      c.ellipse(0, 0, 8.5, 6.5, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Wing decorative lines
      c.strokeStyle = '#cbd5e1';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-3, 0);
      c.lineTo(3, 0);
      c.stroke();
      c.restore();

      c.restore();

      // 9. GROUND LAYER FRONT PANEL
      c.save();
      
      let grdy = c.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      grdy.addColorStop(0, '#7c2d12'); // Rich deep soil brown
      grdy.addColorStop(1, '#431407');

      c.fillStyle = grdy;
      c.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);

      // Scrolling Grass Stripe edge (synchronized seamlessly)
      c.fillStyle = '#22c55e'; // Emerald grass
      c.fillRect(0, GROUND_Y, CANVAS_WIDTH, 14);

      // Light Green detailing highlight rows
      c.fillStyle = '#4ade80';
      const detailStepX = 14;
      const grassOffset = groundScrollX.current;
      for (let i = -1; i < (CANVAS_WIDTH / detailStepX) + 2; i++) {
        c.beginPath();
        c.moveTo(i * detailStepX - grassOffset, GROUND_Y + 14);
        c.lineTo(i * detailStepX - grassOffset + 7, GROUND_Y + 14 + 6);
        c.lineTo(i * detailStepX - grassOffset + detailStepX, GROUND_Y + 14);
        c.fill();
      }

      // Ground decorative textured rocks
      c.fillStyle = '#9a3412';
      for (let i = 0; i < 6; i++) {
        // static patterns based on grid indexes
        const rx = (i * 90 + 35) % CANVAS_WIDTH;
        c.fillRect(rx, GROUND_Y + 35 + (i % 2) * 20, 10, 4);
        c.fillRect(rx + 15, GROUND_Y + 50 - (i % 2) * 5, 5, 2.8);
      }

      // Border separation line
      c.strokeStyle = '#1e0802';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, GROUND_Y);
      c.lineTo(CANVAS_WIDTH, GROUND_Y);
      c.stroke();

      c.restore();
    };

    // Interpolate hex colors helper (e.g. #FFF000 to #AABBCC)
    const interpolateColor = (color1: string, color2: string, factor: number): string => {
      const parseHex = (hex: string) => {
        let clean = hex.replace('#', '');
        if (clean.length === 3) {
          clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
        }
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return { r, g, b };
      };

      const c1 = parseHex(color1);
      const c2 = parseHex(color2);

      const r = Math.round(c1.r + factor * (c2.r - c1.r));
      const g = Math.round(c1.g + factor * (c2.g - c1.g));
      const b = Math.round(c1.b + factor * (c2.b - c1.b));

      return `rgb(${r}, ${g}, ${b})`;
    };

    // Run first frame
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden rounded-2xl select-none">
      {/* Dynamic Background Watermark hints if idle */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none z-10" />
      )}

      {/* HTML5 Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full max-h-full block object-contain select-none"
        style={{ aspectRatio: '3/4' }}
      />
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;
