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
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [animatingFrom, setAnimatingFrom] = useState<string | null>(null);
  const [animatingTo, setAnimatingTo] = useState<string | null>(null);
  const prevFenRef = useRef<string>(fen);
  
  const chess = useMemo(() => new Chess(fen), [fen]);

  // Shake animation on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShakeBoard(true);
      const timeout = setTimeout(() => setShakeBoard(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [wrongMove]);

  // Detect FEN change and trigger animation
  useEffect(() => {
    if (prevFenRef.current === fen) return;

    try {
      const prevChess = new Chess(prevFenRef.current);
      
      // Find which piece moved
      let fromSquare: string | null = null;
      let toSquare: string | null = null;

      for (const file of FILES) {
        for (const rank of RANKS) {
          const square = `${file}${rank}`;
          const prevPiece = prevChess.get(square);
          const currPiece = chess.get(square);

          // Piece disappeared (source of move)
          if (prevPiece && !currPiece) {
            fromSquare = square;
          }

          // Piece appeared (destination of move) - match type and color
          if (currPiece && !prevPiece) {
            // This could be the destination
            toSquare = square;
          }
        }
      }

      // Set animation state if we found from and to squares
      if (fromSquare && toSquare) {
        setAnimatingFrom(fromSquare);
        setAnimatingTo(toSquare);

        // Clear animation after 200ms
        const timeout = setTimeout(() => {
          setAnimatingFrom(null);
          setAnimatingTo(null);
        }, 200);

        return () => clearTimeout(timeout);
      }
    } catch {
      // Silently handle invalid FEN
    }

    prevFenRef.current = fen;
  }, [fen, chess]);

  // Always update prevFenRef
  useEffect(() => {
    prevFenRef.current = fen;
  }, [fen]);

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

  const onSquareClick = useCallback(
    (square: string) => {
      if (disabled) return;

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

      // Try to make the move
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
        // Check if clicking on own piece to reselect
        const clickedPiece = chess.get(square);
        if (clickedPiece && clickedPiece.color === chess.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    },
    [selectedSquare, chess, disabled, onMove, legalMoves]
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

  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  // Get all pieces with their positions
  const getPiecePositions = (): PiecePosition[] => {
    const positions: PiecePosition[] = [];
    
    for (const file of FILES) {
      for (const rank of RANKS) {
        const square = `${file}${rank}`;
        const piece = chess.get(square);
        if (piece) {
          const coords = squareToCoords(square, orientation);
          positions.push({
            piece,
            square,
            x: coords.x,
            y: coords.y,
          });
        }
      }
    }
    
    return positions;
  };

  const piecePositions = getPiecePositions();

  return (
    <div className="flex justify-center w-full select-none">
      <div 
        className={`rounded-lg overflow-hidden shadow-2xl relative transition-transform ${
          shakeBoard ? 'animate-shake' : ''
        }`}
        style={{ width: '400px', aspectRatio: '1' }}
      >
        {/* Board squares */}
        <div className="grid grid-cols-8 gap-0 absolute inset-0">
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const square = `${file}${rank}`;
              const fileIndex = FILES.indexOf(file);
              const rankIndex = RANKS.indexOf(rank);
              const isLight = (fileIndex + rankIndex) % 2 === 0;
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

              const showFile = rankIdx === 7;
              const showRank = fileIdx === 0;

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  disabled={disabled}
                  className="relative flex items-center justify-center cursor-pointer disabled:cursor-default transition-colors duration-75"
                  style={{ backgroundColor: bgColor }}
                  aria-label={`Square ${square}`}
                >
                  {showRank && (
                    <span 
                      className="absolute top-0.5 left-1 font-bold select-none pointer-events-none"
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

                  {/* Legal move indicators */}
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
            const fromCoords = animatingFrom ? squareToCoords(animatingFrom, orientation) : null;
            const toCoords = animatingTo ? squareToCoords(animatingTo, orientation) : null;

            // Check if this piece is animating
            const isAnimating = animatingFrom && animatingTo && 
              pos.square === animatingFrom &&
              fromCoords && toCoords;

            if (!url) return null;

            return (
              <div
                key={pos.square}
                className={`absolute p-0.5 ${isAnimating ? 'transition-all' : ''}`}
                style={{
                  left: `${(isAnimating ? toCoords!.x : pos.x) * 12.5}%`,
                  top: `${(isAnimating ? toCoords!.y : pos.y) * 12.5}%`,
                  width: '12.5%',
                  height: '12.5%',
                  transitionDuration: isAnimating ? '200ms' : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
