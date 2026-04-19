'use client';

import { useCallback, useRef, useEffect } from 'react';

// Chess.com style move sounds
const MOVE_SOUND_URL = 'https://www.chess.com/sound/move.mp3';
const CAPTURE_SOUND_URL = 'https://www.chess.com/sound/capture.mp3';
const CHECK_SOUND_URL = 'https://www.chess.com/sound/check.mp3';
const CASTLE_SOUND_URL = 'https://www.chess.com/sound/castle.mp3';
const PROMOTE_SOUND_URL = 'https://www.chess.com/sound/promote.mp3';

export function useChessSound(enabled = true) {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const captureAudioRef = useRef<HTMLAudioElement | null>(null);
  const checkAudioRef = useRef<HTMLAudioElement | null>(null);
  const castleAudioRef = useRef<HTMLAudioElement | null>(null);
  const promoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load audio elements
    if (typeof window !== 'undefined') {
      moveAudioRef.current = new Audio(MOVE_SOUND_URL);
      moveAudioRef.current.preload = 'auto';
      moveAudioRef.current.volume = 0.4;
      
      captureAudioRef.current = new Audio(CAPTURE_SOUND_URL);
      captureAudioRef.current.preload = 'auto';
      captureAudioRef.current.volume = 0.4;

      checkAudioRef.current = new Audio(CHECK_SOUND_URL);
      checkAudioRef.current.preload = 'auto';
      checkAudioRef.current.volume = 0.4;

      castleAudioRef.current = new Audio(CASTLE_SOUND_URL);
      castleAudioRef.current.preload = 'auto';
      castleAudioRef.current.volume = 0.4;

      promoteAudioRef.current = new Audio(PROMOTE_SOUND_URL);
      promoteAudioRef.current.preload = 'auto';
      promoteAudioRef.current.volume = 0.4;
    }
    
    return () => {
      moveAudioRef.current = null;
      captureAudioRef.current = null;
      checkAudioRef.current = null;
      castleAudioRef.current = null;
      promoteAudioRef.current = null;
    };
  }, []);

  const playMoveSound = useCallback((isCapture: boolean = false, isCheck: boolean = false, isCastle: boolean = false, isPromotion: boolean = false) => {
    if (!enabled) {
      return;
    }

    try {
      let audio: HTMLAudioElement | null = null;

      if (isPromotion) {
        audio = promoteAudioRef.current;
      } else if (isCastle) {
        audio = castleAudioRef.current;
      } else if (isCheck) {
        audio = checkAudioRef.current;
      } else if (isCapture) {
        audio = captureAudioRef.current;
      } else {
        audio = moveAudioRef.current;
      }

      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    } catch {
      // Ignore audio errors
    }
  }, [enabled]);

  return { playMoveSound };
}
