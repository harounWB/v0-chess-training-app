'use client';

import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parsePGN } from '@/lib/pgn-parser';
import { Game } from '@/lib/types';

interface PGNUploadProps {
  onGamesLoaded: (games: Game[]) => void;
  isLoading?: boolean;
}

export function PGNUpload({ onGamesLoaded, isLoading = false }: PGNUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      
      if (!content || content.trim().length === 0) {
        alert('PGN file is empty');
        return;
      }

      const games = parsePGN(content);

      console.log('[v0] Loaded games:', games.length);

      if (games.length === 0) {
        alert('No valid games found in PGN file. Please check the PGN format.');
        return;
      }

      onGamesLoaded(games);
    } catch (error) {
      console.error('[v0] Error parsing PGN:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error parsing PGN file: ${errorMsg}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Chess Opening Trainer</h2>
          <p className="text-sm text-gray-400">
            Upload a PGN file to start training on chess openings
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pgn,.txt"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? 'Loading...' : 'Upload PGN File'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supports single or multiple games</p>
          <p>• Preserves moves, comments, and variations</p>
          <p>• Compatible with standard PGN format</p>
        </div>
      </div>
    </Card>
  );
}
