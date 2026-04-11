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
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Lichess cburnett piece set
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
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1]) - 1; // 1=0, 8=7
  
  if (orientation === 'white') {
    return { x: file, y: 7 - rank };
  } else {
    return { x: 7 - file, y: rank };
  }
}

interface AnimatingPiece {
  pieceKey: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
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
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [shakeBoard, setShakeBoard] = useState(false);
  const prevFenRef = useRef<string>(fen);
  const animationFrameRef = useRef<number | null>(null);
  
  // Shake animation on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShakeBoard(true);
      const timeout = setTimeout(() => setShakeBoard(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [wrongMove]);
  
  const chess = useMemo(() => new Chess(fen), [fen]);
  const prevChess = useMemo(() => {
    try {
      return new Chess(prevFenRef.current);
    } catch {
      return new Chess();
    }
  }, []);

  // Animation duration in ms
  const ANIMATION_DURATION = 200;

  // Detect piece movement and animate
  useEffect(() => {
    if (prevFenRef.current === fen) return;
    
    const prevBoard = prevChess;
    const currBoard = chess;
    
    // Find the piece that moved
    let fromSquare: string | null = null;
    let toSquare: string | null = null;
    let movedPiece: { type: string; color: 'w' | 'b' } | null = null;
    
    // Check all squares for changes
    for (const file of FILES) {
      for (const rank of RANKS) {
        const square = `${file}${rank}`;
        const prevPiece = prevBoard.get(square);
        const currPiece = currBoard.get(square);
        
        // Piece disappeared from this square
        if (prevPiece && !currPiece) {
          fromSquare = square;
          movedPiece = prevPiece;
        }
        // Same piece appeared on new square
        if (currPiece && !prevPiece && movedPiece && 
            currPiece.type === movedPiece.type && currPiece.color === movedPiece.color) {
          toSquare = square;
        }
        // Piece captured (different piece now)
        if (currPiece && prevPiece && movedPiece &&
            currPiece.type === movedPiece.type && currPiece.color === movedPiece.color &&
            (prevPiece.type !== currPiece.type || prevPiece.color !== currPiece.color)) {
          toSquare = square;
        }
      }
    }
    
    // Handle castling - find rook movement
    if (!toSquare && fromSquare && movedPiece?.type === 'k') {
      // King moved, find where it went
      for (const file of FILES) {
        for (const rank of RANKS) {
          const square = `${file}${rank}`;
          const currPiece = currBoard.get(square);
          if (currPiece?.type === 'k' && currPiece.color === movedPiece.color) {
            toSquare = square;
            break;
          }
        }
        if (toSquare) break;
      }
    }
    
    if (fromSquare && toSquare && movedPiece) {
      const fromCoords = squareToCoords(fromSquare, orientation);
      const toCoords = squareToCoords(toSquare, orientation);
      
      const pieceKey = `${movedPiece.color}${movedPiece.type.toUpperCase()}`;
      
      setAnimatingPiece({
        pieceKey,
        fromX: fromCoords.x,
        fromY: fromCoords.y,
        toX: toCoords.x,
        toY: toCoords.y,
        startTime: performance.now(),
      });
      setAnimationProgress(0);
    }
    
    prevFenRef.current = fen;
  }, [fen, chess, prevChess, orientation]);

  // Animation loop
  useEffect(() => {
    if (!animatingPiece) return;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - animatingPiece.startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatingPiece(null);
        setAnimationProgress(0);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animatingPiece]);

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

  // Calculate animating piece position
  const getAnimatingPieceStyle = () => {
    if (!animatingPiece) return null;
    
    const currentX = animatingPiece.fromX + (animatingPiece.toX - animatingPiece.fromX) * animationProgress;
    const currentY = animatingPiece.fromY + (animatingPiece.toY - animatingPiece.fromY) * animationProgress;
    
    return {
      left: `${currentX * 12.5}%`,
      top: `${currentY * 12.5}%`,
      width: '12.5%',
      height: '12.5%',
    };
  };

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

              // Board colors
              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              
              if (isWrongMoveFrom || isWrongMoveTo) {
                // Red flash for wrong move attempt (400ms)
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
                  {/* Coordinates */}
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
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square);
              
              if (!piece) return null;
              
              // Hide piece at destination during animation
              const isAnimatingToHere = animatingPiece && 
                animatingPiece.toX === fileIdx && 
                animatingPiece.toY === rankIdx &&
                animationProgress < 1;
              
              if (isAnimatingToHere) return null;
              
              const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
              const url = PIECE_URLS[pieceKey];
              
              if (!url) return null;

              return (
                <div
                  key={square}
                  className="absolute p-0.5"
                  style={{
                    left: `${fileIdx * 12.5}%`,
                    top: `${rankIdx * 12.5}%`,
                    width: '12.5%',
                    height: '12.5%',
                  }}
                >
                  <img
                    src={url}
                    alt={`${piece.color === 'w' ? 'white' : 'black'} ${piece.type}`}
                    className="w-full h-full"
                    draggable={false}
                  />
                </div>
              );
            })
          )}
          
          {/* Animating piece */}
          {animatingPiece && (
            <div
              className="absolute p-0.5 z-10"
              style={getAnimatingPieceStyle() || undefined}
            >
              <img
                src={PIECE_URLS[animatingPiece.pieceKey]}
                alt="moving piece"
                className="w-full h-full"
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
