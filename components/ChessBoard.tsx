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

// Lichess.org style pieces - clean outline/filled SVG
const PieceComponent: React.FC<{ type: string; color: 'w' | 'b' }> = ({ type, color }) => {
  const isWhite = color === 'w';
  const pieceType = type.toUpperCase();

  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      {pieceType === 'P' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 9c-3.763 0-6.824 2.629-7.937 5.826h2.093c.84-1.976 2.67-3.282 5.844-3.282 3.174 0 5.005 1.306 5.844 3.282h2.093C29.324 11.629 26.263 9 22.5 9z" fill="#fff" stroke="#000" strokeWidth="1.5"/>
          <path d="M15.5 32h15v2.5h-15z" fill="#000"/>
          <ellipse cx="22.5" cy="25" rx="5" ry="4" fill="#fff" stroke="#000" strokeWidth="1.5"/>
        </g>
      )}
      {pieceType === 'P' && !isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 9c-3.763 0-6.824 2.629-7.937 5.826h2.093c.84-1.976 2.67-3.282 5.844-3.282 3.174 0 5.005 1.306 5.844 3.282h2.093C29.324 11.629 26.263 9 22.5 9z" fill="#000"/>
          <path d="M15.5 32h15v2.5h-15z" fill="#000"/>
          <ellipse cx="22.5" cy="25" rx="5" ry="4" fill="#000"/>
        </g>
      )}
      
      {pieceType === 'N' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 10c10.8 0 16.4 8.6 15 21H31c3.6-4.5 2.6-13.5 0-17-3-4.5-7-5-8.5-5S17.9 5.4 15 9c-2.6 3.5-3.6 12.5 0 17H7.5c-1.4-12.4 4.3-21 15-21z" fill="#fff" stroke="#000" strokeWidth="1.5"/>
        </g>
      )}
      {pieceType === 'N' && !isWhite && (
        <path d="M22.5 10c10.8 0 16.4 8.6 15 21H31c3.6-4.5 2.6-13.5 0-17-3-4.5-7-5-8.5-5S17.9 5.4 15 9c-2.6 3.5-3.6 12.5 0 17H7.5c-1.4-12.4 4.3-21 15-21z" fill="#000" stroke="#000" strokeWidth="1.5"/>
      )}
      
      {pieceType === 'B' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 36c3.5-1 6-2 8-4 1-2 1-4.5-1-6.5-1.5-1.5-1-4.5 0-5s1.5-1 1.5-4c0-2-2.5-3-4-4-1.5-1-4-1-4.5.5s.5 1.5 1 2c1 1 1 2.5 0 3-1 1-2 1-2 1s3.5 1 4 2.8c.5 1.8-1 2.8-1 2.8M17.5 31S16 8 16 4c0 0 2 1 2 4s-2.5-2-2.5 4 2.5 6 4 6.5 3 13 4 14" fill="#fff" stroke="#000" strokeWidth="1"/>
        </g>
      )}
      {pieceType === 'B' && !isWhite && (
        <path d="M9.5 36c3.5-1 6-2 8-4 1-2 1-4.5-1-6.5-1.5-1.5-1-4.5 0-5s1.5-1 1.5-4c0-2-2.5-3-4-4-1.5-1-4-1-4.5.5s.5 1.5 1 2c1 1 1 2.5 0 3-1 1-2 1-2 1s3.5 1 4 2.8c.5 1.8-1 2.8-1 2.8M17.5 31S16 8 16 4c0 0 2 1 2 4s-2.5-2-2.5 4 2.5 6 4 6.5 3 13 4 14" fill="#000" stroke="#000" strokeWidth="1.5"/>
      )}
      
      {pieceType === 'R' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h6v-3h4v3h6v-3h4v3h6v-5H9v5zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 29h4v-7h4v7h4v-7h4v7h4V11H9v18h3v0z" fill="#fff" stroke="#000" strokeWidth="1"/>
        </g>
      )}
      {pieceType === 'R' && !isWhite && (
        <path d="M9 39h6v-3h4v3h6v-3h4v3h6v-5H9v5zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 29h4v-7h4v7h4v-7h4v7h4V11H9v18h3v0z" fill="#000" stroke="#000" strokeWidth="1.5"/>
      )}
      
      {pieceType === 'Q' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="18" r="7" fill="#fff" stroke="#000" strokeWidth="1.5"/>
          <circle cx="12" cy="27" r="5" fill="#fff" stroke="#000" strokeWidth="1.5"/>
          <circle cx="33" cy="27" r="5" fill="#fff" stroke="#000" strokeWidth="1.5"/>
          <path d="M12 32h22v5H12z" fill="#fff" stroke="#000" strokeWidth="1.5"/>
        </g>
      )}
      {pieceType === 'Q' && !isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="18" r="7" fill="#000"/>
          <circle cx="12" cy="27" r="5" fill="#000"/>
          <circle cx="33" cy="27" r="5" fill="#000"/>
          <path d="M12 32h22v5H12z" fill="#000"/>
        </g>
      )}
      
      {pieceType === 'K' && isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22.5" y1="8" x2="22.5" y2="15" stroke="#000" strokeWidth="2"/>
          <line x1="18" y1="12" x2="27" y2="12" stroke="#000" strokeWidth="1.5"/>
          <circle cx="22.5" cy="10" r="1.5" fill="#000"/>
          <path d="M11 25h23v12H11z" fill="#fff" stroke="#000" strokeWidth="1.5"/>
        </g>
      )}
      {pieceType === 'K' && !isWhite && (
        <g fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22.5" y1="8" x2="22.5" y2="15" stroke="#000" strokeWidth="2"/>
          <line x1="18" y1="12" x2="27" y2="12" stroke="#000" strokeWidth="1.5"/>
          <circle cx="22.5" cy="10" r="1.5" fill="#000"/>
          <path d="M11 25h23v12H11z" fill="#000"/>
        </g>
      )}
    </svg>
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

              // Lichess.org style colors - tan and brown
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
