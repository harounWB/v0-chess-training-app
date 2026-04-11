'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

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
  draggable?: boolean;
}

interface DragState {
  from: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const LICHESS_PIECE_BASE = 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett';
const PIECE_URLS: Record<string, string> = {
  'wK': `${LICHESS_PIECE_BASE}/wK.svg`,
  'wQ': `${LICHESS_PIECE_BASE}/wQ.svg`,
  'wR': `${LICHESS_PIECE_BASE}/wR.svg`,
  'wB': `${LICHESS_PIECE_BASE}/wB.svg`,
  'wN': `${LICHESS_PIECE_BASE}/wN.svg`,
  'wP': `${LICHESS_PIECE_BASE}/wP.svg`,
  'bK': `${LICHESS_PIECE_BASE}/bK.svg`,
  'bQ': `${LICHESS_PIECE_BASE}/bQ.svg`,
  'bR': `${LICHESS_PIECE_BASE}/bR.svg`,
  'bB': `${LICHESS_PIECE_BASE}/bB.svg`,
  'bN': `${LICHESS_PIECE_BASE}/bN.svg`,
  'bP': `${LICHESS_PIECE_BASE}/bP.svg`,
};

function squareToCoords(square: string, orientation: 'white' | 'black'): { x: number; y: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  
  if (orientation === 'white') {
    return { x: file, y: 7 - rank };
  } else {
    return { x: 7 - file, y: rank };
  }
}

function coordsToSquare(x: number, y: number, orientation: 'white' | 'black'): string | null {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return null;
  
  // x and y are pixel-grid indices (0=left/top, 7=right/bottom).
  // RANKS = ['8','7','6','5','4','3','2','1'], so RANKS[y] maps y=0 → rank 8 (top row).
  // FILES = ['a','b',...,'h'], so FILES[x] maps x=0 → file a (left column) for white.
  if (orientation === 'white') {
    return `${FILES[x]}${RANKS[y]}`;
  } else {
    return `${FILES[7 - x]}${RANKS[7 - y]}`;
  }
}

interface PiecePosition {
  piece: { type: string; color: 'w' | 'b' };
  square: string;
  x: number;
  y: number;
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
  draggable = false,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [animatingFrom, setAnimatingFrom] = useState<string | null>(null);
  const [animatingTo, setAnimatingTo] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({ 
    from: null, 
    startX: 0, 
    startY: 0, 
    currentX: 0, 
    currentY: 0, 
    isDragging: false 
  });
  const boardRef = useRef<HTMLDivElement>(null);
  const prevFenRef = useRef<string>(fen);
  const dragStartTimeRef = useRef<number>(0);
  
  const chess = useMemo(() => new Chess(fen), [fen]);

