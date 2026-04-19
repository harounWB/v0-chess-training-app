'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameContext } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { Header } from '@/components/Header';
import { PGNProgress } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, Clock, BarChart3, Upload, ChevronRight, CheckSquare, Square, Trash2, FolderPlus, Folder, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    setSelectedGame,
    setMoveIndex,
    savedFiles,
    loadGamesFromFiles,
    pgnProgress,
    deletePgnFiles,
    collections,
    createCollection,
    assignFilesToCollection,
  } = useGameContext();
  const { user, isGuest } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string>('new');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [folderDialogError, setFolderDialogError] = useState('');
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);

  // Redirect to upload if no user or no games
  useEffect(() => {
    if (!user && !isGuest) {
      router.push('/upload');
    }
  }, [user, isGuest, router]);

  useEffect(() => {
    setSelectedFiles(prev => prev.filter(file => savedFiles.includes(file)));
  }, [savedFiles]);

  const handleToggleFile = (fileName: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileName)
        ? prev.filter(file => file !== fileName)
        : [...prev, fileName]
    );
  };

  const handleToggleFolder = (collectionId: string) => {
    setOpenCollectionId(prev => (prev === collectionId ? null : collectionId));
  };

  const getPGNStats = (fileName: string): { explored: number; trained: number; total: number; isDone: boolean } => {
    const progress = pgnProgress.find(p => p.fileName === fileName);
    
    return {
      explored: progress?.exploredGames.size || 0,
      trained: progress?.trainedGames.size || 0,
      total: progress?.games.length || 0,
      isDone: progress?.isDone || false
    };
  };

  const handleStartTraining = async () => {
    if (selectedFiles.length === 0) return;

    const combinedGames = await loadGamesFromFiles(selectedFiles);
    if (combinedGames.length > 0) {
      const selectedGame = combinedGames[0];
      setSelectedGame(selectedGame);
      setMoveIndex(0);
      router.push(`/training?game=${encodeURIComponent(selectedGame.id)}`);
    }
  };

  const handleSelectAll = () => {
    setSelectedFiles(savedFiles);
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const handleDeleteFiles = (fileNames: string[]) => {
    if (fileNames.length === 0) return;

    const displayName = fileNames.length === 1
      ? fileNames[0]
      : `${fileNames.length} PGN files`;

    const confirmed = window.confirm(`Delete ${displayName}? This will remove the PGN file${fileNames.length === 1 ? '' : 's'} and all saved progress for it.`);
    if (!confirmed) return;

    deletePgnFiles(fileNames);
    setSelectedFiles(prev => prev.filter(file => !fileNames.includes(file)));
  };

  const getCollectionForFile = (fileName: string) => collections.find(collection => collection.fileNames.includes(fileName)) || null;

  const folderSummaries = collections
    .map(collection => ({
      ...collection,
      files: savedFiles.filter(file => collection.fileNames.includes(file)),
    }));

  const assignedFileSet = new Set(collections.flatMap(collection => collection.fileNames));
  const unassignedFiles = savedFiles.filter(file => !assignedFileSet.has(file));

  const openFolderDialog = () => {
    setFolderDialogError('');
    setTargetCollectionId(collections[0]?.id ?? 'new');
    setNewCollectionName('');
    setFolderDialogOpen(true);
  };

  const handleTrainFolder = async (fileNames: string[]) => {
    if (fileNames.length === 0) return;

    setSelectedFiles(fileNames);
    const combinedGames = await loadGamesFromFiles(fileNames);
    if (combinedGames.length > 0) {
      const selectedGame = combinedGames[0];
      setSelectedGame(selectedGame);
      setMoveIndex(0);
      router.push(`/training?game=${encodeURIComponent(selectedGame.id)}`);
    }
  };

  const handleAssignSelectedFiles = () => {
    if (selectedFiles.length === 0) return;

    if (targetCollectionId === 'new') {
      if (!newCollectionName.trim()) {
        setFolderDialogError('Please enter a folder name.');
        return;
      }

      createCollection(newCollectionName.trim(), selectedFiles);
    } else {
      assignFilesToCollection(selectedFiles, targetCollectionId);
    }

    setFolderDialogOpen(false);
    setFolderDialogError('');
    setNewCollectionName('');
  };

  if (!user && !isGuest) {
    return null; // Redirecting
  }

  const stats = savedFiles.map(file => ({
    fileName: file,
    ...getPGNStats(file)
  }));

  const completedPGNs = stats.filter(s => s.isDone).length;
  const totalProgress = stats.reduce((sum, s) => sum + (s.explored + s.trained), 0);
  const totalPossible = stats.reduce((sum, s) => sum + (s.total * 2), 0); // Each game can be explored and trained
  const selectedCount = selectedFiles.length;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Training Dashboard</h1>
          <p className="text-gray-400">
            {isGuest ? 'Guest Mode - Progress saved locally' : `Welcome back, ${user?.email}`}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium text-gray-300">Total PGNs</h3>
            </div>
            <p className="text-2xl font-bold text-white">{savedFiles.length}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-gray-300">Completed</h3>
            </div>
            <p className="text-2xl font-bold text-white">{completedPGNs}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-medium text-gray-300">In Progress</h3>
            </div>
            <p className="text-2xl font-bold text-white">{savedFiles.length - completedPGNs}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-300">Overall Progress</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalPossible > 0 ? Math.round((totalProgress / totalPossible) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Folders</h2>
              <p className="text-sm text-gray-400">Collections from Settings appear here as dashboard folders.</p>
            </div>
            <p className="text-sm text-gray-500">
              {collections.length} {collections.length === 1 ? 'folder' : 'folders'} - {unassignedFiles.length} unsorted PGNs
            </p>
          </div>

          {folderSummaries.length === 0 && unassignedFiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 p-6 text-sm text-gray-400">
              Create a collection in Settings, then use <span className="text-cyan-300">Add to Folder</span> to sort your PGNs here.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {folderSummaries.map((collection) => {
                const isOpen = openCollectionId === collection.id;

                return (
                  <div key={collection.id} className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-cyan-400" />
                          <h3 className="truncate text-base font-semibold text-white">{collection.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{collection.files.length} {collection.files.length === 1 ? 'PGN' : 'PGNs'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggleFolder(collection.id)}
                          className="rounded-lg border border-gray-700 bg-gray-950/70 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800"
                        >
                          {isOpen ? 'Close folder' : 'Open folder'}
                        </button>
                        <button
                          onClick={() => setSelectedFiles(collection.files)}
                          disabled={collection.files.length === 0}
                          className="rounded-lg border border-gray-700 bg-gray-950/70 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {collection.files.length === 0 ? 'Empty folder' : 'Select folder'}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 space-y-4 rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
                        <div className="flex flex-wrap gap-2">
                          {collection.files.length === 0 ? (
                            <span className="text-sm text-gray-500">No PGNs assigned yet.</span>
                          ) : (
                            collection.files.map((fileName) => (
                              <Badge key={fileName} variant="secondary" className="max-w-full truncate bg-gray-800 text-gray-200">
                                {fileName.replace('.pgn', '')}
                              </Badge>
                            ))
                          )}
                        </div>

                        {collection.files.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleTrainFolder(collection.files)}
                              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cyan-700"
                            >
                              Open in Training
                            </button>
                            <button
                              onClick={() => setSelectedFiles(collection.files)}
                              className="rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800"
                            >
                              Select all in folder
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {unassignedFiles.length > 0 && (
                <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-gray-400" />
                        <h3 className="truncate text-base font-semibold text-white">Unsorted</h3>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{unassignedFiles.length} PGNs not assigned to a folder</p>
                    </div>
                    <button
                      onClick={() => setSelectedFiles(unassignedFiles)}
                      className="rounded-lg border border-gray-700 bg-gray-950/70 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800"
                    >
                      Select unsorted
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {unassignedFiles.slice(0, 4).map((fileName) => (
                      <Badge key={fileName} variant="secondary" className="max-w-full truncate bg-gray-800 text-gray-200">
                        {fileName.replace('.pgn', '')}
                      </Badge>
                    ))}
                    {unassignedFiles.length > 4 && (
                      <Badge variant="outline" className="border-gray-700 text-gray-300">
                        +{unassignedFiles.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PGN Files List */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your PGN Openings</h2>
            {savedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
                >
                  <CheckSquare className="h-4 w-4" />
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
                >
                  <Square className="h-4 w-4" />
                  Clear
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={() => handleDeleteFiles(selectedFiles)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-900/60 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={openFolderDialog}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-900/60 bg-cyan-950/50 px-3 py-2 text-sm text-cyan-200 transition-colors hover:bg-cyan-900/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FolderPlus className="h-4 w-4" />
                  Add to Folder
                </button>
                <span className="text-sm text-gray-400">
                  {selectedCount} selected
                </span>
              </div>
            )}
          </div>

          {savedFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No PGN files uploaded yet</h3>
              <p className="text-gray-400 mb-4">Upload a PGN file to start training your openings</p>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Upload PGN File
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.map((pgnStat) => {
                const progress = pgnProgress.find(p => p.fileName === pgnStat.fileName);
                const pgnGames = progress?.games || [];
                const isSelected = selectedFiles.includes(pgnStat.fileName);
                const progressPercent = pgnStat.total > 0 
                  ? Math.round(((pgnStat.explored + pgnStat.trained) / (pgnStat.total * 2)) * 100)
                  : 0;

                return (
                  <div
                    key={pgnStat.fileName}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
                  >
                    {/* PGN Name Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {pgnStat.fileName.replace('.pgn', '')}
                          </h3>
                          {pgnStat.isDone && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {pgnStat.total} {pgnStat.total === 1 ? 'chapter' : 'chapters'}
                        </p>
                        {getCollectionForFile(pgnStat.fileName) && (
                          <div className="mt-2">
                            <Badge variant="outline" className="border-cyan-900/60 bg-cyan-950/30 text-cyan-200">
                              <Folder className="h-3 w-3" />
                              {getCollectionForFile(pgnStat.fileName)?.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <label className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleFile(pgnStat.fileName)}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
                          />
                          Select game
                        </label>
                        <button
                          onClick={() => handleDeleteFiles([pgnStat.fileName])}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-900/60 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Game
                        </button>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="bg-gray-900/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Explored</p>
                        <p className="text-white font-bold text-lg">{pgnStat.explored}/{pgnStat.total}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Trained</p>
                        <p className="text-white font-bold text-lg">{pgnStat.trained}/{pgnStat.total}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Progress</p>
                        <p className="text-white font-bold text-lg">{progressPercent}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={async () => {
                        setSelectedFiles([pgnStat.fileName]);
                        const combinedGames = await loadGamesFromFiles([pgnStat.fileName]);
                        if (combinedGames.length > 0) {
                          const selectedGame = combinedGames[0];
                          setSelectedGame(selectedGame);
                          setMoveIndex(0);
                          router.push(`/training?game=${encodeURIComponent(selectedGame.id)}`);
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {pgnStat.isDone ? 'Review Chapters' : 'Continue Training'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Chapter List */}
                    {pgnGames.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-3 font-medium">CHAPTERS:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {pgnGames.map((game) => {
                            const isExplored = progress?.exploredGames.has(game.id);
                            const isTrained = progress?.trainedGames.has(game.id);
                            return (
                              <div
                                key={game.id}
                                className="flex items-center gap-2 text-xs p-2 bg-gray-900/50 rounded"
                              >
                                <div className="flex gap-1">
                                  {isExplored && (
                                    <div className="w-2 h-2 rounded-full bg-blue-400" title="Explored" />
                                  )}
                                  {isTrained && (
                                    <div className="w-2 h-2 rounded-full bg-green-400" title="Trained" />
                                  )}
                                </div>
                                <span className="text-gray-300 truncate">
                                  {game.white} vs {game.black}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {savedFiles.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
            >
              <Upload className="w-5 h-5" />
              Upload New PGN
            </button>

            <button
              onClick={handleStartTraining}
              disabled={selectedCount === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Training
            </button>
          </div>
        )}

        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent className="border-gray-800 bg-gray-950 text-gray-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Selected PGNs to a Folder</DialogTitle>
              <DialogDescription>
                Move the {selectedCount} selected {selectedCount === 1 ? 'PGN' : 'PGNs'} into a folder so they appear grouped on the dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">Target folder</label>
                <Select value={targetCollectionId} onValueChange={setTargetCollectionId}>
                  <SelectTrigger className="w-full border-gray-700 bg-gray-900 text-gray-100">
                    <SelectValue placeholder="Choose a folder" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-950 text-gray-100">
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">Create a new folder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetCollectionId === 'new' && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-gray-500">New folder name</label>
                  <input
                    value={newCollectionName}
                    onChange={(e) => {
                      setNewCollectionName(e.target.value);
                      setFolderDialogError('');
                    }}
                    placeholder="Example: Sicilian lines"
                    className="w-full rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-500"
                  />
                </div>
              )}

              {folderDialogError && <p className="text-sm text-red-400">{folderDialogError}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)} className="border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleAssignSelectedFiles} className="bg-cyan-600 text-white hover:bg-cyan-700">
                Add to Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
