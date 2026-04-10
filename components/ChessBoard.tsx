'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string };
  orientation?: 'white' | 'black';
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Professional Chess.com style SVG pieces
const PieceComponent: React.FC<{ type: string; color: 'w' | 'b' }> = ({ type, color }) => {
  const pieceType = type.toUpperCase();
  const isWhite = color === 'w';

  // Colors
  const lightColor = '#f0d9b5';
  const darkColor = '#312e2b';
  const lightStroke = '#1a1a1a';
  const darkStroke = '#d9d0c4';

  if (isWhite) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="whitePieceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fdfbf7" />
            <stop offset="50%" stopColor="#f0d9b5" />
            <stop offset="100%" stopColor="#e0c9a0" />
          </linearGradient>
          <filter id="whiteShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {pieceType === 'P' && (
          <>
            <circle cx="50" cy="25" r="10" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <path d="M 42 35 L 40 65 L 60 65 L 58 35 Z" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <ellipse cx="50" cy="68" rx="14" ry="4" fill="#d9c9b0" stroke={lightStroke} strokeWidth="1" />
          </>
        )}

        {pieceType === 'N' && (
          <path d="M 25 70 Q 30 50 35 40 Q 40 30 50 28 Q 60 30 65 40 Q 70 50 68 65 Q 65 75 50 80 Q 35 75 32 65 Z M 45 50 Q 48 48 52 50" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1.5" strokeLinejoin="round" filter="url(#whiteShadow)" />
        )}

        {pieceType === 'B' && (
          <>
            <circle cx="50" cy="20" r="7" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <path d="M 38 30 L 35 60 Q 35 72 50 78 Q 65 72 65 60 L 62 30 Z" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <circle cx="50" cy="42" r="3" fill={lightStroke} opacity="0.4" />
          </>
        )}

        {pieceType === 'R' && (
          <>
            <rect x="25" y="18" width="50" height="12" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <rect x="32" y="30" width="36" height="28" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <rect x="28" y="63" width="44" height="12" fill="#d9c9b0" stroke={lightStroke} strokeWidth="1" />
            <rect x="37" y="22" width="4" height="8" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" />
            <rect x="59" y="22" width="4" height="8" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" />
          </>
        )}

        {pieceType === 'Q' && (
          <>
            <circle cx="50" cy="16" r="7" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <circle cx="35" cy="23" r="5" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <circle cx="65" cy="23" r="5" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
            <path d="M 28 32 L 25 65 Q 25 75 50 80 Q 75 75 75 65 L 72 32 Z" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
          </>
        )}

        {pieceType === 'K' && (
          <>
            <line x1="50" y1="12" x2="50" y2="28" stroke={lightStroke} strokeWidth="2.5" filter="url(#whiteShadow)" />
            <line x1="44" y1="22" x2="56" y2="22" stroke={lightStroke} strokeWidth="2" filter="url(#whiteShadow)" />
            <circle cx="50" cy="16" r="2" fill={lightStroke} filter="url(#whiteShadow)" />
            <path d="M 32 35 L 28 65 Q 28 75 50 80 Q 72 75 72 65 L 68 35 Z" fill="url(#whitePieceGrad)" stroke={lightStroke} strokeWidth="1" filter="url(#whiteShadow)" />
          </>
        )}
      </svg>
    );
  } else {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="blackPieceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a3c32" />
            <stop offset="50%" stopColor="#312e2b" />
            <stop offset="100%" stopColor="#1a1714" />
          </linearGradient>
          <filter id="blackShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
          </filter>
        </defs>

        {pieceType === 'P' && (
          <>
            <circle cx="50" cy="25" r="10" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <path d="M 42 35 L 40 65 L 60 65 L 58 35 Z" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <ellipse cx="50" cy="68" rx="14" ry="4" fill="#1a1714" stroke={darkStroke} strokeWidth="1" />
          </>
        )}

        {pieceType === 'N' && (
          <path d="M 25 70 Q 30 50 35 40 Q 40 30 50 28 Q 60 30 65 40 Q 70 50 68 65 Q 65 75 50 80 Q 35 75 32 65 Z M 45 50 Q 48 48 52 50" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1.5" strokeLinejoin="round" filter="url(#blackShadow)" />
        )}

        {pieceType === 'B' && (
          <>
            <circle cx="50" cy="20" r="7" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <path d="M 38 30 L 35 60 Q 35 72 50 78 Q 65 72 65 60 L 62 30 Z" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <circle cx="50" cy="42" r="3" fill={darkStroke} opacity="0.4" />
          </>
        )}

        {pieceType === 'R' && (
          <>
            <rect x="25" y="18" width="50" height="12" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <rect x="32" y="30" width="36" height="28" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <rect x="28" y="63" width="44" height="12" fill="#1a1714" stroke={darkStroke} strokeWidth="1" />
            <rect x="37" y="22" width="4" height="8" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" />
            <rect x="59" y="22" width="4" height="8" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" />
          </>
        )}

        {pieceType === 'Q' && (
          <>
            <circle cx="50" cy="16" r="7" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <circle cx="35" cy="23" r="5" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <circle cx="65" cy="23" r="5" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
            <path d="M 28 32 L 25 65 Q 25 75 50 80 Q 75 75 75 65 L 72 32 Z" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
          </>
        )}

        {pieceType === 'K' && (
          <>
            <line x1="50" y1="12" x2="50" y2="28" stroke={darkStroke} strokeWidth="2.5" filter="url(#blackShadow)" />
            <line x1="44" y1="22" x2="56" y2="22" stroke={darkStroke} strokeWidth="2" filter="url(#blackShadow)" />
            <circle cx="50" cy="16" r="2" fill={darkStroke} filter="url(#blackShadow)" />
            <path d="M 32 35 L 28 65 Q 28 75 50 80 Q 72 75 72 65 L 68 35 Z" fill="url(#blackPieceGrad)" stroke={darkStroke} strokeWidth="1" filter="url(#blackShadow)" />
          </>
        )}
      </svg>
    );
  }
};