  // Shake animation on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShakeBoard(true);
      const timeout = setTimeout(() => setShakeBoard(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [wrongMove]);

  // Track the animating piece info (type/color) so we can render a "ghost" during animation
  const [animatingPiece, setAnimatingPiece] = useState<{ type: string; color: string } | null>(null);

  // Detect FEN change and trigger animation
  useEffect(() => {
    if (prevFenRef.current === fen) return;

    try {
      const prevChess = new Chess(prevFenRef.current);
      
      let fromSquare: string | null = null;
      let toSquare: string | null = null;
      let movedPiece: { type: string; color: string } | null = null;

      for (const file of FILES) {
        for (const rank of RANKS) {
          const square = `${file}${rank}`;
          const prevPiece = prevChess.get(square);
          const currPiece = chess.get(square);

          // Piece disappeared from this square (source)
          if (prevPiece && !currPiece) {
            fromSquare = square;
            movedPiece = { type: prevPiece.type, color: prevPiece.color };
          }

          // Piece appeared on this square (destination)
          if (currPiece && !prevPiece) {
            toSquare = square;
          }
        }
      }

      if (fromSquare && toSquare && movedPiece) {
        setAnimatingFrom(fromSquare);
        setAnimatingTo(toSquare);
        setAnimatingPiece(movedPiece);

        // After animation completes, clear state
        const timeout = setTimeout(() => {
          setAnimatingFrom(null);
          setAnimatingTo(null);
          setAnimatingPiece(null);
          prevFenRef.current = fen;
        }, 320);

        return () => clearTimeout(timeout);
      } else {
        prevFenRef.current = fen;
      }
    } catch {
      prevFenRef.current = fen;
    }
  }, [fen, chess]);

  // Get legal moves
  const legalMoves = useMemo(() => {
    const moves: Record<string, string[]> = {};
    const gameMoves = chess.moves({ verbose: true });
    
    gameMoves.forEach((move) => {
      if (!moves[move.from]) {
        moves[move.from] = [];
      }
      moves[move.from].push(move.to);
    });
    
    return moves;
  }, [chess]);

  // Get piece positions
  const piecePositions = useMemo(() => {
    const positions: PiecePosition[] = [];
    for (const file of FILES) {
      for (const rank of RANKS) {
        const square = `${file}${rank}`;
        const piece = chess.get(square);
        if (piece) {
          const coords = squareToCoords(square, orientation);
          positions.push({ piece, square, x: coords.x, y: coords.y });
        }
      }
    }
    return positions;
  }, [chess, orientation]);

  // MOUSE DRAG HANDLERS
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, square: string) => {
      if (disabled || !draggable) return;

      const piece = chess.get(square);
      if (!piece || piece.color !== chess.turn()) return;

      if (!legalMoves[square] || legalMoves[square].length === 0) return;

      dragStartTimeRef.current = Date.now();
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;

      setDragState({
        from: square,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging: true,
      });

      e.preventDefault();
    },
    [disabled, draggable, chess, legalMoves]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !dragState.from) return;

      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));
    },
    [dragState.isDragging, dragState.from]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !dragState.from || !boardRef.current) {
        setDragState({ from: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const squareSize = boardRect.width / 8;
      
      const fileIndex = Math.floor((e.clientX - boardRect.left) / squareSize);
      const rankIndex = Math.floor((e.clientY - boardRect.top) / squareSize);

      const toSquare = coordsToSquare(fileIndex, rankIndex, orientation);

      if (toSquare && legalMoves[dragState.from]?.includes(toSquare)) {
        const piece = chess.get(dragState.from);
        const isPromotion = piece?.type === 'p' && (toSquare[1] === '8' || toSquare[1] === '1');

        onMove({ 
          from: dragState.from, 
          to: toSquare, 
          promotion: isPromotion ? 'q' : undefined 
        });
      }

      setDragState({ from: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
      setSelectedSquare(null);
    },
    [dragState.isDragging, dragState.from, chess, legalMoves, onMove, orientation]
  );

  // TOUCH DRAG HANDLERS
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, square: string) => {
      if (disabled || !draggable) return;

      const piece = chess.get(square);
      if (!piece || piece.color !== chess.turn()) return;

      if (!legalMoves[square] || legalMoves[square].length === 0) return;

      dragStartTimeRef.current = Date.now();
      const touch = e.touches[0];

      setDragState({
        from: square,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isDragging: true,
      });

      // Prevent page scrolling while dragging
      e.preventDefault();
    },
    [disabled, draggable, chess, legalMoves]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !dragState.from) return;

      const touch = e.touches[0];
      setDragState((prev) => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }));

      e.preventDefault();
    },
    [dragState.isDragging, dragState.from]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !dragState.from || !boardRef.current) {
        setDragState({ from: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const squareSize = boardRect.width / 8;

      const touch = e.changedTouches[0];
      const fileIndex = Math.floor((touch.clientX - boardRect.left) / squareSize);
      const rankIndex = Math.floor((touch.clientY - boardRect.top) / squareSize);

      const toSquare = coordsToSquare(fileIndex, rankIndex, orientation);

      if (toSquare && legalMoves[dragState.from]?.includes(toSquare)) {
        const piece = chess.get(dragState.from);
        const isPromotion = piece?.type === 'p' && (toSquare[1] === '8' || toSquare[1] === '1');

        onMove({ 
          from: dragState.from, 
          to: toSquare, 
          promotion: isPromotion ? 'q' : undefined 
        });
      }

      setDragState({ from: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false });
      setSelectedSquare(null);
    },
    [dragState.isDragging, dragState.from, chess, legalMoves, onMove, orientation]
  );

  // Click to move
  const onSquareClick = useCallback(
    (square: string) => {
      if (disabled || dragState.isDragging) return;

      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (!selectedSquare) {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        }
        return;
      }

      if (legalMoves[selectedSquare]?.includes(square)) {
        const piece = chess.get(selectedSquare);
        const isPromotion = piece?.type === 'p' && (square[1] === '8' || square[1] === '1');
        
        onMove({
          from: selectedSquare,
          to: square,
          promotion: isPromotion ? 'q' : undefined,
        });
        setSelectedSquare(null);
      } else {
        const clickedPiece = chess.get(square);
        if (clickedPiece && clickedPiece.color === chess.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    },
    [selectedSquare, chess, disabled, onMove, legalMoves, dragState.isDragging]
  );

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

  // Get dragging piece for visual feedback
  const draggingPieceCoords = dragState.isDragging && dragState.from && boardRef.current 
    ? {
        x: dragState.currentX,
        y: dragState.currentY,
      }
    : null;

  return (
    <div className="flex justify-center w-full select-none">
      <div 
        ref={boardRef}
        className={`rounded-lg overflow-hidden shadow-2xl relative transition-transform ${
          shakeBoard ? 'animate-shake' : ''
        }`}
        style={{ width: '400px', aspectRatio: '1' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Board squares */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {RANKS.map((rank) =>
            FILES.map((file) => {
              const square = `${file}${rank}`;
              const coords = squareToCoords(square, orientation);
              const isLight = (coords.x + coords.y) % 2 === 0;
              const isHighlightedMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isSelected = selectedSquare === square;
              const isValidTarget = selectedSquare && legalMoves[selectedSquare]?.includes(square);
              const hasPieceOnTarget = isValidTarget && chess.get(square);
              const isHintPiece = hintSquare === square;
              const isHintDestination = hintDestinations.includes(square);
              const isWrongMoveFrom = wrongMoveSquares?.from === square;
              const isWrongMoveTo = wrongMoveSquares?.to === square;
              const isCorrectMoveFrom = correctMoveSquares?.from === square;
              const isCorrectMoveTo = correctMoveSquares?.to === square;

              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              
              if (isCorrectMoveFrom || isCorrectMoveTo) {
                bgColor = isLight ? '#a6d5a6' : '#7fb07f';
              } else if (isWrongMoveFrom || isWrongMoveTo) {
                bgColor = isLight ? '#f08080' : '#d9534f';
              } else if (isHintPiece) {
                bgColor = isLight ? '#90caf9' : '#42a5f5';
              } else if (isHintDestination) {
                bgColor = isLight ? '#b3e5fc' : '#4fc3f7';
              } else if (isHighlightedMove) {
                bgColor = isLight ? '#cdd26a' : '#aaa23a';
              } else if (isSelected) {
                bgColor = isLight ? '#f7f769' : '#baca2b';
              }

              const showRank = file === 'a';
              const showFile = rank === '1';

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onTouchStart={(e) => handleTouchStart(e, square)}
                  disabled={disabled}
                  className="relative flex items-center justify-center cursor-pointer disabled:cursor-default transition-colors duration-75"
                  style={{ backgroundColor: bgColor }}
                  aria-label={`Square ${square}`}
                  draggable={false}
                >
                  {showRank && (
                    <span 
                      className="absolute top-1 left-1 font-bold select-none pointer-events-none"
                      style={{ 
                        color: isLight ? '#b58863' : '#f0d9b5',
                        fontSize: '11px',
                      }}
                    >
                      {rank}
                    </span>
                  )}
                  {showFile && (
                    <span 
                      className="absolute bottom-0.5 right-1 font-bold select-none pointer-events-none"
                      style={{ 
                        color: isLight ? '#b58863' : '#f0d9b5',
                        fontSize: '11px',
                      }}
                    >
                      {file}
                    </span>
                  )}

                  {isValidTarget && !hasPieceOnTarget && (
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: '30%',
                        height: '30%',
                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      }}
                    />
                  )}
                  {isValidTarget && hasPieceOnTarget && (
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(transparent 55%, rgba(0, 0, 0, 0.12) 56%)',
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Pieces layer */}
        <div className="absolute inset-0 pointer-events-none">
          {piecePositions.map((pos) => {
            const pieceKey = `${pos.piece.color}${pos.piece.type.toUpperCase()}`;
            const url = PIECE_URLS[pieceKey];
            const isDraggingPiece = dragState.isDragging && dragState.from === pos.square;
            
            // Hide piece at destination during animation (the ghost piece will animate there)
            const isAtAnimationDestination = animatingTo === pos.square && animatingPiece;

            if (!url || isAtAnimationDestination) return null;

            // pos.x and pos.y are 0–7 grid indices. Convert to CSS % (each square = 12.5%)
            let cssLeft = `${pos.x * 12.5}%`;
            let cssTop  = `${pos.y * 12.5}%`;

            if (isDraggingPiece && boardRef.current) {
              const boardRect = boardRef.current.getBoundingClientRect();
              const squareSize = boardRect.width / 8;
              const halfSquare = squareSize / 2;
              const rawLeft = dragState.currentX - boardRect.left - halfSquare;
              const rawTop  = dragState.currentY - boardRect.top  - halfSquare;
              const clampedLeft = Math.max(0, Math.min(boardRect.width  - squareSize, rawLeft));
              const clampedTop  = Math.max(0, Math.min(boardRect.height - squareSize, rawTop));
              cssLeft = `${clampedLeft}px`;
              cssTop  = `${clampedTop}px`;
            }

            return (
              <div
                key={pos.square}
                className={`absolute p-0.5 ${isDraggingPiece ? 'piece-dragging' : ''}`}
                style={{
                  left: cssLeft,
                  top: cssTop,
                  width: '12.5%',
                  height: '12.5%',
                  transition: 'none',
                  transform: isDraggingPiece ? 'scale(1.15)' : 'scale(1)',
                  filter: isDraggingPiece
                    ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  zIndex: isDraggingPiece ? 100 : 10,
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={url}
                  alt={`${pos.piece.color === 'w' ? 'white' : 'black'} ${pos.piece.type}`}
                  className="w-full h-full select-none"
                  draggable={false}
                />
              </div>
            );
          })}

          {/* Animated ghost piece - slides from source to destination using transform */}
          {animatingFrom && animatingTo && animatingPiece && (() => {
            const pieceKey = `${animatingPiece.color}${animatingPiece.type.toUpperCase()}`;
            const url = PIECE_URLS[pieceKey];
            if (!url) return null;

            const fromCoords = squareToCoords(animatingFrom, orientation);
            const toCoords   = squareToCoords(animatingTo,   orientation);

            // Place the ghost at the FROM square, then translate it to the TO square.
            // Using transform:translate is GPU-composited — no teleporting, silky smooth.
            const dx = (toCoords.x - fromCoords.x) * 12.5; // % units
            const dy = (toCoords.y - fromCoords.y) * 12.5;

            return (
              <div
                key="animating-piece"
                className="absolute p-0.5"
                style={{
                  left: `${fromCoords.x * 12.5}%`,
                  top:  `${fromCoords.y * 12.5}%`,
                  width: '12.5%',
                  height: '12.5%',
                  zIndex: 50,
                  pointerEvents: 'none',
                  // Animate the translate from (0,0) → (dx,dy) using a keyframe
                  '--dx': `${dx}%`,
                  '--dy': `${dy}%`,
                  animation: 'pieceSlide 300ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                  willChange: 'transform',
                } as React.CSSProperties}
              >
                <img
                  src={url}
                  alt="moving piece"
                  className="w-full h-full select-none"
                  draggable={false}
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
