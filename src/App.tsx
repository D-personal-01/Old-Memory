import { useState, useEffect } from 'react';
import { GameMode, Difficulty, Category, GameState, GameStats } from './types';
import { TuxCanvas } from './components/TuxCanvas';
import { GameHUD } from './components/GameHUD';
import { SoundEffects } from './components/SoundEffects';
import { 
  Keyboard, Trophy, Play, Settings, Award, RefreshCw, 
  ChevronRight, Volume2, VolumeX, Activity, ArrowLeft,
  BookOpen, Star, Sparkles, HelpCircle, Flame, Zap
} from 'lucide-react';

export default function App() {
  // Game Configuration State
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode>('letter');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [category, setCategory] = useState<Category>('space');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Active Gameplay HUD state (mirrored from canvas to prevent stale renders)
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);
  const maxLives = 5;

  // Persistence
  const [highScore, setHighScore] = useState(0);
  const [statsHistory, setStatsHistory] = useState<GameStats | null>(null);

  // Decorative snow state for start screen
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; delay: string; duration: string; size: string }[]>([]);

  useEffect(() => {
    // Load highscore
    const savedHighScore = localStorage.getItem('tux_high_score');
    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }

    // Initialize decorative snowflakes
    const flakes = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${6 + Math.random() * 8}s`,
      size: `${4 + Math.random() * 8}px`
    }));
    setSnowflakes(flakes);

    // Initialize sound mute preferences
    const savedMute = localStorage.getItem('tux_muted');
    if (savedMute !== null) {
      const isMutedVal = savedMute === 'true';
      setIsMuted(isMutedVal);
      SoundEffects.setMuted(isMutedVal);
    }
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setLevel(1);
    setLives(maxLives);
    setIsPaused(false);
    setGameState('playing');
    
    // Play warm startup beep
    SoundEffects.playKeystroke();
  };

  const handleUpdateStats = (newScore: number, newLevel: number, newLives: number) => {
    setScore(newScore);
    setLevel(newLevel);
    setLives(newLives);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('tux_high_score', String(newScore));
    }
  };

  const handleGameOver = (finalStats: GameStats) => {
    setStatsHistory(finalStats);
    setGameState('gameover');

    if (finalStats.score > highScore) {
      setHighScore(finalStats.score);
      localStorage.setItem('tux_high_score', String(finalStats.score));
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    SoundEffects.setMuted(nextMute);
    localStorage.setItem('tux_muted', String(nextMute));
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    SoundEffects.playKeystroke();
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleQuitToMenu = () => {
    setGameState('menu');
    setScore(0);
    setIsPaused(false);
    SoundEffects.playKeystroke();
  };

  // Helper: custom responsive SVG chart for game-over timeline
  const renderSVGChart = (timeline: { time: number; wpm: number; accuracy: number }[]) => {
    if (!timeline || timeline.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 25;

    const maxWpm = Math.max(...timeline.map(t => t.wpm), 40);
    const maxTime = Math.max(...timeline.map(t => t.time), 10);

    const getX = (t: number) => padding + (t / maxTime) * (width - padding * 2);
    const getY = (w: number) => height - padding - (w / maxWpm) * (height - padding * 2);

    const points = timeline.map(t => `${getX(t.time)},${getY(t.wpm)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-400">
        {/* Background Grids */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth={1} />
        
        {/* Mid gridlines */}
        <line x1={padding} y1={getY(maxWpm / 2)} x2={width - padding} y2={getY(maxWpm / 2)} stroke="#1e293b" strokeDasharray="4 4" />
        <line x1={padding} y1={getY(maxWpm)} x2={width - padding} y2={getY(maxWpm)} stroke="#1e293b" strokeDasharray="4 4" />

        {/* Labels */}
        <text x={padding - 5} y={getY(maxWpm) + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-500">{maxWpm}</text>
        <text x={padding - 5} y={getY(maxWpm / 2) + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-500">{Math.round(maxWpm / 2)}</text>
        <text x={padding - 5} y={getY(0) + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-500">0</text>
        
        <text x={width - padding} y={height - padding + 15} textAnchor="end" className="text-[10px] font-mono fill-slate-500">{maxTime}s</text>
        <text x={padding} y={height - padding + 15} textAnchor="start" className="text-[10px] font-mono fill-slate-500">0s</text>

        {/* Glow Filter for lasers */}
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Plot path */}
        <polyline
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
          points={points}
          filter="url(#neon-glow)"
        />

        {/* Plot points */}
        {timeline.map((t, idx) => (
          <circle
            key={idx}
            cx={getX(t.time)}
            cy={getY(t.wpm)}
            r="4"
            className="fill-white stroke-cyan-500 stroke-2"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* 1. START MENU STATE */}
      {gameState === 'menu' && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative z-10 max-w-5xl mx-auto w-full">
          
          {/* Falling decorative snow */}
          {snowflakes.map(flake => (
            <div
              key={flake.id}
              className="snowflake"
              style={{
                left: flake.left,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
                fontSize: flake.size,
              }}
            >
              ❄
            </div>
          ))}

          {/* Core Game Branding Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-20 blur-xl bg-cyan-500 w-72 h-20 rounded-full animate-pulse" />
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono rounded-full mb-3 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-spin duration-3000" />
              Educational Arcade Remake
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-2 font-sans select-none drop-shadow-[0_4px_12px_rgba(34,211,238,0.3)]">
              TUX <span className="text-cyan-400">TYPING</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto font-medium">
              Protect your dome cities from descending comets or feed Tux delicious fish in this high-speed, sensory-rich typing trainer.
            </p>
          </div>

          {/* Interactive Control Deck Panel */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-900/55 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                        {/* Left: Settings Panel (Columns 1-7) */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Option 1: Difficulty Selection */}
              <div>
                <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  Difficulty Level
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(levelName => (
                    <button
                      key={levelName}
                      onClick={() => { setDifficulty(levelName); SoundEffects.playKeystroke(); }}
                      className={`py-2 px-4 rounded-xl border text-sm font-semibold uppercase tracking-wider transition-all ${
                        difficulty === levelName
                          ? levelName === 'easy' 
                            ? 'bg-green-500/15 border-green-500 text-green-400 font-bold'
                            : levelName === 'medium'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400 font-bold'
                            : 'bg-red-500/15 border-red-500 text-red-400 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      id={`btn-difficulty-${levelName}`}
                    >
                      {levelName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Word Categories */}
              <div className="transition-all duration-300 opacity-100 scale-100">
                <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Vocabulary Bank
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['space', 'technology', 'programming', 'animals', 'fruits_colors', 'easy_words'] as Category[]).map(catKey => {
                    const label = catKey.replace('_', ' ');
                    return (
                      <button
                        key={catKey}
                        onClick={() => { setCategory(catKey); SoundEffects.playKeystroke(); }}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                          category === catKey
                            ? 'bg-indigo-500/20 border-indigo-400 text-white font-bold'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                        id={`btn-category-${catKey}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right: Quick Launch & High Scores (Columns 8-12) */}
            <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
              
              {/* High Score Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-yellow-500/10 scale-150">
                  <Trophy className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Personal Record</span>
                </div>
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-white">{highScore} pts</div>
                  <p className="text-xs text-slate-500 mt-0.5">Defend cities or catch fish to increase your ranking!</p>
                </div>
              </div>

              {/* Game Info/Instructions */}
              <div className="my-5 flex flex-col gap-2.5 text-xs text-slate-400 bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-xl font-mono">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold uppercase mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Typing Rules:
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">1.</span>
                  <span>Type letters/words as they descend to trigger Tux lasers or slides.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">2.</span>
                  <span>Completing an obstacle awards points.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">3.</span>
                  <span>Missing 5 comets or fish ends the campaign.</span>
                </div>
              </div>

              {/* Launcher buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMuted 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  id="btn-menu-mute"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleStartGame}
                  className="flex-1 py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base tracking-wide shadow-lg hover:shadow-cyan-500/15 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  id="btn-start-launch"
                >
                  <Play className="w-5 h-5 fill-slate-950 group-hover:scale-110 transition-transform" />
                  LAUNCH GAME
                  <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </div>

          {/* Humble design credit footer */}
          <div className="text-center mt-10 text-[11px] font-mono text-slate-600 tracking-wider">
            Tux Typing browser remake • Powered by Web Audio API & Canvas
          </div>
        </div>
      )}

      {/* 2. PLAYING CAMPAIGN STATE */}
      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col gap-4 p-4 md:p-6 max-w-6xl w-full mx-auto justify-center">
          
          {/* Main Gameplay HUD bar */}
          <GameHUD
            score={score}
            highScore={highScore}
            level={level}
            lives={lives}
            maxLives={maxLives}
            mode={mode}
            difficulty={difficulty}
            category={category}
            isPaused={isPaused}
            onTogglePause={togglePause}
            onRestart={handleRestart}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />

          {/* Interactive Game Stage */}
          <div className="flex-1 min-h-[450px] md:min-h-[550px] relative">
            <TuxCanvas
              mode={mode}
              difficulty={difficulty}
              category={category}
              isPaused={isPaused}
              score={score}
              lives={lives}
              level={level}
              onUpdateStats={handleUpdateStats}
              onGameOver={handleGameOver}
            />

            {/* Paused dim overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md rounded-2xl flex flex-col justify-center items-center z-50 p-6">
                <div className="text-center max-w-sm flex flex-col items-center gap-6 animate-fade-in">
                  <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Keyboard className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-wider font-mono">MISSION PAUSED</h2>
                    <p className="text-sm text-slate-400 mt-2">Take a breath, relax your fingers, and stretch your wrists!</p>
                  </div>

                  <div className="w-full flex flex-col gap-2">
                    <button
                      onClick={togglePause}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm cursor-pointer"
                      id="btn-pause-resume"
                    >
                      Resume Campaign
                    </button>
                    <button
                      onClick={handleRestart}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-all text-sm cursor-pointer"
                      id="btn-pause-restart"
                    >
                      Restart Session
                    </button>
                    <button
                      onClick={handleQuitToMenu}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900/40 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-all text-sm cursor-pointer"
                      id="btn-pause-quit"
                    >
                      Quit to Main Menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GAMEOVER SUMMARY & ANALYTICS STATE */}
      {gameState === 'gameover' && statsHistory && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-4xl mx-auto w-full relative z-10 animate-fade-in">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-full mb-3 uppercase tracking-wider">
              Mission Ended
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">GAME OVER</h1>
            <p className="text-slate-400 text-sm mt-1">Excellent typing practice! Let's look at your telemetry results:</p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            
            {/* Left Column: Primary Stats Cards (Columns 1-7) */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Highlight Stats Bento Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Score */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Final Score</span>
                  <div className="text-2xl font-bold text-white">{statsHistory.score} pts</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    High score: {statsHistory.highScore}
                  </div>
                </div>

                {/* Level */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Level Reached</span>
                  <div className="text-2xl font-bold text-yellow-400">LVL {statsHistory.level}</div>
                  <div className="text-[11px] text-slate-400 mt-1 capitalize">
                    {difficulty} Difficulty
                  </div>
                </div>

                {/* WPM */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Average WPM</span>
                  <div className="text-2xl font-bold text-cyan-400">
                    {statsHistory.gameDuration > 0 
                      ? Math.round((statsHistory.lettersTyped / 5) / (statsHistory.gameDuration / 60)) 
                      : 0} WPM
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Standard 5-char words</p>
                </div>

                {/* Accuracy */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Key Accuracy</span>
                  <div className="text-2xl font-bold text-green-400">
                    {statsHistory.correctKeystrokes + statsHistory.incorrectKeystrokes > 0
                      ? Math.round((statsHistory.correctKeystrokes / (statsHistory.correctKeystrokes + statsHistory.incorrectKeystrokes)) * 100)
                      : 100}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{statsHistory.correctKeystrokes} correct hits</p>
                </div>
              </div>

              {/* Chart: Speed & Accuracy timeline */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    WPM Speed Trend
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Based on 5s logging snapshots</span>
                </div>
                <div className="w-full h-44 bg-slate-950 rounded-xl border border-slate-900/60 p-2 flex items-center justify-center">
                  {statsHistory.timeline && statsHistory.timeline.length > 0 ? (
                    renderSVGChart(statsHistory.timeline)
                  ) : (
                    <span className="text-xs text-slate-600">Insufficient data timeline</span>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Key Diagnostic and Action Deck (Columns 8-12) */}
            <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
              
              {/* Keys to Practice */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">Keys to Practice</h3>
                </div>

                {Object.keys(statsHistory.missedKeys).length > 0 ? (
                  <div className="flex flex-col gap-2 bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You missed these keys during your gameplay campaign. Practice typing them slowly on your keyboard layout:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Object.entries(statsHistory.missedKeys) as [string, number][])
                        .sort((a, b) => b[1] - a[1]) // highest misses first
                        .slice(0, 8)
                        .map(([key, count]) => (
                          <div 
                            key={key} 
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-bold flex items-center gap-1.5"
                          >
                            <span className="font-mono bg-slate-900/80 px-1 py-0.5 rounded text-white border border-slate-800">{key}</span>
                            <span className="text-xs text-slate-500 font-mono">({count}x)</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl text-center flex flex-col items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <h4 className="font-bold text-sm text-green-400">Flawless Accuracy!</h4>
                    <p className="text-xs text-slate-500">You didn't make a single typing error during this campaign! Sensational fingers!</p>
                  </div>
                )}

                {/* Training Summary description */}
                <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl mt-2 text-xs text-slate-400 font-mono leading-relaxed flex flex-col gap-2">
                  <span className="font-bold text-slate-300">Campaign Summary:</span>
                  <div>• Words Destroyed: {statsHistory.wordsTyped}</div>
                  <div>• Letters Registered: {statsHistory.lettersTyped}</div>
                  <div>• Incorrect Keystrokes: {statsHistory.incorrectKeystrokes}</div>
                  <div>• Total Time: {statsHistory.gameDuration} seconds</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 mt-6">
                <button
                  onClick={handleRestart}
                  className="w-full py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-gameover-replay"
                >
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  REPLAY CAMPAIGN
                </button>

                <button
                  onClick={handleQuitToMenu}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition-all text-sm font-semibold cursor-pointer"
                  id="btn-gameover-quit"
                >
                  Return to Main Menu
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
