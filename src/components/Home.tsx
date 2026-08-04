import { summarize } from '../lib/stats'
import type { AppData, ViewId } from '../types'

export function Home({
  data,
  onGo,
}: {
  data: AppData
  onGo: (v: ViewId) => void
}) {
  const s = summarize(data)

  return (
    <section className="panel home">
      <h1 className="page-title">今日状态</h1>
      <p className="lede">待复习优先，口算练速度，曲线帮你看遗忘。</p>

      <div className="stat-grid">
        <article className="stat">
          <span className="stat-label">待复习</span>
          <strong className="stat-value">{s.due}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">卡片总数</span>
          <strong className="stat-value">{s.total}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">正确率</span>
          <strong className="stat-value">{s.accuracy == null ? '—' : `${s.accuracy}%`}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">平均反应</span>
          <strong className="stat-value">
            {s.avgSpeedMs == null ? '—' : `${(s.avgSpeedMs / 1000).toFixed(1)}s`}
          </strong>
        </article>
      </div>

      <div className="cta-row">
        <button type="button" className="btn primary" onClick={() => onGo('review')} disabled={!s.due}>
          开始复习{s.due ? `（${s.due}）` : ''}
        </button>
        <button type="button" className="btn" onClick={() => onGo('drill')}>
          口算冲刺
        </button>
        <button type="button" className="btn ghost" onClick={() => onGo('library')}>
          添加卡片
        </button>
      </div>

      <p className="hint">已预置「百分比」正反口算卡（如 `1/7→14.3%` 与 `14.3%→1/7`），可在卡片库用标签「反向」筛选。</p>
    </section>
  )
}
