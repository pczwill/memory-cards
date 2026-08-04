import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { avgSpeedMs, overallAccuracy, reviewsByDay, speedTrend } from '../lib/stats'
import type { ThemeId } from '../lib/theme'
import type { AppData } from '../types'

const CHART: Record<ThemeId, { stroke: string; line: string; grid: string; tick: string }> = {
  day: {
    stroke: '#0f766e',
    line: '#b45309',
    grid: 'rgba(15,23,42,0.08)',
    tick: '#5b6b78',
  },
  ink: {
    stroke: '#2dd4bf',
    line: '#f59e0b',
    grid: 'rgba(232,237,242,0.08)',
    tick: '#8b97a5',
  },
}

export function Stats({ data, theme }: { data: AppData; theme: ThemeId }) {
  const reviewSeries = reviewsByDay(data.logs, 14)
  const speedSeries = speedTrend(data.logs, 14)
  const acc = overallAccuracy(data.cards)
  const speed = avgSpeedMs(data.cards)
  const c = CHART[theme]

  const weakest = [...data.cards]
    .filter((card) => card.reviewCount >= 2)
    .sort((a, b) => a.correctCount / a.reviewCount - b.correctCount / b.reviewCount)
    .slice(0, 8)

  return (
    <section className="panel">
      <h1 className="page-title">记忆曲线</h1>
      <p className="lede">近 14 天复习量、正确趋势与反应速度。</p>

      <div className="stat-grid compact">
        <article className="stat">
          <span className="stat-label">总正确率</span>
          <strong className="stat-value">{acc == null ? '—' : `${acc}%`}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">平均速度</span>
          <strong className="stat-value">{speed == null ? '—' : `${(speed / 1000).toFixed(1)}s`}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">复习记录</span>
          <strong className="stat-value">{data.logs.length}</strong>
        </article>
      </div>

      <h2 className="section-title">每日复习量</h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={reviewSeries}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.stroke} stopOpacity={0.45} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fontSize: 11, fill: c.tick }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: c.tick }} width={28} />
            <Tooltip />
            <Area type="monotone" dataKey="count" name="复习次数" stroke={c.stroke} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h2 className="section-title">反应速度（ms）</h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={speedSeries}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fontSize: 11, fill: c.tick }}
            />
            <YAxis tick={{ fontSize: 11, fill: c.tick }} width={40} />
            <Tooltip />
            <Line type="monotone" dataKey="avgMs" name="平均毫秒" stroke={c.line} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="section-title">薄弱卡片</h2>
      <ul className="card-list">
        {weakest.map((card) => (
          <li key={card.id} className="card-row compact">
            <div className="card-main">
              <strong>{card.front}</strong>
              <span className="muted">→ {card.back}</span>
              <p className="meta">
                {Math.round((card.correctCount / card.reviewCount) * 100)}% · {card.reviewCount} 次
              </p>
            </div>
          </li>
        ))}
      </ul>
      {!weakest.length ? <p className="empty">多练几轮后这里会出现薄弱项</p> : null}
    </section>
  )
}
