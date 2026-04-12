'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PGNUpload } from '@/components/PGNUpload';
import { GameList } from '@/components/GameList';
import { useGameContext } from '@/lib/GameContext';
import { Game } from '@/lib/types';
import { BookOpen, Upload } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { games, setGames, setSelectedGame } = useGameContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleGamesLoaded = (loadedGames: Game[]) => {
    setIsLoading(true);
    setTimeout(() => {
      setGames(loadedGames);
      setIsLoading(false);
    }, 300);
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    router.push('/training');
  };

  const totalMoves = games.reduce((sum, g) => sum + g.moves.length, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-8">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Chess Opening Trainer</h1>
                <p className="text-sm text-gray-500">Master openings with interactive training</p>
              </div>
            </div>
            
            {games.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-300">
                    {games.length} game{games.length !== 1 ? 's' : ''} · {totalMoves} moves
                  </div>
                </div>
                <button
                  onClick={() => setGames([])}
                  className="flex items-center gap-2 text-sm px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all hover:scale-105"
                >
                  <Upload className="w-4 h-4" />
                  New File
                </button>
              </div>
            )}
          </header>

          {/* Main Content */}
          {games.length === 0 ? (
            <div className="max-w-md mx-auto pt-12">
              <PGNUpload onGamesLoaded={handleGamesLoaded} isLoading={isLoading} />
            </div>
          ) : (
            <GameList games={games} onSelectGame={handleGameSelect} />
          )}
        </div>
      </div>
    </main>
  );
}
