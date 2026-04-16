'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PGNUpload } from '@/components/PGNUpload';
import { useGameContext } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { Game } from '@/lib/types';
import { BookOpen, Play, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';

export default function UploadPage() {
  const router = useRouter();
  const { games, setGames, setSelectedGame, clearGameData } = useGameContext();
  const { user, isGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGamesLoaded = async (loadedGames: Game[]) => {
    setIsLoading(true);
    
    // Store games in context (this triggers localStorage save)
    setGames(loadedGames);
    
    // Select first game
    if (loadedGames.length > 0) {
      setSelectedGame(loadedGames[0]);
      
      // Wait longer to ensure state is fully persisted to localStorage and context is updated
      setTimeout(() => {
        router.push('/training');
      }, 200);
    } else {
      setIsLoading(false);
    }
  };

  const handleResumeGame = () => {
    if (games.length > 0) {
      setSelectedGame(games[0]);
      router.push('/training');
    }
  };

  const handleUploadNew = () => {
    clearGameData();
    setIsLoading(false);
  };

  const totalMoves = games.reduce((sum, g) => sum + g.moves.length, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {isGuest && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Guest Mode</span>
            </div>
            <p className="text-sm text-amber-300 mt-1">
              Your progress will be saved locally. Create an account to save progress permanently.
            </p>
          </div>
        )}
        <div className="space-y-8">
          {/* Header */}
          <header className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Chess Opening Trainer</h1>
                <p className="text-sm text-gray-500">Master openings with interactive training</p>
              </div>
            </div>
          </header>

          {/* Resume or Upload Decision */}
          {games.length > 0 && (
            <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">You have an existing game</h2>
                <p className="text-sm text-gray-400">
                  {games[0]?.pgn?.split('\n')[0] || 'Game'} • {totalMoves} moves
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResumeGame}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Play className="w-4 h-4" />
                  Resume Game
                </button>
                
                <button
                  onClick={handleUploadNew}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium"
                >
                  <UploadIcon className="w-4 h-4" />
                  New Game
                </button>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div className="max-w-md mx-auto pt-12">
            <PGNUpload onGamesLoaded={handleGamesLoaded} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
