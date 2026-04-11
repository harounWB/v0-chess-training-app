'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Game, PlayerColor, TrainingMode, DifficultyLevel, GameSession, MoveAttempt } from '@/lib/types';
import { ChessBoard } from './ChessBoard';
import { TrainingPanel } from './TrainingPanel';
import { MovesPanel } from './MovesPanel';
import { GameList } from './GameList';
import { SessionFeedback } from './SessionFeedback';
import { PlaybackControls } from './PlaybackControls';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Lightbulb } from 'lucide-react';

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
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [showMoveComment, setShowMoveComment] = useState(false);
  const [wrongMoveSquares, setWrongMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [correctMoveSquares, setCorrectMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [moveAttempts, setMoveAttempts] = useState<MoveAttempt[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game state when game is selected or player color changes
  useEffect(() => {
    if (currentGame) {
      const chess = new Chess();
      setGameState(chess);
      setIsCorrect(null);
      setHintLevel(0);
      setShowMoveComment(false);
      setMoveAttempts([]);
      setSessionComplete(false);
      setCorrectMoveSquares(null);
      setWrongMoveSquares(null);
      
      // Create new session
      const newSession: GameSession = {
        gameId: currentGame.id,
        difficulty,
        moveAttempts: [],
        startTime: Date.now(),
        totalMoves: currentGame.moves.length,
        correctMoves: 0,
        totalMistakes: 0,
      };
      setCurrentSession(newSession);
      
      // In train mode, if playing as Black, wait 1 second then auto-play White's first move
      if (trainingMode === 'train' && playerColor === 'b' && currentGame.moves.length > 0) {
        setMoveIndex(0); // Start at beginning
        setMessage(`White is playing...`);
        // Delay 1 second before auto-playing White's first move
        const timer = setTimeout(() => {
          setMoveIndex(1); // Move to after White's first move
          setMessage(`Playing as Black. Your turn...`);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (trainingMode === 'explore') {
        setMoveIndex(0);
        setMessage(''); // No message in explore mode
      } else {
        setMoveIndex(0);
        setMessage(`Playing as ${playerColor === 'w' ? 'White' : 'Black'}. Your turn...`);
      }
    }
  }, [currentGame, playerColor, trainingMode, difficulty]);

  // Get current FEN position by replaying moves
  const getCurrentFen = useCallback((): string => {
    if (!currentGame) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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
        } catch {
          // Skip invalid moves silently
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
          } catch {
            // Skip invalid moves
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

  // Get hint data for current expected move
  const getHintData = useCallback(() => {
    if (!currentGame || moveIndex >= currentGame.moves.length) {
      return { hintSquare: null, hintDestinations: [] };
    }
    
    const expectedMove = currentGame.moves[moveIndex];
    if (!expectedMove) {
      return { hintSquare: null, hintDestinations: [] };
    }
    
    return {
      hintSquare: expectedMove.from,
      hintDestinations: [expectedMove.to],
    };
  }, [currentGame, moveIndex]);

  // Handle hint button click - difficulty aware
  const handleHint = useCallback(() => {
    if (difficulty === 'hard') {
      setMessage('No hints available in Hard mode.');
      return;
    }

    if (difficulty === 'medium') {
      if (hintLevel === 0) {
        setHintLevel(1);
        setMessage('Hint: The highlighted piece should move.');
      } else {
        setMessage('Only one hint in Medium mode.');
      }
    } else {
      // EASY mode - allow both hints
      if (hintLevel === 0) {
        setHintLevel(1);
        setMessage('Hint: The highlighted piece should move.');
      } else if (hintLevel === 1) {
        setHintLevel(2);
        setMessage('Hint: Move to the highlighted square.');
      }
    }
  }, [hintLevel, difficulty]);

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

      // CRITICAL: Validate move is legal FIRST
      const legalMoves = currentPos.moves({ verbose: true });
      const isLegalMove = legalMoves.some(
        (m) => m.from === move.from && m.to === move.to
      );

      if (!isLegalMove) {
        setIsCorrect(false);
        setMessage('Invalid move!');
        return;
      }

      // In training mode, validate against expected move
      if (trainingMode === 'train') {
        // Get the expected move at current position
        const expectedMove = currentGame.moves[moveIndex];
        
        if (!expectedMove) {
          setMessage('No more moves in this game.');
          setIsCorrect(null);
          return;
        }

        // Check if played move matches expected move
        const moveMatches = 
          expectedMove.from === move.from && 
          expectedMove.to === move.to;

        if (moveMatches) {
          // CORRECT MOVE
          setIsCorrect(true);
          setHintLevel(0); // Reset hints
          setShowMoveComment(true); // Show comment after correct move
          setCorrectMoveSquares({ from: move.from, to: move.to });
          
          // Track move attempt
          const attemptIndex = moveAttempts.findIndex(a => a.moveIndex === moveIndex);
          if (attemptIndex === -1) {
            setMoveAttempts([...moveAttempts, { moveIndex, wrongAttempts: 0 }]);
          }
          
          // Update session
          if (currentSession) {
            setCurrentSession({
              ...currentSession,
              correctMoves: currentSession.correctMoves + 1,
            });
          }
          
          // Green highlight clears after animation
          setTimeout(() => {
            setCorrectMoveSquares(null);
          }, 300);
          
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
                setShowMoveComment(false); // Hide comment when it's user's turn again
                if (opponentIndex >= currentGame.moves.length) {
                  // Game complete - show session feedback
                  if (currentSession) {
                    setCurrentSession({
                      ...currentSession,
                      completedAt: Date.now(),
                    });
                  }
                  setSessionComplete(true);
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
            // Game complete - show session feedback
            if (currentSession) {
              setCurrentSession({
                ...currentSession,
                completedAt: Date.now(),
              });
            }
            setSessionComplete(true);
            setMessage('Game complete! Well done!');
          } else {
            setMessage('Correct! Your turn...');
            setShowMoveComment(false);
          }
        } else {
          // WRONG MOVE - do NOT apply it, do NOT reveal answer, track mistake
          setIsCorrect(false);
          setWrongMoveSquares({ from: move.from, to: move.to });
          setMessage('Incorrect. Try again.');
          
          // Track mistake
          const attemptIndex = moveAttempts.findIndex(a => a.moveIndex === moveIndex);
          if (attemptIndex === -1) {
            setMoveAttempts([...moveAttempts, { moveIndex, wrongAttempts: 1 }]);
          } else {
            const updated = [...moveAttempts];
            updated[attemptIndex].wrongAttempts += 1;
            setMoveAttempts(updated);
          }
          
          // Update session mistake count
          if (currentSession) {
            setCurrentSession({
              ...currentSession,
              totalMistakes: currentSession.totalMistakes + 1,
            });
          }
          
          // Clear the wrong move highlighting after 400ms
          setTimeout(() => {
            setWrongMoveSquares(null);
          }, 400);
        }
      } else {
        // EXPLORE MODE - apply move and advance
        const testChess = new Chess(currentPos.fen());
        const result = testChess.move(move, { sloppy: false });
        
        if (result) {
          setMoveIndex(moveIndex + 1);
          setMessage(`Moved: ${result.san}`);
          setIsCorrect(null);
        } else {
          setIsCorrect(false);
          setMessage('Invalid move!');
        }
      }
    },
    [currentGame, moveIndex, trainingMode, playerColor, getCurrentPosition, playOpponentMove]
  );

  const handleSelectGame = useCallback((game: Game) => {
    setCurrentGame(game);
    setMoveIndex(0);
    setTrainingMode('train');
    setPlayerColor('w');
  }, []);

  const handleResetGame = useCallback(() => {
    if (currentGame) {
      setIsCorrect(null);
      setHintLevel(0);
      setWrongMoveSquares(null);
      setCorrectMoveSquares(null);
      
      // When playing as Black in train mode, show White moving then advance
      if (trainingMode === 'train' && playerColor === 'b' && currentGame.moves.length > 0) {
        setMoveIndex(0);
        setMessage(`White is playing...`);
        setTimeout(() => {
          setMoveIndex(1);
          setMessage(`Playing as Black. Your turn...`);
        }, 1000);
      } else if (trainingMode === 'explore') {
        setMoveIndex(0);
        setMessage('');
      } else {
        setMoveIndex(0);
        setMessage(`Playing as ${playerColor === 'w' ? 'White' : 'Black'}. Your turn...`);
      }
    }
  }, [currentGame, playerColor, trainingMode]);

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

  // Playback controls for explore mode
  const handlePlaybackStart = useCallback(() => {
    if (trainingMode !== 'explore' || !currentGame) return;
    
    setIsPlaying(true);
    
    const delayMs = (2000 / playbackSpeed);
    let nextIndex = moveIndex + 1;
    
    const playNextMove = () => {
      if (nextIndex <= currentGame.moves.length) {
        handleNavigateMove(nextIndex);
        nextIndex += 1;
        
        if (nextIndex > currentGame.moves.length) {
          setIsPlaying(false);
          return;
        }
        
        playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
      }
    };
    
    playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
  }, [trainingMode, currentGame, moveIndex, playbackSpeed, handleNavigateMove]);

  const handlePlaybackPause = useCallback(() => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearTimeout(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  const handlePlaybackReset = useCallback(() => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearTimeout(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    handleNavigateMove(0);
  }, [handleNavigateMove]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    
    // If playing, restart with new speed
    if (isPlaying) {
      handlePlaybackPause();
    }
  }, [isPlaying, handlePlaybackPause]);

  // Stop playback when switching modes or games
  useEffect(() => {
    if (trainingMode === 'train' || !currentGame) {
      handlePlaybackPause();
    }
  }, [trainingMode, currentGame, handlePlaybackPause]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearTimeout(playbackIntervalRef.current);
      }
    };
  }, []);

  const lastMove = moveIndex > 0 ? currentGame?.moves[moveIndex - 1] : undefined;
  const currentMove = getCurrentMove();
  const hintData = getHintData();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] gap-6">
        <div className="flex flex-col gap-4">
          {/* Session Feedback - Show when game is complete */}
          {sessionComplete && currentGame && currentSession && (
            <SessionFeedback
              session={currentSession}
              moveAttempts={moveAttempts}
              onReplay={() => {
                setMoveIndex(0);
                setSessionComplete(false);
                setIsCorrect(null);
              }}
              onNewGame={() => {
                setCurrentGame(null);
                setSessionComplete(false);
              }}
            />
          )}

          {/* Chessboard */}
          <div className="flex flex-col items-center gap-3">
            {currentGame && gameState ? (
              <ChessBoard
                fen={getCurrentFen()}
                onMove={handleMove}
                onNavigate={handleKeyboardNavigation}
                disabled={moveIndex >= (currentGame?.moves.length || 0) && trainingMode === 'train'}
                lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : undefined}
                orientation={playerColor === 'w' ? 'white' : 'black'}
                hintSquare={trainingMode === 'train' && hintLevel >= 1 ? hintData.hintSquare : null}
                hintDestinations={trainingMode === 'train' && hintLevel >= 2 ? hintData.hintDestinations : []}
                wrongMove={isCorrect === false}
                wrongMoveSquares={wrongMoveSquares}
                correctMoveSquares={correctMoveSquares}
                draggable={true}
                playerColor={trainingMode === 'train' ? playerColor : null}
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

                {/* Hint button - only in train mode */}
                {trainingMode === 'train' && moveIndex < currentGame.moves.length && (
                  <>
                    <div className="w-px h-6 bg-gray-700 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHint}
                      disabled={hintLevel >= 2}
                      className={`text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 h-8 px-3 gap-1.5 ${
                        hintLevel > 0 ? 'text-amber-400 bg-amber-900/20' : ''
                      }`}
                      title={hintLevel === 0 ? 'Get a hint' : hintLevel === 1 ? 'Show destination' : 'Hint active'}
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-xs">Hint</span>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Playback Controls - only in explore mode */}
            {currentGame && trainingMode === 'explore' && (
              <PlaybackControls
                isPlaying={isPlaying}
                onPlay={handlePlaybackStart}
                onPause={handlePlaybackPause}
                onReset={handlePlaybackReset}
                speed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                disabled={moveIndex >= currentGame.moves.length}
              />
            )}

            {/* Current move comment display - only show after correct move in train mode, or always in explore */}
            {currentGame && currentMove?.comment && (trainingMode === 'explore' || showMoveComment) && (
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
              difficulty={difficulty}
              onModeChange={setTrainingMode}
              onColorChange={setPlayerColor}
              onDifficultyChange={setDifficulty}
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
