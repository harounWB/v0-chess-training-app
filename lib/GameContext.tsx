'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Game } from '@/lib/types';

interface GameContextType {
  games: Game[];
  setGames: (games: Game[]) => void;
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  moveIndex: number;
  setMoveIndex: (index: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedGames = localStorage.getItem('chessGames');
    const savedSelectedIndex = localStorage.getItem('selectedGameIndex');
    
    if (savedGames) {
      try {
        const parsedGames = JSON.parse(savedGames);
        setGames(parsedGames);
        
        if (savedSelectedIndex) {
          const index = parseInt(savedSelectedIndex);
          if (parsedGames[index]) {
            setSelectedGame(parsedGames[index]);
          }
        }
      } catch (error) {
        console.error('[v0] Failed to load from localStorage:', error);
      }
    }
    setMounted(true);
  }, []);

  // Save to localStorage whenever games change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('chessGames', JSON.stringify(games));
    }
  }, [games, mounted]);

  // Save selected game index
  useEffect(() => {
    if (mounted && selectedGame) {
      const index = games.findIndex(g => g.pgn === selectedGame.pgn);
      if (index !== -1) {
        localStorage.setItem('selectedGameIndex', index.toString());
      }
    }
  }, [selectedGame, games, mounted]);

  return (
    <GameContext.Provider value={{ games, setGames, selectedGame, setSelectedGame, moveIndex, setMoveIndex }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
}
