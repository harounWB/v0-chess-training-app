'use client';

import React, { useRef, useEffect } from 'react';
import { Game } from '@/lib/types';

interface MovesPanelProps {
  game: Game;
  moveIndex: number;
  onNavigateMove: (index: number) => void;
  trainingMode: 'train' | 'explore';
  playerColor: 'w' | 'b';
}

export function MovesPanel({
  game,
  moveIndex,
  onNavigateMove,
  trainingMode,
  playerColor,
}: MovesPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMoveRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current move
  useEffect(() => {
    if (currentMoveRef.current && scrollContainerRef.current) {
      currentMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [moveIndex]);

  const getDisplayedMoves = () => {
    const moves = [];
    for (let i = 0; i < game.moves.length; i++) {
      const move = game.moves[i];
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;
      
      // Always show all moves in EXPLORE mode
      if (trainingMode === 'explore') {
        moves.push({ index: i, moveNumber, isWhiteMove, move });
      } else {
        // In TRAIN mode, only show moves that have been played
        const isPlayerMove = (playerColor === 'w' && isWhiteMove) || (playerColor === 'b' && !isWhiteMove);
        if (isPlayerMove && i >= moveIndex) {
          continue; // Hide future player moves in TRAIN mode
        }
        moves.push({ index: i, moveNumber, isWhiteMove, move });
      }
    }
    return moves;
  };

  const displayedMoves = getDisplayedMoves();

  // Should we show comment for this move?
  const shouldShowComment = (index: number) => {
    if (trainingMode === 'explore') {
      return true; // Always show in explore mode
    }
    // In train mode, show comment only for moves that have been played
    return index < moveIndex;
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="h-96 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/50 p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
    >
      <div className="space-y-3">
        {displayedMoves.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No moves to display</p>
        ) : (
          displayedMoves.map((item) => {
            const isCurrentMove = item.index === moveIndex - 1;
            const isPastMove = item.index < moveIndex;
            const showComment = item.move.comment && shouldShowComment(item.index);
            
            return (
              <div 
                key={item.index}
                ref={isCurrentMove ? currentMoveRef : null}
                className="group"
              >
                {/* Move row */}
                <button
                  onClick={() => onNavigateMove(item.index + 1)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isCurrentMove
                      ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/50'
                      : isPastMove
                      ? 'bg-gray-800/80 text-gray-200 hover:bg-gray-700/80'
                      : 'bg-gray-850 text-gray-400 hover:bg-gray-800/60'
                  }`}
                >
                  {/* Move number */}
                  <span className={`text-xs font-mono min-w-[28px] ${
                    isCurrentMove ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {item.isWhiteMove ? `${item.moveNumber}.` : '...'}
                  </span>
                  
                  {/* Move notation */}
                  <span className={`font-semibold tracking-wide ${
                    isCurrentMove ? 'text-white' : ''
                  }`}>
                    {item.move.san}
                  </span>
                </button>
                
                {/* Comment box */}
                {showComment && (
                  <div className="mt-2 ml-2 mr-1 relative">
                    {/* Connector line */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.4)' }}
                    />
                    
                    <div
                      className="ml-3 px-4 py-3 rounded-lg text-sm leading-relaxed"
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        color: '#d4c4f5',
                        lineHeight: '1.6',
                      }}
                    >
                      {item.move.comment}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
