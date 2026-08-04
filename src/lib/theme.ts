export type ThemeId = 'day' | 'ink'

const KEY = 'memory-cards:theme'

export function readTheme(): ThemeId {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'day' || v === 'ink') return v
  } catch {
    /* ignore */
  }
  return 'day'
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
}
