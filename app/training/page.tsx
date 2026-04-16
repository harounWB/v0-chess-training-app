'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trainer } from '@/components/Trainer';
import { useGameContext } from '@/lib/GameContext';
import { Header } from '@/components/Header';
import { ArrowLeft, Plus } from 'lucide-react';

export default function TrainingPage() {
  const router = useRouter();
  const { games, selectedGame, setSelectedGame, clearGameData } = useGameContext();
  const [isLoading, setIsLoading] = useState(true);

  // Wait for context to hydrate from localStorage
  useEffect(() => {
    // Give context time to load from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to upload if no game after hydration
  useEffect(() => {
    if (!isLoading && (!selectedGame || games.length === 0)) {
      router.push('/upload');
    }
  }, [isLoading, selectedGame, games, router]);

  const handleNewGame = () => {
    clearGameData();
    router.push('/upload');
  };

  // Show loading state while context hydrates
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  // If no game after hydration, show nothing (redirect effect is running)
  if (!selectedGame || games.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Control Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedGame(null);
              router.push('/upload');
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>

          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            New Game
          </button>
        </div>

        {/* Trainer Component */}
        <Trainer games={games} />
      </div>
    </main>
  );
}
