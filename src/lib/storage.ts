import type { AppData } from '../types'
import { mergeMissingReversePercentCards, seedPercentCards } from './seed'

const KEY = 'memory-cards:v1'

export function emptyData(): AppData {
  return { version: 1, cards: [], logs: [] }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded: AppData = {
        version: 1,
        cards: seedPercentCards(),
        logs: [],
      }
      saveData(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as AppData
    if (!parsed?.cards || !parsed?.logs) return emptyData()

    // 已有用户：自动补全反向百分比卡
    const { cards, added } = mergeMissingReversePercentCards(parsed.cards)
    const next = { ...parsed, version: 1 as const, cards }
    if (added > 0) saveData(next)
    return next
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function parseImport(text: string): AppData {
  const parsed = JSON.parse(text) as AppData
  if (!Array.isArray(parsed.cards) || !Array.isArray(parsed.logs)) {
    throw new Error('无效的备份文件')
  }
  return { version: 1, cards: parsed.cards, logs: parsed.logs }
}
