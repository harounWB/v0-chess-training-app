'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type LichessBestMoveRequest = {
  fen: string;
  depth?: number;
};

type PendingRequest = {
  controller: AbortController;
  resolve: (bestMove: string | null) => void;
  reject: (error: Error) => void;
};

export function useLichessEngine() {
  const pendingRequestRef = useRef<PendingRequest | null>(null);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setErrorState = useCallback((next: string | null) => {
    setError((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    setReady(true);
    setErrorState(null);

    return () => {
      const pending = pendingRequestRef.current;
      pendingRequestRef.current = null;
      pending?.controller.abort();
    };
  }, [setErrorState]);

  const requestBestMove = useCallback(({ fen, depth = 12 }: LichessBestMoveRequest) => {
    return new Promise<string | null>((resolve, reject) => {
      if (pendingRequestRef.current) {
        reject(new Error('Lichess is already thinking.'));
        return;
      }

      const controller = new AbortController();
      pendingRequestRef.current = { controller, resolve, reject };

      fetch('/api/lichess/best-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen, depth }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json().catch(() => null) as { bestMove?: string | null; error?: string } | null;

          if (!response.ok) {
            throw new Error(data?.error || 'Lichess analysis failed.');
          }

          resolve(data?.bestMove ?? null);
          setErrorState(null);
        })
        .catch((fetchError: unknown) => {
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            reject(new Error('Lichess request cancelled.'));
            return;
          }

          const nextError = fetchError instanceof Error ? fetchError : new Error('Lichess analysis failed.');
          setErrorState(nextError.message);
          reject(nextError);
        })
        .finally(() => {
          if (pendingRequestRef.current?.controller === controller) {
            pendingRequestRef.current = null;
          }
        });
    });
  }, [setErrorState]);

  const cancelRequest = useCallback(() => {
    const pending = pendingRequestRef.current;
    pendingRequestRef.current = null;

    if (!pending) {
      return;
    }

    pending.controller.abort();
    pending.reject(new Error('Lichess request cancelled.'));
  }, []);

  return {
    ready,
    error,
    requestBestMove,
    cancelRequest,
  };
}
