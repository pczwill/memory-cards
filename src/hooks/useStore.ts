import { useCallback, useEffect, useState } from 'react'
import { applyDrillResult, applyGrade, createBlankCard, setManualDue } from '../lib/sm2'
import { loadData, saveData } from '../lib/storage'
import type { AppData, Card, ReviewGrade, ReviewLog } from '../types'

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const replaceAll = useCallback((next: AppData) => setData(next), [])

  const upsertCard = useCallback((card: Card) => {
    setData((prev) => {
      const idx = prev.cards.findIndex((c) => c.id === card.id)
      const cards =
        idx >= 0
          ? prev.cards.map((c) => (c.id === card.id ? card : c))
          : [...prev.cards, card]
      return { ...prev, cards }
    })
  }, [])

  const addCard = useCallback(
    (input: { front: string; back: string; tags: string[]; kind: Card['kind'] }) => {
      const card = createBlankCard(input)
      setData((prev) => ({ ...prev, cards: [...prev.cards, card] }))
      return card
    },
    [],
  )

  const removeCard = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
      logs: prev.logs.filter((l) => l.cardId !== id),
    }))
  }, [])

  const logReview = useCallback((log: Omit<ReviewLog, 'id'>) => {
    const entry: ReviewLog = { ...log, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, logs: [...prev.logs, entry] }))
  }, [])

  const gradeCard = useCallback((cardId: string, grade: ReviewGrade) => {
    setData((prev) => {
      const card = prev.cards.find((c) => c.id === cardId)
      if (!card) return prev
      const updated = applyGrade(card, grade)
      const log: ReviewLog = {
        id: crypto.randomUUID(),
        cardId,
        at: new Date().toISOString(),
        grade,
        correct: grade === 'good' || grade === 'easy',
        mode: 'review',
      }
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        logs: [...prev.logs, log],
      }
    })
  }, [])

  const drillCard = useCallback((cardId: string, correct: boolean, responseMs: number) => {
    setData((prev) => {
      const card = prev.cards.find((c) => c.id === cardId)
      if (!card) return prev
      const updated = applyDrillResult(card, correct, responseMs)
      const log: ReviewLog = {
        id: crypto.randomUUID(),
        cardId,
        at: new Date().toISOString(),
        correct,
        responseMs,
        mode: 'drill',
        grade: correct ? 'good' : 'again',
      }
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        logs: [...prev.logs, log],
      }
    })
  }, [])

  const manualSchedule = useCallback((cardId: string, dateYmd: string) => {
    setData((prev) => {
      const card = prev.cards.find((c) => c.id === cardId)
      if (!card) return prev
      const updated = setManualDue(card, dateYmd)
      return { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? updated : c)) }
    })
  }, [])

  return {
    data,
    replaceAll,
    upsertCard,
    addCard,
    removeCard,
    gradeCard,
    drillCard,
    manualSchedule,
    logReview,
  }
}
