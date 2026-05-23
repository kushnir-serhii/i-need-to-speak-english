import React from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { IconMoon, IconSun } from '@/assets/icons';
import { ButtonOrLink } from '@/components/ui';

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme, theme } = useSettingsStore();

  const isDark = theme === 'dark';
  return (
    <ButtonOrLink onClick={toggleTheme} variant={isDark ? 'ghost' : 'primary'}>
      <IconMoon className="hidden size-5 dark:block dark:text-white/80" />
      <IconSun className="size-5 dark:hidden" />
    </ButtonOrLink>
  );
};
