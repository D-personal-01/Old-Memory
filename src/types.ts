/**
 * Types and interfaces for the Tux Typing browser remake
 */

export type GameMode = 'letter' | 'word';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = 
  | 'animals' 
  | 'technology' 
  | 'space' 
  | 'fruits_colors' 
  | 'programming' 
  | 'easy_words';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export interface FallingItem {
  id: string;
  text: string;
  x: number; // percentage of canvas width (0 to 100)
  y: number; // percentage of canvas height (0 to 100)
  speed: number; // speed multiplier
  typedCount: number; // number of correctly typed letters
  width: number; // visual bounding box width
  height: number; // visual bounding box height
  isTargeted: boolean; // is this the current word the user is typing?
  isExploding: boolean; // playing death animation
  explosionProgress: number; // 0 to 1
  isZapped: boolean; // whether hit by laser
}

export interface ChartPoint {
  time: number; // seconds since start
  wpm: number;
  accuracy: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  wordsTyped: number;
  lettersTyped: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  lives: number;
  maxLives: number;
  level: number;
  startTime: number;
  gameDuration: number; // in seconds
  timeline: ChartPoint[];
  missedKeys: Record<string, number>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}
