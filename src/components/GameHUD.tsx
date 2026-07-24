import React from 'react';
import { GameMode, Difficulty, Category } from '../types';
import { Volume2, VolumeX, Pause, Play, Award, Zap, Heart, Flame, RefreshCw } from 'lucide-react';
import { SoundEffects } from './SoundEffects';

interface GameHUDProps {
  score: number;
  highScore: number;
  level: number;
  lives: number;
  maxLives: number;
  mode: GameMode;
  difficulty: Difficulty;
  category: Category;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  level,
  lives,
  maxLives,
  mode,
  difficulty,
  category,
  isPaused,
  onTogglePause,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  const getCategoryLabel = (cat: Category) => {
    switch (cat) {
      case 'easy_words': return 'Easy Words';
      case 'animals': return 'Animals';
      case 'technology': return 'Technology';
      case 'space': return 'Space Exploration';
      case 'fruits_colors': return 'Fruits & Colors';
      case 'programming': return 'Programming Terms';
      default: return 'General';
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
      {/* 1. Left Side: Active Parameters & Mode info */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Mode:</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center gap-1.5">
            {mode === 'word' ? <Flame className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {mode === 'word' ? 'Fish Cascade' : 'Comet Zap'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Difficulty:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Category:</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {getCategoryLabel(category)}
          </span>
        </div>
      </div>

      {/* 2. Center Side: Score, Level, and Lives HUD */}
      <div className="flex items-center gap-6 md:gap-8 bg-slate-950/60 py-2 px-5 rounded-2xl border border-slate-800">
        {/* Lives Counter */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-1">Lives</span>
          <div className="flex gap-1.5">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform duration-300 ${
                  i < lives 
                    ? 'text-red-500 fill-red-500 scale-100' 
                    : 'text-slate-600 scale-90'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-slate-800" />

        {/* Level display */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Level</span>
          <span className="text-xl font-bold text-yellow-400">{level}</span>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-slate-800" />

        {/* Score display */}
        <div className="flex flex-col items-center min-w-[70px]">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Score</span>
          <span className="text-xl font-bold text-white tracking-tight">{score}</span>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-slate-800 hidden sm:block" />

        {/* High Score */}
        <div className="flex flex-col items-center min-w-[70px] hidden sm:flex">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">High Score</span>
          <span className="text-xl font-bold text-slate-400 tracking-tight flex items-center gap-1">
            <Award className="w-4 h-4 text-slate-500" />
            {highScore}
          </span>
        </div>
      </div>

      {/* 3. Right Side: Actions & Audio toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-3 rounded-xl border transition-all ${
            isMuted 
              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          id="btn-hud-mute"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={onTogglePause}
          className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-2 font-semibold"
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          id="btn-hud-pause"
        >
          {isPaused ? <Play className="w-5 h-5 text-green-400" /> : <Pause className="w-5 h-5" />}
          <span className="text-sm hidden lg:inline">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          onClick={onRestart}
          className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all"
          title="Restart Session"
          id="btn-hud-restart"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
