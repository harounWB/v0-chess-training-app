'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';

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
  const [shakeBoard, setShakeBoard] = useState(false);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  const chess = useMemo(() => new Chess(fen), [fen]);

  // Shake on wrong move
  useEffect(() => {
    if (wrongMove) {
      setShakeBoard(true);
      const t = setTimeout(() => setShakeBoard(false), 300);
      return () => clearTimeout(t);
    }
  }, [wrongMove]);

  // Clear selection when FEN changes
  useEffect(() => {
    setMoveFrom(null);
    setOptionSquares({});
  }, [fen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNavigate?.('next'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onNavigate?.('prev'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  // Get legal moves for a square
  const getMoveOptions = useCallback((square: Square) => {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length === 0) return false;

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: chess.get(move.to as Square)
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.15) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }, [chess]);

  // Handle piece drop (drag and drop)
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
      console.log('[v0] onPieceDrop:', { sourceSquare, targetSquare, piece, disabled, playerColor, turn: chess.turn(), orientation });
      
      if (disabled) return false;

      // Check if it's the player's turn (when playerColor is set)
      const pieceColor = piece[0] === 'w' ? 'w' : 'b';
      if (playerColor && pieceColor !== playerColor) {
        console.log('[v0] Blocked: not player color');
        return false;
      }
      if (pieceColor !== chess.turn()) {
        console.log('[v0] Blocked: not turn');
        return false;
      }

      // Check if move is legal
      const moves = chess.moves({ square: sourceSquare, verbose: true });
      const isLegal = moves.some(m => m.to === targetSquare);
      if (!isLegal) {
        console.log('[v0] Blocked: not legal');
        return false;
      }

      // Determine promotion
      const isPromotion = piece[1].toLowerCase() === 'p' && 
        (targetSquare[1] === '8' || targetSquare[1] === '1');

      console.log('[v0] Move accepted:', { from: sourceSquare, to: targetSquare });
      onMove({ 
        from: sourceSquare, 
        to: targetSquare, 
        promotion: isPromotion ? 'q' : undefined 
      });

      setMoveFrom(null);
      setOptionSquares({});
      return true;
    },
    [chess, disabled, onMove, playerColor, orientation]
  );

  // Handle square click (click to move)
  const onSquareClick = useCallback(
    (square: Square) => {
      if (disabled) return;

      // If we have a moveFrom, try to complete the move
      if (moveFrom) {
        const moves = chess.moves({ square: moveFrom, verbose: true });
        const foundMove = moves.find(m => m.to === square);

        if (foundMove) {
          const piece = chess.get(moveFrom);
          const isPromotion = piece?.type === 'p' && (square[1] === '8' || square[1] === '1');
          
          onMove({ 
            from: moveFrom, 
            to: square, 
            promotion: isPromotion ? 'q' : undefined 
          });
          setMoveFrom(null);
          setOptionSquares({});
          return;
        }
        
        // Invalid target, reset
        setMoveFrom(null);
        setOptionSquares({});
      }

      // Try to select a new piece
      const piece = chess.get(square);
      if (!piece) return;

      // Check player color restriction
      if (playerColor && piece.color !== playerColor) return;
      if (piece.color !== chess.turn()) return;

      // Show move options
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setMoveFrom(square);
      }
    },
    [chess, disabled, getMoveOptions, moveFrom, onMove, playerColor]
  );

  // Determine if a piece is draggable
  const isDraggablePiece = useCallback(
    ({ piece }: { piece: string }): boolean => {
      if (disabled || !draggable) return false;
      const pieceColor = piece[0] === 'w' ? 'w' : 'b';
      if (playerColor && pieceColor !== playerColor) return false;
      return pieceColor === chess.turn();
    },
    [chess, disabled, draggable, playerColor]
  );

  // Build custom square styles for highlights
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Last move highlight
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(155, 199, 0, 0.41)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(155, 199, 0, 0.41)' };
    }

    // Hint square highlight
    if (hintSquare) {
      styles[hintSquare] = { backgroundColor: 'rgba(66, 165, 245, 0.6)' };
    }

    // Hint destinations
    hintDestinations.forEach(sq => {
      styles[sq] = { backgroundColor: 'rgba(79, 195, 247, 0.5)' };
    });

    // Wrong move highlight
    if (wrongMoveSquares) {
      styles[wrongMoveSquares.from] = { backgroundColor: 'rgba(220, 53, 69, 0.6)' };
      styles[wrongMoveSquares.to] = { backgroundColor: 'rgba(220, 53, 69, 0.6)' };
    }

    // Correct move highlight
    if (correctMoveSquares) {
      styles[correctMoveSquares.from] = { backgroundColor: 'rgba(40, 167, 69, 0.6)' };
      styles[correctMoveSquares.to] = { backgroundColor: 'rgba(40, 167, 69, 0.6)' };
    }

    // Merge with option squares (move dots)
    return { ...styles, ...optionSquares };
  }, [lastMove, hintSquare, hintDestinations, wrongMoveSquares, correctMoveSquares, optionSquares]);

  return (
    <div className="flex justify-center w-full select-none">
      <div
        className={`rounded-lg overflow-hidden shadow-2xl ${shakeBoard ? 'animate-shake' : ''}`}
        style={{ width: '400px' }}
      >
        <Chessboard
          id="training-board"
          position={fen}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          boardOrientation={orientation}
          isDraggablePiece={isDraggablePiece}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#b58863' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          animationDuration={200}
        />
      </div>
    </div>
  );
}
