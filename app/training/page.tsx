'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trainer } from '@/components/Trainer';
import { useGameContext } from '@/lib/GameContext';
import { Header } from '@/components/Header';
import { ArrowLeft, Plus } from 'lucide-react';
import type { TrainingMode } from '@/lib/types';

export default function TrainingPage() {
  const router = useRouter();
  const { games, selectedGame, setSelectedGame, setMoveIndex, clearGameData } = useGameContext();
  const [isLoading, setIsLoading] = useState(true);
  const [initialMode, setInitialMode] = useState<TrainingMode>('train');
  const [preferredGameId, setPreferredGameId] = useState<string | null>(null);
  const hasAppliedPreferredGameRef = useRef(false);

  // Wait for context to hydrate from localStorage
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setInitialMode(query.get('mode') === 'explore' ? 'explore' : 'train');
    setPreferredGameId(query.get('game'));
    document.title = 'Chess Opening Trainer - Practice Openings Interactively | OpeningMaster';

    // Give context time to load from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Select the intended game once the context is ready.
  useEffect(() => {
    if (isLoading || games.length === 0) {
      return;
    }

    if (!hasAppliedPreferredGameRef.current) {
      const preferredGame = preferredGameId
        ? games.find(game => game.id === preferredGameId)
        : null;

      if (preferredGame) {
        hasAppliedPreferredGameRef.current = true;
        if (selectedGame?.id !== preferredGame.id) {
          setSelectedGame(preferredGame);
          setMoveIndex(0);
        }
        return;
      }

      hasAppliedPreferredGameRef.current = true;
    }

    if (!selectedGame) {
      router.replace('/upload');
    }
  }, [isLoading, games, preferredGameId, selectedGame, router, setSelectedGame, setMoveIndex]);

  // Redirect to upload if no game after hydration
  useEffect(() => {
    if (!isLoading && games.length === 0) {
      router.push('/upload');
    }
  }, [isLoading, games, router]);

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
  if (games.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="mx-auto max-w-screen-xl px-4 py-4 sm:py-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Training Mode</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Chess Opening Trainer - Practice Openings Interactively</h1>
          <p className="mt-4 text-lg leading-8 text-gray-300">
            Review your repertoire line by line, correct mistakes quickly, and build opening memory through repetition.
          </p>
        </div>

        {/* Control Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => {
              clearGameData();
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
        <Trainer games={games} initialMode={initialMode} />
      </div>
    </main>
  );
}