export function ChessBoard({
  fen,
  onMove,
  onNavigate,
  disabled = false,
  lastMove,
  orientation = 'white',
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const chess = useMemo(() => new Chess(fen), [fen]);

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
  }, [chess, fen]);

  const onSquareClick = useCallback(
    (square: string) => {
      if (disabled) return;

      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (!selectedSquare) {
        const piece = chess.get(square);
        if (piece) {
          const isWhiteToMove = chess.turn() === 'w';
          const isPieceWhite = piece.color === 'w';

          if (isWhiteToMove === isPieceWhite) {
            setSelectedSquare(square);
          }
        }
        return;
      }

      const piece = chess.get(selectedSquare);
      if (!piece) {
        setSelectedSquare(null);
        return;
      }

      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          onMove({
            from: selectedSquare,
            to: square,
            promotion: move.promotion,
          });
          setSelectedSquare(null);
        } else {
          const clickedPiece = chess.get(square);
          if (clickedPiece) {
            const isWhiteToMove = chess.turn() === 'w';
            const isPieceWhite = clickedPiece.color === 'w';

            if (isWhiteToMove === isPieceWhite) {
              setSelectedSquare(square);
            }
          } else {
            setSelectedSquare(null);
          }
        }
      } catch (e) {
        setSelectedSquare(null);
      }
    },
    [selectedSquare, chess, disabled, onMove]
  );

  // Handle keyboard navigation
  React.useEffect(() => {
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

  return (
    <div className="flex justify-center w-full">
      <div className="rounded-lg overflow-hidden shadow-xl" style={{ width: '360px' }}>
        <div className="grid grid-cols-8 gap-0">
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square);
              const fileIndex = FILES.indexOf(file);
              const rankIndex = RANKS.indexOf(rank);
              const isLight = (fileIndex + rankIndex) % 2 === 0;
              const isHighlightedMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isSelected = selectedSquare === square;
              const isValidTarget = selectedSquare && legalMoves[selectedSquare]?.includes(square);

              // Chess.com green and cream colors (Neo theme)
              let bgColor = isLight ? '#f5f5dc' : '#739552';
              
              if (isHighlightedMove) {
                bgColor = isLight ? '#baca44' : '#a9a933';
              } else if (isSelected) {
                bgColor = isLight ? '#baca44' : '#a9a933';
              }

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  disabled={disabled}
                  className="w-full h-full flex items-center justify-center transition-colors cursor-pointer hover:opacity-90 disabled:cursor-not-allowed relative"
                  style={{ 
                    backgroundColor: bgColor,
                    aspectRatio: '1',
                  }}
                  aria-label={`Square ${square}`}
                >
                  {isValidTarget && (
                    <div
                      className="absolute rounded-full bg-gray-800 opacity-40"
                      style={{
                        width: '20%',
                        height: '20%',
                      }}
                    />
                  )}
                  {piece && (
                    <div style={{ width: '78%', height: '78%' }}>
                      <PieceComponent type={piece.type} color={piece.color} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
