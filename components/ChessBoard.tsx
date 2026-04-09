'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { THEME_COLORS } from '@/lib/constants';

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string };
  orientation?: 'white' | 'black';
}

const PIECE_UNICODE: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  fen,
  onMove,
  disabled = false,
  lastMove,
  orientation = 'white',
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const chess = useMemo(() => new Chess(fen), [fen]);

  // Calculate legal moves for highlighting
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

      // Deselect if clicking the same square
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // If no square selected, try to select this one
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

      // Try to move from selected square to clicked square
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
          // If move failed, try to select the clicked square instead
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

  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  return (
    <div className="w-full max-w-2xl aspect-square rounded-lg overflow-hidden shadow-2xl border border-white border-opacity-10">
      <div className="w-full h-full grid grid-cols-8 gap-0">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}`;
            const piece = chess.get(square);
            const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;
            const isHighlightedMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isSelected = selectedSquare === square;
            const isValidTarget = selectedSquare && legalMoves[selectedSquare]?.includes(square);

            let bgColor = isLight ? THEME_COLORS.boardLight : THEME_COLORS.boardDark;
            
            if (isHighlightedMove) {
              bgColor = THEME_COLORS.highlight;
            } else if (isSelected) {
              bgColor = THEME_COLORS.selectedSquare;
            }

            return (
              <button
                key={square}
                onClick={() => onSquareClick(square)}
                disabled={disabled}
                className="w-full h-full flex flex-col items-center justify-center text-6xl font-bold transition-all cursor-pointer hover:opacity-90 disabled:cursor-not-allowed relative"
                style={{ backgroundColor: bgColor }}
                aria-label={`Square ${square}`}
              >
                {isValidTarget && (
                  <div
                    className="absolute w-1/4 h-1/4 rounded-full border-2"
                    style={{ borderColor: THEME_COLORS.accentSecondary }}
                  />
                )}
                {piece && (
                  <span className="select-none">{PIECE_UNICODE[piece.type + (piece.color === 'w' ? '' : '')]}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
