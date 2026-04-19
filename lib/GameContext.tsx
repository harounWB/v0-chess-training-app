'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Game, PGNProgress, AppSettings, Collection } from '@/lib/types';
import { createClient, hasSupabaseEnv } from '@/utils/supabase/client';
import { useAuth } from '@/lib/AuthContext';

interface GameContextType {
  games: Game[];
  pgnProgress: PGNProgress[];
  settings: AppSettings;
  collections: Collection[];
  setGames: (games: Game[], fileName?: string) => void;
  loadGamesFromFiles: (fileNames: string[]) => Game[];
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  moveIndex: number;
  setMoveIndex: (index: number) => void;
  resetTrainingState: () => void;
  clearGameData: () => void;
  deletePgnFiles: (fileNames: string[]) => void;
  saveCompletedGame: (gameId: string) => void;
  markGameExplored: (gameId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  createCollection: (name: string) => void;
  renameCollection: (collectionId: string, name: string) => void;
  deleteCollection: (collectionId: string) => void;
  assignGameToCollection: (gameId: string, collectionId: string | null) => void;
  savedFiles: string[];
  loadGamesFromFile: (fileName: string) => Game[];
  getPGNProgress: (fileName: string) => PGNProgress | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const GAME_ID_SEPARATOR = '::';

export function scopeGameIdForFile(fileName: string, gameId: string) {
  const prefix = `${fileName}${GAME_ID_SEPARATOR}`;
  return gameId.startsWith(prefix) ? gameId : `${prefix}${gameId}`;
}

export function scopeGameForFile(fileName: string, game: Game): Game {
  return {
    ...game,
    id: scopeGameIdForFile(fileName, game.id),
  };
}

export function scopeGamesForFile(fileName: string, games: Game[]): Game[] {
  return games.map(game => scopeGameForFile(fileName, game));
}

function scopeProgressForFile(fileName: string, progress: PGNProgress): PGNProgress {
  const scopedGames = scopeGamesForFile(fileName, progress.games);
  const scopedIds = scopedGames.map(game => game.id);

  return {
    ...progress,
    games: scopedGames,
    exploredGames: new Set(scopedIds.filter(id => progress.exploredGames.has(id) || progress.exploredGames.has(id.replace(`${fileName}${GAME_ID_SEPARATOR}`, '')))),
    trainedGames: new Set(scopedIds.filter(id => progress.trainedGames.has(id) || progress.trainedGames.has(id.replace(`${fileName}${GAME_ID_SEPARATOR}`, '')))),
  };
}

function normalizeProgressEntries(progressEntries: PGNProgress[]): PGNProgress[] {
  return progressEntries.map(progress => scopeProgressForFile(progress.fileName, progress));
}

type PersistedPGNProgress = {
  fileName: string;
  exploredGames: string[];
  trainedGames: string[];
  isDone: boolean;
  importedAt: number;
};

function readProgressGamesFromStorage(fileName: string): Game[] {
  const savedGames = localStorage.getItem(`pgnfile:${fileName}`);
  if (!savedGames) return [];

  try {
    const parsed = JSON.parse(savedGames);
    return scopeGamesForFile(fileName, parsed);
  } catch {
    return [];
  }
}

function hydrateProgressEntries(rawEntries: unknown): PGNProgress[] {
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries
    .map((entry: any) => {
      const fileName = typeof entry?.fileName === 'string' ? entry.fileName : '';
      const persistedGames = Array.isArray(entry?.games) ? entry.games : [];
      const games = persistedGames.length > 0
        ? scopeGamesForFile(fileName, persistedGames)
        : readProgressGamesFromStorage(fileName);

      return {
        fileName,
        games,
        exploredGames: new Set(Array.isArray(entry?.exploredGames) ? entry.exploredGames : []),
        trainedGames: new Set(Array.isArray(entry?.trainedGames) ? entry.trainedGames : []),
        isDone: Boolean(entry?.isDone),
        importedAt: typeof entry?.importedAt === 'number' ? entry.importedAt : Date.now(),
      } satisfies PGNProgress;
    })
    .filter(progress => progress.fileName);
}

function serializeProgressEntries(progressEntries: PGNProgress[]): PersistedPGNProgress[] {
  return progressEntries.map(progress => ({
    fileName: progress.fileName,
    exploredGames: Array.from(progress.exploredGames),
    trainedGames: Array.from(progress.trainedGames),
    isDone: progress.isDone,
    importedAt: progress.importedAt,
  }));
}

function safeSetLocalStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    const name = error instanceof Error ? error.name : 'StorageError';
    const isQuotaError = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';

    if (isQuotaError) {
      console.warn(`Unable to persist ${key}: browser storage quota was exceeded.`);
      return;
    }

    console.warn(`Unable to persist ${key}:`, error);
  }
}

