import { effectiveDue, isDue } from './sm2'
import type { AppData, Card, ReviewLog } from '../types'

export function dueCards(cards: Card[]): Card[] {
  return cards
    .filter((c) => isDue(c))
    .sort((a, b) => effectiveDue(a).getTime() - effectiveDue(b).getTime())
}

export function accuracy(card: Card): number | null {
  if (card.reviewCount === 0) return null
  return Math.round((card.correctCount / card.reviewCount) * 100)
}

export function overallAccuracy(cards: Card[]): number | null {
  const reviews = cards.reduce((s, c) => s + c.reviewCount, 0)
  if (!reviews) return null
  const correct = cards.reduce((s, c) => s + c.correctCount, 0)
  return Math.round((correct / reviews) * 100)
}

export function avgSpeedMs(cards: Card[]): number | null {
  const withSpeed = cards.filter((c) => c.avgResponseMs != null)
  if (!withSpeed.length) return null
  const sum = withSpeed.reduce((s, c) => s + (c.avgResponseMs ?? 0), 0)
  return Math.round(sum / withSpeed.length)
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function reviewsByDay(logs: ReviewLog[], days = 14): { day: string; count: number; correct: number }[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  const map = new Map(keys.map((k) => [k, { day: k, count: 0, correct: 0 }]))
  for (const log of logs) {
    const k = dayKey(log.at)
    const row = map.get(k)
    if (!row) continue
    row.count += 1
    if (log.correct || (log.grade && log.grade !== 'again' && log.grade !== 'hard')) {
      if (log.correct === true || log.grade === 'good' || log.grade === 'easy') row.correct += 1
    }
  }
  return keys.map((k) => map.get(k)!)
}

export function speedTrend(logs: ReviewLog[], days = 14): { day: string; avgMs: number }[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  const buckets = new Map<string, number[]>()
  for (const k of keys) buckets.set(k, [])
  for (const log of logs) {
    if (log.responseMs == null) continue
    const k = dayKey(log.at)
    const arr = buckets.get(k)
    if (arr) arr.push(log.responseMs)
  }
  return keys.map((k) => {
    const arr = buckets.get(k)!
    const avgMs = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
    return { day: k, avgMs }
  })
}

export function summarize(data: AppData) {
  const due = dueCards(data.cards).length
  return {
    total: data.cards.length,
    due,
    accuracy: overallAccuracy(data.cards),
    avgSpeedMs: avgSpeedMs(data.cards),
    todayReviews: data.logs.filter((l) => dayKey(l.at) === new Date().toISOString().slice(0, 10))
      .length,
  }
}

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/%/g, '')
    .replace(/％/g, '')
}

export function answersMatch(input: string, expected: string): boolean {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(expected)
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return Math.abs(na - nb) < 0.05
  }
  return false
}
