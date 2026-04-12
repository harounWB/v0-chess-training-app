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

  // Get square background color
  const getSquareColor = (square: string, isLight: boolean) => {
    // Wrong move - red
    if (wrongMoveSquares && (wrongMoveSquares.from === square || wrongMoveSquares.to === square)) {
      return isLight ? '#f08080' : '#dc3545';
    }
    // Correct move - green
    if (correctMoveSquares && (correctMoveSquares.from === square || correctMoveSquares.to === square)) {
      return isLight ? '#90ee90' : '#28a745';
    }
    // Hint piece - blue
    if (hintSquare === square) {
      return isLight ? '#90caf9' : '#42a5f5';
    }
    // Hint destination - light blue
    if (hintDestinations.includes(square)) {
      return isLight ? '#b3e5fc' : '#4fc3f7';
    }
    // Last move highlight - yellow/green
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      return isLight ? '#f7f769' : '#baca2b';
    }
    // Selected square
    if (selectedSquare === square) {
      return isLight ? '#f7f769' : '#baca2b';
    }
    // Normal square colors
    return isLight ? '#f0d9b5' : '#b58863';
  };

  const squares = getSquares();
  const chess = chessRef.current;

  // Responsive board size
  const [boardSize, setBoardSize] = useState(400);
  const squareSize = boardSize / 8;
  const pieceSize = squareSize * 0.85;

  // Calculate responsive board size
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Mobile: 90% of viewport width, max 500px
      // Desktop: larger, max 600px
      let size: number;
      if (vw < 768) {
        size = Math.min(vw * 0.9, vh * 0.5, 500);
      } else {
        size = Math.min(vw * 0.45, vh * 0.7, 600);
      }
      
      // Ensure it's divisible by 8 for clean squares
      size = Math.floor(size / 8) * 8;
      setBoardSize(Math.max(280, size));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="flex justify-center w-full">
      <div
        ref={boardRef}
        className={`relative grid grid-cols-8 rounded-lg overflow-hidden shadow-2xl select-none ${shaking ? 'animate-shake' : ''}`}
        style={{ 
          width: `${boardSize}px`, 
          height: `${boardSize}px`,
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
              className="relative flex items-center justify-center cursor-pointer aspect-square"
              style={{
                backgroundColor: getSquareColor(square, isLight),
              }}
              onClick={() => handleSquareClick(square)}
              onMouseDown={(e) => piece && handleDragStart(e, square)}
              onTouchStart={(e) => piece && handleDragStart(e, square)}
            >
              {/* Legal move indicator */}
              {isLegalTarget && !isDraggedPiece && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: hasPiece ? '85%' : '30%',
                    height: hasPiece ? '85%' : '30%',
                    backgroundColor: hasPiece ? 'transparent' : 'rgba(0, 0, 0, 0.15)',
                    border: hasPiece ? `${Math.max(3, squareSize * 0.08)}px solid rgba(0, 0, 0, 0.15)` : 'none',
                  }}
                />
              )}

              {/* Piece */}
              {pieceKey && !isDraggedPiece && (
                <img
                  src={PIECE_IMAGES[pieceKey]}
                  alt={pieceKey}
                  className="pointer-events-none"
                  style={{ width: `${pieceSize}px`, height: `${pieceSize}px` }}
                  draggable={false}
                />
              )}

              {/* Coordinate labels */}
              {(orientation === 'white' ? file === 'a' : file === 'h') && (
                <span
                  className="absolute top-0.5 left-1 font-bold pointer-events-none select-none"
                  style={{ 
                    color: isLight ? '#b58863' : '#f0d9b5',
                    fontSize: `${Math.max(10, squareSize * 0.18)}px`,
                  }}
                >
                  {rank}
                </span>
              )}
              {(orientation === 'white' ? rank === '1' : rank === '8') && (
                <span
                  className="absolute bottom-0.5 right-1 font-bold pointer-events-none select-none"
                  style={{ 
                    color: isLight ? '#b58863' : '#f0d9b5',
                    fontSize: `${Math.max(10, squareSize * 0.18)}px`,
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
                  className="w-full h-full drop-shadow-lg"
                  style={{ transform: 'scale(1.1)' }}
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
