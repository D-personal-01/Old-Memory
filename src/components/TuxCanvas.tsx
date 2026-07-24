import React, { useEffect, useRef, useState } from 'react';
import { GameMode, Difficulty, Category, FallingItem, Particle, GameStats, ChartPoint } from '../types';
import { SoundEffects } from './SoundEffects';
import { getRandomWord, getRandomLetter, getRandomShortWord } from './WordList';
import { Shield, Sparkles, Zap, Flame } from 'lucide-react';

interface TuxCanvasProps {
  mode: GameMode;
  difficulty: Difficulty;
  category: Category;
  isPaused: boolean;
  score: number;
  lives: number;
  level: number;
  onUpdateStats: (score: number, level: number, lives: number) => void;
  onGameOver: (stats: GameStats) => void;
}

export const TuxCanvas: React.FC<TuxCanvasProps> = ({
  mode,
  difficulty,
  category,
  isPaused,
  score,
  lives,
  level,
  onUpdateStats,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Game State refs (to avoid closure issues in the requestAnimationFrame loop)
  const stateRef = useRef({
    score,
    lives,
    level,
    startTime: 0,
    maxLives: lives,
    items: [] as FallingItem[],
    particles: [] as Particle[],
    activeItemId: null as string | null,
    spawnTimer: 0,
    spawnInterval: 3000, // ms between spawns
    baseSpeed: 0.8, // pixels per frame base
    lastTime: 0,
    gameTime: 0, // total elapsed milliseconds
    isPaused,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    wordsTypedCount: 0,
    lettersTypedCount: 0,
    missedKeys: {} as Record<string, number>,
    timeline: [] as ChartPoint[],
    lastTimelineUpdate: 0,
    screenShake: 0,
    tuxX: 50, // Tux position as a percentage (0 to 100)
    tuxTargetX: 50,
    tuxState: 'idle' as 'idle' | 'sliding' | 'zapping' | 'happy',
    tuxStateTimer: 0,
    laserBeam: null as { fromX: number; fromY: number; toX: number; toY: number; alpha: number } | null,
    snowflakes: [] as { x: number; y: number; speed: number; size: number; angle: number; drift: number }[],
    recentWords: [] as string[],
  });

  // Setup initial variables based on difficulty
  useEffect(() => {
    const s = stateRef.current;
    if (difficulty === 'easy') {
      s.baseSpeed = 0.15; // ~10 seconds to fall from top to bottom
      s.spawnInterval = 3800;
    } else if (difficulty === 'medium') {
      s.baseSpeed = 0.23; // ~6.5 seconds to fall from top to bottom
      s.spawnInterval = 3200;
    } else {
      s.baseSpeed = 0.38; // ~4.0 seconds to fall from top to bottom
      s.spawnInterval = 2600;
    }
    // Scale interval and speed dynamically based on current level (gentle progression)
    const intervalDec = difficulty === 'easy' ? 120 : difficulty === 'medium' ? 160 : 200;
    const minInterval = difficulty === 'easy' ? 2200 : difficulty === 'medium' ? 1600 : 1100;
    s.spawnInterval = Math.max(s.spawnInterval - ((level - 1) * intervalDec), minInterval);

    const speedInc = difficulty === 'easy' ? 0.012 : difficulty === 'medium' ? 0.022 : 0.035;
    s.baseSpeed = s.baseSpeed + ((level - 1) * speedInc);
  }, [difficulty, level]);

  // Handle Pause updates
  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Resize handler
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 800, height: height || 600 });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize background snowflakes
  useEffect(() => {
    const s = stateRef.current;
    s.snowflakes = Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.1 + Math.random() * 0.3,
      size: 1 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      drift: 0.02 + Math.random() * 0.05,
    }));
  }, []);

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.isPaused || s.lives <= 0) return;

      // Ignore modifiers, arrows, etc.
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

      const pressedKey = e.key;

      // 1. Try to match with currently targeted/active item
      if (s.activeItemId) {
        const activeItem = s.items.find(item => item.id === s.activeItemId && !item.isExploding);
        if (activeItem) {
          const nextChar = activeItem.text[activeItem.typedCount];
          if (pressedKey === nextChar) {
            // Correct letter typed!
            activeItem.typedCount++;
            s.correctKeystrokes++;
            s.lettersTypedCount++;
            s.tuxTargetX = activeItem.x;
            s.tuxState = 'zapping';
            s.tuxStateTimer = 10; // Frames of laser posture

            SoundEffects.playKeystroke();
            spawnTypingParticles(activeItem.x, activeItem.y, '#22c55e');

            // Trigger laser beam visual
            s.laserBeam = {
              fromX: s.tuxX,
              fromY: 88, // Swiveling dual laser cannon nozzle %
              toX: activeItem.x,
              toY: activeItem.y,
              alpha: 1.0
            };

            // Check if word is fully typed
            if (activeItem.typedCount === activeItem.text.length) {
              triggerDestroyItem(activeItem);
            }
            return;
          } else {
            // Incorrect letter
            registerMiss(pressedKey);
            return;
          }
        }
      }

      // 2. No active item, or active item died - find a new one
      // We search for items that are active, not exploding, and start with the typed key
      // Prioritize items closer to the bottom (higher y value)
      const matchingItems = s.items
        .filter(item => !item.isExploding && item.text[0] === pressedKey)
        .sort((a, b) => b.y - a.y);

      if (matchingItems.length > 0) {
        const itemToTarget = matchingItems[0];
        s.activeItemId = itemToTarget.id;
        itemToTarget.isTargeted = true;
        itemToTarget.typedCount = 1;
        s.correctKeystrokes++;
        s.lettersTypedCount++;
        s.tuxTargetX = itemToTarget.x;
        s.tuxState = 'zapping';
        s.tuxStateTimer = 10;

        SoundEffects.playKeystroke();
        spawnTypingParticles(itemToTarget.x, itemToTarget.y, '#22c55e');

        // Target laser
        s.laserBeam = {
          fromX: s.tuxX,
          fromY: 88, // Swiveling dual laser cannon nozzle %
          toX: itemToTarget.x,
          toY: itemToTarget.y,
          alpha: 1.0
        };

        // If it was a single letter (Letter Mode), it's already done!
        if (itemToTarget.typedCount === itemToTarget.text.length) {
          triggerDestroyItem(itemToTarget);
        }
      } else {
        // Absolute miss
        registerMiss(pressedKey);
      }
    };

    const registerMiss = (key: string) => {
      const s = stateRef.current;
      s.incorrectKeystrokes++;
      s.missedKeys[key] = (s.missedKeys[key] || 0) + 1;
      SoundEffects.playMiss();
      s.screenShake = 3; // small rumble for input error
    };

    const triggerDestroyItem = (item: FallingItem) => {
      const s = stateRef.current;
      item.isExploding = true;
      item.explosionProgress = 0;
      s.wordsTypedCount++;
      s.activeItemId = null; // untarget

      // Slide/Jump state for Tux
      s.tuxState = mode === 'word' ? 'sliding' : 'happy';
      s.tuxStateTimer = 18; // longer animation frame hold

      // Award points scaled by difficulty and length
      const lengthBonus = item.text.length * 15;
      const speedBonus = Math.round((100 - item.y) * 0.5); // bonus for hitting it high up!
      const levelMultiplier = 1 + (s.level - 1) * 0.1;
      const points = Math.round((lengthBonus + speedBonus) * levelMultiplier);

      s.score += points;

      // Play retro blast
      SoundEffects.playZap();
      SoundEffects.playExplosion();

      // Trigger massive particle explosion on canvas
      spawnExplosionParticles(item.x, item.y, mode === 'word' ? '#f97316' : '#22d3ee');

      // Check level-up threshold: every 250 points, up level
      const newLevel = Math.floor(s.score / 250) + 1;
      if (newLevel > s.level) {
        s.level = newLevel;
        SoundEffects.playLevelUp();
        spawnLevelUpParticles();
      }

      // Fire state update to React wrapper
      onUpdateStats(s.score, s.level, s.lives);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, difficulty, category, onUpdateStats]);

  // Particle generators
  const spawnTypingParticles = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        color,
        alpha: 1.0,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      });
    }
  };

  const spawnExplosionParticles = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    // Splash circle
    const colors = [color, '#ffffff', '#38bdf8', '#facc15'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        size: 3 + Math.random() * 5,
        life: 0,
        maxLife: 30 + Math.random() * 20,
      });
    }
  };

  const spawnLevelUpParticles = () => {
    const s = stateRef.current;
    for (let i = 0; i < 80; i++) {
      s.particles.push({
        x: Math.random() * 100,
        y: 80,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 90%, 65%)`,
        alpha: 1.0,
        size: 4 + Math.random() * 6,
        life: 0,
        maxLife: 50 + Math.random() * 30,
      });
    }
  };

  const spawnSplashParticles = (x: number, y: number) => {
    const s = stateRef.current;
    // Splash of icy blue droplets
    for (let i = 0; i < 20; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 3,
        color: '#e0f2fe',
        alpha: 1.0,
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 25 + Math.random() * 15,
      });
    }
  };

  // Main rendering & physical update loops inside canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const s = stateRef.current;
    s.lastTime = performance.now();
    s.startTime = Date.now();
    s.lastTimelineUpdate = s.startTime;

    const gameLoop = (timestamp: number) => {
      if (s.isPaused) {
        s.lastTime = timestamp;
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const elapsed = timestamp - s.lastTime;
      s.lastTime = timestamp;
      s.gameTime += elapsed;

      // Progressively track performance metrics for chart
      const nowMs = Date.now();
      if (nowMs - s.lastTimelineUpdate >= 5000) { // every 5 seconds
        s.lastTimelineUpdate = nowMs;
        const durationSec = (nowMs - s.startTime) / 1000;
        const currentWpm = durationSec > 0 ? Math.round((s.lettersTypedCount / 5) / (durationSec / 60)) : 0;
        const totalAttempts = s.correctKeystrokes + s.incorrectKeystrokes;
        const currentAccuracy = totalAttempts > 0 ? Math.round((s.correctKeystrokes / totalAttempts) * 100) : 100;
        s.timeline.push({
          time: Math.round(durationSec),
          wpm: Math.min(currentWpm, 200), // cap anomaly spikes
          accuracy: currentAccuracy
        });
      }

      // Screen shake decay
      if (s.screenShake > 0) {
        s.screenShake -= 0.15;
        if (s.screenShake < 0) s.screenShake = 0;
      }

      // Physics, object spawning & cleanups
      updatePhysics(elapsed);

      // Rendering calls
      drawGame(ctx);

      // End game checks
      if (s.lives <= 0) {
        handleEndGame();
        return;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    const updatePhysics = (elapsed: number) => {
      const s = stateRef.current;

      // 1. Spawning system
      s.spawnTimer += elapsed;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        spawnItem();
      }

      // 2. Falling Items Physics
      s.items.forEach(item => {
        if (item.isExploding) {
          item.explosionProgress += 0.05;
          return;
        }

        // Falling velocity scaled by level, difficulty, and item speed multiplier
        item.y += s.baseSpeed * item.speed * (elapsed / 16.67);

        // If hit bottom (92% is the water line)
        if (item.y >= 92) {
          item.isExploding = true;
          item.explosionProgress = 1.0; // skip explosion, trigger splash immediately
          
          s.lives--;
          SoundEffects.playSplash();
          s.screenShake = 8; // heavy shake on life loss
          spawnSplashParticles(item.x, 92);

          // If the item fell was the currently targeted item, reset focus
          if (item.id === s.activeItemId) {
            s.activeItemId = null;
          }

          onUpdateStats(s.score, s.level, s.lives);
        }
      });

      // Filter out dead items
      s.items = s.items.filter(item => !(item.isExploding && item.explosionProgress >= 1.0));

      // 3. Snowflakes falling
      s.snowflakes.forEach(flake => {
        flake.y += flake.speed;
        flake.angle += flake.drift;
        flake.x += Math.sin(flake.angle) * 0.05;

        // Wrap around borders
        if (flake.y > 100) {
          flake.y = -2;
          flake.x = Math.random() * 100;
        }
        if (flake.x > 100) flake.x = 0;
        if (flake.x < 0) flake.x = 100;
      });

      // 4. Tux horizontal interpolation
      const tuxDiff = s.tuxTargetX - s.tuxX;
      if (Math.abs(tuxDiff) > 0.1) {
        s.tuxX += tuxDiff * 0.15; // smooth drag
        if (Math.abs(tuxDiff) > 2 && s.tuxState === 'idle') {
          s.tuxState = 'sliding';
        }
      } else {
        if (s.tuxState === 'sliding') s.tuxState = 'idle';
      }

      // Spawn ice dust trail if sliding fast
      if (s.tuxState === 'sliding' && Math.abs(tuxDiff) > 3) {
        s.particles.push({
          x: s.tuxX + (Math.random() - 0.5) * 5,
          y: 86 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 1 - (tuxDiff > 0 ? 0.5 : -0.5),
          vy: -0.1 - Math.random() * 0.5,
          color: '#bae6fd',
          alpha: 0.8,
          size: 2 + Math.random() * 4,
          life: 0,
          maxLife: 15 + Math.random() * 10,
        });
      }

      // Tux posture timers
      if (s.tuxStateTimer > 0) {
        s.tuxStateTimer--;
        if (s.tuxStateTimer <= 0) {
          s.tuxState = 'idle';
        }
      }

      // 5. Particles Physics
      s.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1.0 - (p.life / p.maxLife);
      });

      // Clear dead particles
      s.particles = s.particles.filter(p => p.life < p.maxLife);

      // 6. Laser beam visual fading
      if (s.laserBeam) {
        s.laserBeam.alpha -= 0.15;
        if (s.laserBeam.alpha <= 0) {
          s.laserBeam = null;
        }
      }
    };

    const spawnItem = () => {
      const s = stateRef.current;
      const id = Math.random().toString(36).substr(2, 9);
      
      // Select words depending on the game mode (both use words now!)
      let text = '';
      let attempts = 0;
      const existingTexts = s.items.map(item => item.text.toLowerCase());
      
      do {
        text = mode === 'word' 
          ? getRandomWord(category, difficulty, s.level) 
          : getRandomShortWord(category, difficulty, s.level);
        attempts++;
      } while (
        (existingTexts.includes(text.toLowerCase()) || s.recentWords.includes(text.toLowerCase())) && 
        attempts < 40
      );

      // Track recent words so we don't repeat immediately
      s.recentWords.push(text.toLowerCase());
      if (s.recentWords.length > 25) {
        s.recentWords.shift();
      }

      // Random X between 8% and 92% to avoid clipping edges
      const x = 8 + Math.random() * 84;
      const y = -5; // spawn slightly above viewport

      // Speed multiplier centered around 1.0 on average:
      // 1. Slows down longer words slightly so players have fair time to type.
      // 2. Speeds up shorter words slightly to keep gameplay engaging.
      // 3. Adds slight random variance so obstacles don't descend in lockstep rows.
      const lengthFactor = 1.0 - (text.length - 5) * 0.035;
      const lengthAdjusted = Math.max(0.75, Math.min(1.25, lengthFactor));
      const itemSpeed = lengthAdjusted * (0.9 + Math.random() * 0.2);

      s.items.push({
        id,
        text,
        x,
        y,
        speed: itemSpeed,
        typedCount: 0,
        width: 0,
        height: 0,
        isTargeted: false,
        isExploding: false,
        explosionProgress: 0,
        isZapped: false,
      });
    };

    const drawGame = (c: CanvasRenderingContext2D) => {
      const w = dimensions.width;
      const h = dimensions.height;

      c.save();

      // Implement Screen Shake effect
      if (s.screenShake > 0) {
        const dx = (Math.random() - 0.5) * s.screenShake * 3;
        const dy = (Math.random() - 0.5) * s.screenShake * 3;
        c.translate(dx, dy);
      }

      // 1. Draw Space Background (Deep black/violet/blue starry gradient)
      const skyGrad = c.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#04060c'); // Cosmic void black
      skyGrad.addColorStop(0.5, '#080a12');
      skyGrad.addColorStop(0.9, '#0f0e22'); // Indigo horizon
      skyGrad.addColorStop(1.0, '#191028'); // Violet starbase floor
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, w, h);

      // Draw Procedural Cosmic Nebulae (colorful space gas)
      c.save();
      c.globalCompositeOperation = 'screen';
      
      // Nebula 1: Purple cluster top-center
      const nebGrad1 = c.createRadialGradient(w * 0.4, h * 0.35, 10, w * 0.4, h * 0.35, w * 0.42);
      nebGrad1.addColorStop(0, 'rgba(168, 85, 247, 0.16)'); // Purple-500
      nebGrad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)'); // Indigo-500
      nebGrad1.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      c.fillStyle = nebGrad1;
      c.fillRect(0, 0, w, h);

      // Nebula 2: Deep blue/teal glow right-center
      const nebGrad2 = c.createRadialGradient(w * 0.75, h * 0.45, 5, w * 0.75, h * 0.45, w * 0.35);
      nebGrad2.addColorStop(0, 'rgba(6, 182, 212, 0.15)'); // Cyan-500
      nebGrad2.addColorStop(0.6, 'rgba(30, 58, 138, 0.05)'); // Blue-900
      nebGrad2.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      c.fillStyle = nebGrad2;
      c.fillRect(0, 0, w, h);
      c.restore();

      // 2. Draw Distant Stars (twinkling and scrolling)
      s.snowflakes.forEach((star, i) => {
        // Calculate twinkle opacity
        const twinkle = 0.3 + Math.sin(s.gameTime * 0.003 + i) * 0.4;
        c.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        
        c.beginPath();
        // Give some starburst glows to a few large stars
        if (i % 8 === 0) {
          const starX = (star.x * w) / 100;
          const starY = (star.y * h) / 100;
          const starSize = star.size * 1.5;
          
          c.arc(starX, starY, starSize, 0, Math.PI * 2);
          c.fill();
          
          // Star cross flares
          c.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(starX - starSize * 3, starY);
          c.lineTo(starX + starSize * 3, starY);
          c.moveTo(starX, starY - starSize * 3);
          c.lineTo(starX, starY + starSize * 3);
          c.stroke();
        } else {
          // Regular stars
          c.arc((star.x * w) / 100, (star.y * h) / 100, star.size, 0, Math.PI * 2);
          c.fill();
        }
      });

      // 3. Draw Laser Base Floor and Shield Domes
      const groundY = h * 0.90;

      // Platform Base Ground
      const groundGrad = c.createLinearGradient(0, groundY, 0, h);
      groundGrad.addColorStop(0, '#12102e'); // indigo-950
      groundGrad.addColorStop(0.3, '#0b0c16'); // dark grey
      groundGrad.addColorStop(1.0, '#010206');
      c.fillStyle = groundGrad;
      c.fillRect(0, groundY, w, h * 0.10);

      // Cyber tech deck neon line
      c.strokeStyle = '#06b6d4'; // cyan-500
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, groundY);
      c.lineTo(w, groundY);
      c.stroke();

      // Technical laser-deck grid panel markings (vector perspective lines)
      c.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      c.lineWidth = 1.5;
      for (let gx = 0; gx < w; gx += 45) {
        c.beginPath();
        c.moveTo(gx, groundY);
        c.lineTo(gx - 25, h);
        c.stroke();
      }

      // Render the 5 Protective Dome Cities (Lives indicator)
      const slotWidth = w / 5;
      const domeRadius = Math.min(slotWidth * 0.42, 55);

      for (let i = 0; i < 5; i++) {
        const cx = (i + 0.5) * slotWidth;

        if (i < s.lives) {
          // ACTIVE CITY & GLOWING SHIELD DOME
          c.save();

          // 2D green silhouette skyscrapers
          c.fillStyle = '#10b981'; // emerald green cities
          c.fillRect(cx - 16, groundY - 26, 9, 26);
          c.fillRect(cx - 6, groundY - 38, 12, 38);
          c.fillRect(cx + 6, groundY - 20, 9, 20);
          
          // Tiny yellow windows lit inside buildings
          c.fillStyle = '#fbbf24';
          c.fillRect(cx - 13, groundY - 20, 1.5, 1.5);
          c.fillRect(cx - 13, groundY - 12, 1.5, 1.5);
          c.fillRect(cx - 2, groundY - 32, 1.5, 1.5);
          c.fillRect(cx + 4, groundY - 28, 1.5, 1.5);
          c.fillRect(cx + 9, groundY - 14, 1.5, 1.5);

          // Draw the bubble dome shield with pulse animation
          const pulse = 1.0 + Math.sin(s.gameTime * 0.003 + i) * 0.03;
          const currentRadius = domeRadius * pulse;

          // Radial gradient inside dome to make it feel spherically glowing
          const domeGrad = c.createRadialGradient(cx, groundY, 5, cx, groundY, currentRadius);
          domeGrad.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
          domeGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
          domeGrad.addColorStop(1.0, 'rgba(34, 211, 238, 0.42)'); // cyan edge

          c.fillStyle = domeGrad;
          c.strokeStyle = 'rgba(34, 211, 238, 0.85)';
          c.lineWidth = 2.5;

          // Glowing shadow
          c.shadowColor = '#22d3ee';
          c.shadowBlur = 10;

          c.beginPath();
          c.arc(cx, groundY, currentRadius, Math.PI, 0, false);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();

        } else {
          // DESTROYED CITY / RUINS
          c.fillStyle = '#334155'; // dark slate rubble
          c.beginPath();
          c.moveTo(cx - 16, groundY);
          c.lineTo(cx - 12, groundY - 10);
          c.lineTo(cx - 6, groundY - 4);
          c.lineTo(cx, groundY - 14);
          c.lineTo(cx + 8, groundY - 6);
          c.lineTo(cx + 16, groundY);
          c.closePath();
          c.fill();

          c.fillStyle = '#1e293b';
          c.fillRect(cx - 8, groundY - 3, 3, 3);
          c.fillRect(cx + 6, groundY - 4, 4, 3);

          // Emit active rubble smoke particles
          if (Math.random() < 0.05) {
            s.particles.push({
              x: (cx / w) * 100 + (Math.random() - 0.5) * 3,
              y: (groundY / h) * 100 - 1,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.3 - Math.random() * 0.4,
              color: '#64748b',
              alpha: 0.5,
              size: 2 + Math.random() * 2,
              life: 0,
              maxLife: 35 + Math.random() * 15
            });
          }
        }
      }

      // 4. Draw Laser Beam (if active)
      if (s.laserBeam) {
        c.save();
        const laserX1 = (s.laserBeam.fromX * w) / 100;
        const laserY1 = (s.laserBeam.fromY * h) / 100;
        const laserX2 = (s.laserBeam.toX * w) / 100;
        const laserY2 = (s.laserBeam.toY * h) / 100;

        // Core white hot beam
        c.strokeStyle = `rgba(255, 255, 255, ${s.laserBeam.alpha})`;
        c.lineWidth = 5 + Math.random() * 4;
        c.beginPath();
        c.moveTo(laserX1, laserY1);
        c.lineTo(laserX2, laserY2);
        c.stroke();

        // Neon outer glow (cyan/blue)
        c.strokeStyle = `rgba(34, 211, 238, ${s.laserBeam.alpha * 0.75})`;
        c.lineWidth = 14 + Math.random() * 8;
        c.shadowColor = '#22d3ee';
        c.shadowBlur = 18;
        c.beginPath();
        c.moveTo(laserX1, laserY1);
        c.lineTo(laserX2, laserY2);
        c.stroke();
        c.restore();
      }

      // 5. Draw Particles
      s.particles.forEach(p => {
        c.save();
        c.globalAlpha = Math.max(0, p.alpha);
        c.fillStyle = p.color;
        c.beginPath();
        c.arc((p.x * w) / 100, (p.y * h) / 100, p.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      });

      // 6. Draw Tux
      drawTux(c, w, h);

      // 7. Draw Falling Items (Fish or Comets)
      s.items.forEach(item => {
        const itemX = (item.x * w) / 100;
        const itemY = (item.y * h) / 100;

        if (mode === 'word') {
          drawFish(c, itemX, itemY, item);
        } else {
          drawComet(c, itemX, itemY, item);
        }
      });

      c.restore();
    };

    const drawTux = (c: CanvasRenderingContext2D, w: number, h: number) => {
      const s = stateRef.current;
      const tx = (s.tuxX * w) / 100;
      const ty = (85 * h) / 100; // cockpit desk level

      const tuxSize = Math.max(w * 0.075, 50);

      c.save();
      
      // Draw Futuristic Cockpit desk frame first
      const cockpitW = 90;
      const cockpitH = 32;
      c.fillStyle = '#334155'; // metal grey desk
      c.strokeStyle = '#475569';
      c.lineWidth = 2.5;

      c.beginPath();
      c.moveTo(tx - cockpitW / 2, ty + cockpitH + 10);
      c.lineTo(tx - cockpitW / 2 + 12, ty + 12);
      c.lineTo(tx + cockpitW / 2 - 12, ty + 12);
      c.lineTo(tx + cockpitW / 2, ty + cockpitH + 10);
      c.closePath();
      c.fill();
      c.stroke();

      // Screen inside desk
      c.fillStyle = '#020617';
      c.fillRect(tx - cockpitW / 2 + 16, ty + 16, cockpitW - 32, cockpitH - 12);
      c.strokeStyle = '#0891b2';
      c.lineWidth = 1;
      c.strokeRect(tx - cockpitW / 2 + 16, ty + 16, cockpitW - 32, cockpitH - 12);

      // Blinking controls
      const greenBlink = Math.sin(s.gameTime * 0.01) > 0 ? '#10b981' : '#064e3b';
      const redBlink = Math.sin(s.gameTime * 0.01 + Math.PI) > 0 ? '#ef4444' : '#7f1d1d';
      c.fillStyle = greenBlink;
      c.beginPath(); c.arc(tx - cockpitW / 2 + 25, ty + 24, 2.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = redBlink;
      c.beginPath(); c.arc(tx - cockpitW / 2 + 32, ty + 24, 2.5, 0, Math.PI * 2); c.fill();

      // Radar screen graphic
      c.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      c.beginPath();
      c.arc(tx + 22, ty + 26, 7, 0, Math.PI * 2);
      c.stroke();
      const sw = s.gameTime * 0.006;
      c.beginPath();
      c.moveTo(tx + 22, ty + 26);
      c.lineTo(tx + 22 + Math.cos(sw) * 7, ty + 26 + Math.sin(sw) * 7);
      c.stroke();

      // Draw Tux sitting slightly nested inside cockpit
      c.translate(tx, ty + 12);

      let bounce = 0;
      let angleOffset = 0;
      if (s.tuxState === 'sliding') {
        bounce = Math.sin(s.gameTime * 0.02) * 1.5;
        angleOffset = (s.tuxTargetX > s.tuxX ? 0.12 : -0.12);
      } else {
        bounce = Math.sin(s.gameTime * 0.005) * 1.0;
      }

      c.translate(0, bounce - 10);
      c.rotate(angleOffset);

      // 1. Draw Feet (under desk)
      c.fillStyle = '#ea580c';
      c.beginPath();
      c.ellipse(-tuxSize * 0.28, tuxSize * 0.05, tuxSize * 0.16, tuxSize * 0.06, -0.2, 0, Math.PI * 2);
      c.ellipse(tuxSize * 0.28, tuxSize * 0.05, tuxSize * 0.16, tuxSize * 0.06, 0.2, 0, Math.PI * 2);
      c.fill();

      // 2. Body
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.ellipse(0, -tuxSize * 0.35, tuxSize * 0.34, tuxSize * 0.44, 0, 0, Math.PI * 2);
      c.fill();

      // 3. Belly
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(0, -tuxSize * 0.28, tuxSize * 0.24, tuxSize * 0.34, 0, 0, Math.PI * 2);
      c.fill();

      // 4. Wings/Flippers
      c.fillStyle = '#0f172a';
      if (s.tuxState === 'zapping') {
        // Wings raised to fire lasers!
        c.beginPath();
        c.ellipse(-tuxSize * 0.35, -tuxSize * 0.5, tuxSize * 0.09, tuxSize * 0.2, 0.5, 0, Math.PI * 2);
        c.ellipse(tuxSize * 0.35, -tuxSize * 0.5, tuxSize * 0.09, tuxSize * 0.2, -0.5, 0, Math.PI * 2);
        c.fill();
      } else {
        // Natural resting wings on console
        c.beginPath();
        c.ellipse(-tuxSize * 0.36, -tuxSize * 0.28, tuxSize * 0.08, tuxSize * 0.18, -0.1, 0, Math.PI * 2);
        c.ellipse(tuxSize * 0.36, -tuxSize * 0.28, tuxSize * 0.08, tuxSize * 0.18, 0.1, 0, Math.PI * 2);
        c.fill();
      }

      // 5. Head
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(0, -tuxSize * 0.7, tuxSize * 0.27, 0, Math.PI * 2);
      c.fill();

      // White eyes backing
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(-tuxSize * 0.08, -tuxSize * 0.74, tuxSize * 0.07, tuxSize * 0.10, 0, 0, Math.PI * 2);
      c.ellipse(tuxSize * 0.08, -tuxSize * 0.74, tuxSize * 0.07, tuxSize * 0.10, 0, 0, Math.PI * 2);
      c.fill();

      // Pupils looking alert at space
      c.fillStyle = '#000000';
      c.beginPath();
      c.arc(-tuxSize * 0.07, -tuxSize * 0.78, tuxSize * 0.035, 0, Math.PI * 2);
      c.arc(tuxSize * 0.07, -tuxSize * 0.78, tuxSize * 0.035, 0, Math.PI * 2);
      c.fill();

      // Beak
      c.fillStyle = '#f97316';
      if (s.tuxState === 'zapping' || s.tuxState === 'happy') {
        c.beginPath();
        c.moveTo(-tuxSize * 0.09, -tuxSize * 0.68);
        c.lineTo(tuxSize * 0.09, -tuxSize * 0.68);
        c.lineTo(0, -tuxSize * 0.58);
        c.closePath();
        c.fill();
      } else {
        c.beginPath();
        c.moveTo(-tuxSize * 0.11, -tuxSize * 0.68);
        c.lineTo(tuxSize * 0.11, -tuxSize * 0.68);
        c.lineTo(0, -tuxSize * 0.61);
        c.closePath();
        c.fill();
      }

      // Red Scarf
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.roundRect(-tuxSize * 0.20, -tuxSize * 0.59, tuxSize * 0.40, tuxSize * 0.06, 3);
      c.fill();

      // Astronaut Cyber Visor (Always on for space theme!)
      c.strokeStyle = '#22d3ee'; // cyan-400
      c.lineWidth = 2.5;
      c.fillStyle = 'rgba(34, 211, 238, 0.35)'; // translucent cyber shield
      c.shadowColor = '#22d3ee';
      c.shadowBlur = 6;
      c.beginPath();
      c.roundRect(-tuxSize * 0.15, -tuxSize * 0.81, tuxSize * 0.30, tuxSize * 0.09, 3);
      c.fill();
      c.stroke();

      c.restore();

      // ==========================================
      // SWIVEL DUAL PLASMA CANNON INTEGRATION
      // ==========================================
      let targetAngle = -Math.PI / 2;
      let hasActiveTarget = false;
      if (s.activeItemId) {
        const activeItem = s.items.find(item => item.id === s.activeItemId && !item.isExploding);
        if (activeItem) {
          const itemX = (activeItem.x * w) / 100;
          const itemY = (activeItem.y * h) / 100;
          const dx = itemX - tx;
          const dy = itemY - (ty + 18); // cannon center is at ty + 18
          targetAngle = Math.atan2(dy, dx);
          hasActiveTarget = true;
        }
      }
      if (!hasActiveTarget) {
        // dynamic scanning sweep back and forth when idle
        targetAngle = -Math.PI / 2 + Math.sin(s.gameTime * 0.0015) * 0.3;
      }

      c.save();
      // Translate to cannon swivel mount on the cockpit desk
      c.translate(tx, ty + 18);
      c.rotate(targetAngle);

      // Neon active target glow
      const glowColor = hasActiveTarget ? '#22d3ee' : '#0891b2';
      c.shadowColor = glowColor;
      c.shadowBlur = s.tuxState === 'zapping' ? 14 : 6;

      // 1. Swivel Turret Base Plate (glowing high-tech chassis)
      c.fillStyle = '#1e293b'; // dark steel grey
      c.strokeStyle = '#475569';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 11, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // 2. High-Tech Reactor Core LED indicator
      c.fillStyle = s.tuxState === 'zapping' ? '#ffffff' : glowColor;
      c.beginPath();
      c.arc(0, 0, 4, 0, Math.PI * 2);
      c.fill();

      // 3. Double-Barrel Muzzles (Sleek sci-fi barrels)
      c.fillStyle = '#334155'; // medium steel grey
      c.strokeStyle = '#475569';
      c.lineWidth = 1.5;

      // Left laser barrel (offset vertically in rotated coordinate system)
      c.beginPath();
      c.roundRect(4, -8, 22, 5, 1.5);
      c.fill();
      c.stroke();

      // Right laser barrel
      c.beginPath();
      c.roundRect(4, 3, 22, 5, 1.5);
      c.fill();
      c.stroke();

      // Cyber magnetic rail connectors between muzzles
      c.fillStyle = '#475569';
      c.fillRect(10, -5, 3, 10);

      // 4. Heavy Muzzle Flash and Particle Spray (fires when zapping!)
      if (s.tuxState === 'zapping') {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(26, -5.5, 4, 0, Math.PI * 2);
        c.arc(26, 5.5, 4, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#22d3ee';
        c.beginPath();
        c.arc(26, -5.5, 6, 0, Math.PI * 2);
        c.arc(26, 5.5, 6, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    };

    const drawFish = (c: CanvasRenderingContext2D, x: number, y: number, item: FallingItem) => {
      // Draw falling hot Asteroids/Meteorites (Word Mode)
      const size = 32;
      c.save();
      c.translate(x, y);

      const s = stateRef.current;

      // 1. Outer Blazing Flame (Tail rising up)
      const tailGrad = c.createLinearGradient(0, 0, 0, -45);
      tailGrad.addColorStop(0, 'rgba(249, 115, 22, 0.8)'); // Orange
      tailGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)'); // Red
      tailGrad.addColorStop(1.0, 'rgba(124, 58, 237, 0)'); // Purple fade

      c.fillStyle = tailGrad;
      c.beginPath();
      c.moveTo(-size, 0);
      c.quadraticCurveTo(-size * 0.4, -55 - Math.random() * 8, 0, -55 - Math.random() * 8);
      c.quadraticCurveTo(size * 0.4, -55 - Math.random() * 8, size, 0);
      c.closePath();
      c.fill();

      // 2. Meteor Nucleus (Rocky bumpy asteroid)
      const rockyGrad = c.createRadialGradient(-size * 0.2, -size * 0.2, 2, 0, 0, size);
      if (item.isTargeted) {
        rockyGrad.addColorStop(0, '#fca5a5'); // hot pink core
        rockyGrad.addColorStop(0.8, '#be123c'); // deep rose
        rockyGrad.addColorStop(1.0, '#881337');
      } else {
        rockyGrad.addColorStop(0, '#d1d5db'); // slate crater
        rockyGrad.addColorStop(0.8, '#4b5563'); // medium gray
        rockyGrad.addColorStop(1.0, '#1f2937');
      }
      c.fillStyle = rockyGrad;
      
      // Bumpy crater shape path
      c.beginPath();
      const points = 12;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radiusNoise = size + (Math.sin(angle * 5 + x) * 3);
        const px = Math.cos(angle) * radiusNoise;
        const py = Math.sin(angle) * radiusNoise;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();

      // Crates details inside rocky meteor
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.beginPath(); c.arc(-size * 0.4, -size * 0.1, size * 0.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(size * 0.3, size * 0.2, size * 0.15, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-size * 0.1, size * 0.4, size * 0.12, 0, Math.PI * 2); c.fill();

      c.restore();

      // Draw word text panel attached beneath meteor
      c.save();
      c.translate(x, y);

      c.font = 'bold 15px "JetBrains Mono", monospace';
      const textWidth = c.measureText(item.text).width;
      const cardW = textWidth + 18;
      const cardH = 26;

      const cardGrad = c.createLinearGradient(0, size + 4, 0, size + 4 + cardH);
      if (item.isTargeted) {
        cardGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        cardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        c.strokeStyle = '#22d3ee';
        c.lineWidth = 2;
        c.shadowColor = '#22d3ee';
        c.shadowBlur = 8;
      } else {
        cardGrad.addColorStop(0, 'rgba(30, 41, 59, 0.85)');
        cardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
        c.strokeStyle = '#475569';
        c.lineWidth = 1;
        c.shadowBlur = 0;
      }

      c.fillStyle = cardGrad;
      c.beginPath();
      c.roundRect(-cardW / 2, size + 6, cardW, cardH, 5);
      c.fill();
      c.stroke();

      // Render characters
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const startX = -textWidth / 2;

      const typedPart = item.text.substring(0, item.typedCount);
      const remainingPart = item.text.substring(item.typedCount);

      // Typed: cyan green-500
      c.fillStyle = '#22c55e';
      c.fillText(typedPart, startX, size + 6 + cardH / 2);

      const typedWidth = c.measureText(typedPart).width;

      // Remaining: white
      c.fillStyle = '#ffffff';
      c.fillText(remainingPart, startX + typedWidth, size + 6 + cardH / 2);

      // Cursor underline
      if (item.isTargeted) {
        c.fillStyle = '#22d3ee';
        c.fillRect(startX + typedWidth, size + 6 + cardH - 5, 8, 2.5);
      }

      c.restore();
    };

    const drawComet = (c: CanvasRenderingContext2D, x: number, y: number, item: FallingItem) => {
      // Draw falling cyan-burning capsule comet holding full words! (Letter Mode / Comet Zap)
      c.save();
      c.translate(x, y);

      const s = stateRef.current;

      // Measure text width to scale capsule and flame tail dynamically
      c.font = 'bold 16px "JetBrains Mono", monospace';
      const textWidth = c.measureText(item.text).width;
      const capsuleW = Math.max(42, textWidth + 18);
      const capsuleH = 26;

      // 1. Draw blazing burning cyan-blue tail (rising upwards, scaled to capsule width!)
      const tailHeight = 52 + Math.sin(s.gameTime * 0.01 + x) * 8;
      const tailGrad = c.createLinearGradient(0, 0, 0, -tailHeight);
      tailGrad.addColorStop(0, 'rgba(34, 211, 238, 0.95)'); // Cyan-400 hot core
      tailGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.65)'); // Cyan-500
      tailGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.3)'); // Blue-500 outer tail
      tailGrad.addColorStop(1.0, 'rgba(99, 102, 241, 0)'); // Indigo fade

      c.fillStyle = tailGrad;
      
      // Draw organic flickering flame tail path (pointing UP)
      c.beginPath();
      c.moveTo(-capsuleW * 0.5, 0);
      c.quadraticCurveTo(-capsuleW * 0.2, -tailHeight * 0.9, 0, -tailHeight);
      c.quadraticCurveTo(capsuleW * 0.2, -tailHeight * 0.9, capsuleW * 0.5, 0);
      c.closePath();
      c.fill();

      // Inner white-hot flame core
      const innerTailH = tailHeight * 0.55;
      const innerGrad = c.createLinearGradient(0, 0, 0, -innerTailH);
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.5, '#e0f7fa');
      innerGrad.addColorStop(1.0, 'rgba(34, 211, 238, 0)');
      c.fillStyle = innerGrad;
      c.beginPath();
      c.moveTo(-capsuleW * 0.3, 0);
      c.quadraticCurveTo(0, -innerTailH, capsuleW * 0.3, 0);
      c.closePath();
      c.fill();

      // 2. Draw comet glass nucleus capsule (cyan capsule)
      const capsuleGrad = c.createRadialGradient(0, 0, 2, 0, 0, capsuleW / 2);
      if (item.isTargeted) {
        capsuleGrad.addColorStop(0, '#ffffff'); // bright targeted core
        capsuleGrad.addColorStop(0.7, '#22d3ee'); // cyan-400
        capsuleGrad.addColorStop(1.0, '#0891b2'); // cyan-600 outline
      } else {
        capsuleGrad.addColorStop(0, '#e0f2fe'); // ice blue
        capsuleGrad.addColorStop(0.8, '#0284c7'); // sky-600
        capsuleGrad.addColorStop(1.0, '#0369a1');
      }
      c.fillStyle = capsuleGrad;

      // Comet capsule border
      c.strokeStyle = item.isTargeted ? '#ffffff' : 'rgba(34, 211, 238, 0.6)';
      c.lineWidth = 1.5;

      c.beginPath();
      c.roundRect(-capsuleW / 2, -capsuleH / 2, capsuleW, capsuleH, capsuleH / 2);
      c.fill();
      c.stroke();

      // 3. Render word text with active typing feedback (high-contrast outline)
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const startX = -textWidth / 2;

      const typedPart = item.text.substring(0, item.typedCount);
      const remainingPart = item.text.substring(item.typedCount);

      // Draw high-contrast black stroke backing first for readability
      c.font = 'bold 16px "JetBrains Mono", monospace';
      c.strokeStyle = '#020617';
      c.lineWidth = 3;
      c.lineJoin = 'miter';
      c.miterLimit = 2;
      c.strokeText(item.text, startX, 0);

      // Typed characters (green/emerald neon)
      c.fillStyle = '#10b981';
      c.fillText(typedPart, startX, 0);

      const typedWidth = c.measureText(typedPart).width;

      // Remaining characters (crisp white)
      c.fillStyle = '#ffffff';
      c.fillText(remainingPart, startX + typedWidth, 0);

      // Neon blinking cursor underline for targeted word
      if (item.isTargeted) {
        c.fillStyle = '#22d3ee';
        c.fillRect(startX + typedWidth, capsuleH / 2 - 4, 8, 2);
      }

      c.restore();
    };

    const handleEndGame = () => {
      const durationSec = Math.max(1, Math.round((Date.now() - s.startTime) / 1000));
      const wpm = Math.round((s.lettersTypedCount / 5) / (durationSec / 60));
      const totalKeys = s.correctKeystrokes + s.incorrectKeystrokes;
      const accuracy = totalKeys > 0 ? Math.round((s.correctKeystrokes / totalKeys) * 100) : 100;

      // Play gameover sad tone
      SoundEffects.playGameOver();

      onGameOver({
        score: s.score,
        highScore: Math.max(s.score, Number(localStorage.getItem('tux_high_score') || 0)),
        wordsTyped: s.wordsTypedCount,
        lettersTyped: s.lettersTypedCount,
        correctKeystrokes: s.correctKeystrokes,
        incorrectKeystrokes: s.incorrectKeystrokes,
        lives: s.lives,
        maxLives: s.maxLives,
        level: s.level,
        startTime: s.startTime,
        gameDuration: durationSec,
        timeline: s.timeline.length > 0 ? s.timeline : [{ time: durationSec, wpm, accuracy }],
        missedKeys: s.missedKeys,
      });
    };

    // Begin looping
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions, mode, difficulty, category, isPaused, onGameOver, onUpdateStats]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden rounded-2xl border-4 border-slate-700/80 shadow-2xl flex items-center justify-center crt-screen"
    >
      {/* HTML5 Canvas Element */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block aspect-auto max-w-full max-h-full"
      />

      {/* Screen flash on life lost */}
      {stateRef.current.screenShake > 4 && (
        <div className="absolute inset-0 bg-red-600/10 pointer-events-none transition-opacity duration-75 animate-pulse z-40" />
      )}

      {/* Level up notifier overlay banner */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
        {stateRef.current.score > 0 && stateRef.current.score % 250 < 30 && (
          <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-500 text-slate-950 font-sans font-bold text-lg animate-bounce border-2 border-white shadow-lg">
            <Flame className="w-5 h-5 animate-pulse" />
            LEVEL UP! WELCOME TO LEVEL {level}
          </div>
        )}
      </div>
    </div>
  );
};
