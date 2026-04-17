'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Game, PGNProgress } from '@/lib/types';
import { createClient, hasSupabaseEnv } from '@/utils/supabase/client';
import { useAuth } from '@/lib/AuthContext';

interface GameContextType {
  games: Game[];
  pgnProgress: PGNProgress[];
  setGames: (games: Game[], fileName?: string) => void;
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  moveIndex: number;
  setMoveIndex: (index: number) => void;
  clearGameData: () => void;
  saveCompletedGame: (gameId: string) => void;
  markGameExplored: (gameId: string) => void;
  savedFiles: string[];
  loadGamesFromFile: (fileName: string) => void;
  getPGNProgress: (fileName: string) => PGNProgress | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [games, setGamesState] = useState<Game[]>([]);
  const [pgnProgress, setPgnProgress] = useState<PGNProgress[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);
  const { user, isGuest } = useAuth();
  const supabase = createClient();

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Load PGN progress
    const savedProgress = localStorage.getItem('pgnProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        // Convert Set strings back to Sets
        const progressWithSets = parsed.map((p: any) => ({
          ...p,
          exploredGames: new Set(p.exploredGames),
          trainedGames: new Set(p.trainedGames)
        }));
        setPgnProgress(progressWithSets);
      } catch (error) {
        console.error('Failed to load PGN progress:', error);
      }
    }
  }, []);

  // Save to localStorage whenever games change
  useEffect(() => {
    if (mounted && (!user || isGuest)) {
      localStorage.setItem('chessGames', JSON.stringify(games));
    }
  }, [games, mounted, user, isGuest]);

  // Save selected game index
  useEffect(() => {
    if (mounted && (!user || isGuest) && selectedGame) {
      const index = games.findIndex(g => g.pgn === selectedGame.pgn);
      if (index !== -1) {
        localStorage.setItem('selectedGameIndex', index.toString());
      }
    }
  }, [selectedGame, games, mounted, user, isGuest]);

  // Save games to a named file and as current
  const setGames = (newGames: Game[], fileName?: string) => {
    setGamesState(newGames);
    if (fileName) {
      localStorage.setItem('pgnfile:' + fileName, JSON.stringify(newGames));
      
      // Create or update PGN progress entry
      setPgnProgress(prev => {
        const existingIndex = prev.findIndex(p => p.fileName === fileName);
        const newProgress: PGNProgress = {
          fileName,
          games: newGames,
          exploredGames: existingIndex >= 0 ? prev[existingIndex].exploredGames : new Set(),
          trainedGames: existingIndex >= 0 ? prev[existingIndex].trainedGames : new Set(),
          isDone: existingIndex >= 0 ? prev[existingIndex].isDone : false,
          importedAt: Date.now()
        };

        const updated = existingIndex >= 0 
          ? prev.map((p, i) => i === existingIndex ? newProgress : p)
          : [...prev, newProgress];

        localStorage.setItem('pgnProgress', JSON.stringify(updated));
        return updated;
      });

      // Update saved files list
      const files = Object.keys(localStorage).filter(k => k.startsWith('pgnfile:')).map(k => k.replace('pgnfile:', ''));
      setSavedFiles(files);
    }

    // Sync to database if authenticated
    if (user && !isGuest && hasSupabaseEnv) {
      saveProgressToDatabase();
    } else {
      localStorage.setItem('chessGames', JSON.stringify(newGames));
    }
  };

  // Mark a game as completed and persist
  const saveCompletedGame = (gameId: string) => {
    setGamesState(prev => {
      const updated = prev.map(g => g.id === gameId ? { ...g, completed: true } : g);

      // Update PGN progress
      setPgnProgress(prevProgress => {
        const updatedProgress = prevProgress.map(pgn => {
          if (pgn.games.some(g => g.id === gameId)) {
            const newTrained = new Set(pgn.trainedGames);
            newTrained.add(gameId);
            
            // Check if all games are both explored and trained
            const allGamesDone = pgn.games.every(g => 
              pgn.exploredGames.has(g.id) && newTrained.has(g.id)
            );
            
            return {
              ...pgn,
              trainedGames: newTrained,
              isDone: allGamesDone
            };
          }
          return pgn;
        });

        localStorage.setItem('pgnProgress', JSON.stringify(updatedProgress));
        return updatedProgress;
      });

      // Sync to database if authenticated
      if (user && !isGuest && hasSupabaseEnv) {
        saveProgressToDatabase();
      } else {
        localStorage.setItem('chessGames', JSON.stringify(updated));
        // Also update in all saved files
        savedFiles.forEach(file => {
          const fileGames = localStorage.getItem('pgnfile:' + file);
          if (fileGames) {
            try {
              const parsed = JSON.parse(fileGames);
              const updatedFileGames = parsed.map((g: Game) => g.id === gameId ? { ...g, completed: true } : g);
              localStorage.setItem('pgnfile:' + file, JSON.stringify(updatedFileGames));
            } catch {}
          }
        });
      }

      return updated;
    });
  };

  // Load games from a named file
  const loadGamesFromFile = (fileName: string) => {
    const fileGames = localStorage.getItem('pgnfile:' + fileName);
    if (fileGames) {
      try {
        const parsed = JSON.parse(fileGames);
        setGamesState(parsed);
        setSelectedGame(parsed[0] || null);
        localStorage.setItem('chessGames', JSON.stringify(parsed));
      } catch {}
    }
  };

  // Get PGN progress for a specific file
  const getPGNProgress = (fileName: string): PGNProgress | null => {
    return pgnProgress.find(p => p.fileName === fileName) || null;
  };

  // Mark a game as explored
  const markGameExplored = (gameId: string) => {
    setPgnProgress(prev => {
      const updated = prev.map(pgn => {
        if (pgn.games.some(g => g.id === gameId)) {
          const newExplored = new Set(pgn.exploredGames);
          newExplored.add(gameId);
          
          // Check if all games are both explored and trained
          const allGamesDone = pgn.games.every(g => 
            newExplored.has(g.id) && pgn.trainedGames.has(g.id)
          );
          
          return {
            ...pgn,
            exploredGames: newExplored,
            isDone: allGamesDone
          };
        }
        return pgn;
      });

      // Save to localStorage
      localStorage.setItem('pgnProgress', JSON.stringify(updated));
      return updated;
    });
  };

  const clearGameData = () => {
    setGamesState([]);
    setSelectedGame(null);
    setMoveIndex(0);
    localStorage.removeItem('chessGames');
    localStorage.removeItem('selectedGameIndex');
  };

  // Database sync functions
  const saveProgressToDatabase = async () => {
    if (!user || isGuest || !supabase) return;

    try {
      // Save current games
      const { error: gamesError } = await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          games: games,
          updated_at: new Date().toISOString()
        });

      if (gamesError) throw gamesError;

      // Save current progress
      if (selectedGame) {
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            selected_game_id: selectedGame.id,
            move_index: moveIndex,
            updated_at: new Date().toISOString()
          });

        if (progressError) throw progressError;
      }

      console.log('Progress saved to database');
    } catch (error) {
      console.error('Failed to save progress to database:', error);
    }
  };

  const loadProgressFromDatabase = async () => {
    if (!user || isGuest || !supabase) return;

    try {
      // Load games
      const { data: gamesData, error: gamesError } = await supabase
        .from('user_games')
        .select('games')
        .eq('user_id', user.id)
        .single();

      if (gamesError && gamesError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw gamesError;
      }

      if (gamesData?.games) {
        setGamesState(gamesData.games);
      }

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('selected_game_id, move_index')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      if (progressData) {
        const game = gamesData?.games?.find((g: Game) => g.id === progressData.selected_game_id);
        if (game) {
          setSelectedGame(game);
          setMoveIndex(progressData.move_index || 0);
        }
      }

      console.log('Progress loaded from database');
    } catch (error) {
      console.error('Failed to load progress from database:', error);
    }
  };

  // Load from database on user login, or localStorage for guest
  useEffect(() => {
    if (!mounted) return;

    if (user && !isGuest && hasSupabaseEnv) {
      loadProgressFromDatabase();
    } else {
      // Load from localStorage for guest users
      const savedGames = localStorage.getItem('chessGames');
      const savedSelectedIndex = localStorage.getItem('selectedGameIndex');
      const savedProgress = localStorage.getItem('pgnProgress');
      
      if (savedGames) {
        try {
          const parsedGames = JSON.parse(savedGames);
          setGamesState(parsedGames);
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

      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          const progressWithSets = parsed.map((p: any) => ({
            ...p,
            exploredGames: new Set(p.exploredGames),
            trainedGames: new Set(p.trainedGames)
          }));
          setPgnProgress(progressWithSets);
        } catch (error) {
          console.error('Failed to load PGN progress:', error);
        }
      }
    }

    // Load all saved file names
    const files = Object.keys(localStorage).filter(k => k.startsWith('pgnfile:')).map(k => k.replace('pgnfile:', ''));
    setSavedFiles(files);
    setMounted(true);
  }, [user, isGuest, mounted]);

  // Save to database when authenticated, or localStorage for guest
  useEffect(() => {
    if (!mounted) return;

    if (user && !isGuest && hasSupabaseEnv) {
      saveProgressToDatabase();
    } else if (mounted) {
      localStorage.setItem('chessGames', JSON.stringify(games));
    }
  }, [games, mounted, user, isGuest]);

  // Save selected game index for guest users
  useEffect(() => {
    if (!mounted || (user && !isGuest)) return;

    if (selectedGame) {
      const index = games.findIndex(g => g.pgn === selectedGame.pgn);
      if (index !== -1) {
        localStorage.setItem('selectedGameIndex', index.toString());
      }
    }
  }, [selectedGame, games, mounted, user, isGuest]);

  // Save move index for guest users
  useEffect(() => {
    if (!mounted || (user && !isGuest)) return;

    localStorage.setItem('moveIndex', moveIndex.toString());
  }, [moveIndex, mounted, user, isGuest]);

  // Load move index on mount for guest users
  useEffect(() => {
    if (!mounted || (user && !isGuest)) return;

    const savedMoveIndex = localStorage.getItem('moveIndex');
    if (savedMoveIndex) {
      setMoveIndex(parseInt(savedMoveIndex));
    }
  }, [mounted, user, isGuest]);

  return (
    <GameContext.Provider value={{ 
      games, 
      pgnProgress,
      setGames, 
      selectedGame, 
      setSelectedGame, 
      moveIndex, 
      setMoveIndex, 
      clearGameData, 
      saveCompletedGame, 
      markGameExplored,
      savedFiles, 
      loadGamesFromFile,
      getPGNProgress 
    }}>
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
