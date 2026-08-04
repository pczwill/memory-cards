import { createBlankCard } from './sm2'
import type { Card } from '../types'

/** 分数 → 百分比 */
export const PCT_PAIRS: Array<[string, string]> = [
  ['1/2', '50%'],
  ['1/2.5', '40%'],
  ['1/3', '33.3%'],
  ['1/3.5', '28.6%'],
  ['1/4', '25%'],
  ['1/4.5', '22.2%'],
  ['1/5', '20%'],
  ['1/5.5', '18.2%'],
  ['1/6', '16.7%'],
  ['1/6.5', '15.4%'],
  ['1/7', '14.3%'],
  ['1/7.5', '13.3%'],
  ['1/8', '12.5%'],
  ['1/8.5', '11.8%'],
  ['1/9', '11.1%'],
  ['1/9.5', '10.5%'],
  ['1/10', '10%'],
  ['1/10.5', '9.5%'],
  ['1/11', '9.1%'],
  ['1/11.5', '8.7%'],
  ['1/12', '8.3%'],
  ['1/12.5', '8%'],
  ['1/13', '7.7%'],
  ['1/13.5', '7.4%'],
  ['1/14', '7.1%'],
  ['1/14.5', '6.9%'],
  ['1/15', '6.7%'],
  ['1/15.5', '6.5%'],
  ['1/16', '6.3%'],
  ['1/16.5', '6.1%'],
  ['1/17', '5.9%'],
  ['1/17.5', '5.7%'],
  ['1/18', '5.6%'],
  ['1/18.5', '5.4%'],
  ['1/19', '5.3%'],
  ['1/19.5', '5.1%'],
  ['1/20', '5%'],
  ['1/20.5', '4.9%'],
]

function pairKey(front: string, back: string): string {
  return `${front.trim()}→${back.trim()}`
}

export function seedPercentCards(): Card[] {
  const forward = PCT_PAIRS.map(([front, back]) =>
    createBlankCard({
      front,
      back,
      tags: ['百分比', '口算'],
      kind: 'drill',
    }),
  )
  const reverse = PCT_PAIRS.map(([front, back]) =>
    createBlankCard({
      front: back,
      back: front,
      tags: ['百分比', '口算', '反向'],
      kind: 'drill',
    }),
  )
  return [...forward, ...reverse]
}

/** 给已有卡库补全缺失的反向百分比卡，不覆盖已有进度 */
export function mergeMissingReversePercentCards(cards: Card[]): {
  cards: Card[]
  added: number
} {
  const existing = new Set(cards.map((c) => pairKey(c.front, c.back)))
  const toAdd: Card[] = []

  for (const [frac, pct] of PCT_PAIRS) {
    const key = pairKey(pct, frac)
    if (!existing.has(key)) {
      toAdd.push(
        createBlankCard({
          front: pct,
          back: frac,
          tags: ['百分比', '口算', '反向'],
          kind: 'drill',
        }),
      )
      existing.add(key)
    }
  }

  if (!toAdd.length) return { cards, added: 0 }
  return { cards: [...cards, ...toAdd], added: toAdd.length }
}
