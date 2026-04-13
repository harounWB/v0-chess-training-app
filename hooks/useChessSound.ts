'use client';

import { useCallback, useRef, useEffect } from 'react';

// Chess.com style move sound - wooden piece on board
const MOVE_SOUND_URL = 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3';
const CAPTURE_SOUND_URL = 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3';

export function useChessSound() {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const captureAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load audio elements
    if (typeof window !== 'undefined') {
      moveAudioRef.current = new Audio(MOVE_SOUND_URL);
      moveAudioRef.current.preload = 'auto';
      moveAudioRef.current.volume = 0.5;
      
      captureAudioRef.current = new Audio(CAPTURE_SOUND_URL);
      captureAudioRef.current.preload = 'auto';
      captureAudioRef.current.volume = 0.5;
    }
    
    return () => {
      moveAudioRef.current = null;
      captureAudioRef.current = null;
    };
  }, []);

  const playMoveSound = useCallback((isCapture: boolean = false) => {
    try {
      const audio = isCapture ? captureAudioRef.current : moveAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    } catch {
      // Ignore audio errors
    }
  }, []);

  return { playMoveSound };
}
