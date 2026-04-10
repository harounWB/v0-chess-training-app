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

const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

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

              // Chess.com style colors
              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              
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
                  className="w-full h-full flex items-center justify-center text-5xl font-bold transition-colors cursor-pointer hover:opacity-90 disabled:cursor-not-allowed relative"
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
                    <span 
                      className="select-none font-black leading-none"
                      style={{ 
                        fontSize: '42px',
                        textShadow: piece.color === 'w' 
                          ? '0 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.3)'
                          : '0 2px 4px rgba(0,0,0,0.6)',
                        color: piece.color === 'w' ? '#fafafa' : '#1a1a1a',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                      }}
                    >
                      {PIECE_SYMBOLS[piece.type + (piece.color === 'w' ? '' : '')]}
                    </span>
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
