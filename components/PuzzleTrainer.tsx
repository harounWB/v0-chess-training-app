'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Game, Move } from '@/lib/types';
import { ChessBoard } from './ChessBoard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useGameContext } from '@/lib/GameContext';
import { replayGameToMoveIndex } from '@/lib/pgn-parser';
import { Lightbulb, RotateCcw, Sparkles, Target } from 'lucide-react';
import { useChessSound } from '@/hooks/useChessSound';

const MIN_START_PLY = 8;

interface PuzzleItem {
  game: Game;
  startIndex: number;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], seed: string) {
  const copy = [...items];
  const random = seededRandom(hashString(seed));
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPuzzleStartIndex(game: Game, seed: string) {
  if (game.moves.length <= MIN_START_PLY) return null;

  const minIndex = Math.min(MIN_START_PLY, game.moves.length - 1);
  const candidates = Array.from({ length: game.moves.length - minIndex }, (_, idx) => idx + minIndex);
  if (candidates.length === 0) return null;

  const random = seededRandom(hashString(`${seed}:${game.id}`));
  return candidates[Math.floor(random() * candidates.length)];
}

function formatMoveLabel(move: Move, index: number) {
  const isWhiteMove = index % 2 === 0;
  const moveNumber = Math.floor(index / 2) + 1;
  return `${moveNumber}${isWhiteMove ? '.' : '...'} ${move.san}`;
}

function formatGameTitle(game: Game) {
  return `${game.white} vs ${game.black}`;
}

export function PuzzleTrainer({ games, sessionKey = 'puzzle' }: { games: Game[]; sessionKey?: string }) {
  const { settings } = useGameContext();
  const { playMoveSound } = useChessSound();
  
  // Single chess instance - never recreated
  const gameRef = useRef<Chess | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const correctTimerRef = useRef<number | null>(null);

  const [queue, setQueue] = useState<PuzzleItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Only store minimal state
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState('Loading puzzle...');
  const [gameComplete, setGameComplete] = useState(false);
  const [wrongMove, setWrongMove] = useState(false);
  const [wrongMoveSquares, setWrongMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [correctMoveSquares, setCorrectMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [awaitingAdvance, setAwaitingAdvance] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  const currentPuzzle = queue[currentIndex] || null;
  const expectedMove = currentPuzzle?.game.moves[currentPuzzle.startIndex] || null;
  const boardOrientation = gameRef.current?.turn() === 'w' ? 'white' : 'black';
  const hintDestinations = useMemo(
    () => (hintLevel >= 2 && hintMove ? [hintMove.to] : []),
    [hintLevel, hintMove]
  );

  const lineMoves = useMemo(() => {
    if (!currentPuzzle) return [];
    // Only show last 10 moves for performance
    const allMoves = currentPuzzle.game.moves.slice(0, currentPuzzle.startIndex);
    return allMoves.slice(Math.max(0, allMoves.length - 10));
  }, [currentPuzzle]);

  const clearTimers = useCallback(() => {
    if (wrongTimerRef.current) {
      window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    if (correctTimerRef.current) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
  }, []);

  const goToNextPuzzle = useCallback((reason: 'skip' | 'auto' = 'skip') => {
    clearTimers();
    setWrongMove(false);
    setWrongMoveSquares(null);
    setCorrectMoveSquares(null);
    setHintLevel(0);
    setHintMove(null);
    setAwaitingAdvance(false);
    if (reason === 'skip') {
      setStatus('Skipped puzzle.');
    }

    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= queue.length) {
        setGameComplete(true);
        setStatus('All puzzles complete. Nice work.');
        return prev;
      }
      return nextIndex;
    });
  }, [clearTimers, queue.length]);

  const buildQueue = useCallback((sourceGames: Game[]) => {
    const items = sourceGames
      .map((game): PuzzleItem | null => {
        const startIndex = getPuzzleStartIndex(game, sessionKey);
        if (startIndex === null) return null;
        return { game, startIndex };
      })
      .filter((item): item is PuzzleItem => item !== null);

    return shuffle(items, sessionKey);
  }, [sessionKey]);

  const loadCurrentPuzzle = useCallback((item: PuzzleItem) => {
    clearTimers();

    // Initialize chess instance once, reuse it
    if (!gameRef.current) {
      gameRef.current = new Chess();
    }

    // Replay to the starting position
    const chess = replayGameToMoveIndex(item.game, item.startIndex);
    gameRef.current = chess;

    setBoardFen(chess.fen());
    setHintLevel(0);
    setHintMove(null);
    setStatus(`Puzzle ${currentIndex + 1} of ${queue.length}: ${formatGameTitle(item.game)}`);
    setGameComplete(false);
    setWrongMove(false);
    setWrongMoveSquares(null);
    setCorrectMoveSquares(null);
    setAwaitingAdvance(false);
  }, [clearTimers, currentIndex, queue.length]);

  useEffect(() => {
    setQueue(buildQueue(games));
    setCurrentIndex(0);
    setSolvedCount(0);
    setGameComplete(false);
  }, [buildQueue, games]);

  useEffect(() => {
    if (queue.length === 0) {
      setGameComplete(true);
      setStatus('No eligible puzzles were found in the selected PGNs.');
      return;
    }

    const item = queue[currentIndex];
    if (!item) {
      setGameComplete(true);
      setStatus('All puzzles complete. Nice work.');
      return;
    }

    loadCurrentPuzzle(item);
  }, [currentIndex, loadCurrentPuzzle, queue]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    if (!currentPuzzle || !gameRef.current || gameComplete || awaitingAdvance || wrongMove) return;

    const chess = gameRef.current;
    const legalMoves = chess.moves({ verbose: true });
    
    // Check if move is legal
    const isLegal = legalMoves.some(candidate =>
      candidate.from === move.from &&
      candidate.to === move.to &&
      (candidate.promotion || undefined) === (move.promotion || undefined)
    );

    if (!isLegal || !expectedMove) {
      return;
    }

    // Check if move matches expected move
    const matches = expectedMove.from === move.from
      && expectedMove.to === move.to
      && (expectedMove.promotion || undefined) === (move.promotion || undefined);

    // IMPORTANT: Apply the move to the chess instance FIRST
    let result;
    try {
      result = chess.move(move);
    } catch {
      return;
    }

    if (!result) {
      return;
    }

    // Clear hints
    setHintLevel(0);
    setHintMove(null);

    // Handle wrong move - show it briefly then undo
    if (!matches) {
      clearTimers();
      setWrongMove(true);
      setWrongMoveSquares({ from: result.from, to: result.to });
      setStatus('Wrong move');
      // Update board to show the wrong move
      setBoardFen(chess.fen());

      wrongTimerRef.current = window.setTimeout(() => {
        // Undo the move after 2 seconds
        chess.undo();
        setBoardFen(chess.fen());
        setWrongMove(false);
        setWrongMoveSquares(null);
        setStatus('Try again.');
      }, 2000);
      return;
    }

    // Correct move - play sound
    playMoveSound(
      result.captured !== undefined,
      chess.inCheck(),
      Boolean(result.flags?.includes('k') || result.flags?.includes('q')),
      result.promotion !== undefined
    );

    // Update board immediately
    setBoardFen(chess.fen());
    setCorrectMoveSquares({ from: result.from, to: result.to });
    setWrongMoveSquares(null);
    setStatus(`Correct: ${result.san}`);
    setSolvedCount(prev => prev + 1);
    setAwaitingAdvance(true);

    correctTimerRef.current = window.setTimeout(() => {
      setCorrectMoveSquares(null);
      goToNextPuzzle('auto');
    }, 2000);
  }, [clearTimers, currentPuzzle, expectedMove, gameComplete, goToNextPuzzle, playMoveSound, wrongMove]);

  const handleHint = useCallback(() => {
    if (!expectedMove || gameComplete) return;

    setHintMove({ from: expectedMove.from, to: expectedMove.to });
    setHintLevel(1);
    setStatus('Hint: blue square shows the piece to move.');
  }, [expectedMove, gameComplete]);

  const handleSquareSelect = useCallback((square: string) => {
    if (expectedMove && hintLevel > 0 && square === expectedMove.from) {
      setHintLevel(0);
    }
  }, [expectedMove, hintLevel]);

  const handleReplayPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    loadCurrentPuzzle(currentPuzzle);
  }, [currentPuzzle, loadCurrentPuzzle]);

  const handleNextPuzzle = useCallback(() => {
    if (gameRef.current) {
      clearTimers();
      setCorrectMoveSquares(null);
      setWrongMove(false);
      setWrongMoveSquares(null);
      setHintLevel(0);
      setHintMove(null);
      setAwaitingAdvance(false);
      setBoardFen(gameRef.current.fen());
    }
    goToNextPuzzle();
  }, [clearTimers, goToNextPuzzle]);

  if (queue.length === 0) {
    return (
      <Card className="border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-300">{status}</p>
      </Card>
    );
  }

  if (gameComplete && solvedCount >= queue.length && queue.length > 0) {
    return (
      <Card className="border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">Puzzle complete</h2>
        <p className="mt-2 text-sm text-gray-400">
          You solved {solvedCount} {solvedCount === 1 ? 'puzzle' : 'puzzles'}.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[800px] flex items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-emerald-400" />
                Puzzle Mode
              </div>
              <p className="text-xs text-gray-400 truncate">
                Guess the next move from the loaded repertoire position.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleHint}
              disabled={!expectedMove || gameComplete}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Hint
            </Button>
          </div>

          <Card className="w-full max-w-[800px] p-4 bg-gray-900 border-gray-800">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>{status}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {currentPuzzle ? formatGameTitle(currentPuzzle.game) : 'Waiting for the next puzzle...'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Puzzles: {Math.min(currentIndex + 1, queue.length)}/{queue.length}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Solved: {solvedCount}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Hint: {hintLevel === 0 ? 'Off' : hintLevel === 1 ? 'Piece' : 'Destination'}
                </span>
              </div>
            </div>
          </Card>

          <ChessBoard
            fen={boardFen}
            onMove={handleMove}
            onSquareSelect={handleSquareSelect}
            disabled={gameComplete || awaitingAdvance || wrongMove}
            boardOrientation={boardOrientation}
            hintSquare={hintLevel >= 1 && hintMove ? hintMove.from : null}
            hintDestinations={hintDestinations}
            wrongMoveSquares={wrongMoveSquares}
            correctMoveSquares={correctMoveSquares}
            boardTheme={settings.boardTheme}
            pieceTheme={settings.pieceTheme}
            lastMove={correctMoveSquares || undefined}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-4 bg-gray-900 border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-3">Line so far</h3>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {lineMoves.length === 0 ? (
                <p className="text-sm text-gray-500">The puzzle starts from the initial position.</p>
              ) : (
                lineMoves.map((move, index) => (
                  <div key={`${move.san}-${index}`} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                    <div className="text-sm text-gray-200">
                      {formatMoveLabel(move, index)}
                    </div>
                    {move.comment && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-400">
                        {move.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-3">Puzzle controls</h3>
            <div className="space-y-3">
              <Button
                onClick={handleReplayPuzzle}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Replay Puzzle
              </Button>

              {wrongMove && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
                  <p className="text-sm text-red-200">That was the wrong move.</p>
                </div>
              )}

              {gameComplete && (
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-200">
                  All puzzles are done. You solved {solvedCount} {solvedCount === 1 ? 'puzzle' : 'puzzles'}.
                </div>
              )}

              {expectedMove && !gameComplete && (
                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-gray-400">
                  Hint stays on the board until you click the hinted piece.
                </div>
              )}

              <Button
                onClick={handleNextPuzzle}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Next Puzzle
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
