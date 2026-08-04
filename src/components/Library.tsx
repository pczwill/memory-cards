import { useMemo, useState } from 'react'
import { effectiveDue } from '../lib/sm2'
import { accuracy } from '../lib/stats'
import type { Card } from '../types'

function formatDue(card: Card): string {
  const d = effectiveDue(card)
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
  const [tagFilter, setTagFilter] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Card | null>(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [kind, setKind] = useState<Card['kind']>('flash')
  const [manualDueId, setManualDueId] = useState<string | null>(null)
  const [manualDate, setManualDate] = useState('')
  const [bulk, setBulk] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [cards])

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (tagFilter && !c.tags.includes(tagFilter)) return false
      if (!q.trim()) return true
      const needle = q.trim().toLowerCase()
      return (
        c.front.toLowerCase().includes(needle) ||
        c.back.toLowerCase().includes(needle) ||
        c.tags.some((t) => t.includes(needle))
      )
    })
  }, [cards, tagFilter, q])

  function startCreate() {
    setEditing(null)
    setFront('')
    setBack('')
    setTags('')
    setKind('flash')
  }

  function startEdit(card: Card) {
    setEditing(card)
    setFront(card.front)
    setBack(card.back)
    setTags(card.tags.join(', '))
    setKind(card.kind)
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
    startCreate()
  }

  function importBulk() {
    const lines = bulk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    let n = 0
    for (const line of lines) {
      const m = line.match(/^(.+?)\s*=\s*(.+)$/)
      if (!m) continue
      onSave({
        front: m[1].trim(),
        back: m[2].trim(),
        tags: ['导入'],
        kind: 'drill',
      })
      n += 1
    }
    setBulk('')
    alert(`已导入 ${n} 张卡片`)
  }

  return (
    <section className="panel">
      <h1 className="page-title">卡片库</h1>
      <p className="lede">单库 + 标签。支持批量：每行 `正面=背面`。</p>

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
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="百分比, 口算" />
          </label>
          <label>
            类型
            <select value={kind} onChange={(e) => setKind(e.target.value as Card['kind'])}>
              <option value="flash">普通卡片</option>
              <option value="drill">口算</option>
            </select>
          </label>
        </div>
        <div className="cta-row">
          <button type="submit" className="btn primary">
            {editing ? '保存修改' : '添加'}
          </button>
          {editing ? (
            <button type="button" className="btn ghost" onClick={startCreate}>
              取消编辑
            </button>
          ) : null}
        </div>
      </form>

      <details className="bulk">
        <summary>批量导入</summary>
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

      <div className="toolbar">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索正面 / 背面 / 标签"
        />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">全部标签</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
                <span className="tag quiet">{card.kind === 'drill' ? '口算' : '普通'}</span>
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
      {!filtered.length ? <p className="empty">没有匹配的卡片</p> : null}
    </section>
  )
}
