'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function ThemeHydrator() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
