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
  /** When set, only this color's pieces can ever be interacted with (train mode). */
  playerColor?: 'w' | 'b' | null;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Drag is only activated after moving this many pixels from the mousedown point
const DRAG_THRESHOLD = 6;

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
  const file = square.charCodeAt(0) - 97; // a=0 … h=7
  const rank = parseInt(square[1]) - 1;   // 1=0 … 8=7

  if (orientation === 'white') {
    return { x: file, y: 7 - rank }; // rank 8 → row 0 (top)
  } else {
    // Black orientation: flip both axes
    return { x: 7 - file, y: rank };
  }
}

function coordsToSquare(x: number, y: number, orientation: 'white' | 'black'): string | null {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return null;
  
  if (orientation === 'white') {
    // White: normal mapping
    const file = FILES[x];           // x: 0→a, 7→h
    const rank = RANKS[y];           // y: 0→8, 7→1
    return `${file}${rank}`;
  } else {
    // Black: invert both axes to flip the board coordinates
    const file = FILES[7 - x];       // x: 0→h, 7→a
    const rank = RANKS[7 - y];       // y: 0→1, 7→8
    return `${file}${rank}`;
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
  draggable = true,
  playerColor = null,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);

  // Drag state — isDragging is only true after threshold is exceeded
  const pendingDragRef = useRef<{
    from: string;
    startX: number;
    startY: number;
  } | null>(null);

  const [dragState, setDragState] = useState<{
    from: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const chess = useMemo(() => new Chess(fen), [fen]);

  // Clear selected square when FEN changes (move was made)
  const prevFenRef = useRef(fen);
  useEffect(() => {
    if (prevFenRef.current !== fen) {
      prevFenRef.current = fen;
      setSelectedSquare(null);
    }
  }, [fen]);

  // Shake on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShakeBoard(true);
      const t = setTimeout(() => setShakeBoard(false), 300);
      return () => clearTimeout(t);
    }
  }, [wrongMove]);

  // Legal moves map: from → to[]
  const legalMoves = useMemo(() => {
    const map: Record<string, string[]> = {};
    chess.moves({ verbose: true }).forEach((m) => {
      if (!map[m.from]) map[m.from] = [];
      map[m.from].push(m.to);
    });
    return map;
  }, [chess]);

  // Piece positions
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

  const tryMove = useCallback(
    (from: string, to: string) => {
      if (!legalMoves[from]?.includes(to)) return;
      const piece = chess.get(from);
      const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
      onMove({ from, to, promotion: isPromotion ? 'q' : undefined });
    },
    [chess, legalMoves, onMove]
  );

  // ─── CLICK TO MOVE ────────────────────────────────────────────────────────
  const onSquareClick = useCallback(
    (square: string) => {
      if (disabled) return;

      // Deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Complete a move
      if (selectedSquare && legalMoves[selectedSquare]?.includes(square)) {
        tryMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      // Select a piece
      // If playerColor is set, only that color's pieces can ever be selected.
      // Additionally the piece must belong to the side whose turn it currently is.
      const piece = chess.get(square);
      const isPlayersPiece = playerColor ? piece?.color === playerColor : true;
      if (piece && isPlayersPiece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        return;
      }

      // Clicked on an empty or opponent square with nothing selected
      setSelectedSquare(null);
    },
    [selectedSquare, chess, disabled, legalMoves, tryMove, playerColor]
  );

  // ─── DRAG (MOUSE) ─────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, square: string) => {
      if (disabled || !draggable) return;
      const piece = chess.get(square);
      if (!piece) return;
      // Only allow dragging the player's own pieces when they are to move
      if (playerColor && piece.color !== playerColor) return;
      if (piece.color !== chess.turn()) return;
      if (!legalMoves[square]?.length) return;

      // Record the potential drag start — don't commit yet
      pendingDragRef.current = { from: square, startX: e.clientX, startY: e.clientY };
      e.preventDefault();
    },
    [disabled, draggable, chess, legalMoves, playerColor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState) {
        // Already dragging — update position
        setDragState((prev) => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        return;
      }

      if (!pendingDragRef.current) return;

      const { startX, startY, from } = pendingDragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        // Threshold crossed — begin drag
        setSelectedSquare(from); // highlight source + show dots
        setDragState({ from, currentX: e.clientX, currentY: e.clientY });
        pendingDragRef.current = null;
      }
    },
    [dragState]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragState && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const sq = boardRect.width / 8;
        const col = Math.floor((e.clientX - boardRect.left) / sq);
        const row = Math.floor((e.clientY - boardRect.top) / sq);
        const toSquare = coordsToSquare(col, row, orientation);
        if (toSquare) tryMove(dragState.from, toSquare);
        setDragState(null);
        setSelectedSquare(null);
      }
      pendingDragRef.current = null;
    },
    [dragState, orientation, tryMove]
  );

  // ─── DRAG (TOUCH) ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, square: string) => {
      if (disabled || !draggable) return;
      const piece = chess.get(square);
      if (!piece) return;
      // Only allow dragging the player's own pieces when they are to move
      if (playerColor && piece.color !== playerColor) return;
      if (piece.color !== chess.turn()) return;
      if (!legalMoves[square]?.length) return;

      const t = e.touches[0];
      pendingDragRef.current = { from: square, startX: t.clientX, startY: t.clientY };
      e.preventDefault();
    },
    [disabled, draggable, chess, legalMoves, playerColor]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];

      if (dragState) {
        setDragState((prev) => prev ? { ...prev, currentX: t.clientX, currentY: t.clientY } : null);
        e.preventDefault();
        return;
      }

      if (!pendingDragRef.current) return;

      const { startX, startY, from } = pendingDragRef.current;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        setSelectedSquare(from);
        setDragState({ from, currentX: t.clientX, currentY: t.clientY });
        pendingDragRef.current = null;
        e.preventDefault();
      }
    },
    [dragState]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (dragState && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const sq = boardRect.width / 8;
        const t = e.changedTouches[0];
        const col = Math.floor((t.clientX - boardRect.left) / sq);
        const row = Math.floor((t.clientY - boardRect.top) / sq);
        const toSquare = coordsToSquare(col, row, orientation);
        if (toSquare) tryMove(dragState.from, toSquare);
        setDragState(null);
        setSelectedSquare(null);
      }
      pendingDragRef.current = null;
    },
    [dragState, orientation, tryMove]
  );

  // ─── KEYBOARD NAV ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNavigate?.('next'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onNavigate?.('prev'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  // The square that is "active" — either via click selection or drag source
  const activeSquare = dragState?.from ?? selectedSquare;
  const activeLegalTargets = activeSquare ? (legalMoves[activeSquare] ?? []) : [];

  return (
    <div className="flex justify-center w-full select-none">
      <div
        ref={boardRef}
        className={`rounded-lg overflow-hidden shadow-2xl relative ${shakeBoard ? 'animate-shake' : ''}`}
        style={{ width: '400px', aspectRatio: '1', cursor: dragState ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Board squares ─────────────────────────────────────────── */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {RANKS.map((rank) =>
            FILES.map((file) => {
              const square = `${file}${rank}`;
              const coords = squareToCoords(square, orientation);
              const isLight = (coords.x + coords.y) % 2 === 0;
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isSelected = activeSquare === square;
              const isTarget = activeLegalTargets.includes(square);
              const hasPiece = !!chess.get(square);
              const isHintPiece = hintSquare === square;
              const isHintDest = hintDestinations.includes(square);
              const isWrongFrom = wrongMoveSquares?.from === square;
              const isWrongTo = wrongMoveSquares?.to === square;
              const isCorrectFrom = correctMoveSquares?.from === square;
              const isCorrectTo = correctMoveSquares?.to === square;

              let bgColor = isLight ? '#f0d9b5' : '#b58863';

              if (isCorrectFrom || isCorrectTo) {
                bgColor = isLight ? '#a6d5a6' : '#7fb07f';
              } else if (isWrongFrom || isWrongTo) {
                bgColor = isLight ? '#f08080' : '#d9534f';
              } else if (isHintPiece) {
                bgColor = isLight ? '#90caf9' : '#42a5f5';
              } else if (isHintDest) {
                bgColor = isLight ? '#b3e5fc' : '#4fc3f7';
              } else if (isLastMove) {
                bgColor = isLight ? '#cdd26a' : '#aaa23a';
              } else if (isSelected) {
                bgColor = isLight ? '#f7f769' : '#baca2b';
              }

              // Determine display position based on orientation
              let displayRank = rank;
              let displayFile = file;
              if (orientation === 'black') {
                // Reverse the display coordinates
                displayRank = String(9 - parseInt(rank));
                displayFile = String.fromCharCode(104 - displayFile.charCodeAt(0)); // 'h'=104, 'a'=97
              }

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onTouchStart={(e) => handleTouchStart(e, square)}
                  disabled={disabled}
                  className="relative flex items-center justify-center cursor-pointer disabled:cursor-default"
                  style={{ backgroundColor: bgColor }}
                  aria-label={`Square ${square}`}
                  draggable={false}
                >
                  {/* Rank label */}
                  {(orientation === 'white' ? file === 'a' : file === 'h') && (
                    <span
                      className="absolute top-0.5 left-1 font-bold pointer-events-none select-none"
                      style={{ color: isLight ? '#b58863' : '#f0d9b5', fontSize: '11px' }}
                    >
                      {displayRank}
                    </span>
                  )}
                  {/* File label */}
                  {(orientation === 'white' ? rank === '1' : rank === '8') && (
                    <span
                      className="absolute bottom-0.5 right-1 font-bold pointer-events-none select-none"
                      style={{ color: isLight ? '#b58863' : '#f0d9b5', fontSize: '11px' }}
                    >
                      {displayFile}
                    </span>
                  )}

                  {/* Move dot — empty square */}
                  {isTarget && !hasPiece && (
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{ width: '32%', height: '32%', backgroundColor: 'rgba(0,0,0,0.15)' }}
                    />
                  )}
                  {/* Capture ring — occupied square */}
                  {isTarget && hasPiece && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        borderRadius: '50%',
                        background: 'radial-gradient(transparent 56%, rgba(0,0,0,0.15) 57%)',
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Pieces ────────────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {piecePositions.map((pos) => {
            const pieceKey = `${pos.piece.color}${pos.piece.type.toUpperCase()}`;
            const url = PIECE_URLS[pieceKey];
            if (!url) return null;

            const isDragging = dragState?.from === pos.square;

            let cssLeft = `${pos.x * 12.5}%`;
            let cssTop  = `${pos.y * 12.5}%`;

            if (isDragging && boardRef.current) {
              const rect = boardRef.current.getBoundingClientRect();
              const sz = rect.width / 8;
              const rawLeft = dragState!.currentX - rect.left - sz / 2;
              const rawTop  = dragState!.currentY - rect.top  - sz / 2;
              cssLeft = `${Math.max(0, Math.min(rect.width  - sz, rawLeft))}px`;
              cssTop  = `${Math.max(0, Math.min(rect.height - sz, rawTop))}px`;
            }

            return (
              <div
                key={pos.square}
                className="absolute p-0.5"
                style={{
                  left: cssLeft,
                  top: cssTop,
                  width: '12.5%',
                  height: '12.5%',
                  transition: 'none',
                  transform: isDragging ? 'scale(1.12)' : 'scale(1)',
                  filter: isDragging
                    ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                  zIndex: isDragging ? 100 : 10,
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
        </div>
      </div>
    </div>
  );
}
