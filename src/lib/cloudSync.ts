import type { AppData } from '../types'

const CODE_KEY = 'memory-cards:sync-code'

export function readSyncCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveSyncCode(code: string): void {
  localStorage.setItem(CODE_KEY, code.trim().toUpperCase())
}

/** 生成形如 MC-XXXXXXXXXXXX 的同步码 */
export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `MC-${hex.slice(0, 4)}${hex.slice(4, 8)}${hex.slice(8, 12)}`
}

export function normalizeSyncCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function isValidSyncCode(raw: string): boolean {
  return /^[A-Z0-9-]{10,64}$/.test(normalizeSyncCode(raw))
}

type PullOk = { ok: true; updatedAt: string; data: AppData }
type PushOk = { ok: true; updatedAt: string }
type Err = { ok: false; error: string }

export async function pullFromCloud(code: string): Promise<PullOk | Err> {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(normalizeSyncCode(code))}`)
  const body = (await res.json().catch(() => ({}))) as {
    error?: string
    updatedAt?: string
    data?: AppData
  }
  if (!res.ok) return { ok: false, error: body.error || `拉取失败（${res.status}）` }
  if (!body.data) return { ok: false, error: '云端返回数据为空' }
  return { ok: true, updatedAt: body.updatedAt || '', data: body.data }
}

export async function pushToCloud(code: string, data: AppData): Promise<PushOk | Err> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: normalizeSyncCode(code), data }),
  })
  const body = (await res.json().catch(() => ({}))) as { error?: string; updatedAt?: string }
  if (!res.ok) return { ok: false, error: body.error || `上传失败（${res.status}）` }
  return { ok: true, updatedAt: body.updatedAt || '' }
}
