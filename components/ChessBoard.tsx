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

// Official Lichess cburnett piece set from GitHub raw
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

// Piece component using official Lichess SVG assets
const PieceComponent: React.FC<{ type: string; color: 'w' | 'b' }> = ({ type, color }) => {
  const pieceKey = `${color}${type.toUpperCase()}`;
  const url = PIECE_URLS[pieceKey];

  if (!url) return null;

  return (
    <img
      src={url}
      alt={`${color === 'w' ? 'white' : 'black'} ${type}`}
      className="w-full h-full"
      draggable={false}
    />
  );
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
      <div className="rounded-lg overflow-hidden shadow-xl" style={{ width: '400px' }}>
        <div className="grid grid-cols-8 gap-0 relative">
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square);
              const fileIndex = FILES.indexOf(file);
              const rankIndex = RANKS.indexOf(rank);
              const isLight = (fileIndex + rankIndex) % 2 === 0;
              const isHighlightedMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isSelected = selectedSquare === square;
              const isValidTarget = selectedSquare && legalMoves[selectedSquare]?.includes(square);
              const hasPieceOnTarget = isValidTarget && chess.get(square);

              // Lichess default board colors - beige and green
              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              
              if (isHighlightedMove) {
                bgColor = isLight ? '#cdd26a' : '#aaa23a';
              } else if (isSelected) {
                bgColor = isLight ? '#f7f769' : '#baca2b';
              }

              // Show file coordinate on bottom row
              const showFile = rankIdx === 7;
              // Show rank coordinate on left column
              const showRank = fileIdx === 0;

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  disabled={disabled}
                  className="w-full h-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed relative"
                  style={{ 
                    backgroundColor: bgColor,
                    aspectRatio: '1',
                  }}
                  aria-label={`Square ${square}`}
                >
                  {/* Rank coordinate (1-8) */}
                  {showRank && (
                    <span 
                      className="absolute top-0.5 left-0.5 text-xs font-bold select-none"
                      style={{ 
                        color: isLight ? '#b58863' : '#f0d9b5',
                        fontSize: '10px',
                      }}
                    >
                      {rank}
                    </span>
                  )}
                  
                  {/* File coordinate (a-h) */}
                  {showFile && (
                    <span 
                      className="absolute bottom-0.5 right-1 text-xs font-bold select-none"
                      style={{ 
                        color: isLight ? '#b58863' : '#f0d9b5',
                        fontSize: '10px',
                      }}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal move indicator - dot for empty, ring for capture */}
                  {isValidTarget && !hasPieceOnTarget && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '28%',
                        height: '28%',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  )}
                  {isValidTarget && hasPieceOnTarget && (
                    <div
                      className="absolute rounded-full border-4"
                      style={{
                        width: '85%',
                        height: '85%',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <div className="w-full h-full p-0.5">
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
