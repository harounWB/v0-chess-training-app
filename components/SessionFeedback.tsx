'use client';

import React from 'react';
import { GameSession, MoveAttempt } from '@/lib/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckCircle, RotateCcw, Trophy } from 'lucide-react';

interface SessionFeedbackProps {
  session: GameSession;
  moveAttempts: MoveAttempt[];
  onReplay?: () => void;
  onReplayMistakes?: () => void;
  onNewGame?: () => void;
}

export function SessionFeedback({
  session,
  moveAttempts,
  onReplay,
  onReplayMistakes,
  onNewGame,
}: SessionFeedbackProps) {
  const accuracy = (session.correctMoves + session.incorrectMoves + session.hintsUsed) > 0 
    ? Math.round((session.correctMoves / (session.correctMoves + session.incorrectMoves + session.hintsUsed)) * 100)
    : 0;

  const mistakeMoves = moveAttempts.filter(a => a.wrongAttempts > 0);
  const hasMistakes = mistakeMoves.length > 0;

  const sessionDuration = session.completedAt 
    ? Math.round((session.completedAt - session.startTime) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-gray-900/30 border-purple-800/50 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Header with trophy */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Game Complete!</h2>
          <p className="text-sm text-gray-400">
            Difficulty: <span className="capitalize font-semibold text-purple-300">{session.difficulty}</span>
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
            <div className="text-xs text-gray-400 mt-1">Accuracy</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="text-2xl font-bold text-blue-400">{session.correctMoves}</div>
            <div className="text-xs text-gray-400 mt-1">Correct</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="text-2xl font-bold text-red-400">{session.incorrectMoves}</div>
            <div className="text-xs text-gray-400 mt-1">Incorrect</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="text-2xl font-bold text-yellow-400">{session.hintsUsed}</div>
            <div className="text-xs text-gray-400 mt-1">Hints</div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Duration:</span>
            <span className="text-white font-medium">{formatDuration(sessionDuration)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Total Moves:</span>
            <span className="text-white font-medium">{session.totalMoves}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Correct on First Try:</span>
            <span className="text-green-400 font-medium">{session.correctMoves}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Incorrect Moves:</span>
            <span className="text-red-400 font-medium">{session.incorrectMoves}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Hints Used:</span>
            <span className="text-yellow-400 font-medium">{session.hintsUsed}</span>
          </div>
        </div>

        {/* Mistake summary */}
        {hasMistakes && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30">
            <p className="text-sm text-red-300 font-medium">
              {mistakeMoves.length} move{mistakeMoves.length !== 1 ? 's' : ''} had mistakes
            </p>
            <p className="text-xs text-red-300/70 mt-1">
              Total wrong attempts: {moveAttempts.reduce((sum, a) => sum + a.wrongAttempts, 0)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {hasMistakes && onReplayMistakes && (
            <Button
              onClick={onReplayMistakes}
              className="w-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Replay Mistakes
            </Button>
          )}
          {onReplay && (
            <Button
              onClick={onReplay}
              variant="outline"
              className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Replay Game
            </Button>
          )}
          {onNewGame && (
            <Button
              onClick={onNewGame}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              New Game
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
