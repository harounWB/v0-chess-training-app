'use client';

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { BoardTheme, PieceTheme } from '@/lib/types';

// Chess.com piece sets mapped to the app's existing theme keys.
const PIECE_THEME_FOLDERS: Record<PieceTheme, string> = {
  neo: 'neo',
  alpha: 'classic',
  merida: 'neo_wood',
  lichess: 'cburnett',
};

// Map piece keys to chess.com filenames.
const PIECE_IMAGE_MAP: Record<string, string> = {
  wK: 'wk.png',
  wQ: 'wq.png',
  wR: 'wr.png',
  wB: 'wb.png',
  wN: 'wn.png',
  wP: 'wp.png',
  bK: 'bk.png',
  bQ: 'bq.png',
  bR: 'br.png',
  bB: 'bb.png',
  bN: 'bn.png',
  bP: 'bp.png',
};

const getPieceImage = (pieceKey: string, theme: PieceTheme) =>
  theme === 'lichess'
    ? `/pieces/lichess/${PIECE_THEME_FOLDERS[theme] || 'cburnett'}/${pieceKey}.svg`
    : `/pieces/chesscom/${PIECE_THEME_FOLDERS[theme] || 'neo'}/${PIECE_IMAGE_MAP[pieceKey] || 'wp.png'}`;

const BOARD_THEME_PALETTES: Record<BoardTheme, { light: string; dark: string; border: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863', border: '#8b5a2b' },
  wood: { light: '#e7c48d', dark: '#8b583f', border: '#5c381e' },
  stone: { light: '#d8d3c4', dark: '#6d6a63', border: '#4a4a42' },
  purple: { light: '#dcd1ff', dark: '#6d57a8', border: '#4d3a82' },
  lichess: { light: '#eeeed2', dark: '#769656', border: '#5c7a41' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function getSquareCoordinates(square: string, orientation: 'white' | 'black') {
  const file = square[0];
  const rank = square[1];
  const fileIndex = FILES.indexOf(file);
  const rankIndex = RANKS.indexOf(rank);

  if (fileIndex === -1 || rankIndex === -1) {
    return null;
  }

  return orientation === 'white'
    ? { col: fileIndex, row: rankIndex }
    : { col: 7 - fileIndex, row: 7 - rankIndex };
}

function getPieceKey(piece: { color: 'w' | 'b'; type: string } | null | undefined) {
  return piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
}

interface AnimatedPiece {
  id: string;
  pieceKey: string;
  from: string;
  to: string;
  startLeft: number;
  startTop: number;
  deltaX: number;
  deltaY: number;
  animate: boolean;
}

const MOVE_ANIMATION_MS = 180;

type MoveTransition = {
  from: string;
  to: string;
  direction?: 'forward' | 'backward';
} | null;

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onSquareSelect?: (square: string) => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  onReady?: () => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string };
  orientation?: 'white' | 'black';
  boardOrientation?: 'white' | 'black';
  hintSquare?: string | null;
  hintDestinations?: string[];
  wrongMoveSquares?: { from: string; to: string } | null;
  correctMoveSquares?: { from: string; to: string } | null;
  moveHighlightTone?: 'yellow' | 'green';
  showMoveHighlight?: boolean;
  moveTransition?: MoveTransition;
  playerColor?: 'w' | 'b' | null;
  boardTheme?: BoardTheme;
  pieceTheme?: PieceTheme;
}

