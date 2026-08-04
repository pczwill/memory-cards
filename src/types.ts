export type CardKind = 'flash' | 'drill'

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export interface Card {
  id: string
  front: string
  back: string
  tags: string[]
  kind: CardKind
  /** SM-2 ease factor */
  ease: number
  /** Current interval in days */
  interval: number
  repetitions: number
  dueAt: string
  createdAt: string
  updatedAt: string
  /** Optional manual override ISO date (cleared after next review) */
  manualDueAt?: string | null
  lastReviewedAt?: string | null
  avgResponseMs?: number
  reviewCount: number
  correctCount: number
}

export interface ReviewLog {
  id: string
  cardId: string
  at: string
  grade?: ReviewGrade
  correct?: boolean
  responseMs?: number
  mode: 'review' | 'drill'
}

export interface AppData {
  version: 1
  cards: Card[]
  logs: ReviewLog[]
}

export type ViewId = 'home' | 'library' | 'review' | 'drill' | 'stats' | 'backup'
