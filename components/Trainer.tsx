'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Game, PlayerColor, TrainingMode } from '@/lib/types';
import { ChessBoard } from './ChessBoard';
import { TrainingPanel } from './TrainingPanel';
import { MovesPanel } from './MovesPanel';
import { GameList } from './GameList';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TrainerProps {
  games: Game[];
}

export function Trainer({ games }: TrainerProps) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('train');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [gameState, setGameState] = useState<Chess | null>(null);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());

  // Initialize game state when game is selected
  useEffect(() => {
    if (currentGame) {
      const chess = new Chess();
      setGameState(chess);
      setIsCorrect(null);
      
      // In train mode, if playing as Black, auto-play White's first move
      if (trainingMode === 'train' && playerColor === 'b' && currentGame.moves.length > 0) {
        setMoveIndex(1); // Start after White's first move
        setMessage(`Playing as Black. Your turn...`);
      } else {
        setMoveIndex(0);
        setMessage(`Playing as ${playerColor === 'w' ? 'White' : 'Black'}. ${playerColor === 'w' ? 'Your turn...' : 'Your turn...'}`);
      }
    }
  }, [currentGame, playerColor, trainingMode]);

  // Get current FEN position by replaying moves
  const getCurrentFen = useCallback((): string => {
    if (!currentGame || !gameState) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const chess = new Chess();
    for (let i = 0; i < moveIndex; i++) {
      if (i < currentGame.moves.length) {
        const move = currentGame.moves[i];
        try {
          chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
        } catch (e) {
          console.error('[v0] Error replaying move:', move, e);
        }
      }
    }
    return chess.fen();
  }, [currentGame, moveIndex]);

  const getCurrentPosition = useCallback((): Chess => {
    const chess = new Chess();
    if (currentGame) {
      for (let i = 0; i < moveIndex; i++) {
        if (i < currentGame.moves.length) {
          const move = currentGame.moves[i];
          try {
            chess.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion,
            });
          } catch (e) {
            console.error('[v0] Error replaying move:', move, e);
          }
        }
      }
    }
    return chess;
  }, [currentGame, moveIndex]);

  const getExpectedMove = useCallback((): string | null => {
    if (!currentGame || moveIndex >= currentGame.moves.length) {
      return null;
    }

    const currentPos = getCurrentPosition();
    const playerToMove = currentPos.turn();

    // Skip moves that don't match our training perspective
    let expectedIndex = moveIndex;
    while (expectedIndex < currentGame.moves.length) {
      const chess = new Chess();
      for (let i = 0; i < expectedIndex; i++) {
        if (i < currentGame.moves.length) {
          const move = currentGame.moves[i];
          chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
        }
      }

      if (chess.turn() === playerColor) {
        return currentGame.moves[expectedIndex]?.san || null;
      }
      expectedIndex++;
    }

    return null;
  }, [currentGame, moveIndex, playerColor]);

  // Get current move and its comment
  const getCurrentMove = useCallback(() => {
    if (!currentGame || moveIndex === 0) {
      return null;
    }
    return currentGame.moves[moveIndex - 1];
  }, [currentGame, moveIndex]);

  // Get move number for display
  const getCurrentMoveNumber = useCallback(() => {
    if (moveIndex === 0) return 0;
    return Math.ceil(moveIndex / 2);
  }, [moveIndex]);

  // Auto-play opponent's move after user makes correct move
  const playOpponentMove = useCallback((currentMoveIndex: number) => {
    if (!currentGame) return currentMoveIndex;
    
    // Check if next move is opponent's move
    const nextMoveIndex = currentMoveIndex;
    if (nextMoveIndex >= currentGame.moves.length) return currentMoveIndex;
    
    // Determine whose turn it is at this position
    const chess = new Chess();
    for (let i = 0; i < nextMoveIndex; i++) {
      if (i < currentGame.moves.length) {
        const m = currentGame.moves[i];
        chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      }
    }
    
    // If it's opponent's turn, auto-play their move
    if (chess.turn() !== playerColor && nextMoveIndex < currentGame.moves.length) {
      return nextMoveIndex + 1; // Skip to after opponent's move
    }
    
    return currentMoveIndex;
  }, [currentGame, playerColor]);

  const handleMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      if (!currentGame) return;

      const currentPos = getCurrentPosition();

      // Validate move is legal
      try {
        const result = currentPos.move(move, { sloppy: false });
        if (!result) {
          setMessage('Invalid move!');
          setIsCorrect(false);
          return;
        }

        // Check if it's training mode and validate against expected move
        if (trainingMode === 'train') {
          const expectedMove = getExpectedMove();

          if (!expectedMove) {
            setMessage('No more moves in this game.');
            setIsCorrect(null);
            return;
          }

          // Find the matching move in the game
          const nextGameMove = currentGame.moves[moveIndex];
          if (
            nextGameMove &&
            nextGameMove.from === move.from &&
            nextGameMove.to === move.to
          ) {
            setIsCorrect(true);
            
            // Move to next position
            let newIndex = moveIndex + 1;
            
            // Auto-play opponent's response after a short delay
            if (newIndex < currentGame.moves.length) {
              const opponentIndex = playOpponentMove(newIndex);
              if (opponentIndex > newIndex) {
                // Show opponent's move with a slight delay for visual feedback
                setMoveIndex(newIndex);
                setMessage('Correct!');
                setTimeout(() => {
                  setMoveIndex(opponentIndex);
                  if (opponentIndex >= currentGame.moves.length) {
                    setMessage('Game complete! Well done!');
                    setIsCorrect(null);
                  } else {
                    setMessage('Your turn...');
                    setIsCorrect(null);
                  }
                }, 400);
                return;
              }
            }
            
            setMoveIndex(newIndex);
            if (newIndex >= currentGame.moves.length) {
              setMessage('Game complete! Well done!');
            } else {
              setMessage('Correct! Your turn...');
            }
          } else {
            setIsCorrect(false);
            setMessage(`Wrong! Expected: ${nextGameMove?.san || 'end of game'}`);
          }
        } else {
          // Explore mode - just advance
          if (moveIndex < currentGame.moves.length) {
            setMoveIndex(moveIndex + 1);
            setMessage(`Moved: ${result.san}`);
            setIsCorrect(null);
          } else {
            setMessage('Game ended.');
            setIsCorrect(null);
          }
        }
      } catch (e) {
        setMessage('Invalid move!');
        setIsCorrect(false);
      }
    },
    [currentGame, moveIndex, trainingMode, playerColor, getExpectedMove, getCurrentPosition, playOpponentMove]
  );

  const handleSelectGame = useCallback((game: Game) => {
    setCurrentGame(game);
    setMoveIndex(0);
    setTrainingMode('train');
    setPlayerColor('w');
  }, []);

  const handleResetGame = useCallback(() => {
    if (currentGame) {
      setMoveIndex(0);
      setMessage(`Resetting game. Playing as ${playerColor === 'w' ? 'White' : 'Black'}.`);
      setIsCorrect(null);
    }
  }, [currentGame, playerColor]);

  const handleCompleteGame = useCallback(() => {
    if (currentGame) {
      const newCompleted = new Set(completedGames);
      newCompleted.add(currentGame.id);
      setCompletedGames(newCompleted);
      setMessage('Game marked as complete!');
    }
  }, [currentGame, completedGames]);

  const handleNavigateMove = useCallback((index: number) => {
    if (currentGame && index >= 0 && index <= currentGame.moves.length) {
      // In TRAIN mode, restrict navigation to moves already played
      if (trainingMode === 'train' && index > moveIndex) {
        setMessage('Complete the current move to continue');
        return;
      }
      
      setMoveIndex(index);
      setIsCorrect(null);
      
      // Update message with new position
      const newPos = new Chess();
      for (let i = 0; i < index; i++) {
        if (i < currentGame.moves.length) {
          const move = currentGame.moves[i];
          newPos.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
        }
      }
      
      const currentMove = currentGame.moves[index - 1];
      if (currentMove) {
        setMessage(`Move ${currentMove.san}`);
      }
    }
  }, [currentGame, moveIndex, trainingMode]);

  // Handle arrow key navigation
  const handleKeyboardNavigation = useCallback((direction: 'next' | 'prev') => {
    if (trainingMode === 'train' && direction === 'next' && moveIndex >= (currentGame?.moves.length || 0)) {
      setMessage('Game complete!');
      return;
    }

    if (direction === 'next') {
      handleNavigateMove(Math.min((currentGame?.moves.length || 0), moveIndex + 1));
    } else {
      handleNavigateMove(Math.max(0, moveIndex - 1));
    }
  }, [currentGame, moveIndex, trainingMode, handleNavigateMove]);

  const lastMove = moveIndex > 0 ? currentGame?.moves[moveIndex - 1] : undefined;
  const currentMove = getCurrentMove();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3">
            {currentGame && gameState ? (
              <ChessBoard
                fen={getCurrentFen()}
                onMove={handleMove}
                onNavigate={handleKeyboardNavigation}
                disabled={moveIndex >= (currentGame?.moves.length || 0) && trainingMode === 'train'}
                lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : undefined}
                orientation={playerColor === 'w' ? 'white' : 'black'}
              />
            ) : (
              <div className="w-full max-w-md aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <p className="text-gray-400">Select a game to begin</p>
              </div>
            )}

            {/* Navigation controls below board */}
            {currentGame && (
              <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateMove(0)}
                  disabled={moveIndex === 0}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="First move"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleKeyboardNavigation('prev')}
                  disabled={moveIndex === 0}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="Previous move"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-400 min-w-[60px] text-center">
                  {moveIndex} / {currentGame.moves.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleKeyboardNavigation('next')}
                  disabled={trainingMode === 'train' ? moveIndex >= currentGame.moves.length : moveIndex >= currentGame.moves.length}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="Next move"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateMove(currentGame.moves.length)}
                  disabled={trainingMode === 'train' || moveIndex >= currentGame.moves.length}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="Last move"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Current move comment display */}
            {currentGame && currentMove?.comment && (
              <div 
                className="w-full max-w-[400px] rounded-lg p-4 border-l-3"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  borderLeft: '3px solid rgba(139, 92, 246, 0.5)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}
                    >
                      {getCurrentMoveNumber()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-purple-300 mb-1">
                      {currentMove.san}
                    </div>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: '#d4c4f5', lineHeight: '1.6' }}
                    >
                      {currentMove.comment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentGame && (
            <TrainingPanel
              game={currentGame}
              moveIndex={moveIndex}
              trainingMode={trainingMode}
              playerColor={playerColor}
              message={message}
              isCorrect={isCorrect}
              expectedMove={getExpectedMove()}
              onModeChange={setTrainingMode}
              onColorChange={setPlayerColor}
              onReset={handleResetGame}
              onNavigateMove={handleNavigateMove}
              onCompleteGame={handleCompleteGame}
              isCompleted={completedGames.has(currentGame.id)}
            />
          )}
        </div>

        {/* Moves and Comments Sidebar - Only show in explore mode */}
        {currentGame && trainingMode === 'explore' && (
          <div className="flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Moves & Comments</h3>
            <MovesPanel
              game={currentGame}
              moveIndex={moveIndex}
              onNavigateMove={handleNavigateMove}
              trainingMode={trainingMode}
              playerColor={playerColor}
            />
          </div>
        )}

        {/* Games List Sidebar */}
        <div className="flex-shrink-0">
          <GameList
            games={games}
            selectedGame={currentGame}
            onSelectGame={handleSelectGame}
            completedGames={completedGames}
          />
        </div>
      </div>
    </div>
  );
}
