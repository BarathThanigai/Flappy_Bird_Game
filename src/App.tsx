import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Play, AlertCircle, Sparkles, Sliders, Shield, Award, Cpu, User, Clock, Terminal, Activity } from 'lucide-react';

import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import ScoreBoard from './components/ScoreBoard';
import SettingsPanel from './components/SettingsPanel';
import AchievementsPanel from './components/AchievementsPanel';

import { GameState, DifficultyMode, GameSettings, Achievement, MedalType } from './types';
import { audioManager } from './utils/audio';
import { loadAchievements, checkAchievements, saveAchievements } from './utils/achievements';

export default function App() {
  const canvasRef = useRef<GameCanvasHandle | null>(null);

  // --- PERSISTED GAME STATES ---
  const [highScore, setHighScore] = useState<number>(0);
  const [totalFlaps, setTotalFlaps] = useState<number>(0);
  const [cumulativeDistance, setCumulativeDistance] = useState<number>(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [attempts, setAttempts] = useState<number>(1);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mute: false,
    difficulty: 'MEDIUM',
    birdColor: '#FFD700' // Gold Sunny Yellow!
  });

  // --- LIVE ENGINE STATES ---
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [earnedMedal, setEarnedMedal] = useState<MedalType>('NONE');

  // --- ACTIVE PANEL NAVIGATION ---
  // Tells overlay overlays which active configuration panels to show
  const [activePanel, setActivePanel] = useState<'NONE' | 'SETTINGS' | 'ACHIEVEMENTS'>('NONE');

  // --- ACHIEVEMENT POPUP ALERTS ---
  const [unlockedAlert, setUnlockedAlert] = useState<string | null>(null);

  // Initialize and load saved values
  useEffect(() => {
    // Audio configuration load
    audioManager.initialize();
    
    // Loaded configs from Local Storage
    const savedHighScore = localStorage.getItem('flappy_react_high_score');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

    const savedFlaps = localStorage.getItem('flappy_react_total_flaps');
    if (savedFlaps) setTotalFlaps(parseInt(savedFlaps, 10));

    const savedDistance = localStorage.getItem('flappy_react_cumulative_distance');
    if (savedDistance) setCumulativeDistance(parseInt(savedDistance, 10));

    const savedAttempts = localStorage.getItem('flappy_react_attempts');
    if (savedAttempts) setAttempts(parseInt(savedAttempts, 10));

    // Settings schema load with safe default fallbacks
    const savedMute = localStorage.getItem('flappy_react_mute') === 'true';
    const savedDiff = (localStorage.getItem('flappy_react_difficulty') || 'MEDIUM') as DifficultyMode;
    const savedColor = localStorage.getItem('flappy_react_bird_color') || '#FFD700';

    setSettings({
      mute: savedMute,
      difficulty: savedDiff,
      birdColor: savedColor
    });

    audioManager.setMute(savedMute);

    // Achievements load
    const list = loadAchievements();
    setAchievements(list);
  }, []);

  // Timer run loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format session timer string
  const formatSessionTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Sync settings mutations helper
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    audioManager.setMute(newSettings.mute);
    localStorage.setItem('flappy_react_mute', newSettings.mute ? 'true' : 'false');
    localStorage.setItem('flappy_react_difficulty', newSettings.difficulty);
    localStorage.setItem('flappy_react_bird_color', newSettings.birdColor);
  };

  // Medal determination logic
  const determineMedal = (score: number): MedalType => {
    if (score >= 50) return 'PLATINUM';
    if (score >= 30) return 'GOLD';
    if (score >= 15) return 'SILVER';
    if (score >= 5) return 'BRONZE';
    return 'NONE';
  };

  // Score ticker increases
  const handleScoreIncrease = (newScore: number, addedDistance: number) => {
    setCurrentScore(newScore);

    // Dynamic Live High Score updates
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('flappy_react_high_score', newScore.toString());
      if (!isNewBest) {
        setIsNewBest(true);
      }
    }

    // Cumulative stats
    const totalDist = cumulativeDistance + addedDistance;
    setCumulativeDistance(totalDist);
    localStorage.setItem('flappy_react_cumulative_distance', totalDist.toString());

    // Evaluate live achievements
    verifyAchievements(newScore, totalFlaps, totalDist);
  };

  const handleNewFlap = () => {
    const updatedFlaps = totalFlaps + 1;
    setTotalFlaps(updatedFlaps);
    localStorage.setItem('flappy_react_total_flaps', updatedFlaps.toString());

    // Evaluate flaps milestone
    verifyAchievements(currentScore, updatedFlaps, cumulativeDistance);
  };

  // Run achievement verification
  const verifyAchievements = (score: number, flapsCount: number, distanceCount: number) => {
    const checkTargetScore = Math.max(score, highScore);
    const { updatedList, newlyUnlockedTitle } = checkAchievements(achievements, {
      maxScore: checkTargetScore,
      currentFlaps: flapsCount,
      totalDistance: distanceCount
    });

    if (newlyUnlockedTitle) {
      setAchievements(updatedList);
      // Show slide-in achievement banner
      setUnlockedAlert(newlyUnlockedTitle);
    }
  };

  // Clear banner alert after a delay
  useEffect(() => {
    if (unlockedAlert) {
      const timer = setTimeout(() => {
        setUnlockedAlert(null);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [unlockedAlert]);

  // Game over state triggers
  const handleGameOver = (finalScore: number) => {
    setGameState('GAMEOVER');
    setIsNewBest(finalScore > 0 && finalScore >= highScore);
    setEarnedMedal(determineMedal(finalScore));

    // Save final cumulative session data
    verifyAchievements(finalScore, totalFlaps, cumulativeDistance);
  };

  // --- GAME ACTIONS ---
  const startGame = () => {
    setCurrentScore(0);
    setIsNewBest(false);
    setEarnedMedal('NONE');
    setGameState('PLAYING');
    setActivePanel('NONE');
    
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    localStorage.setItem('flappy_react_attempts', nextAttempts.toString());

    canvasRef.current?.resetGame();
  };

  const togglePause = () => {
    if (gameState !== 'PLAYING') return;
    setGameState('PAUSED');
  };

  const resumeGame = () => {
    if (gameState !== 'PAUSED') return;
    setGameState('PLAYING');
  };

  // Left click / Space / Up Arrow input handling
  const handleInteractiveInput = (e: React.MouseEvent | React.TouchEvent) => {
    // If clicking configurations sliders or buttons inside overlays, ignore flap
    if (activePanel !== 'NONE' || gameState === 'PAUSED') return;

    if (gameState === 'IDLE') {
      startGame();
    } else if (gameState === 'PLAYING') {
      // Trigger canvas flap
      canvasRef.current?.triggerFlap();
    } else if (gameState === 'GAMEOVER') {
      startGame();
    }
  };

  // Manage Keyboard interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Standard inputs
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // lock viewport scrolling behavior

        if (activePanel !== 'NONE') return;

        if (gameState === 'IDLE') {
          startGame();
        } else if (gameState === 'PLAYING') {
          canvasRef.current?.triggerFlap();
        } else if (gameState === 'PAUSED') {
          resumeGame();
        } else if (gameState === 'GAMEOVER') {
          startGame();
        }
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          togglePause();
        } else if (gameState === 'PAUSED') {
          resumeGame();
        }
      }

      if (e.code === 'KeyR') {
        if (gameState === 'PLAYING' || gameState === 'GAMEOVER' || gameState === 'PAUSED') {
          e.preventDefault();
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activePanel]);

  // Compute live speed metrics to feed the Elegant Dark aside-panel
  const getLiveSpeedMetric = () => {
    let baseSpeed = 2.4;
    if (settings.difficulty === 'EASY') baseSpeed = 2.1;
    if (settings.difficulty === 'HARD') baseSpeed = 3.0;

    const speedMultiplier = 1.0 + Math.min(currentScore * 0.015, 0.25);
    return (baseSpeed * speedMultiplier).toFixed(2);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col justify-between overflow-hidden select-none">
      
      {/* 1. Header / Navigation Bar */}
      <nav className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.4)]">F</div>
          <h1 className="text-xl font-bold tracking-tight text-white select-none">
            FLAPPY<span className="text-orange-500 underline underline-offset-4 decoration-2">REACT</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="hidden sm:inline text-slate-400">STABLE BUILD <span className="text-orange-500 font-semibold">v1.2.4</span></span>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (gameState === 'IDLE') {
                  setActivePanel(prev => prev === 'SETTINGS' ? 'NONE' : 'SETTINGS');
                }
              }}
              disabled={gameState !== 'IDLE'}
              className={`px-3 py-1 text-xs bg-slate-800/80 rounded hover:bg-slate-700 active:bg-slate-900 transition-all font-medium border border-slate-700/30 ${gameState !== 'IDLE' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Config
            </button>
            <button
              onClick={() => {
                if (gameState === 'IDLE') startGame();
              }}
              disabled={gameState !== 'IDLE'}
              className={`px-3 py-1 text-xs bg-orange-500 text-slate-950 rounded font-bold hover:bg-orange-400 transition-all ${gameState !== 'IDLE' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Play Now
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Main Game Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* LEFT PANEL: Stats & Badges (Visible on medium screens and up) */}
        <aside className="w-72 border-r border-slate-800 p-6 hidden lg:flex flex-col gap-6 overflow-y-auto bg-slate-950/20 select-none">
          
          {/* Diagnostic Leaderboard */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Ranking</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">1. pixel_master</span>
                <span className="text-orange-400 font-mono font-semibold">95 pts</span>
              </div>
              <div className="flex justify-between items-center text-xs p-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-200">
                <span className="font-medium">2. you (local best)</span>
                <span className="text-orange-400 font-mono font-extrabold">{highScore} pts</span>
              </div>
              <div className="flex justify-between items-center text-xs opacity-50">
                <span className="text-slate-400">3. dev_null</span>
                <span className="text-orange-400 font-mono font-semibold">12 pts</span>
              </div>
            </div>
          </div>

          {/* Real-time Badge status */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Badges & Medals</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Bronze */}
              <div className={`aspect-square bg-slate-900/40 rounded-xl flex flex-col items-center justify-center border transition-all ${highScore >= 5 ? 'border-amber-500' : 'border-slate-800/80 grayscale opacity-40'}`}>
                <div className="w-8 h-8 rounded-full mb-1 border-2 bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500 flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Bronze</span>
              </div>

              {/* Silver */}
              <div className={`aspect-square bg-slate-900/40 rounded-xl flex flex-col items-center justify-center border transition-all ${highScore >= 15 ? 'border-slate-300' : 'border-slate-800/80 grayscale opacity-40'}`}>
                <div className="w-8 h-8 rounded-full mb-1 border-2 bg-gradient-to-br from-slate-300 to-slate-400 border-slate-200 flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Silver</span>
              </div>

              {/* Gold */}
              <div className={`aspect-square bg-slate-900/40 rounded-xl flex flex-col items-center justify-center border transition-all ${highScore >= 30 ? 'border-yellow-400' : 'border-slate-800/80 grayscale opacity-40'}`}>
                <div className="w-8 h-8 rounded-full mb-1 border-2 bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 flex items-center justify-center shadow-lg animate-pulse">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Gold</span>
              </div>

              {/* Platinum */}
              <div className={`aspect-square bg-slate-900/40 rounded-xl flex flex-col items-center justify-center border transition-all ${highScore >= 50 ? 'border-cyan-300' : 'border-slate-800/80 grayscale opacity-40'}`}>
                <div className="w-8 h-8 rounded-full mb-1 border-2 bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 border-cyan-300 flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Platinum</span>
              </div>
            </div>
          </div>

          {/* Player online count */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              4,281 Pilots Playing
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT: Active Play Viewport */}
        <main className="flex-1 bg-black/95 relative flex items-center justify-center p-4">
          
          {/* Main Arcade Frame */}
          <div className="relative w-full max-w-[480px] h-[600px] border-4 border-slate-900 rounded-2xl shadow-2xl overflow-hidden bg-slate-950 flex flex-col">
            
            {/* Top Gloss Flare */}
            <div className="absolute inset-x-0 top-0 h-4 bg-white/5 pointer-events-none rounded-t-xl z-20" />

            {/* Tap/click interaction backing */}
            <div
              id="viewport_trigger"
              onClick={handleInteractiveInput}
              onTouchStart={(e) => {
                e.preventDefault();
                handleInteractiveInput(e);
              }}
              className="absolute inset-0 cursor-crosshair active:cursor-grabbing w-full h-full z-0 overflow-hidden"
            >
              <GameCanvas
                ref={canvasRef}
                gameState={gameState}
                difficulty={settings.difficulty}
                birdColor={settings.birdColor}
                isPaused={gameState === 'PAUSED'}
                onIncrementScore={handleScoreIncrease}
                onGameOver={handleGameOver}
                onNewFlap={handleNewFlap}
              />
            </div>

            {/* Overlays Layered */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
              
              {/* Score HUD (Visible on playing) */}
              {gameState === 'PLAYING' && (
                <ScoreBoard
                  score={currentScore}
                  highScore={highScore}
                  isPaused={false}
                  isMuted={settings.mute}
                  onTogglePause={togglePause}
                  onToggleMute={() => handleUpdateSettings({ ...settings, mute: !settings.mute })}
                />
              )}

              {/* Pause modal */}
              {gameState === 'PAUSED' && (
                <div className="absolute inset-0 bg-slate-950/70 p-6 flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm z-40">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full text-center shadow-2xl relative select-none">
                    <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Play className="w-6 h-6 text-yellow-400 translate-x-[1px]" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">FLIGHT PAUSED</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Ready to resume flight path? Progress is held in safety.
                    </p>
                    <button
                      id="btn_resume_flight"
                      onClick={resumeGame}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-95 transition-all rounded-xl text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      RESUME PILOT
                    </button>
                  </div>
                </div>
              )}

              {/* Lobby menu screen */}
              {gameState === 'IDLE' && activePanel === 'NONE' && (
                <div className="w-full h-full pointer-events-auto z-25">
                  <StartScreen
                    highScore={highScore}
                    birdColor={settings.birdColor}
                    onStartGame={startGame}
                    onOpenSettings={() => setActivePanel('SETTINGS')}
                    onOpenAchievements={() => setActivePanel('ACHIEVEMENTS')}
                  />
                </div>
              )}

              {/* Active navigation sliders */}
              {gameState === 'IDLE' && activePanel !== 'NONE' && (
                <div className="w-full h-full pointer-events-auto flex items-center justify-center px-4 bg-slate-950/50 backdrop-blur-sm z-30">
                  {activePanel === 'SETTINGS' && (
                    <SettingsPanel
                      settings={settings}
                      onChangeSettings={handleUpdateSettings}
                      onClose={() => setActivePanel('NONE')}
                    />
                  )}
                  {activePanel === 'ACHIEVEMENTS' && (
                    <AchievementsPanel
                      achievements={achievements}
                      onClose={() => setActivePanel('NONE')}
                    />
                  )}
                </div>
              )}

              {/* Game Over Screen */}
              {gameState === 'GAMEOVER' && (
                <div className="w-full h-full pointer-events-auto z-20 flex items-center justify-center">
                  <GameOverScreen
                    score={currentScore}
                    highScore={highScore}
                    isNewBest={isNewBest}
                    medal={earnedMedal}
                    onRestart={startGame}
                    onHome={() => setGameState('IDLE')}
                  />
                </div>
              )}

            </div>

            {/* Standard in-flight alert banners */}
            <AnimatePresence>
              {unlockedAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -45 }}
                  animate={{ opacity: 1, y: 15 }}
                  exit={{ opacity: 0, y: -45 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute top-4 left-4 right-4 mx-auto max-w-[340px] bg-slate-900/95 border-2 border-yellow-500 rounded-xl p-3 shadow-[0_8px_24px_rgba(234,179,8,0.25)] flex items-center gap-3 backdrop-blur-md z-50 pointer-events-none select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 animate-bounce">
                    <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-[10px] font-mono text-yellow-500 font-extrabold uppercase tracking-widest leading-none">
                      ACHIEVEMENT UNLOCKED!
                    </div>
                    <div className="text-xs font-bold text-white truncate leading-tight mt-1">
                      {unlockedAlert}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Floating UI Badges in the Main view */}
          <div className="absolute top-10 right-10 flex gap-4 pointer-events-none">
            <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">FPS</span>
              <span className="text-xs font-mono text-emerald-400 font-extrabold">60.0</span>
            </div>
            <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Vol</span>
              <div className="flex gap-0.5 items-end h-2.5">
                <div className={`w-0.5 h-2 ${settings.mute ? 'bg-slate-700' : 'bg-orange-500'}`} />
                <div className={`w-0.5 h-3 ${settings.mute ? 'bg-slate-700' : 'bg-orange-500'}`} />
                <div className={`w-0.5 h-1.5 ${settings.mute ? 'bg-slate-700' : 'bg-orange-500'}`} />
              </div>
            </div>
          </div>

        </main>

        {/* RIGHT PANEL: Dev Details & Logs (Visible on large screens) */}
        <aside className="w-64 border-l border-slate-800 flex flex-col bg-slate-950/20 xl:flex hidden select-none">
          
          <div className="p-4 border-b border-slate-800/85">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engine Metrics</p>
            </div>
            
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between items-center bg-slate-950/35 p-1 rounded">
                <span className="text-slate-500 text-[10px]">GRAVITY</span>
                <span className="text-slate-300 font-medium">{gameState === 'GAMEOVER' ? '0.42' : '0.36'} px/f²</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/35 p-1 rounded">
                <span className="text-slate-500 text-[10px]">FLAP_IMPULSE</span>
                <span className="text-slate-300 font-medium">-6.80 px/f</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/35 p-1 rounded">
                <span className="text-slate-500 text-[10px]">PIPE_SPEED</span>
                <span className="text-orange-400 font-extrabold">{getLiveSpeedMetric()} px/f</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/35 p-1 rounded">
                <span className="text-slate-500 text-[10px]">AIR_CLEARANCE</span>
                <span className="text-sky-300 font-semibold">{settings.difficulty === 'EASY' ? '155px' : settings.difficulty === 'HARD' ? '118px' : '135px'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Controls</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-slate-800 border-b-2 border-slate-700 rounded text-[9px] font-bold font-mono">SPACE</kbd>
                  <span className="text-xs text-slate-400">Flap Wing</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-slate-800 border-b-2 border-slate-700 rounded text-[9px] font-bold font-mono text-center w-9">UP_ARR</kbd>
                  <span className="text-xs text-slate-400">Flap Wing</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-slate-800 border-b-2 border-slate-700 rounded text-[9px] font-bold font-mono text-center w-9">ESC_P</kbd>
                  <span className="text-xs text-slate-400">Pause Flight</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-slate-800 border-b-2 border-slate-700 rounded text-[9px] font-bold font-mono text-center w-9">KEY_R</kbd>
                  <span className="text-xs text-slate-400">Instant Reset</span>
                </div>
              </div>
            </div>

            {/* Informational box */}
            <div className="mt-8">
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-orange-400 uppercase mb-1 italic">New Patch</p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Refined collision buffers on pipe corners. Audio channels adjusted gracefully.
                </p>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* 3. Footer Status Bar */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500 flex-shrink-0">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Session: {formatSessionTime(sessionSeconds)}
          </span>
          <span className="font-mono">Attempts: {attempts}</span>
          <span className="hidden sm:inline font-mono text-slate-500">Cumulative Flying: {cumulativeDistance.toFixed(0)}m</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> GPU Acceleration: On</span>
          <span>React v19.0.1</span>
        </div>
      </footer>

    </div>
  );
}

