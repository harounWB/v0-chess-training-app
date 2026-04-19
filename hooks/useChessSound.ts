'use client';

import { useCallback, useEffect, useRef } from 'react';

type SoundKind = 'move' | 'capture' | 'check' | 'castle' | 'promotion';

function createAudioContext() {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

function playTone(
  context: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  startAt = 0
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + startAt);

  gainNode.gain.setValueAtTime(0.0001, context.currentTime + startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, context.currentTime + startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(context.currentTime + startAt);
  oscillator.stop(context.currentTime + startAt + duration + 0.03);
}

function playWoodKnock(context: AudioContext, volume = 0.05, startAt = 0, accent = 1) {
  const now = context.currentTime + startAt;
  const bodyOscillator = context.createOscillator();
  const bodyGain = context.createGain();
  const clickNoise = context.createBufferSource();
  const clickFilter = context.createBiquadFilter();
  const output = context.createGain();

  const bufferSize = Math.max(1, Math.floor(context.sampleRate * 0.02));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const decay = 1 - i / bufferSize;
    channel[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  clickNoise.buffer = buffer;
  clickFilter.type = 'bandpass';
  clickFilter.frequency.setValueAtTime(2200 + accent * 180, now);
  clickFilter.Q.setValueAtTime(2.2, now);

  bodyOscillator.type = 'triangle';
  bodyOscillator.frequency.setValueAtTime(148 + accent * 12, now);
  bodyOscillator.frequency.exponentialRampToValueAtTime(92 + accent * 5, now + 0.065);

  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(1, now + 0.004);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

  clickNoise.connect(clickFilter);
  clickFilter.connect(output);
  bodyOscillator.connect(bodyGain);
  bodyGain.connect(output);
  output.connect(context.destination);

  clickNoise.start(now);
  clickNoise.stop(now + 0.03);
  bodyOscillator.start(now);
  bodyOscillator.stop(now + 0.11);
}

function playSound(context: AudioContext, kind: SoundKind) {
  switch (kind) {
    case 'move':
      playWoodKnock(context, 0.038, 0, 1);
      break;
    case 'capture':
      playWoodKnock(context, 0.045, 0, 1.3);
      playWoodKnock(context, 0.028, 0.05, 0.8);
      break;
    case 'check':
      playWoodKnock(context, 0.042, 0, 1.15);
      playTone(context, 760, 0.04, 0.013, 'triangle', 0.02);
      break;
    case 'castle':
      playWoodKnock(context, 0.034, 0, 0.85);
      playWoodKnock(context, 0.034, 0.035, 1.05);
      break;
    case 'promotion':
      playWoodKnock(context, 0.038, 0, 1);
      playTone(context, 640, 0.05, 0.015, 'triangle', 0.028);
      playTone(context, 920, 0.05, 0.012, 'triangle', 0.055);
      break;
  }
}

export function useChessSound(enabled = true) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => {
        // Ignore shutdown errors.
      });
      audioContextRef.current = null;
    };
  }, []);

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    const context = audioContextRef.current;
    if (!context) {
      return null;
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => {
        // Ignore resume failures.
      });
    }

    return context;
  }, []);

  const playMoveSound = useCallback((isCapture: boolean = false, isCheck: boolean = false, isCastle: boolean = false, isPromotion: boolean = false) => {
    if (!enabled) {
      return;
    }

    try {
      const context = ensureContext();
      if (!context) {
        return;
      }

      const kind: SoundKind = isPromotion
        ? 'promotion'
        : isCastle
          ? 'castle'
          : isCheck
            ? 'check'
            : isCapture
              ? 'capture'
              : 'move';

      playSound(context, kind);
    } catch {
      // Ignore audio errors so move handling is never blocked.
    }
  }, [enabled, ensureContext]);

  return { playMoveSound };
}
