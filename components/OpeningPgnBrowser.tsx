'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ChevronDown, X, Loader2 } from 'lucide-react';
import { scopeGamesForFile, useGameContext } from '@/lib/GameContext';
import { parsePGN } from '@/lib/pgn-parser';

type OpeningPgnBrowserProps = {
  fileNames: string[];
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\.pgn$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function OpeningPgnBrowser({ fileNames }: OpeningPgnBrowserProps) {
  const router = useRouter();
  const { setGames, setSelectedGame } = useGameContext();
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const normalizedQuery = normalizeSearchText(searchQuery);
  const queryTokens = normalizedQuery ? normalizedQuery.split(' ') : [];

  const filteredFiles = useMemo(() => {
    if (queryTokens.length === 0) {
      return fileNames;
    }

    return fileNames.filter((fileName) => {
      const normalizedFile = normalizeSearchText(fileName);
      return queryTokens.every((token) => normalizedFile.includes(token));
    });
  }, [fileNames, queryTokens]);

  const handleSelectPgnFile = async (fileName: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/pgn/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }

      const content = await response.text();
      const loadedGames = parsePGN(content);

      if (loadedGames.length === 0) {
        throw new Error('No valid games found in the selected file');
      }

      const scopedGames = scopeGamesForFile(fileName, loadedGames);
      setGames(loadedGames, fileName, { source: 'bundled' });
      setSelectedGame(scopedGames[0]);

      setTimeout(() => {
        router.push(`/training?game=${encodeURIComponent(scopedGames[0].id)}`);
      }, 200);
    } catch (error) {
      console.error('Error loading PGN file:', error);
      alert(`Failed to load ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">PGN Library</p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white">Browse all PGNs in your library</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Search by opening name, variation, or move sequence. Clicking a file loads it into training automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b14]"
        >
          {showMore ? 'Show less' : 'Show more'}
          <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showMore && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your PGNs"
                className="w-full rounded-[1.15rem] border border-transparent bg-[#08111f] py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-cyan-400/30 focus:bg-[#0a1426] focus:ring-2 focus:ring-cyan-400/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              Loading PGN...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-10 text-center">
              <p className="text-sm font-medium text-white">No PGNs match your search</p>
              <p className="mt-1 text-xs text-gray-400">Try a different opening, variation, or move sequence.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredFiles.map((fileName, index) => (
                <button
                  key={`${fileName}-${index}`}
                  onClick={() => handleSelectPgnFile(fileName)}
                  disabled={isLoading}
                  className="group w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-300 transition-colors group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{fileName.replace(/\.pgn$/i, '')}</p>
                      <p className="mt-1 text-xs text-gray-400">PGN File</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
