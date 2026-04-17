'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameContext } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { Header } from '@/components/Header';
import { Game, PGNProgress } from '@/lib/types';
import { Play, CheckCircle, Clock, BarChart3, Upload, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { games, setSelectedGame, savedFiles, loadGamesFromFile, pgnProgress } = useGameContext();
  const { user, isGuest } = useAuth();
  const [selectedPGN, setSelectedPGN] = useState<string>('');

  // Redirect to upload if no user or no games
  useEffect(() => {
    if (!user && !isGuest) {
      router.push('/upload');
    }
  }, [user, isGuest, router]);

  const handleSelectPGN = (fileName: string) => {
    setSelectedPGN(fileName);
    loadGamesFromFile(fileName);
  };

  const handleResumeGame = (game: Game) => {
    setSelectedGame(game);
    router.push('/training');
  };

  const getPGNStats = (fileName: string): { explored: number; trained: number; total: number; isDone: boolean } => {
    const progress = pgnProgress.find(p => p.fileName === fileName);
    const fileGames = games.filter(g => progress?.games.some(pg => pg.id === g.id)) || [];
    
    return {
      explored: progress?.exploredGames.size || 0,
      trained: progress?.trainedGames.size || 0,
      total: fileGames.length,
      isDone: progress?.isDone || false
    };
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

        {/* PGN Files List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Your PGN Openings</h2>

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
                const progressPercent = pgnStat.total > 0 
                  ? Math.round(((pgnStat.explored + pgnStat.trained) / (pgnStat.total * 2)) * 100)
                  : 0;

                return (
                  <div
                    key={pgnStat.fileName}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
                  >
                    {/* PGN Name Header */}
                    <div className="flex items-start justify-between mb-4">
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
                      onClick={() => handleSelectPGN(pgnStat.fileName)}
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

        {/* Quick Actions */}
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
              onClick={() => {
                if (selectedPGN) {
                  const pgnProgress = pgnProgress.find(p => p.fileName === selectedPGN);
                  const game = pgnProgress?.games[0];
                  if (game) {
                    setSelectedGame(game);
                    router.push('/training');
                  }
                }
              }}
              disabled={!selectedPGN}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Training
            </button>
          </div>
        )}
      </div>
    </main>
  );
}