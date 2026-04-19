'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { useChessSound } from '@/hooks/useChessSound';
import { useGameContext } from '@/lib/GameContext';
import { replayGameToMoveIndex } from '@/lib/pgn-parser';

interface TrainerProps {
  games: Game[];
  initialMode?: TrainingMode;
}

export function Trainer({ games, initialMode = 'train' }: TrainerProps) {
  const router = useRouter();
  const { selectedGame, setSelectedGame, moveIndex, setMoveIndex, saveCompletedGame, markGameExplored, settings, clearGameData, pgnProgress } = useGameContext();
  const { playMoveSound } = useChessSound(settings.soundEnabled);
  const lastExploredGameRef = useRef<string | null>(null);
  const lastAutoCompletedGameRef = useRef<string | null>(null);
  const currentGameIndex = games.findIndex(g => g.id === selectedGame?.id) ?? -1;
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(initialMode);
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [gameState, setGameState] = useState<Chess | null>(null);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [hintUsedCount, setHintUsedCount] = useState(0); // Track hint usage
  const [showMoveComment, setShowMoveComment] = useState(false);
  const [wrongMoveSquares, setWrongMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [correctMoveSquares, setCorrectMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [moveAttempts, setMoveAttempts] = useState<MoveAttempt[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveAttemptedWrong, setMoveAttemptedWrong] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [exploreFen, setExploreFen] = useState<string | null>(null);
  const [moveTransition, setMoveTransition] = useState<{ from: string; to: string; direction?: 'forward' | 'backward' } | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moveIndexRef = useRef(moveIndex);
  const moveAnimationDurationMs = {
    slow: 260,
    normal: 180,
    fast: 120,
  }[settings.animationSpeed];
  const completedGameIds = React.useMemo(
    () => new Set([
      ...games.filter(game => game.completed).map(game => game.id),
      ...pgnProgress.flatMap(progress => Array.from(progress.trainedGames)),
    ]),
    [games, pgnProgress]
  );

  const getBoardFenForGame = useCallback((game: Game | null | undefined, index: number) => {
    if (!game) return new Chess().fen();
    return replayGameToMoveIndex(game, index).fen();
  }, []);

  useEffect(() => {
    moveIndexRef.current = moveIndex;
  }, [moveIndex]);

  useEffect(() => {
    setCompletedGames(completedGameIds);
  }, [completedGameIds]);

  useEffect(() => {
    if (!selectedGame?.id || !sessionComplete || currentSession?.gameId !== selectedGame.id) {
      return;
    }

    if (completedGameIds.has(selectedGame.id)) {
      lastAutoCompletedGameRef.current = selectedGame.id;
      return;
    }

    if (lastAutoCompletedGameRef.current === selectedGame.id) {
      return;
    }

    lastAutoCompletedGameRef.current = selectedGame.id;
    saveCompletedGame(selectedGame.id);
  }, [selectedGame?.id, sessionComplete, currentSession?.gameId, completedGameIds, saveCompletedGame]);

  // Reset exploreFen when switching to explore mode
  useEffect(() => {
    if (trainingMode === 'explore') {
      setExploreFen(null);
      // Mark game as explored when entering explore mode
      if (selectedGame?.id && lastExploredGameRef.current !== selectedGame.id) {
        markGameExplored(selectedGame.id);
        lastExploredGameRef.current = selectedGame.id;
      }
    }
  }, [trainingMode, selectedGame?.id, markGameExplored]);

  // Initialize game state when game is selected or player color changes
  useEffect(() => {
    if (selectedGame) {
      const chess = selectedGame.fen ? new Chess(selectedGame.fen) : new Chess();
      setGameState(chess);
      setIsCorrect(null);
      setHintLevel(0);
      setHintUsedCount(0); // Reset hint counter on new game
      setShowMoveComment(false);
      setMoveAttempts([]);
      setSessionComplete(false);
      setCorrectMoveSquares(null);
      setWrongMoveSquares(null);
      setMoveAttemptedWrong(false);
      
      const newSession: GameSession = {
        gameId: selectedGame.id,
        difficulty,
        moveAttempts: [],
        startTime: Date.now(),
        totalMoves: trainingMode === 'train'
          ? playerColor === 'w'
            ? Math.ceil(Math.max(0, selectedGame.moves.length - moveIndexRef.current) / 2) // White plays ceil(n/2) moves
            : Math.floor(Math.max(0, selectedGame.moves.length - moveIndexRef.current) / 2) // Black plays floor(n/2) moves
          : selectedGame.moves.length, // In explore mode, count all moves
        correctMoves: 0,
        incorrectMoves: 0,
        hintsUsed: 0,
      };
      setCurrentSession(newSession);
      
      if (trainingMode === 'train' && playerColor === 'b' && selectedGame.moves.length > 0) {
        const position = replayGameToMoveIndex(selectedGame, moveIndexRef.current);
        if (position.turn() === 'w') {
          setMessage(`White is playing...`);
          const timer = setTimeout(() => {
            if (moveIndexRef.current < selectedGame.moves.length) {
              setMoveIndex(moveIndexRef.current + 1);
              setMessage(`Playing as Black. Your turn...`);
            }
          }, 1000);
          return () => clearTimeout(timer);
        }
        setMessage(`Playing as Black. Your turn...`);
      } else if (trainingMode === 'explore') {
        setExploreFen(null);
        setMessage('');
      } else {
        setMessage(`Playing as ${playerColor === 'w' ? 'White' : 'Black'}. Your turn...`);
      }
    }
  }, [selectedGame, playerColor, trainingMode, difficulty]);

  // Get current FEN by replaying moves up to moveIndex
  const getCurrentFen = useCallback((): string => {
    if (!selectedGame) {
      return new Chess().fen();
    }
    return getBoardFenForGame(selectedGame, moveIndex);
  }, [selectedGame, moveIndex, getBoardFenForGame]);

  const getCurrentPosition = useCallback((): Chess => {
    if (!selectedGame) {
      return new Chess();
    }
    return replayGameToMoveIndex(selectedGame, moveIndex);
  }, [selectedGame, moveIndex]);

  const getExpectedMove = useCallback((): string | null => {
    if (!selectedGame || moveIndex >= selectedGame.moves.length) {
      return null;
    }
    const currentPos = getCurrentPosition();
    const expectedMove = selectedGame.moves[moveIndex];
    try {
      const result = currentPos.move({
        from: expectedMove.from,
        to: expectedMove.to,
        promotion: expectedMove.promotion,
      });
      return result?.san || null;
    } catch {
      return null;
    }
  }, [selectedGame, moveIndex, getCurrentPosition]);

  const getCurrentMove = useCallback(() => {
    if (!selectedGame || moveIndex <= 0 || moveIndex > selectedGame.moves.length) {
      return null;
    }
    return selectedGame.moves[moveIndex - 1];
  }, [selectedGame, moveIndex]);

  const getCurrentMoveNumber = useCallback(() => {
    if (moveIndex <= 0) return '';
    const isWhiteMove = (moveIndex - 1) % 2 === 0;
    const moveNum = Math.floor((moveIndex - 1) / 2) + 1;
    return isWhiteMove ? `${moveNum}.` : `${moveNum}...`;
  }, [moveIndex]);

  const getHintData = useCallback(() => {
    if (!selectedGame || moveIndex >= selectedGame.moves.length) {
      return { hintSquare: null, hintDestinations: [] };
    }
    const expectedMove = selectedGame.moves[moveIndex];
    return {
      hintSquare: expectedMove.from,
      hintDestinations: [expectedMove.to],
    };
  }, [selectedGame, moveIndex]);

  const handleHint = useCallback(() => {
    // EASY MODE: Unlimited, level 0→piece, level 1→destination
    if (difficulty === 'easy') {
      if (hintLevel < 2) {
        setHintLevel((prev) => Math.min(2, prev + 1) as 0 | 1 | 2);
        setHintUsedCount(prev => prev + 1);
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            hintsUsed: currentSession.hintsUsed + 1,
          });
        }
        if (hintLevel === 0) {
          setMessage('Hint: The highlighted square shows the piece to move.');
        } else if (hintLevel === 1) {
          setMessage('Hint: Move to the highlighted destination.');
        }
      }
      return;
    }
    
    // MEDIUM MODE: Unlimited, only show piece (hintLevel stays 1)
    if (difficulty === 'medium') {
      if (hintLevel === 0) {
        setHintLevel(1);
        setHintUsedCount(prev => prev + 1);
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            hintsUsed: currentSession.hintsUsed + 1,
          });
        }
        setMessage('Hint: The highlighted square shows the piece to move.');
      }
      return;
    }
    
    // HARD MODE: Only one usage total
    if (difficulty === 'hard') {
      if (hintUsedCount === 0) {
        setHintLevel(1);
        setHintUsedCount(1); // Mark as used
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            hintsUsed: currentSession.hintsUsed + 1,
          });
        }
        setMessage('Hint: The highlighted square shows the piece to move. (Last hint)');
      }
    }
  }, [difficulty, hintLevel, hintUsedCount, currentSession]);

  const playOpponentMove = useCallback((currentMoveIndex: number): number => {
    if (!selectedGame) return currentMoveIndex;
    
    const nextMoveIndex = currentMoveIndex;

    const chess = replayGameToMoveIndex(selectedGame, nextMoveIndex);
    if (chess.turn() !== playerColor && nextMoveIndex < selectedGame.moves.length) {
      return nextMoveIndex + 1;
    }
    
    return currentMoveIndex;
  }, [selectedGame, playerColor]);

  const playSoundForMoveIndex = useCallback((moveIndexToPlay: number) => {
    if (!selectedGame || moveIndexToPlay < 0 || moveIndexToPlay >= selectedGame.moves.length) {
      return;
    }

    const move = selectedGame.moves[moveIndexToPlay];
    const tempChess = replayGameToMoveIndex(selectedGame, moveIndexToPlay);
    const result = tempChess.move({ from: move.from, to: move.to, promotion: move.promotion });

    if (!result) {
      return;
    }

    playMoveSound(
      result.captured !== undefined,
      tempChess.inCheck(),
      Boolean(result.flags?.includes('k') || result.flags?.includes('q')),
      result.promotion !== undefined
    );
  }, [selectedGame, playMoveSound]);

  const handleMove = useCallback(
  (move: { from: string; to: string; promotion?: string }) => {
  if (!selectedGame) return;

      const currentPos = getCurrentPosition();

      const legalMoves = currentPos.moves({ verbose: true });
      const isLegalMove = legalMoves.some(
        (m) => m.from === move.from && m.to === move.to
      );

      if (!isLegalMove) {
        setIsCorrect(false);
        setMessage('Invalid move!');
        return;
      }

      if (trainingMode === 'train') {
        const expectedMove = selectedGame.moves[moveIndex];
        
        if (!expectedMove) {
          setMessage('No more moves in this game.');
          setIsCorrect(null);
          return;
        }

        const moveMatches = 
          expectedMove.from === move.from && 
          expectedMove.to === move.to;

        if (moveMatches) {
          setIsCorrect(true);
          setHintLevel(0);
          setShowMoveComment(true);
          
          // Detect special move types for sound
          const tempChess = replayGameToMoveIndex(selectedGame, moveIndex);
          const result = tempChess.move(move);
          const isCapture = result?.captured !== undefined;
          const isCheck = tempChess.inCheck();
          const isCastle = result?.flags?.includes('k') || result?.flags?.includes('q');
          const isPromotion = result?.promotion !== undefined;
          
          // Play appropriate move sound
          playMoveSound(isCapture, isCheck, isCastle, isPromotion);
          
          // Update highlight at same time as move (in same state batch)
          setCorrectMoveSquares({ from: move.from, to: move.to });
          
          const attemptIndex = moveAttempts.findIndex(a => a.moveIndex === moveIndex);
          if (attemptIndex === -1) {
            setMoveAttempts([...moveAttempts, { moveIndex, wrongAttempts: 0 }]);
          }
          
          if (currentSession) {
            setCurrentSession({
              ...currentSession,
              correctMoves: moveAttemptedWrong ? currentSession.correctMoves : currentSession.correctMoves + 1,
              incorrectMoves: moveAttemptedWrong ? currentSession.incorrectMoves + 1 : currentSession.incorrectMoves,
            });
          }
          
          // Reset for next move
          setMoveAttemptedWrong(false);
          setMoveTransition({ from: move.from, to: move.to, direction: 'forward' });
          
          let newIndex = moveIndex + 1;
          
          if (newIndex < selectedGame.moves.length) {
            const opponentIndex = playOpponentMove(newIndex);
            if (opponentIndex > newIndex) {
              setMoveIndex(newIndex);
              setMessage('Correct!');
              
              // Clear highlight after animation duration
              setTimeout(() => {
                setCorrectMoveSquares(null);
              }, moveAnimationDurationMs);
              
              // After opponent move completes, update board state
              setTimeout(() => {
                // Play sound for opponent's move
                playSoundForMoveIndex(newIndex);
                setMoveTransition({ from: selectedGame.moves[newIndex].from, to: selectedGame.moves[newIndex].to, direction: 'forward' });
                setMoveIndex(opponentIndex);
                setShowMoveComment(false);
                if (opponentIndex >= selectedGame.moves.length) {
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
          setMoveTransition({ from: move.from, to: move.to, direction: 'forward' });
          
          // Clear highlight after animation duration
          setTimeout(() => {
            setCorrectMoveSquares(null);
          }, moveAnimationDurationMs);
          
          if (newIndex >= selectedGame.moves.length) {
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
          setIsCorrect(false);
          setWrongMoveSquares({ from: move.from, to: move.to });
          setMessage('Incorrect. Try again.');
          setMoveAttemptedWrong(true);
          
          const attemptIndex = moveAttempts.findIndex(a => a.moveIndex === moveIndex);
          if (attemptIndex === -1) {
            setMoveAttempts([...moveAttempts, { moveIndex, wrongAttempts: 1 }]);
          } else {
            const updated = [...moveAttempts];
            updated[attemptIndex].wrongAttempts += 1;
            setMoveAttempts(updated);
          }
          
          setTimeout(() => {
            setWrongMoveSquares(null);
          }, moveAnimationDurationMs);
        }
      } else {
        // EXPLORE MODE - apply move and check if it matches PGN
        const currentFen = exploreFen || getCurrentFen();
        const exploreChess = new Chess(currentFen);
        const result = exploreChess.move(move);
        
        if (result) {
          setExploreFen(exploreChess.fen());
          
          // Detect special move types for sound
          const isCapture = result.captured !== undefined;
          const isCheck = exploreChess.inCheck();
          const isCastle = result.flags?.includes('k') || result.flags?.includes('q');
          const isPromotion = result.promotion !== undefined;
          
          // Play appropriate move sound
          playMoveSound(isCapture, isCheck, isCastle, isPromotion);
          
          // Check if this move matches the next PGN move
          if (selectedGame && moveIndex < selectedGame.moves.length) {
            const expectedMove = selectedGame.moves[moveIndex];
            // Compare both directions since PGN can store moves as "from-to" or "e2e4"
            const moveMatches = 
              (expectedMove.from === move.from && expectedMove.to === move.to) ||
              (expectedMove.notation === result.san);
            
            if (moveMatches) {
              // Advance through PGN - no auto-play, user plays both sides
              setMoveTransition({ from: move.from, to: move.to, direction: 'forward' });
              setMoveIndex(moveIndex + 1);
              setMessage(`Correct! ${result.san}`);
              setIsCorrect(true);
            } else {
              setMessage(`Moved: ${result.san} (not the PGN move)`);
              setIsCorrect(null);
            }
          } else {
            setMessage(`Moved: ${result.san}`);
            setIsCorrect(null);
          }
        } else {
          setIsCorrect(false);
          setMessage('Invalid move!');
        }
      }
    },
    [selectedGame, moveIndex, trainingMode, playerColor, getCurrentPosition, playOpponentMove, moveAttempts, currentSession, exploreFen, getCurrentFen, playMoveSound, playSoundForMoveIndex]
  );

  const handleSelectGame = useCallback((game: Game) => {
    setSelectedGame(game);
    setMoveIndex(0);
    setTrainingMode('train');
    setPlayerColor('w');
    setExploreFen(null);
    setMoveTransition(null);
    setIsCorrect(null);
    setHintLevel(0);
    setHintUsedCount(0);
    setShowMoveComment(false);
    setMoveAttempts([]);
    setSessionComplete(false);
    setCurrentSession(null);
    setCorrectMoveSquares(null);
    setWrongMoveSquares(null);
    setMoveAttemptedWrong(false);
    setMessage('Playing as White. Your turn...');
  }, [setSelectedGame]);

  const handleModeChange = useCallback((mode: TrainingMode) => {
    setTrainingMode(mode);
    setMoveIndex(0);
    setMoveTransition(null);
    setIsCorrect(null);
    setExploreFen(null);
  }, []);

  const handleColorChange = useCallback((color: PlayerColor) => {
    setPlayerColor(color);
    setMoveIndex(0);
    setMoveTransition(null);
    setIsCorrect(null);
  }, []);

  const handleResetGame = useCallback(() => {
    if (selectedGame) {
      setIsCorrect(null);
      setHintLevel(0);
      setHintUsedCount(0);
      setWrongMoveSquares(null);
      setCorrectMoveSquares(null);
      setMoveAttemptedWrong(false);
      setMoveTransition(null);
      
      if (trainingMode === 'train' && playerColor === 'b' && selectedGame.moves.length > 0) {
        setMoveIndex(0);
        const initialPosition = replayGameToMoveIndex(selectedGame, 0);
        if (initialPosition.turn() === 'w') {
          setMessage(`White is playing...`);
          setTimeout(() => {
            playSoundForMoveIndex(0);
            setMoveTransition({ from: selectedGame.moves[0].from, to: selectedGame.moves[0].to, direction: 'forward' });
            setMoveIndex(1);
            setMessage(`Playing as Black. Your turn...`);
          }, 1000);
        } else {
          setMessage(`Playing as Black. Your turn...`);
        }
      } else if (trainingMode === 'explore') {
        setMoveIndex(0);
        setExploreFen(null);
        setMessage('');
      } else {
        setMoveIndex(0);
        setMessage(`Playing as ${playerColor === 'w' ? 'White' : 'Black'}. Your turn...`);
      }
    }
  }, [selectedGame, playerColor, trainingMode, playSoundForMoveIndex]);

  const handleCompleteGame = useCallback(() => {
    if (selectedGame) {
      saveCompletedGame(selectedGame.id); // Save to context
      lastAutoCompletedGameRef.current = selectedGame.id;
      setMessage('Game marked as complete!');
    }
  }, [selectedGame, saveCompletedGame]);

  const handleNavigateMove = useCallback((index: number) => {
    if (selectedGame && index >= 0 && index <= selectedGame.moves.length) {
      if (trainingMode === 'train' && index > moveIndex) {
        setMessage('Complete the current move to continue');
        return;
      }

      const shouldPlaySound = index !== moveIndex;
      if (index === moveIndex + 1 && selectedGame.moves[moveIndex]) {
        const move = selectedGame.moves[moveIndex];
        const tempChess = replayGameToMoveIndex(selectedGame, moveIndex);
        const result = tempChess.move({ from: move.from, to: move.to, promotion: move.promotion });
        if (shouldPlaySound && result) {
          playMoveSound(
            result.captured !== undefined,
            tempChess.inCheck(),
            Boolean(result.flags?.includes('k') || result.flags?.includes('q')),
            result.promotion !== undefined
          );
        }
        setMoveTransition({ from: move.from, to: move.to, direction: 'forward' });
      } else if (index === moveIndex - 1 && selectedGame.moves[index]) {
        const move = selectedGame.moves[index];
        const tempChess = replayGameToMoveIndex(selectedGame, index);
        const result = tempChess.move({ from: move.from, to: move.to, promotion: move.promotion });
        if (shouldPlaySound && result) {
          playMoveSound(
            result.captured !== undefined,
            tempChess.inCheck(),
            Boolean(result.flags?.includes('k') || result.flags?.includes('q')),
            result.promotion !== undefined
          );
        }
        setMoveTransition({ from: move.from, to: move.to, direction: 'backward' });
      } else {
        setMoveTransition(null);
      }
      
      setMoveIndex(index);
      setIsCorrect(null);
      
      // In explore mode, reset exploreFen to follow PGN when navigating
      if (trainingMode === 'explore') {
        setExploreFen(null);
      }
      
      const currentMove = selectedGame.moves[index - 1];
      if (currentMove) {
        setMessage(`Move ${currentMove.san}`);
      }
    }
  }, [selectedGame, moveIndex, trainingMode, playMoveSound]);

  const handleKeyboardNavigation = useCallback((direction: 'next' | 'prev') => {
    if (trainingMode === 'train' && direction === 'next' && moveIndex >= (selectedGame?.moves.length || 0)) {
      setMessage('Game complete!');
      return;
    }

    if (direction === 'next') {
      handleNavigateMove(Math.min((selectedGame?.moves.length || 0), moveIndex + 1));
    } else {
      handleNavigateMove(Math.max(0, moveIndex - 1));
    }
  }, [selectedGame, moveIndex, trainingMode, handleNavigateMove]);

  const handlePlaybackStart = useCallback(() => {
    if (trainingMode !== 'explore' || !selectedGame) return;
    
    setIsPlaying(true);
    
    const delayMs = (2000 / playbackSpeed);
    let nextIndex = moveIndex + 1;
    
    const playNextMove = () => {
      if (nextIndex <= selectedGame.moves.length) {
        handleNavigateMove(nextIndex);
        nextIndex += 1;
        
        if (nextIndex > selectedGame.moves.length) {
          setIsPlaying(false);
          return;
        }
        
        playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
      }
    };
    
    playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
  }, [trainingMode, selectedGame, moveIndex, playbackSpeed, handleNavigateMove]);

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
    if (isPlaying) {
      handlePlaybackPause();
    }
  }, [isPlaying, handlePlaybackPause]);

  useEffect(() => {
    if (trainingMode === 'train' || !selectedGame) {
      handlePlaybackPause();
    }
  }, [trainingMode, selectedGame, handlePlaybackPause]);

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearTimeout(playbackIntervalRef.current);
      }
    };
  }, []);

  const lastMove = moveIndex > 0 ? selectedGame?.moves[moveIndex - 1] : undefined;
  const currentMove = getCurrentMove();
  const hintData = getHintData();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px_280px]">
        <div className="flex min-w-0 flex-col gap-4">
          {sessionComplete && selectedGame && currentSession && (
            <SessionFeedback
              session={currentSession}
              moveAttempts={moveAttempts}
              onReplay={() => {
                setMoveIndex(0);
                setSessionComplete(false);
                setIsCorrect(null);
              }}
              onNewGame={() => {
                clearGameData();
                router.push('/upload');
              }}
            />
          )}

          <div className="mx-auto flex w-full max-w-[min(100vw,500px)] flex-col items-center gap-3">
            {selectedGame && gameState ? (
              <ChessBoard
                fen={trainingMode === 'explore' && exploreFen ? exploreFen : getCurrentFen()}
                onMove={handleMove}
                onNavigate={handleKeyboardNavigation}
                disabled={moveIndex >= (selectedGame?.moves.length || 0) && trainingMode === 'train'}
                lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : undefined}
                orientation={trainingMode === 'explore' ? boardOrientation : (playerColor === 'w' ? 'white' : 'black')}
                hintSquare={trainingMode === 'train' && hintLevel >= 1 ? hintData.hintSquare : null}
                hintDestinations={trainingMode === 'train' && hintLevel >= 2 ? hintData.hintDestinations : []}
                wrongMoveSquares={wrongMoveSquares}
                moveHighlightTone={trainingMode === 'train' ? 'yellow' : 'green'}
                showMoveHighlight={trainingMode !== 'explore'}
                moveTransition={moveTransition}
                playerColor={trainingMode === 'train' ? playerColor : null}
                boardTheme={settings.boardTheme}
                pieceTheme={settings.pieceTheme}
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800">
                <p className="text-gray-400">Select a game to begin</p>
              </div>
            )}

            {selectedGame && (
              <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
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
    {trainingMode === 'explore' ? `${moveIndex} / ${selectedGame.moves.length}` : ''}
  </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleKeyboardNavigation('next')}
                  disabled={trainingMode === 'train' ? moveIndex >= selectedGame.moves.length : moveIndex >= selectedGame.moves.length}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="Next move"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateMove(selectedGame.moves.length)}
                  disabled={trainingMode === 'train' || moveIndex >= selectedGame.moves.length}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  title="Last move"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                {trainingMode === 'train' && moveIndex < selectedGame.moves.length && (
                  <>
                    <div className="w-px h-6 bg-gray-700 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHint}
                      disabled={
                        difficulty === 'easy' ? hintLevel >= 2 :
                        difficulty === 'medium' ? hintLevel >= 1 :
                        hintUsedCount >= 1
                      }
                      className={`text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 h-8 px-3 gap-1.5 ${
                        hintLevel > 0 ? 'text-amber-400 bg-amber-900/20' : ''
                      }`}
                      title={
                        difficulty === 'hard' && hintUsedCount >= 1 ? 'Hint already used' :
                        hintLevel === 0 ? 'Get a hint' : 'Hint active'
                      }
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-xs">Hint</span>
                    </Button>
                  </>
                )}
              </div>
            )}

            {selectedGame && trainingMode === 'explore' && (
              <PlaybackControls
                isPlaying={isPlaying}
                onPlay={handlePlaybackStart}
                onPause={handlePlaybackPause}
                onReset={handlePlaybackReset}
                speed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                disabled={moveIndex >= selectedGame.moves.length}
              />
            )}

            {selectedGame && (
              <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const prevIndex = Math.max(0, currentGameIndex - 1);
                    if (prevIndex >= 0 && prevIndex < games.length) {
                      handleSelectGame(games[prevIndex]);
                    }
                  }}
                  disabled={currentGameIndex <= 0}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 px-3 gap-1.5"
                  title="Previous game"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Previous</span>
                </Button>
                <span className="text-xs text-gray-400 min-w-[50px] text-center">
                  {currentGameIndex + 1} / {games.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextIndex = currentGameIndex + 1;
                    if (nextIndex < games.length) {
                      handleSelectGame(games[nextIndex]);
                    }
                  }}
                  disabled={currentGameIndex >= games.length - 1}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 px-3 gap-1.5"
                  title="Next game"
                >
                  <span className="text-xs hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selectedGame && currentMove?.comment && trainingMode === 'explore' && (
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

          {selectedGame && (
            <TrainingPanel
              game={selectedGame}
              moveIndex={moveIndex}
              trainingMode={trainingMode}
              playerColor={playerColor}
              message={message}
              isCorrect={isCorrect}
              expectedMove={trainingMode === 'explore' ? getExpectedMove() : null}
              difficulty={difficulty}
              onModeChange={handleModeChange}
              onColorChange={handleColorChange}
              onFlipBoard={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
              onDifficultyChange={setDifficulty}
              onReset={handleResetGame}
              onNavigateMove={handleNavigateMove}
              onCompleteGame={handleCompleteGame}
              isCompleted={completedGames.has(selectedGame.id)}
            />
          )}
        </div>

        {selectedGame && trainingMode === 'explore' && (
          <div className="min-w-0 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Moves & Comments</h3>
            <MovesPanel
              game={selectedGame}
              moveIndex={moveIndex}
              onNavigateMove={handleNavigateMove}
              trainingMode={trainingMode}
              playerColor={playerColor}
            />
          </div>
        )}

        <div className="min-w-0 flex-shrink-0">
          <GameList
            games={games}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
            completedGames={completedGames}
          />
        </div>
      </div>
    </div>
  );
}
