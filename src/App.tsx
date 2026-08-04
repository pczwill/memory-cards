import { useMemo, useState } from 'react'
import { Backup } from './components/Backup'
import { Drill } from './components/Drill'
import { Home } from './components/Home'
import { Library } from './components/Library'
import { Nav } from './components/Nav'
import { Review } from './components/Review'
import { Stats } from './components/Stats'
import { useStore } from './hooks/useStore'
import { useTheme } from './hooks/useTheme'
import { dueCards } from './lib/stats'
import type { ViewId } from './types'
import './App.css'

export default function App() {
  const store = useStore()
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<ViewId>('home')
  const dueCount = useMemo(() => dueCards(store.data.cards).length, [store.data.cards])

  return (
    <div className="app">
      <div className="bg-glow" aria-hidden />
      <Nav
        view={view}
        onChange={setView}
        dueCount={dueCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="main">
        {view === 'home' ? <Home data={store.data} onGo={setView} /> : null}
        {view === 'review' ? (
          <Review cards={store.data.cards} onGrade={store.gradeCard} />
        ) : null}
        {view === 'drill' ? (
          <Drill cards={store.data.cards} onResult={store.drillCard} />
        ) : null}
        {view === 'library' ? (
          <Library
            cards={store.data.cards}
            onSave={(input) => {
              if (input.id) {
                const existing = store.data.cards.find((c) => c.id === input.id)
                if (!existing) return
                store.upsertCard({
                  ...existing,
                  front: input.front,
                  back: input.back,
                  tags: input.tags,
                  kind: input.kind,
                  updatedAt: new Date().toISOString(),
                })
              } else {
                store.addCard(input)
              }
            }}
            onRemove={store.removeCard}
            onManualDue={store.manualSchedule}
          />
        ) : null}
        {view === 'stats' ? <Stats data={store.data} theme={theme} /> : null}
        {view === 'backup' ? <Backup data={store.data} onReplace={store.replaceAll} /> : null}
      </main>
      <footer className="footer">本地网页 · 数据仅存于本机浏览器</footer>
    </div>
  )
}
