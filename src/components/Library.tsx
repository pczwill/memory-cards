import { useMemo, useState } from 'react'
import { effectiveDue } from '../lib/sm2'
import { accuracy } from '../lib/stats'
import type { Card } from '../types'

const UNTAGGED = '__untagged__'

function formatDue(card: Card): string {
  const d = effectiveDue(card)
  return d.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Library({
  cards,
  onSave,
  onRemove,
  onManualDue,
}: {
  cards: Card[]
  onSave: (input: {
    id?: string
    front: string
    back: string
    tags: string[]
    kind: Card['kind']
  }) => void
  onRemove: (id: string) => void
  onManualDue: (id: string, dateYmd: string) => void
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Card | null>(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [kind, setKind] = useState<Card['kind']>('flash')
  const [manualDueId, setManualDueId] = useState<string | null>(null)
  const [manualDate, setManualDate] = useState('')
  const [bulk, setBulk] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  const tagStats = useMemo(() => {
    const map = new Map<string, number>()
    let untagged = 0
    for (const c of cards) {
      if (!c.tags.length) {
        untagged += 1
        continue
      }
      for (const t of c.tags) {
        map.set(t, (map.get(t) ?? 0) + 1)
      }
    }
    const list = [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    if (untagged > 0) list.push({ name: UNTAGGED, count: untagged })
    return list
  }, [cards])

  const filtered = useMemo(() => {
    if (!activeTag) return []
    return cards.filter((c) => {
      if (activeTag === UNTAGGED) {
        if (c.tags.length) return false
      } else if (!c.tags.includes(activeTag)) {
        return false
      }
      if (!q.trim()) return true
      const needle = q.trim().toLowerCase()
      return (
        c.front.toLowerCase().includes(needle) ||
        c.back.toLowerCase().includes(needle) ||
        c.tags.some((t) => t.toLowerCase().includes(needle))
      )
    })
  }, [cards, activeTag, q])

  function startCreate() {
    setEditing(null)
    setFront('')
    setBack('')
    setTags(activeTag && activeTag !== UNTAGGED ? activeTag : '百化分')
    setKind('drill')
    setShowEditor(true)
  }

  function startEdit(card: Card) {
    setEditing(card)
    setFront(card.front)
    setBack(card.back)
    setTags(card.tags.join(', '))
    setKind(card.kind)
    setShowEditor(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    onSave({
      id: editing?.id,
      front: front.trim(),
      back: back.trim(),
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      kind,
    })
    setEditing(null)
    setFront('')
    setBack('')
    setTags(activeTag && activeTag !== UNTAGGED ? activeTag : '百化分')
    setKind('drill')
    setShowEditor(false)
  }

  function importBulk() {
    const lines = bulk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    let n = 0
    const defaultTag = activeTag && activeTag !== UNTAGGED ? activeTag : '百化分'
    for (const line of lines) {
      const m = line.match(/^(.+?)\s*=\s*(.+)$/)
      if (!m) continue
      onSave({
        front: m[1].trim(),
        back: m[2].trim(),
        tags: [defaultTag],
        kind: 'drill',
      })
      n += 1
    }
    setBulk('')
    alert(`已导入 ${n} 张卡片`)
  }

  const activeLabel = activeTag === UNTAGGED ? '未分类' : activeTag

  if (!activeTag) {
    return (
      <section className="panel">
        <h1 className="page-title">卡片库</h1>
        <p className="lede">先点标签进入，再查看该标签下的卡片。</p>

        <div className="cta-row">
          <button type="button" className="btn primary" onClick={startCreate}>
            新建卡片
          </button>
        </div>

        {showEditor ? (
          <form className="editor" onSubmit={submit}>
            <h2 className="section-title">{editing ? '编辑卡片' : '新建卡片'}</h2>
            <label>
              正面
              <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} required />
            </label>
            <label>
              背面
              <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} required />
            </label>
            <div className="row-2">
              <label>
                标签（逗号分隔）
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="百化分, 反向"
                />
              </label>
              <label>
                类型
                <select value={kind} onChange={(e) => setKind(e.target.value as Card['kind'])}>
                  <option value="flash">普通卡片</option>
                  <option value="drill">百化分</option>
                </select>
              </label>
            </div>
            <div className="cta-row">
              <button type="submit" className="btn primary">
                {editing ? '保存修改' : '添加'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setShowEditor(false)}>
                取消
              </button>
            </div>
          </form>
        ) : null}

        <div className="tag-grid">
          {tagStats.map((item) => (
            <button
              key={item.name}
              type="button"
              className="tag-tile"
              onClick={() => {
                setActiveTag(item.name)
                setQ('')
                setShowEditor(false)
              }}
            >
              <strong>{item.name === UNTAGGED ? '未分类' : item.name}</strong>
              <span>{item.count} 张</span>
            </button>
          ))}
        </div>
        {!tagStats.length ? <p className="empty">还没有标签，先新建一张卡片吧</p> : null}
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="session-top">
        <div>
          <button type="button" className="btn ghost back-tag" onClick={() => setActiveTag(null)}>
            ← 全部标签
          </button>
          <h1 className="page-title">{activeLabel}</h1>
          <p className="lede">{filtered.length} 张卡片</p>
        </div>
        <button type="button" className="btn primary" onClick={startCreate}>
          新建
        </button>
      </div>

      {showEditor ? (
        <form className="editor" onSubmit={submit}>
          <h2 className="section-title">{editing ? '编辑卡片' : '新建卡片'}</h2>
          <label>
            正面
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} required />
          </label>
          <label>
            背面
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} required />
          </label>
          <div className="row-2">
            <label>
              标签（逗号分隔）
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="百化分, 反向" />
            </label>
            <label>
              类型
              <select value={kind} onChange={(e) => setKind(e.target.value as Card['kind'])}>
                <option value="flash">普通卡片</option>
                <option value="drill">百化分</option>
              </select>
            </label>
          </div>
          <div className="cta-row">
            <button type="submit" className="btn primary">
              {editing ? '保存修改' : '添加'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setShowEditor(false)}>
              取消
            </button>
          </div>
        </form>
      ) : null}

      <details className="bulk">
        <summary>批量导入到「{activeLabel}」</summary>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={5}
          placeholder={'1/7=14.3%\n首都=北京'}
        />
        <button type="button" className="btn" onClick={importBulk}>
          导入这些行
        </button>
      </details>

      <div className="toolbar single">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="在此标签内搜索"
        />
      </div>

      <ul className="card-list">
        {filtered.map((card) => (
          <li key={card.id} className="card-row">
            <div className="card-main">
              <strong>{card.front}</strong>
              <span className="muted">→ {card.back}</span>
              <div className="tag-row">
                {card.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
                <span className="tag quiet">{card.kind === 'drill' ? '百化分' : '普通'}</span>
              </div>
              <p className="meta">
                下次 {formatDue(card)}
                {card.manualDueAt ? '（手动）' : ''} · 正确率{' '}
                {accuracy(card) == null ? '—' : `${accuracy(card)}%`}
                {card.avgResponseMs != null ? ` · ${(card.avgResponseMs / 1000).toFixed(1)}s` : ''}
              </p>
            </div>
            <div className="card-actions">
              <button type="button" className="btn ghost" onClick={() => startEdit(card)}>
                编辑
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setManualDueId(card.id)
                  setManualDate(effectiveDue(card).toISOString().slice(0, 10))
                }}
              >
                改期
              </button>
              <button type="button" className="btn danger" onClick={() => onRemove(card.id)}>
                删除
              </button>
            </div>
            {manualDueId === card.id ? (
              <div className="manual-due">
                <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    if (manualDate) onManualDue(card.id, manualDate)
                    setManualDueId(null)
                  }}
                >
                  确定
                </button>
                <button type="button" className="btn ghost" onClick={() => setManualDueId(null)}>
                  取消
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {!filtered.length ? <p className="empty">这个标签下还没有卡片</p> : null}
    </section>
  )
}