function clearTrainingStorage() {
  localStorage.removeItem('selectedGameIndex');
  localStorage.removeItem('moveIndex');
  localStorage.removeItem('currentGame');
}

type SaveSnapshot = {
  games?: Game[];
  selectedGame?: Game | null;
  moveIndex?: number;
};

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const typedError = error as Record<string, unknown>;
    return {
      message: typedError.message ?? 'Unknown Supabase error',
      code: typedError.code,
      details: typedError.details,
      hint: typedError.hint,
      status: typedError.status,
      ...typedError,
    };
  }

  return { message: String(error) };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [games, setGamesState] = useState<Game[]>([]);
  const [pgnProgress, setPgnProgress] = useState<PGNProgress[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    themeMode: 'system',
    soundEnabled: true,
    animationSpeed: 'normal',
    boardTheme: 'classic',
    pieceTheme: 'merida',
    remindersEnabled: false,
    reminderTime: '19:00',
    blitzModeEnabled: false,
  });
  const [collections, setCollections] = useState<Collection[]>([]);
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
        // Convert persisted IDs back to Sets and hydrate games from per-file storage.
        const progressWithSets = normalizeProgressEntries(hydrateProgressEntries(parsed));
        setPgnProgress(progressWithSets);
      } catch (error) {
        console.error('Failed to load PGN progress:', error);
      }
    }
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load app settings:', error);
      }
    }
    const savedCollections = localStorage.getItem('collections');
    if (savedCollections) {
      try {
        setCollections(JSON.parse(savedCollections));
      } catch (error) {
        console.error('Failed to load collections:', error);
      }
    }
  }, []);

  // Save to localStorage whenever games change
  useEffect(() => {
    if (mounted && (!user || isGuest)) {
      safeSetLocalStorageItem('chessGames', JSON.stringify(games));
    }
  }, [games, mounted, user, isGuest]);

  // Save selected game index
  useEffect(() => {
    if (mounted && (!user || isGuest) && selectedGame) {
      const index = games.findIndex(g => g.pgn === selectedGame.pgn);
      if (index !== -1) {
        safeSetLocalStorageItem('selectedGameIndex', index.toString());
      }
    }
  }, [selectedGame, games, mounted, user, isGuest]);

  // Save games to a named file and as current
  const setGames = (newGames: Game[], fileName?: string) => {
    if (fileName) {
      const scopedGames = scopeGamesForFile(fileName, newGames);
      setGamesState(scopedGames);
      safeSetLocalStorageItem('pgnfile:' + fileName, JSON.stringify(scopedGames));
      
      // Create or update PGN progress entry
      setPgnProgress(prev => {
        const existingIndex = prev.findIndex(p => p.fileName === fileName);
        const newProgress: PGNProgress = {
          fileName,
          games: scopedGames,
          exploredGames: existingIndex >= 0 ? prev[existingIndex].exploredGames : new Set(),
          trainedGames: existingIndex >= 0 ? prev[existingIndex].trainedGames : new Set(),
          isDone: existingIndex >= 0 ? prev[existingIndex].isDone : false,
          importedAt: Date.now()
        };

        const updated = existingIndex >= 0 
          ? prev.map((p, i) => i === existingIndex ? newProgress : p)
          : [...prev, newProgress];

        safeSetLocalStorageItem('pgnProgress', JSON.stringify(serializeProgressEntries(updated)));
        return updated;
      });

      // Update saved files list
      const files = Object.keys(localStorage).filter(k => k.startsWith('pgnfile:')).map(k => k.replace('pgnfile:', ''));
      setSavedFiles(files);
    } else {
      setGamesState(newGames);
    }

    // Sync to local storage for guests
    if (!(user && !isGuest && hasSupabaseEnv)) {
      safeSetLocalStorageItem('chessGames', JSON.stringify(fileName ? scopeGamesForFile(fileName, newGames) : newGames));
    }
  };

  const resetTrainingState = () => {
    setSelectedGame(null);
    setMoveIndex(0);
    clearTrainingStorage();
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

        safeSetLocalStorageItem('pgnProgress', JSON.stringify(serializeProgressEntries(updatedProgress)));
        return updatedProgress;
      });

      if (!(user && !isGuest && hasSupabaseEnv)) {
        safeSetLocalStorageItem('chessGames', JSON.stringify(updated));
        // Also update in all saved files
        savedFiles.forEach(file => {
          const fileGames = localStorage.getItem('pgnfile:' + file);
          if (fileGames) {
            try {
              const parsed = JSON.parse(fileGames);
              const updatedFileGames = parsed.map((g: Game) => g.id === gameId ? { ...g, completed: true } : g);
              safeSetLocalStorageItem('pgnfile:' + file, JSON.stringify(updatedFileGames));
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
        const scopedGames = scopeGamesForFile(fileName, parsed);
        setGamesState(scopedGames);
        setSelectedGame(scopedGames[0] || null);
        setMoveIndex(0);
        safeSetLocalStorageItem('pgnfile:' + fileName, JSON.stringify(scopedGames));
        safeSetLocalStorageItem('chessGames', JSON.stringify(scopedGames));
        return scopedGames;
      } catch {}
    }

    return [];
  };

  const loadGamesFromFiles = (fileNames: string[]) => {
    const combinedGames = fileNames.flatMap(fileName => {
      const fileGames = localStorage.getItem('pgnfile:' + fileName);
      if (!fileGames) return [];

      try {
        const parsed = JSON.parse(fileGames);
        const scopedGames = scopeGamesForFile(fileName, parsed);
        safeSetLocalStorageItem('pgnfile:' + fileName, JSON.stringify(scopedGames));
        return scopedGames;
      } catch {
        return [];
      }
    });

    setGamesState(combinedGames);
    setSelectedGame(combinedGames[0] || null);
    setMoveIndex(0);
    safeSetLocalStorageItem('chessGames', JSON.stringify(combinedGames));
    return combinedGames;
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

      // Save to localStorage - convert Sets to arrays for serialization
      safeSetLocalStorageItem('pgnProgress', JSON.stringify(serializeProgressEntries(updated)));
      return updated;
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const createCollection = (name: string) => {
    const collection: Collection = {
      id: `col-${Date.now()}`,
      name,
      gameIds: [],
      createdAt: Date.now(),
    };
    setCollections(prev => [...prev, collection]);
  };

  const renameCollection = (collectionId: string, name: string) => {
    setCollections(prev => prev.map(col => col.id === collectionId ? { ...col, name } : col));
  };

  const deleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(col => col.id !== collectionId));
    setGamesState(prev => prev.map(game => game.collectionId === collectionId ? { ...game, collectionId: null } : game));
  };

  const assignGameToCollection = (gameId: string, collectionId: string | null) => {
    setGamesState(prev => prev.map(game => game.id === gameId ? { ...game, collectionId } : game));
  };

  const clearGameData = () => {
    resetTrainingState();
    setGamesState([]);
    localStorage.removeItem('chessGames');
  };

  const deletePgnFiles = (fileNames: string[]) => {
    if (fileNames.length === 0) return;

    const fileSet = new Set(fileNames);

    fileNames.forEach(fileName => {
      localStorage.removeItem(`pgnfile:${fileName}`);
    });

    setPgnProgress(prev => {
      const updated = prev.filter(progress => !fileSet.has(progress.fileName));
      safeSetLocalStorageItem('pgnProgress', JSON.stringify(serializeProgressEntries(updated)));
      return updated;
    });

    setSavedFiles(prev => prev.filter(file => !fileSet.has(file)));

    setGamesState(prev => prev.filter(game => {
      const prefix = game.id.split(GAME_ID_SEPARATOR)[0];
      return !fileSet.has(prefix);
    }));

    if (selectedGame && fileSet.has(selectedGame.id.split(GAME_ID_SEPARATOR)[0])) {
      resetTrainingState();
    }

    const remainingFiles = Object.keys(localStorage)
      .filter(k => k.startsWith('pgnfile:'))
      .map(k => k.replace('pgnfile:', ''));

    if (remainingFiles.length === 0) {
      localStorage.removeItem('chessGames');
      clearTrainingStorage();
    }
  };

  // Database sync functions
  const saveProgressToDatabase = async (snapshot: SaveSnapshot = {}) => {
    if (!user || isGuest || !supabase || !hasSupabaseEnv) return;

    const gamesToSave = snapshot.games ?? games;
    const selectedGameToSave = snapshot.selectedGame ?? selectedGame;
    const moveIndexToSave = snapshot.moveIndex ?? moveIndex;

    try {
      // Save current games
      const { error: gamesError } = await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          games: gamesToSave,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
        });

      if (gamesError) throw gamesError;

      // Save current progress
      if (selectedGameToSave) {
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            selected_game_id: selectedGameToSave.id,
            move_index: moveIndexToSave,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
          });

        if (progressError) throw progressError;
      }

      console.log('Progress saved to database');
    } catch (error) {
      console.warn('Failed to save progress to database:', formatSupabaseError(error));

      // Keep local state resilient when the remote write is unavailable.
      safeSetLocalStorageItem('chessGames', JSON.stringify(gamesToSave));
      if (selectedGameToSave) {
        const index = gamesToSave.findIndex(g => g.id === selectedGameToSave.id);
        if (index !== -1) {
          safeSetLocalStorageItem('selectedGameIndex', index.toString());
        }
      }
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
      const savedProgress = localStorage.getItem('pgnProgress');
      
      if (savedGames) {
        try {
          const parsedGames = JSON.parse(savedGames);
          setGamesState(parsedGames);
        } catch (error) {
          console.error('[v0] Failed to load from localStorage:', error);
        }
      }

      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          const progressWithSets = normalizeProgressEntries(hydrateProgressEntries(parsed));
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
      void saveProgressToDatabase();
    } else if (mounted) {
      safeSetLocalStorageItem('chessGames', JSON.stringify(games));
    }
  }, [games, selectedGame, moveIndex, mounted, user, isGuest]);

  useEffect(() => {
    if (!mounted) return;
    safeSetLocalStorageItem('appSettings', JSON.stringify(settings));
  }, [settings, mounted]);

  useEffect(() => {
    if (!mounted) return;
    safeSetLocalStorageItem('collections', JSON.stringify(collections));
  }, [collections, mounted]);

  // Save selected game index for guest users
  return (
    <GameContext.Provider value={{ 
      games, 
      pgnProgress,
      settings,
      collections,
      setGames, 
      selectedGame, 
      setSelectedGame, 
      moveIndex, 
      setMoveIndex, 
      resetTrainingState,
      clearGameData, 
      deletePgnFiles,
      saveCompletedGame, 
      markGameExplored,
      updateSettings,
      createCollection,
      renameCollection,
      deleteCollection,
      assignGameToCollection,
      savedFiles, 
      loadGamesFromFile,
      loadGamesFromFiles,
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