function ChessBoardImpl({
  fen,
  onMove,
  onSquareSelect,
  onNavigate,
  onReady,
  disabled = false,
  lastMove,
  orientation = 'white',
  boardOrientation,
  hintSquare,
  hintDestinations = [],
  wrongMoveSquares = null,
  correctMoveSquares = null,
  moveHighlightTone = 'green',
  showMoveHighlight = true,
  moveTransition = null,
  playerColor = null,
  boardTheme = 'classic',
  pieceTheme = 'neo',
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [dragging, setDragging] = useState<{ square: string; x: number; y: number } | null>(null);
  const [animatedPieces, setAnimatedPieces] = useState<AnimatedPiece[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const previousFenRef = useRef(fen);
  const chess = useMemo(() => new Chess(fen), [fen]);
  const effectiveOrientation = boardOrientation ?? orientation ?? 'white';

  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
    setDragging(null);
  }, [fen]);

  useEffect(() => {
    let cancelled = false;

    const pieceKeys = Object.keys(PIECE_IMAGE_MAP);
    Promise.all(
      pieceKeys.map((pieceKey) => new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = async () => {
          try {
            if ('decode' in img) {
              await img.decode();
            }
          } catch {
            // Ignore decode failures; the image already loaded.
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = getPieceImage(pieceKey, pieceTheme || 'neo');
      }))
    ).then(() => {
      if (cancelled) return;
      onReady?.();
    });

    return () => {
      cancelled = true;
    };
  }, [onReady, pieceTheme]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);
  const squareSize = boardSize > 0 ? boardSize / 8 : 0;
  const pieceSize = squareSize * 0.88;

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const nextSize = Math.floor(wrapper.getBoundingClientRect().width);
      setBoardSize((currentSize) => (currentSize === nextSize ? currentSize : nextSize));
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);

    window.addEventListener('orientationchange', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  const clearMoveAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  const getPiecePosition = useCallback((square: string) => {
    const coords = getSquareCoordinates(square, effectiveOrientation);
    if (!coords) return null;
    return {
      left: coords.col * squareSize,
      top: coords.row * squareSize,
    };
  }, [effectiveOrientation, squareSize]);

  const buildMoveAnimations = useCallback((previousFen: string, nextFen: string) => {
    const move = moveTransition;
    if (!move) return [];

    const previousChess = new Chess(previousFen);
    const nextChess = new Chess(nextFen);
    const animated: AnimatedPiece[] = [];
    const isBackward = move.direction === 'backward';
    const startSquare = isBackward ? move.to : move.from;
    const endSquare = isBackward ? move.from : move.to;
    const mainPiece = previousChess.get(startSquare as Square) || nextChess.get(endSquare as Square);

    if (!mainPiece) {
      return animated;
    }

    const start = getPiecePosition(startSquare);
    const end = getPiecePosition(endSquare);
    if (!start || !end) {
      return animated;
    }

    const mainPieceKey = getPieceKey(mainPiece);
    if (!mainPieceKey) {
      return animated;
    }

    animated.push({
      id: `main-${startSquare}-${endSquare}`,
      pieceKey: mainPieceKey,
      from: startSquare,
      to: endSquare,
      startLeft: start.left,
      startTop: start.top,
      deltaX: end.left - start.left,
      deltaY: end.top - start.top,
      animate: false,
    });

    return animated;
  }, [getPiecePosition, moveTransition]);

  useLayoutEffect(() => {
    const previousFen = previousFenRef.current;
    if (previousFen === fen) {
      return;
    }

    previousFenRef.current = fen;
    clearMoveAnimation();

    if (!moveTransition) {
      setAnimatedPieces([]);
      return;
    }

    const nextAnimations = buildMoveAnimations(previousFen, fen);
    if (nextAnimations.length === 0) {
      setAnimatedPieces([]);
      return;
    }

    setAnimatedPieces(nextAnimations);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setAnimatedPieces(nextAnimations.map((piece) => ({ ...piece, animate: true })));
      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatedPieces([]);
        animationTimeoutRef.current = null;
      }, MOVE_ANIMATION_MS);
      animationFrameRef.current = null;
    });

    return clearMoveAnimation;
  }, [buildMoveAnimations, clearMoveAnimation, fen, moveTransition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate?.('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate?.('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  // Get squares in correct order based on orientation
  const getSquares = useCallback(() => {
    const files = effectiveOrientation === 'white' ? FILES : [...FILES].reverse();
    const ranks = effectiveOrientation === 'white' ? RANKS : [...RANKS].reverse();
    const squares: string[] = [];
    for (const rank of ranks) {
      for (const file of files) {
        squares.push(file + rank);
      }
    }
    return squares;
  }, [effectiveOrientation]);

  // Check if a piece can be moved
  const canMovePiece = useCallback((square: string) => {
    const piece = chess.get(square as Square);
    if (!piece) return false;
    if (disabled) return false;
    
    // In training mode, only allow player's pieces
    if (playerColor && piece.color !== playerColor) return false;
    
    // Only allow moving pieces of the side to move
    if (piece.color !== chess.turn()) return false;
    
    return true;
  }, [chess, disabled, playerColor]);

  // Handle clicking a square
  const handleSquareClick = useCallback((square: string) => {
    onSquareSelect?.(square);

    // If a piece is already selected
    if (selectedSquare) {
      // Check if clicking on a legal move target
      if (legalMoves.includes(square)) {
        const piece = chess.get(selectedSquare as Square);
        const isPromotion = piece?.type === 'p' && (square[1] === '8' || square[1] === '1');
        
        onMove({
          from: selectedSquare,
          to: square,
          promotion: isPromotion ? 'q' : undefined,
        });
        
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Clicking on same square deselects
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Try to select a new piece
    if (canMovePiece(square)) {
      const moves = chess.moves({ square: square as Square, verbose: true });
      setSelectedSquare(square);
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [chess, selectedSquare, legalMoves, canMovePiece, onMove]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, square: string) => {
    if (!canMovePiece(square)) return;

    e.preventDefault();
    onSquareSelect?.(square);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragging({ square, x: clientX, y: clientY });
    
    const moves = chess.moves({ square: square as Square, verbose: true });
    setSelectedSquare(square);
    setLegalMoves(moves.map(m => m.to));
  }, [canMovePiece, chess, onSquareSelect]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragging(prev => prev ? { ...prev, x: clientX, y: clientY } : null);
  }, [dragging]);

  // Handle drag end
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !boardRef.current) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    
    let col = Math.floor((clientX - rect.left) / squareSize);
    let row = Math.floor((clientY - rect.top) / squareSize);

    // Clamp to valid range
    col = Math.max(0, Math.min(7, col));
    row = Math.max(0, Math.min(7, row));

    // Convert to square notation based on orientation
    let file: string;
    let rank: string;
    
    if (effectiveOrientation === 'white') {
      file = FILES[col];
      rank = RANKS[row];
    } else {
      file = FILES[7 - col];
      rank = RANKS[7 - row];
    }
    
    const targetSquare = file + rank;

    // Check if valid move
    if (legalMoves.includes(targetSquare)) {
      const piece = chess.get(dragging.square as Square);
      const isPromotion = piece?.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1');

      onMove({
        from: dragging.square,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });
    }

    setDragging(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [chess, dragging, effectiveOrientation, legalMoves, onMove]);

  // Add and remove drag event listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragging, handleDragMove, handleDragEnd]);

  // Get square background color with improved styling
  const getSquareColor = (square: string, isLight: boolean) => {
    // Wrong move - red with gradient
    if (wrongMoveSquares && (wrongMoveSquares.from === square || wrongMoveSquares.to === square)) {
      return isLight
        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
        : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    }
    // Hint piece - blue with gradient
    if (hintSquare === square) {
      return isLight
        ? 'linear-gradient(135deg, #74c0fc 0%, #339af0 100%)'
        : 'linear-gradient(135deg, #228be6 0%, #1971c2 100%)';
    }
    // Hint destination - light blue with gradient
    if (hintDestinations.includes(square)) {
      return isLight
        ? 'linear-gradient(135deg, #a5d8ff 0%, #74c0fc 100%)'
        : 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)';
    }
    // Selected square with gradient
    if (selectedSquare === square) {
      return isLight
        ? 'linear-gradient(135deg, #ffd43b 0%, #fab005 100%)'
        : 'linear-gradient(135deg, #f59f00 0%, #e67700 100%)';
    }
    // Real move highlight follows the board state, so it stays synced with FEN updates.
    if (showMoveHighlight && lastMove && (lastMove.from === square || lastMove.to === square)) {
      if (moveHighlightTone === 'yellow') {
        return isLight
          ? 'linear-gradient(135deg, #fff3bf 0%, #ffe066 100%)'
          : 'linear-gradient(135deg, #ffd43b 0%, #fab005 100%)';
      }
      return isLight
        ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
        : 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
    }
    // Optional transient correct-move flash if a caller still provides one.
    if (correctMoveSquares && (correctMoveSquares.from === square || correctMoveSquares.to === square)) {
      return isLight
        ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
        : 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
    }
    // Normal square colors with improved gradients
    const palette = BOARD_THEME_PALETTES[boardTheme || 'classic'];
    return isLight
      ? palette.light
      : palette.dark;
  };

  const squares = useMemo(() => getSquares(), [getSquares]);
  const animatedSquares = useMemo(() => {
    const squaresSet = new Set<string>();
    for (const piece of animatedPieces) {
      squaresSet.add(piece.to);
    }
    return squaresSet;
  }, [animatedPieces]);
  const boardPalette = BOARD_THEME_PALETTES[boardTheme || 'classic'];
  const boardFrameBackground = boardTheme === 'lichess'
    ? `
      linear-gradient(145deg, #57734a 0%, #40583a 50%, #2e4028 100%),
      radial-gradient(circle at 30% 30%, rgba(111, 149, 93, 0.28) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(31, 45, 28, 0.22) 0%, transparent 50%)
    `
    : `
      linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%),
      radial-gradient(circle at 30% 30%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(74, 44, 23, 0.2) 0%, transparent 50%)
    `;

  return (
    <div ref={wrapperRef} className="mx-auto aspect-square w-full max-w-[min(100vw,500px)] touch-none">
      <div
        ref={boardRef}
        className="relative grid h-full w-full grid-cols-8 overflow-hidden select-none rounded-xl border-4 shadow-2xl"
        style={{
          touchAction: 'none',
          borderColor: boardPalette.border,
          background: boardFrameBackground,
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px ${boardPalette.border}1a,
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
        }}
        >
        {squares.map((square) => {
          const file = square[0];
          const rank = square[1];
          const fileIndex = FILES.indexOf(file);
          const rankIndex = RANKS.indexOf(rank);
          const isLight = (fileIndex + rankIndex) % 2 === 0;
          const piece = chess.get(square as Square);
          const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
          const isDraggedPiece = dragging?.square === square;
          const isLegalTarget = legalMoves.includes(square);
          const hasPiece = !!piece;
          const isAnimatingSquare = animatedSquares.has(square);

          return (
            <div
              key={square}
              className="relative flex aspect-square cursor-pointer items-center justify-center transition-colors duration-150 hover:brightness-[1.02]"
              style={{
                background: getSquareColor(square, isLight),
                boxShadow: isLight
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
              }}
              onClick={() => handleSquareClick(square)}
              onMouseDown={(e) => piece && handleDragStart(e, square)}
              onTouchStart={(e) => piece && handleDragStart(e, square)}
            >
              {/* Legal move indicator */}
              {isLegalTarget && !isDraggedPiece && (
                <div
                  className="absolute rounded-full pointer-events-none transition-all duration-200"
                  style={{
                    width: hasPiece ? '85%' : '30%',
                    height: hasPiece ? '85%' : '30%',
                    backgroundColor: hasPiece ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
                    border: hasPiece ? `${Math.max(3, squareSize * 0.08)}px solid rgba(0, 0, 0, 0.25)` : 'none',
                    boxShadow: hasPiece ? '0 0 8px rgba(0, 0, 0, 0.3)' : '0 0 12px rgba(0, 0, 0, 0.4)',
                  }}
                />
              )}

              {hintSquare === square && (
                <div
                  className="absolute inset-1 rounded-lg pointer-events-none animate-pulse"
                  style={{
                    border: '3px solid rgba(59, 130, 246, 0.95)',
                    boxShadow: '0 0 0 3px rgba(29, 78, 216, 0.25), 0 0 18px rgba(59, 130, 246, 0.45)',
                  }}
                />
              )}

              {/* Piece */}
              {pieceKey && !isDraggedPiece && !isAnimatingSquare && (
                <img
                  src={getPieceImage(pieceKey, pieceTheme || 'neo')}
                  alt={pieceKey}
                  className="pointer-events-none block select-none"
                  style={{
                    width: `${pieceSize}px`,
                    height: `${pieceSize}px`,
                    objectFit: 'contain',
                    filter: hintSquare === square ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.85))' : 'none',
                  }}
                  draggable={false}
                />
              )}

              {/* Coordinate labels */}
              {(effectiveOrientation === 'white' ? file === 'a' : file === 'h') && (
                <span
                  className="absolute top-0.5 left-1 font-bold pointer-events-none select-none drop-shadow-sm"
                  style={{
                    color: isLight ? '#8b4513' : '#f4e4bc',
                    fontSize: `${Math.max(10, squareSize * 0.18)}px`,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {rank}
                </span>
              )}
              {(effectiveOrientation === 'white' ? rank === '1' : rank === '8') && (
                <span
                  className="absolute bottom-0.5 right-1 font-bold pointer-events-none select-none drop-shadow-sm"
                  style={{
                    color: isLight ? '#8b4513' : '#f4e4bc',
                    fontSize: `${Math.max(10, squareSize * 0.18)}px`,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {file}
                </span>
              )}
            </div>
          );
        })}

        {animatedPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute pointer-events-none z-40"
            style={{
              left: `${piece.startLeft}px`,
              top: `${piece.startTop}px`,
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              transform: piece.animate
                ? `translate3d(${piece.deltaX}px, ${piece.deltaY}px, 0)`
                : 'translate3d(0, 0, 0)',
              transition: `transform ${MOVE_ANIMATION_MS}ms linear`,
              willChange: 'transform',
            }}
          >
            <img
              src={getPieceImage(piece.pieceKey, pieceTheme || 'neo')}
              alt={piece.pieceKey}
              className="block h-full w-full select-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          </div>
        ))}

        {/* Dragged piece */}
        {dragging && boardRef.current && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: dragging.x - pieceSize / 2,
              top: dragging.y - pieceSize / 2,
              width: `${pieceSize}px`,
              height: `${pieceSize}px`,
            }}
          >
            {(() => {
              const piece = chess.get(dragging.square as Square);
              const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
              return pieceKey ? (
                <img
                  src={getPieceImage(pieceKey, pieceTheme || 'neo')}
                  alt={pieceKey}
                  className="w-full h-full block select-none"
                  style={{
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              ) : null;
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

export const ChessBoard = React.memo(ChessBoardImpl);
