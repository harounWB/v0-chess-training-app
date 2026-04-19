'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Game, PGNProgress, AppSettings, Collection } from '@/lib/types';
import { createClient, hasSupabaseEnv } from '@/utils/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { parsePGN } from '@/lib/pgn-parser';

interface GameContextType {
  games: Game[];
  pgnProgress: PGNProgress[];
  settings: AppSettings;
  collections: Collection[];
  setGames: (games: Game[], fileName?: string, options?: { source?: 'bundled' | 'upload' }) => void;
  loadGamesFromFiles: (fileNames: string[]) => Promise<Game[]>;
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
  createCollection: (name: string, fileNames?: string[]) => string;
  renameCollection: (collectionId: string, name: string) => void;
  deleteCollection: (collectionId: string) => void;
  assignFilesToCollection: (fileNames: string[], collectionId: string | null) => void;
  savedFiles: string[];
  loadGamesFromFile: (fileName: string) => Promise<Game[]>;
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

type PersistedCollection = {
  id: string;
  name: string;
  fileNames?: string[];
  gameIds?: string[];
  createdAt?: number;
};

type SavedPgnFileRecord = {
  fileName: string;
  source: 'bundled' | 'upload';
  games: Game[] | null;
  importedAt: number;
  updatedAt?: number;
};

type SavedPgnFileMeta = {
  fileName: string;
  source: 'bundled' | 'upload';
  importedAt: number;
  updatedAt: number;
};

function readSavedGamesFromStorage(fileName: string): Game[] {
  const savedGames = localStorage.getItem(`pgnfile:${fileName}`);
  if (!savedGames) return [];

  try {
    const parsed = JSON.parse(savedGames);
    return Array.isArray(parsed) ? scopeGamesForFile(fileName, parsed) : [];
  } catch {
    return [];
  }
}

function readSavedFileRecordsFromStorage(): SavedPgnFileRecord[] {
  if (typeof window === 'undefined') return [];

  return Object.keys(localStorage)
    .filter(key => key.startsWith('pgnfile:'))
    .map((key): SavedPgnFileRecord => {
      const fileName = key.replace('pgnfile:', '');
      const parsedGames = readSavedGamesFromStorage(fileName);
      const metaRaw = localStorage.getItem(`pgnmeta:${fileName}`);
      let meta: SavedPgnFileMeta | null = null;

      if (metaRaw) {
        try {
          const parsed = JSON.parse(metaRaw);
          if (parsed && typeof parsed === 'object') {
            meta = {
              fileName,
              source: parsed.source === 'bundled' ? 'bundled' : 'upload',
              importedAt: typeof parsed.importedAt === 'number' ? parsed.importedAt : Date.now(),
              updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
            };
          }
        } catch {
          meta = null;
        }
      }

      return {
        fileName,
        source: meta?.source ?? 'upload',
        games: parsedGames.length > 0 ? parsedGames : null,
        importedAt: meta?.importedAt ?? Date.now(),
        updatedAt: meta?.updatedAt ?? Date.now(),
      };
    });
}

function mergeSavedFileRecords(localRecords: SavedPgnFileRecord[], remoteRecords: SavedPgnFileRecord[]) {
  const merged = new Map<string, SavedPgnFileRecord>();

  for (const record of localRecords) {
    merged.set(record.fileName, record);
  }

  for (const record of remoteRecords) {
    const existing = merged.get(record.fileName);
    if (!existing) {
      merged.set(record.fileName, record);
      continue;
    }

    const existingStamp = existing.updatedAt ?? existing.importedAt;
    const incomingStamp = record.updatedAt ?? record.importedAt;
    if (incomingStamp >= existingStamp) {
      merged.set(record.fileName, record);
    }
  }

  return Array.from(merged.values());
}

async function loadBundledGamesFromPublicFile(fileName: string): Promise<Game[]> {
  try {
    const response = await fetch(`/pgn/${encodeURIComponent(fileName)}`);
    if (!response.ok) return [];

    const content = await response.text();
    const parsed = parsePGN(content);
    return scopeGamesForFile(fileName, parsed);
  } catch {
    return [];
  }
}

async function loadGamesForSavedFile(record: SavedPgnFileRecord): Promise<Game[]> {
  if (record.source === 'upload' && Array.isArray(record.games)) {
    return scopeGamesForFile(record.fileName, record.games);
  }

  const publicGames = await loadBundledGamesFromPublicFile(record.fileName);
  if (publicGames.length > 0) {
    return publicGames;
  }

  if (Array.isArray(record.games)) {
    return scopeGamesForFile(record.fileName, record.games);
  }

  return readSavedGamesFromStorage(record.fileName);
}

function hydrateProgressEntries(rawEntries: unknown): PGNProgress[] {
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries
    .map((entry: any) => {
      const fileName = typeof entry?.fileName === 'string' ? entry.fileName : '';
      const persistedGames = Array.isArray(entry?.games) ? entry.games : [];
      const games = persistedGames.length > 0
        ? scopeGamesForFile(fileName, persistedGames)
        : readSavedGamesFromStorage(fileName);

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

function normalizeCollectionEntries(rawEntries: unknown): Collection[] {
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries
    .map((entry: PersistedCollection, index: number) => {
      const rawFileNames = Array.isArray(entry?.fileNames) ? entry.fileNames : [];
      const legacyGameIds = Array.isArray(entry?.gameIds) ? entry.gameIds : [];
      const migratedFileNames = rawFileNames.length > 0
        ? rawFileNames
        : legacyGameIds.map((gameId) => {
            if (typeof gameId !== 'string') return '';
            const separatorIndex = gameId.indexOf(GAME_ID_SEPARATOR);
            return separatorIndex === -1 ? gameId : gameId.slice(0, separatorIndex);
          });

      return {
        id: typeof entry?.id === 'string' ? entry.id : `col-${index}-${Date.now()}`,
        name: typeof entry?.name === 'string' ? entry.name : 'Untitled folder',
        fileNames: Array.from(new Set(migratedFileNames.filter((fileName): fileName is string => typeof fileName === 'string' && fileName.length > 0))),
        createdAt: typeof entry?.createdAt === 'number' ? entry.createdAt : Date.now(),
      } satisfies Collection;
    })
    .filter(collection => collection.id && collection.name);
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
    const entries = Object.entries(typedError).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return { message: 'Unknown Supabase error', raw: error };
    }

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

function isNoRowsError(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const typedError = error as { code?: unknown; message?: unknown };
    return typedError.code === 'PGRST116' || String(typedError.message ?? '').includes('JSON object requested');
  }

  return false;
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
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [savedFileRecords, setSavedFileRecords] = useState<SavedPgnFileRecord[]>([]);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);
  const { user, isGuest } = useAuth();
  const supabase = createClient();
  const fileRecordMap = useMemo(
    () => new Map(savedFileRecords.map(record => [record.fileName, record] as const)),
    [savedFileRecords]
  );

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
        setCollections(normalizeCollectionEntries(JSON.parse(savedCollections)));
      } catch (error) {
        console.error('Failed to load collections:', error);
      }
    }
  }, []);

  // Keep the saved file list derived from the manifest rows.
  useEffect(() => {
    setSavedFiles(savedFileRecords.map(record => record.fileName));
  }, [savedFileRecords, user, isGuest]);

  const syncFileRecordLocally = (record: SavedPgnFileRecord) => {
    if (!record.fileName) return;
    safeSetLocalStorageItem(`pgnmeta:${record.fileName}`, JSON.stringify({
      fileName: record.fileName,
      source: record.source,
      importedAt: record.importedAt,
      updatedAt: record.updatedAt ?? Date.now(),
    } satisfies SavedPgnFileMeta));
    if (record.games) {
      safeSetLocalStorageItem(`pgnfile:${record.fileName}`, JSON.stringify(scopeGamesForFile(record.fileName, record.games)));
    }
  };

  const syncProgressLocally = (progressEntries: PGNProgress[]) => {
    safeSetLocalStorageItem('pgnProgress', JSON.stringify(serializeProgressEntries(progressEntries)));
  };

  const hydrateRemoteState = async () => {
    if (!user || isGuest || !supabase || !hasSupabaseEnv) return;

    try {
      const [filesResult, progressResult, dashboardResult] = await Promise.allSettled([
        supabase
          .from('user_saved_pgn_files')
          .select('file_name, source, games, imported_at, updated_at')
          .eq('user_id', user.id),
        supabase
          .from('user_pgn_progress')
          .select('file_name, explored_games, trained_games, is_done, imported_at, updated_at')
          .eq('user_id', user.id),
        supabase
          .from('user_dashboard_state')
          .select('collections, updated_at')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const fileRowsResult = filesResult.status === 'fulfilled' ? filesResult.value : null;
      const progressRowsResult = progressResult.status === 'fulfilled' ? progressResult.value : null;
      const dashboardRowsResult = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;

      if (filesResult.status === 'rejected') {
        throw filesResult.reason;
      }

      if (fileRowsResult?.error) {
        throw fileRowsResult.error;
      }

      if (progressResult.status === 'rejected') {
        throw progressResult.reason;
      }

      if (progressRowsResult?.error) {
        throw progressRowsResult.error;
      }

      if (dashboardResult.status === 'rejected' && !isNoRowsError(dashboardResult.reason)) {
        console.warn('Failed to load remote dashboard collections; using local defaults:', formatSupabaseError(dashboardResult.reason));
      }

      if (dashboardRowsResult?.error && !isNoRowsError(dashboardRowsResult.error)) {
        console.warn('Failed to load remote dashboard collections; using local defaults:', formatSupabaseError(dashboardRowsResult.error));
      }

      const fileRows = Array.isArray(fileRowsResult?.data) ? fileRowsResult.data : [];
      const progressRows = Array.isArray(progressRowsResult?.data) ? progressRowsResult.data : [];
      const dashboardCollections = Array.isArray((dashboardRowsResult?.data as any)?.collections)
        ? (dashboardRowsResult?.data as any).collections
        : [];

      const hydratedFileRecords = fileRows.map((row: any) => ({
        fileName: row.file_name,
        source: row.source === 'bundled' ? 'bundled' : 'upload',
        games: Array.isArray(row.games) ? row.games : null,
        importedAt: typeof row.imported_at === 'string' ? Date.parse(row.imported_at) || Date.now() : Date.now(),
        updatedAt: typeof row.updated_at === 'string' ? Date.parse(row.updated_at) || Date.now() : Date.now(),
      }));

      const remoteFileMap = new Map(hydratedFileRecords.map(record => [record.fileName, record] as const));
      const remoteProgressEntries = await Promise.all(progressRows.map(async (row: any) => {
        const fileName = row.file_name as string;
        const record = remoteFileMap.get(fileName);
        const games = record ? await loadGamesForSavedFile(record) : readSavedGamesFromStorage(fileName);

        return {
          fileName,
          games,
          exploredGames: new Set(Array.isArray(row.explored_games) ? row.explored_games : []),
          trainedGames: new Set(Array.isArray(row.trained_games) ? row.trained_games : []),
          isDone: Boolean(row.is_done),
          importedAt: typeof row.imported_at === 'string' ? Date.parse(row.imported_at) || Date.now() : Date.now(),
        } satisfies PGNProgress;
      }));

      const localRecords = readSavedFileRecordsFromStorage();
      const mergedFileRecords = mergeSavedFileRecords(localRecords, hydratedFileRecords);

      setSavedFileRecords(mergedFileRecords);
      setPgnProgress(normalizeProgressEntries(remoteProgressEntries));
      setCollections(normalizeCollectionEntries(dashboardCollections));
      safeSetLocalStorageItem('collections', JSON.stringify(dashboardCollections));

      mergedFileRecords.forEach(syncFileRecordLocally);
      syncProgressLocally(remoteProgressEntries);
    } catch (error) {
      console.warn('Failed to load remote dashboard state; falling back to local state:', formatSupabaseError(error));
      loadLocalState();
    }
  };

  const loadLocalState = () => {
    setSavedFileRecords(readSavedFileRecordsFromStorage());

    const savedGames = localStorage.getItem('chessGames');
    if (savedGames) {
      try {
        setGamesState(JSON.parse(savedGames));
      } catch (error) {
        console.error('Failed to load current games from localStorage:', error);
      }
    }

    const savedProgress = localStorage.getItem('pgnProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        const progressWithSets = normalizeProgressEntries(hydrateProgressEntries(parsed));
        setPgnProgress(progressWithSets);
      } catch (error) {
        console.error('Failed to load PGN progress:', error);
      }
    }

    const savedCollections = localStorage.getItem('collections');
    if (savedCollections) {
      try {
        setCollections(normalizeCollectionEntries(JSON.parse(savedCollections)));
      } catch (error) {
        console.error('Failed to load collections:', error);
      }
    }

    const files = Object.keys(localStorage)
      .filter(key => key.startsWith('pgnfile:'))
      .map(key => key.replace('pgnfile:', ''));
    setSavedFiles(files);
  };

  useEffect(() => {
    if (!mounted) return;

    loadLocalState();

    if (user && !isGuest && hasSupabaseEnv) {
      void hydrateRemoteState();
    }
  }, [mounted, user, isGuest]);

  // Save to localStorage whenever games change
  useEffect(() => {
    if (mounted) {
      safeSetLocalStorageItem('chessGames', JSON.stringify(games));
    }
  }, [games, mounted]);

  // Save selected game index
  useEffect(() => {
    if (mounted && selectedGame) {
      const index = games.findIndex(g => g.pgn === selectedGame.pgn);
      if (index !== -1) {
        safeSetLocalStorageItem('selectedGameIndex', index.toString());
      }
    }
  }, [selectedGame, games, mounted]);

  const upsertFileRecord = (fileName: string, gamesToStore: Game[], source: 'bundled' | 'upload') => {
    const scopedGames = scopeGamesForFile(fileName, gamesToStore);
    const record: SavedPgnFileRecord = {
      fileName,
      source,
      games: source === 'upload' ? scopedGames : null,
      importedAt: fileRecordMap.get(fileName)?.importedAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    setSavedFileRecords(prev => {
      const next = prev.some(existing => existing.fileName === fileName)
        ? prev.map(existing => existing.fileName === fileName ? record : existing)
        : [...prev, record];
      return next;
    });

    safeSetLocalStorageItem(`pgnfile:${fileName}`, JSON.stringify(scopedGames));
    syncFileRecordLocally(record);
  };

  const registerOpenedFile = async (fileName: string, gamesToStore: Game[], source: 'bundled' | 'upload') => {
    upsertFileRecord(fileName, gamesToStore, source);
    return scopeGamesForFile(fileName, gamesToStore);
  };

  // Save games to a named file and as current
  const setGames = (newGames: Game[], fileName?: string, options?: { source?: 'bundled' | 'upload' }) => {
    if (fileName) {
      const source = options?.source ?? 'upload';
      const scopedGames = scopeGamesForFile(fileName, newGames);
      setGamesState(scopedGames);
      upsertFileRecord(fileName, scopedGames, source);

      setPgnProgress(prev => {
        const existingIndex = prev.findIndex(p => p.fileName === fileName);
        const existingProgress = existingIndex >= 0 ? prev[existingIndex] : null;
        const newProgress: PGNProgress = {
          fileName,
          games: scopedGames,
          exploredGames: existingProgress?.exploredGames ?? new Set(),
          trainedGames: existingProgress?.trainedGames ?? new Set(),
          isDone: existingProgress?.isDone ?? false,
          importedAt: existingProgress?.importedAt ?? Date.now(),
        };

        const updated = existingIndex >= 0
          ? prev.map((p, i) => i === existingIndex ? newProgress : p)
          : [...prev, newProgress];

        syncProgressLocally(updated);
        return updated;
      });
    } else {
      setGamesState(newGames);
    }
  };

  const resetTrainingState = () => {
    setSelectedGame(null);
    setMoveIndex(0);
    clearTrainingStorage();
  };

  const syncRemoteState = async () => {
    if (!user || isGuest || !supabase || !hasSupabaseEnv) return;

    const timestamp = new Date().toISOString();

    try {
      if (savedFileRecords.length > 0) {
        const fileRows = savedFileRecords.map(record => ({
          user_id: user.id,
          file_name: record.fileName,
          source: record.source,
          games: record.source === 'upload' ? record.games ?? null : null,
          imported_at: new Date(record.importedAt).toISOString(),
          updated_at: timestamp,
        }));

        const { error: fileError } = await supabase
          .from('user_saved_pgn_files')
          .upsert(fileRows, { onConflict: 'user_id,file_name' });

        if (fileError) throw fileError;
      }

      if (pgnProgress.length > 0) {
        const progressRows = pgnProgress.map(progress => ({
          user_id: user.id,
          file_name: progress.fileName,
          explored_games: Array.from(progress.exploredGames),
          trained_games: Array.from(progress.trainedGames),
          is_done: progress.isDone,
          imported_at: new Date(progress.importedAt).toISOString(),
          updated_at: timestamp,
        }));

        const { error: progressError } = await supabase
          .from('user_pgn_progress')
          .upsert(progressRows, { onConflict: 'user_id,file_name' });

        if (progressError) throw progressError;
      }

      const { error: dashboardError } = await supabase
        .from('user_dashboard_state')
        .upsert({
          user_id: user.id,
          collections: collections,
          updated_at: timestamp,
        }, {
          onConflict: 'user_id',
        });

      if (dashboardError) throw dashboardError;
    } catch (error) {
      console.warn('Failed to sync dashboard state to database:', formatSupabaseError(error));
    }
  };

  useEffect(() => {
    if (!mounted || !user || isGuest || !hasSupabaseEnv) return;

    const timer = setTimeout(() => {
      void syncRemoteState();
    }, 250);

    return () => clearTimeout(timer);
  }, [mounted, user, isGuest, hasSupabaseEnv, savedFileRecords, pgnProgress, collections]);

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

        syncProgressLocally(updatedProgress);
        return updatedProgress;
      });

      return updated;
    });
  };

  // Load games from a named file
  const loadGamesFromFile = async (fileName: string) => {
    const localGames = readSavedGamesFromStorage(fileName);
    if (localGames.length > 0) {
      setGamesState(localGames);
      setSelectedGame(localGames[0] || null);
      setMoveIndex(0);
      safeSetLocalStorageItem('chessGames', JSON.stringify(localGames));
      if (!fileRecordMap.has(fileName)) {
        upsertFileRecord(fileName, localGames, 'upload');
      }
      return localGames;
    }

    const record = fileRecordMap.get(fileName);
    if (record) {
      const scopedGames = await loadGamesForSavedFile(record);
      setGamesState(scopedGames);
      setSelectedGame(scopedGames[0] || null);
      setMoveIndex(0);
      if (scopedGames.length > 0) {
        safeSetLocalStorageItem(`pgnfile:${fileName}`, JSON.stringify(scopedGames));
        safeSetLocalStorageItem('chessGames', JSON.stringify(scopedGames));
      }
      return scopedGames;
    }

    const bundledGames = await loadBundledGamesFromPublicFile(fileName);
    if (bundledGames.length > 0) {
      setGamesState(bundledGames);
      setSelectedGame(bundledGames[0] || null);
      setMoveIndex(0);
      await registerOpenedFile(fileName, bundledGames, 'bundled');
      safeSetLocalStorageItem('chessGames', JSON.stringify(bundledGames));
      return bundledGames;
    }

    return [];
  };

  const loadGamesFromFiles = async (fileNames: string[]) => {
    const combinedGames = (await Promise.all(fileNames.map(async (fileName) => {
      const localGames = readSavedGamesFromStorage(fileName);
      if (localGames.length > 0) {
        if (!fileRecordMap.has(fileName)) {
          upsertFileRecord(fileName, localGames, 'upload');
        }
        return localGames;
      }

      const record = fileRecordMap.get(fileName);
      if (record) {
        return loadGamesForSavedFile(record);
      }

      const bundledGames = await loadBundledGamesFromPublicFile(fileName);
      if (bundledGames.length > 0) {
        await registerOpenedFile(fileName, bundledGames, 'bundled');
      }
      return bundledGames;
    }))).flat();

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
      syncProgressLocally(updated);
      return updated;
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const createCollection = (name: string, fileNames: string[] = []) => {
    const collection: Collection = {
      id: `col-${Date.now()}`,
      name,
      fileNames: Array.from(new Set(fileNames.filter((fileName): fileName is string => typeof fileName === 'string' && fileName.length > 0))),
      createdAt: Date.now(),
    };
    setCollections(prev => [...prev, collection]);
    return collection.id;
  };

  const renameCollection = (collectionId: string, name: string) => {
    setCollections(prev => prev.map(col => col.id === collectionId ? { ...col, name } : col));
  };

  const deleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(col => col.id !== collectionId));
  };

  const assignFilesToCollection = (fileNames: string[], collectionId: string | null) => {
    const normalizedFileNames = Array.from(new Set(fileNames.filter((fileName): fileName is string => typeof fileName === 'string' && fileName.length > 0)));
    if (normalizedFileNames.length === 0) return;

    setCollections(prev => {
      if (collectionId === null) {
        return prev.map(collection => ({
          ...collection,
          fileNames: collection.fileNames.filter(fileName => !normalizedFileNames.includes(fileName)),
        }));
      }

      const targetExists = prev.some(collection => collection.id === collectionId);
      if (!targetExists) return prev;

      return prev.map(collection => {
        const fileNamesWithoutCurrentSelection = collection.fileNames.filter(fileName => !normalizedFileNames.includes(fileName));

        if (collection.id !== collectionId) {
          return {
            ...collection,
            fileNames: fileNamesWithoutCurrentSelection,
          };
        }

        return {
          ...collection,
          fileNames: Array.from(new Set([...fileNamesWithoutCurrentSelection, ...normalizedFileNames])),
        };
      });
    });
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

    setCollections(prev => prev.map(collection => ({
      ...collection,
      fileNames: collection.fileNames.filter(fileName => !fileSet.has(fileName)),
    })));

    setSavedFiles(prev => prev.filter(file => !fileSet.has(file)));
    setSavedFileRecords(prev => prev.filter(record => !fileSet.has(record.fileName)));

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

    if (user && !isGuest && supabase && hasSupabaseEnv) {
      void Promise.all([
        supabase.from('user_saved_pgn_files').delete().eq('user_id', user.id).in('file_name', fileNames),
        supabase.from('user_pgn_progress').delete().eq('user_id', user.id).in('file_name', fileNames),
      ]).catch(error => {
        console.warn('Failed to delete remote PGN files:', formatSupabaseError(error));
      });
    }
  };

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
      assignFilesToCollection,
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
