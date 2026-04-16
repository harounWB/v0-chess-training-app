'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameContext } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { Header } from '@/components/Header';
import { Game } from '@/lib/types';
import { Play, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { games, setSelectedGame, savedFiles, loadGamesFromFile } = useGameContext();
  const { user, isGuest } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string>('');

  // Redirect to upload if no user or no games
  useEffect(() => {
    if (!user && !isGuest) {
      router.push('/upload');
    }
  }, [user, isGuest, router]);

  const handleResumeGame = (game: Game) => {
    setSelectedGame(game);
    router.push('/training');
  };

  const handleLoadFile = (fileName: string) => {
    loadGamesFromFile(fileName);
    setSelectedFile(fileName);
  };

  const getGameProgress = (game: Game) => {
    // This is a simplified progress calculation
    // In a real implementation, you'd track move-by-move progress
    return game.completed ? 100 : Math.floor(Math.random() * 80) + 10; // Mock progress
  };

  const completedGames = games.filter(g => g.completed);
  const totalMoves = games.reduce((sum, game) => sum + game.moves.length, 0);
  const completedMoves = completedGames.reduce((sum, game) => sum + game.moves.length, 0);

  if (!user && !isGuest) {
    return null; // Redirecting
  }

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
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium text-gray-300">Total Games</h3>
            </div>
            <p className="text-2xl font-bold text-white">{games.length}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-gray-300">Completed</h3>
            </div>
            <p className="text-2xl font-bold text-white">{completedGames.length}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-medium text-gray-300">In Progress</h3>
            </div>
            <p className="text-2xl font-bold text-white">{games.length - completedGames.length}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Play className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-300">Total Moves</h3>
            </div>
            <p className="text-2xl font-bold text-white">{totalMoves}</p>
          </div>
        </div>

        {/* Saved Files */}
        {savedFiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Your PGN Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedFiles.map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => handleLoadFile(fileName)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    selectedFile === fileName
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <h3 className="font-medium text-white truncate">{fileName}</h3>
                  <p className="text-sm text-gray-400 mt-1">Click to load games</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Games List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Your Games {selectedFile && `(${selectedFile})`}
          </h2>

          {games.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No games uploaded yet</h3>
              <p className="text-gray-400 mb-4">Upload a PGN file to start training</p>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Upload PGN File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => {
                const progress = getGameProgress(game);
                return (
                  <div
                    key={game.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
                  >
                    {/* Game Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {game.white} vs {game.black}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {game.event || 'Unknown Event'}
                        </p>
                      </div>
                      {game.completed && (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Game Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400">Moves</p>
                        <p className="text-white font-medium">{game.moves.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Result</p>
                        <p className="text-white font-medium">{game.result || 'Unknown'}</p>
                      </div>
                    </div>

                    {/* Resume Button */}
                    <button
                      onClick={() => handleResumeGame(game)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <Play className="w-4 h-4" />
                      {game.completed ? 'Review' : 'Resume Training'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
          >
            <Play className="w-5 h-5" />
            Upload New Games
          </button>

          <button
            onClick={() => router.push('/training')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            disabled={games.length === 0}
          >
            <BarChart3 className="w-5 h-5" />
            Continue Training
          </button>
        </div>
      </div>
    </main>
  );
}