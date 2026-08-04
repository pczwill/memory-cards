import type { Card, ReviewGrade } from '../types'

const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 5,
}

export function createBlankCard(
  partial: Pick<Card, 'front' | 'back'> & Partial<Card>,
): Card {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    front: partial.front,
    back: partial.back,
    tags: partial.tags ?? [],
    kind: partial.kind ?? 'flash',
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: now,
    createdAt: now,
    updatedAt: now,
    manualDueAt: null,
    lastReviewedAt: null,
    avgResponseMs: undefined,
    reviewCount: 0,
    correctCount: 0,
  }
}

export function effectiveDue(card: Card): Date {
  if (card.manualDueAt) return new Date(card.manualDueAt)
  return new Date(card.dueAt)
}

export function isDue(card: Card, now = new Date()): boolean {
  return effectiveDue(card).getTime() <= now.getTime()
}

function addDays(isoBase: string, days: number): string {
  const d = new Date(isoBase)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Apply SM-2 style scheduling after a graded review. */
export function applyGrade(card: Card, grade: ReviewGrade, now = new Date()): Card {
  const q = GRADE_QUALITY[grade]
  let { ease, interval, repetitions } = card
  const nowIso = now.toISOString()

  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.max(1, Math.round(interval * ease))

    if (grade === 'easy') interval = Math.max(interval + 1, Math.round(interval * 1.3))
    if (grade === 'hard') interval = Math.max(1, Math.round(interval * 1.2))

    repetitions += 1
  }

  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ease < 1.3) ease = 1.3

  return {
    ...card,
    ease,
    interval,
    repetitions,
    dueAt: addDays(nowIso, interval),
    manualDueAt: null,
    lastReviewedAt: nowIso,
    updatedAt: nowIso,
    reviewCount: card.reviewCount + 1,
    correctCount: card.correctCount + (q >= 3 ? 1 : 0),
  }
}

/** Soft update after timed drill (correct/incorrect), also nudges schedule. */
export function applyDrillResult(
  card: Card,
  correct: boolean,
  responseMs: number,
  now = new Date(),
): Card {
  const grade: ReviewGrade = correct
    ? responseMs < 3000
      ? 'easy'
      : responseMs < 6000
        ? 'good'
        : 'hard'
    : 'again'

  const graded = applyGrade(card, grade, now)
  const n = card.reviewCount
  const prevAvg = card.avgResponseMs ?? responseMs
  const avgResponseMs = Math.round((prevAvg * n + responseMs) / (n + 1))

  return { ...graded, avgResponseMs }
}

export function setManualDue(card: Card, dueDateLocal: string): Card {
  // dueDateLocal: YYYY-MM-DD
  const d = new Date(`${dueDateLocal}T09:00:00`)
  return {
    ...card,
    manualDueAt: d.toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
