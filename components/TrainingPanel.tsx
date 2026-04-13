'use client';

import React from 'react';
import { Game, PlayerColor, TrainingMode, DifficultyLevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TrainingPanelProps {
  game: Game;
  moveIndex: number;
  trainingMode: TrainingMode;
  playerColor: PlayerColor;
  message: string;
  isCorrect: boolean | null;
  expectedMove: string | null;
  difficulty?: DifficultyLevel;
  onModeChange: (mode: TrainingMode) => void;
  onColorChange: (color: PlayerColor) => void;
  onFlipBoard: () => void;
  onDifficultyChange?: (difficulty: DifficultyLevel) => void;
  onReset: () => void;
  onNavigateMove: (index: number) => void;
  onCompleteGame: () => void;
  isCompleted: boolean;
}

export function TrainingPanel({
  game,
  moveIndex,
  trainingMode,
  playerColor,
  message,
  isCorrect,
  expectedMove,
  difficulty = 'medium',
  onModeChange,
  onColorChange,
  onFlipBoard,
  onDifficultyChange,
  onReset,
  onNavigateMove,
  onCompleteGame,
  isCompleted,
}: TrainingPanelProps) {
  const moveProgressPercentage = (moveIndex / (game.moves.length || 1)) * 100;

  const getMessageColor = () => {
    if (isCorrect === true) return 'text-green-400';
    if (isCorrect === false) return 'text-red-400';
    return 'text-blue-300';
  };

  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="space-y-4">
        {/* Game Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">
            {game.white} vs {game.black}
          </div>
          {isCompleted && (
            <div className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">
              ✔ Complete
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={trainingMode === 'train' ? 'default' : 'outline'}
            onClick={() => onModeChange('train')}
            className={
              trainingMode === 'train'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }
          >
            Train
          </Button>
          <Button
            size="sm"
            variant={trainingMode === 'explore' ? 'default' : 'outline'}
            onClick={() => onModeChange('explore')}
            className={
              trainingMode === 'explore'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }
          >
            Explore
          </Button>
        </div>

        {/* Color Selection: Flip Board in explore, Play White/Black in train */}
        {trainingMode === 'explore' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onFlipBoard}
            className="bg-gray-800 hover:bg-gray-700 w-full text-white"
          >
            Flip Board
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={playerColor === 'w' ? 'default' : 'outline'}
              onClick={() => onColorChange('w')}
              className={
                playerColor === 'w'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }
            >
              Play White
            </Button>
            <Button
              size="sm"
              variant={playerColor === 'b' ? 'default' : 'outline'}
              onClick={() => onColorChange('b')}
              className={
                playerColor === 'b'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }
            >
              Play Black
            </Button>
          </div>
        )}

        {/* Difficulty Level Selection - Only show in train mode */}
        {trainingMode === 'train' && onDifficultyChange && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Difficulty
            </div>
            <div className="flex gap-1">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Button
                  key={level}
                  size="sm"
                  onClick={() => onDifficultyChange(level)}
                  className={`flex-1 text-xs capitalize ${
                    difficulty === level
                      ? level === 'easy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : level === 'medium'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {level}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {difficulty === 'easy' && 'Hints available • Destination shown'}
              {difficulty === 'medium' && 'First hint only • No destination'}
              {difficulty === 'hard' && 'No hints • Only feedback'}
            </p>
          </div>
        )}

        {/* Status Message */}
        <div
          className={`text-sm p-3 rounded bg-gray-800 ${getMessageColor()} min-h-10 flex items-center`}
        >
          {message}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onReset}
            className="flex-1 bg-gray-800 hover:bg-gray-700"
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onCompleteGame}
            className={`flex-1 ${
              isCompleted
                ? 'bg-green-900 hover:bg-green-800'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {isCompleted ? '✔ Done' : 'Mark Done'}
          </Button>
        </div>

        {/* Move History - Only show in explore mode */}
        {game.moves.length > 0 && trainingMode === 'explore' && (
          <div className="mt-4 p-2 bg-gray-800 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Moves:</div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {game.moves.map((move, index) => (
                <button
                  key={index}
                  onClick={() => onNavigateMove(index + 1)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    index < moveIndex
                      ? 'bg-purple-900 text-purple-100'
                      : index === moveIndex
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {move.san}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
