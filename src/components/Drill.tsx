import { useEffect, useRef, useState } from 'react'
import { answersMatch } from '../lib/stats'
import { isPercentDrillCard } from '../lib/seed'
import type { Card } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildPool(cards: Card[]): Card[] {
  const drills = cards.filter(isPercentDrillCard)
  return shuffle(drills.length ? drills : cards)
}

export function Drill({
  cards,
  onResult,
}: {
  cards: Card[]
  onResult: (id: string, correct: boolean, ms: number) => void
}) {
  const [pool] = useState(() => buildPool(cards))
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<{
    ok: boolean
    answer: string
    ms: number
  } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [session, setSession] = useState({ n: 0, ok: 0, ms: 0 })
  const started = useRef(Date.now())
  const frozenMs = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = pool[index % Math.max(pool.length, 1)]

  useEffect(() => {
    frozenMs.current = 0
    started.current = Date.now()
    setElapsed(0)
    setPaused(false)
  }, [index, current?.id])

  useEffect(() => {
    if (feedback || paused) return
    const t = window.setInterval(() => {
      setElapsed(frozenMs.current + (Date.now() - started.current))
    }, 50)
    return () => clearInterval(t)
  }, [index, current?.id, feedback, paused])

  useEffect(() => {
    if (!paused && !feedback) inputRef.current?.focus()
  }, [index, feedback, paused])

  if (!pool.length) {
    return (
      <section className="panel center">
        <h1 className="page-title">没有可练的卡片</h1>
        <p className="lede">先在卡片库添加，或把类型设为「百化分」。</p>
      </section>
    )
  }

  function togglePause() {
    if (feedback) return
    if (paused) {
      started.current = Date.now()
      setPaused(false)
    } else {
      frozenMs.current = frozenMs.current + (Date.now() - started.current)
      setElapsed(frozenMs.current)
      setPaused(true)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || feedback || paused) return
    const ms = frozenMs.current + (Date.now() - started.current)
    const ok = answersMatch(input, current.back)
    setElapsed(ms)
    setFeedback({ ok, answer: current.back, ms })
    onResult(current.id, ok, ms)
    setSession((s) => ({ n: s.n + 1, ok: s.ok + (ok ? 1 : 0), ms: s.ms + ms }))
  }

  function next() {
    setFeedback(null)
    setInput('')
    setIndex((i) => i + 1)
  }

  return (
    <section className="panel">
      <div className="session-top">
        <h1 className="page-title">百化分冲刺</h1>
        <div className="session-actions">
          {!feedback ? (
            <button type="button" className="btn ghost" onClick={togglePause}>
              {paused ? '继续' : '暂停'}
            </button>
          ) : null}
          <span className="progress">
            本局 {session.ok}/{session.n}
            {session.n ? ` · 均 ${(session.ms / session.n / 1000).toFixed(1)}s` : ''}
          </span>
        </div>
      </div>

      <div className={`flip-stage drill${paused ? ' is-paused' : ''}`}>
        {paused ? (
          <div className="pause-overlay">
            <p className="pause-title">已暂停</p>
            <p className="pause-sub">计时已冻结，题目已隐藏</p>
            <button type="button" className="btn primary" onClick={togglePause}>
              继续作答
            </button>
          </div>
        ) : (
          <>
            <p className="timer">{(elapsed / 1000).toFixed(1)}s</p>
            <p className="prompt-label">算出结果</p>
            <p className="prompt big">{current.front}</p>

            <form
              className="drill-form"
              onSubmit={
                feedback
                  ? (e) => {
                      e.preventDefault()
                      next()
                    }
                  : submit
              }
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入答案，如 14.3% 或 14.3"
                disabled={!!feedback}
                autoComplete="off"
              />
              {!feedback ? (
                <button type="submit" className="btn primary">
                  提交
                </button>
              ) : (
                <button type="submit" className="btn primary">
                  下一题
                </button>
              )}
            </form>

            {feedback?.ok ? (
              <p className="feedback ok">正确 · {(feedback.ms / 1000).toFixed(1)}s</p>
            ) : null}
            {feedback && !feedback.ok ? (
              <p className="feedback bad">
                不对，答案是 <strong>{feedback.answer}</strong>
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
