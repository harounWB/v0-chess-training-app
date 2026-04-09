'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { THEME_COLORS } from '@/lib/constants';

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string };
  orientation?: 'white' | 'black';
}

export function ChessBoard({
  fen,
  onMove,
  disabled = false,
  lastMove,
  orientation = 'white',
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const gameRef = React.useRef(new Chess(fen));
  const chess = useMemo(() => new Chess(fen), [fen]);

  // Update the reference when fen changes
  React.useEffect(() => {
    gameRef.current = new Chess(fen);
  }, [fen]);

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

  // Create custom square styles
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: THEME_COLORS.highlight,
      };
      styles[lastMove.to] = {
        backgroundColor: THEME_COLORS.highlight,
      };
    }

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: THEME_COLORS.selectedSquare,
      };

      // Highlight legal moves from selected square
      if (legalMoves[selectedSquare]) {
        legalMoves[selectedSquare].forEach((square) => {
          styles[square] = {
            backgroundColor: THEME_COLORS.selectedSquare,
            backgroundImage: `radial-gradient(circle, ${THEME_COLORS.accentSecondary} 30%, transparent 30%)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
          };
        });
      }
    }

    return styles;
  }, [selectedSquare, lastMove, legalMoves]);

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

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (disabled) return false;

      try {
        const move = gameRef.current.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (move) {
          onMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: move.promotion,
          });
          setSelectedSquare(null);
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },
    [disabled, onMove]
  );

  return (
    <div className="flex justify-center w-full">
      <div className="w-96 shadow-2xl rounded-xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
        <Chessboard
          position={fen}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          boardOrientation={orientation}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '0.75rem',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.3)',
          }}
          arePiecesDraggable={!disabled}
          isDraggablePiece={({ piece }) => {
            if (disabled) return false;
            const isWhiteToMove = chess.turn() === 'w';
            const isPieceWhite = piece.charCodeAt(0) < 97; // uppercase = white
            return isWhiteToMove === isPieceWhite;
          }}
          customDarkSquareStyle={{
            backgroundColor: THEME_COLORS.boardDark,
          }}
          customLightSquareStyle={{
            backgroundColor: THEME_COLORS.boardLight,
          }}
          animationDuration={200}
          boardWidth={384}
        />
      </div>
    </div>
  );
}
