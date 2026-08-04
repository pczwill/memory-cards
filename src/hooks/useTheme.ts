import { useEffect, useState } from 'react'
import { applyTheme, readTheme, type ThemeId } from '../lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(next: ThemeId) {
    setThemeState(next)
  }

  function toggleTheme() {
    setThemeState((t) => (t === 'day' ? 'ink' : 'day'))
  }

  return { theme, setTheme, toggleTheme }
}
