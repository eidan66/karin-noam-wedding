"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useCallback, useMemo } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const containerClass = useMemo(
    () => `theme-toggle-fancy select-none`,
    []
  );

  // In dark mode show moon (default). In light mode show sun/day classes
  const tdnnClass = useMemo(
    () => `tdnn ${!isDark ? 'day' : ''}`,
    [isDark]
  );

  const moonClass = useMemo(
    () => `moon ${!isDark ? 'sun' : ''}`,
    [isDark]
  );

  const onClick = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  return (
    <div
      className={containerClass}
      style={{ fontSize: '10%' }}
      onClick={onClick}
      role="button"
      aria-label="Toggle theme"
    >
      <div className={tdnnClass}>
        <div className={moonClass} />
      </div>
    </div>
  );
}
