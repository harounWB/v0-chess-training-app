'use client';

import React from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
  disabled = false,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
      {/* Playback Controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled}
          className="w-10 h-10 p-0 bg-purple-600 hover:bg-purple-500"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="w-10 h-10 p-0 bg-gray-700 hover:bg-gray-600"
          title="Reset to start"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium min-w-fit">Speed:</span>
        <div className="flex gap-1">
          {[0.5, 1, 2].map((s) => (
            <Button
              key={s}
              size="sm"
              onClick={() => onSpeedChange(s)}
              disabled={disabled}
              className={`px-2 py-1 text-xs font-medium ${
                speed === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
