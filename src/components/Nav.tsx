import type { ThemeId } from '../lib/theme'
import type { ViewId } from '../types'

const ITEMS: { id: ViewId; label: string }[] = [
  { id: 'home', label: '今日' },
  { id: 'review', label: '复习' },
  { id: 'drill', label: '百化分' },
  { id: 'library', label: '卡片库' },
  { id: 'stats', label: '曲线' },
  { id: 'backup', label: '备份' },
]

export function Nav({
  view,
  onChange,
  dueCount,
  theme,
  onToggleTheme,
}: {
  view: ViewId
  onChange: (v: ViewId) => void
  dueCount: number
  theme: ThemeId
  onToggleTheme: () => void
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        <div>
          <strong className="brand-name">记忆卡片</strong>
          <p className="brand-sub">遗忘曲线 · 速度强化</p>
        </div>
      </div>
      <div className="topbar-end">
        <nav className="nav" aria-label="主导航">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => onChange(item.id)}
            >
              {item.label}
              {item.id === 'review' && dueCount > 0 ? (
                <span className="badge">{dueCount}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'day' ? '切换到墨夜主题' : '切换到晨雾主题'}
          title={theme === 'day' ? '切换到墨夜' : '切换到晨雾'}
        >
          <span className="theme-dot" aria-hidden />
          {theme === 'day' ? '晨雾' : '墨夜'}
        </button>
      </div>
    </header>
  )
}
