'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useGameContext } from '@/lib/GameContext';

export function ThemeSync() {
  const { theme, setTheme } = useTheme();
  const { settings } = useGameContext();

  useEffect(() => {
    if (!settings) return;
    if (settings.themeMode === 'system') {
      setTheme('system');
    } else {
      setTheme(settings.themeMode);
    }
  }, [settings, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
