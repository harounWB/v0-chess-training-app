'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';

// Piece images from chess.com style
const PIECE_IMAGES: Record<string, string> = {
  wK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png',
  wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
  wR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
  wB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
  wN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
  wP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
  bK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png',
  bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
  bR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
  bB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
  bN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
  bP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string };
  orientation?: 'white' | 'black';
  hintSquare?: string | null;
  hintDestinations?: string[];
  wrongMove?: boolean;
  wrongMoveSquares?: { from: string; to: string } | null;
  correctMoveSquares?: { from: string; to: string } | null;
  playerColor?: 'w' | 'b' | null;
}

export function ChessBoard({
  fen,
  onMove,
  onNavigate,
  disabled = false,
  lastMove,
  orientation = 'white',
  hintSquare,
  hintDestinations = [],
  wrongMove = false,
  wrongMoveSquares = null,
  correctMoveSquares = null,
  playerColor = null,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [dragging, setDragging] = useState<{ square: string; x: number; y: number } | null>(null);
  const [shaking, setShaking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess(fen));

  // Update chess instance when FEN changes
  useEffect(() => {
    chessRef.current = new Chess(fen);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [fen]);

  // Shake animation on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wrongMove]);

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
    const files = orientation === 'white' ? FILES : [...FILES].reverse();
    const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();
    const squares: string[] = [];
    for (const rank of ranks) {
      for (const file of files) {
        squares.push(file + rank);
      }
    }
    return squares;
  }, [orientation]);

  // Check if a piece can be moved
  const canMovePiece = useCallback((square: string) => {
    const chess = chessRef.current;
    const piece = chess.get(square as Square);
    if (!piece) return false;
    if (disabled) return false;
    
    // In training mode, only allow player's pieces
    if (playerColor && piece.color !== playerColor) return false;
    
    // Only allow moving pieces of the side to move
    if (piece.color !== chess.turn()) return false;
    
    return true;
  }, [disabled, playerColor]);

  // Handle clicking a square
  const handleSquareClick = useCallback((square: string) => {
    const chess = chessRef.current;

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
  }, [selectedSquare, legalMoves, canMovePiece, onMove]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, square: string) => {
    if (!canMovePiece(square)) return;

    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragging({ square, x: clientX, y: clientY });
    
    const chess = chessRef.current;
    const moves = chess.moves({ square: square as Square, verbose: true });
    setSelectedSquare(square);
    setLegalMoves(moves.map(m => m.to));
  }, [canMovePiece]);

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
    
    if (orientation === 'white') {
      file = FILES[col];
      rank = RANKS[row];
    } else {
      file = FILES[7 - col];
      rank = RANKS[7 - row];
    }
    
    const targetSquare = file + rank;

    // Check if valid move
    if (legalMoves.includes(targetSquare)) {
      const chess = chessRef.current;
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
  }, [dragging, legalMoves, onMove, orientation]);

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
    // Correct move - green with gradient
    if (correctMoveSquares && (correctMoveSquares.from === square || correctMoveSquares.to === square)) {
      return isLight
        ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
        : 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
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
    // Last move highlight - yellow/green with gradient
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      return isLight
        ? 'linear-gradient(135deg, #ffd43b 0%, #fab005 100%)'
        : 'linear-gradient(135deg, #f59f00 0%, #e67700 100%)';
    }
    // Selected square with gradient
    if (selectedSquare === square) {
      return isLight
        ? 'linear-gradient(135deg, #ffd43b 0%, #fab005 100%)'
        : 'linear-gradient(135deg, #f59f00 0%, #e67700 100%)';
    }
    // Normal square colors with improved gradients
    return isLight
      ? 'linear-gradient(135deg, #f8f1e8 0%, #ede3d6 50%, #e8dcc8 100%)'
      : 'linear-gradient(135deg, #c4a57c 0%, #b8956a 50%, #a67c52 100%)';
  };

  const squares = getSquares();
  const chess = chessRef.current;

  // Responsive board size
  const [boardSize, setBoardSize] = useState(480);
  const squareSize = boardSize / 8;
  const pieceSize = squareSize * 0.85;

  // Calculate responsive board size with better mobile support
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Mobile: 95% of viewport width, max 600px
      // Desktop: larger, max 800px for better detail
      let size: number;
      if (vw < 768) {
        size = Math.min(vw * 0.95, vh * 0.6, 600);
      } else {
        size = Math.min(vw * 0.45, vh * 0.7, 800);
      }

      // Ensure it's divisible by 8 for clean squares
      size = Math.floor(size / 8) * 8;
      setBoardSize(Math.max(360, size));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="flex justify-center w-full">
      <div
        ref={boardRef}
        className={`relative grid grid-cols-8 rounded-xl overflow-hidden select-none border-4 border-amber-800/30 shadow-2xl ${shaking ? 'animate-shake' : ''}`}
        style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
          touchAction: 'none',
          background: `
            linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%),
            radial-gradient(circle at 30% 30%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(74, 44, 23, 0.2) 0%, transparent 50%)
          `,
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(184, 134, 11, 0.1),
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

          return (
            <div
              key={square}
              className="relative flex items-center justify-center cursor-pointer aspect-square transition-all duration-150 hover:brightness-105 active:scale-95"
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

              {/* Piece */}
              {pieceKey && !isDraggedPiece && (
                <img
                  src={PIECE_IMAGES[pieceKey]}
                  alt={pieceKey}
                  className="pointer-events-none drop-shadow-sm"
                  style={{
                    width: `${pieceSize}px`,
                    height: `${pieceSize}px`,
                    filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))',
                  }}
                  draggable={false}
                />
              )}

              {/* Coordinate labels */}
              {(orientation === 'white' ? file === 'a' : file === 'h') && (
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
              {(orientation === 'white' ? rank === '1' : rank === '8') && (
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
                  src={PIECE_IMAGES[pieceKey]}
                  alt={pieceKey}
                  className="w-full h-full"
                  style={{
                    transform: 'scale(1.15)',
                    filter: `
                      drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.4))
                      drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))
                    `,
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
