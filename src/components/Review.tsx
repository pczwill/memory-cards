import { useMemo, useState } from 'react'
import { dueCards } from '../lib/stats'
import type { Card, ReviewGrade } from '../types'

const GRADES: { id: ReviewGrade; label: string; hint: string }[] = [
  { id: 'again', label: '忘记', hint: '马上再来' },
  { id: 'hard', label: '困难', hint: '勉强想起' },
  { id: 'good', label: '记住', hint: '正常间隔' },
  { id: 'easy', label: '轻松', hint: '拉长间隔' },
]

export function Review({
  cards,
  onGrade,
}: {
  cards: Card[]
  onGrade: (id: string, grade: ReviewGrade) => void
}) {
  const [queue] = useState(() => dueCards(cards))
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState(false)

  const live = useMemo(() => {
    const map = new Map(cards.map((c) => [c.id, c]))
    return queue.map((c) => map.get(c.id) ?? c)
  }, [cards, queue])

  const current = live[index]

  function grade(g: ReviewGrade) {
    if (!current) return
    onGrade(current.id, g)
    setRevealed(false)
    if (index + 1 >= live.length) setFinished(true)
    else setIndex((i) => i + 1)
  }

  if (!queue.length) {
    return (
      <section className="panel center">
        <h1 className="page-title">暂无待复习</h1>
        <p className="lede">所有卡片都还没到期，去百化分练习或加新卡吧。</p>
      </section>
    )
  }

  if (finished) {
    return (
      <section className="panel center">
        <h1 className="page-title">本轮完成</h1>
        <p className="lede">刚复习了 {queue.length} 张。</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="session-top">
        <h1 className="page-title">复习</h1>
        <span className="progress">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="flip-stage">
        <p className="prompt-label">正面</p>
        <p className="prompt">{current.front}</p>
        {revealed ? (
          <>
            <p className="prompt-label">背面</p>
            <p className="answer">{current.back}</p>
          </>
        ) : (
          <button type="button" className="btn primary reveal" onClick={() => setRevealed(true)}>
            显示答案
          </button>
        )}
      </div>

      {revealed ? (
        <div className="grade-row">
          {GRADES.map((g) => (
            <button key={g.id} type="button" className={`btn grade ${g.id}`} onClick={() => grade(g.id)}>
              <strong>{g.label}</strong>
              <span>{g.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
